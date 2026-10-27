import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import api from '../services/api';
import FlashcardGenerator from './FlashcardGenerator';

const mockUser = { uid: 'student-one', semester: '1' };
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'fr' }) }));
jest.mock('../firebase/config', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ addDoc: jest.fn(), collection: jest.fn(() => 'flashcards'), serverTimestamp: jest.fn(() => 'server-time') }));
jest.mock('../services/api', () => ({ post: jest.fn() }));
jest.mock('../utils/pdfWorker', () => ({ getPdfWorkerUrl: () => 'pdf-worker.mock.js' }));

const generate = async () => {
  fireEvent.change(screen.getByLabelText('Titre du deck'), { target: { value: 'Mon cours' } });
  fireEvent.change(screen.getByLabelText('Texte du cours'), { target: { value: 'Un texte de cours suffisamment long pour générer les cartes.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Générer les flashcards' }));
};
beforeEach(() => {
  jest.clearAllMocks();
  collection.mockReturnValue('flashcards');
  serverTimestamp.mockReturnValue('server-time');
});

test('keeps valid AI cards when malformed items exist and saves a private owned deck', async () => {
  api.post.mockResolvedValue({ data: { choices: [{ message: { content: JSON.stringify({ cards: [null, false, { front: ' ', back: 'Vide' }, { front: ' Question utile ', back: ' Réponse utile ' }] }) } }] } });
  addDoc.mockResolvedValue({ id: 'persisted-deck' });
  const saved = jest.fn();
  render(<FlashcardGenerator onDeckSaved={saved} />);
  await generate();
  expect(await screen.findByText('Question utile')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer mes flashcards' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(addDoc).toHaveBeenCalledWith('flashcards', expect.objectContaining({ ownerId: 'student-one', visibility: 'private', semester: '1', cardCount: 1 }));
  expect(saved.mock.calls[0][0]).toEqual(expect.objectContaining({ id: 'persisted-deck', ownerId: 'student-one', visibility: 'private' }));
});

test('an empty or malformed generation cannot be saved', async () => {
  api.post.mockResolvedValue({ data: { choices: [{ message: { content: JSON.stringify({ cards: [null, {}, 'invalid'] }) } }] } });
  render(<FlashcardGenerator />);
  await generate();
  expect(await screen.findByRole('alert')).toHaveTextContent('La génération a échoué');
  expect(screen.queryByRole('button', { name: 'Enregistrer mes flashcards' })).not.toBeInTheDocument();
  expect(addDoc).not.toHaveBeenCalled();
});

test('a failed new generation cannot save cards from the previous source', async () => {
  api.post.mockResolvedValueOnce({ data: { choices: [{ message: { content: JSON.stringify({ cards: [{ front: 'Ancienne question', back: 'Ancienne réponse' }] }) } }] } }).mockRejectedValueOnce(new Error('Unavailable'));
  render(<FlashcardGenerator />);
  await generate();
  await screen.findByText('Ancienne question');
  fireEvent.change(screen.getByLabelText('Titre du deck'), { target: { value: 'Autre cours' } });
  fireEvent.change(screen.getByLabelText('Texte du cours'), { target: { value: 'Un autre texte de cours, distinct du premier document.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Générer les flashcards' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('Ancienne question')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Enregistrer mes flashcards' })).not.toBeInTheDocument();
  expect(addDoc).not.toHaveBeenCalled();
});
