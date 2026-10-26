import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getDoc } from 'firebase/firestore';
import { getVisibleDocuments } from '../services/contentService';
import { resolveMediaUrl } from '../services/mediaService';
import VideoPlayer from './VideoPlayer';

const mockUser = { uid: 'student', semester: '1', customClaims: { role: 'student' } };
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'fr' }) }));
jest.mock('../firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), getDoc: jest.fn() }));
jest.mock('../services/contentService', () => ({ getVisibleDocuments: jest.fn() }));
jest.mock('../services/mediaService', () => ({ resolveMediaUrl: jest.fn() }));
jest.mock('./FlashcardGenerator', () => () => null);
jest.mock('./QCMPlayer', () => () => null);

const mount = () => render(<MemoryRouter initialEntries={['/videos/lecture']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/videos/:id" element={<VideoPlayer />} /></Routes></MemoryRouter>);
beforeEach(() => {
  jest.clearAllMocks();
  getDoc.mockResolvedValue({ id: 'lecture', exists: () => true, data: () => ({ title: 'Anatomie du cœur', youtubeId: 'dQw4w9WgXcQ' }) });
  resolveMediaUrl.mockImplementation(async (_kind, _id, url) => url);
  getVisibleDocuments.mockResolvedValue([]);
});

test('optional resource failures do not hide the authorized video', async () => {
  getVisibleDocuments.mockRejectedValue(new Error('permission-denied'));
  mount();
  expect(await screen.findByRole('heading', { level: 1, name: 'Anatomie du cœur' })).toBeInTheDocument();
  expect(await screen.findByRole('status')).toHaveTextContent('ressources complémentaires');
  expect(screen.getByTitle('Anatomie du cœur')).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed/dQw4w9WgXcQ'));
});

test('inactive videos are rejected before resolving media or loading related content', async () => {
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({ status: 'inactive', storagePath: 'videos/private.mp4' }) });
  mount();
  expect(await screen.findByText('Vidéo introuvable')).toBeInTheDocument();
  expect(resolveMediaUrl).not.toHaveBeenCalled();
  expect(getVisibleDocuments).not.toHaveBeenCalled();
});

test('malformed legacy flashcards cannot hide a playable video', async () => {
  getVisibleDocuments.mockImplementation(async name => name === 'flashcards' ? [{ id: 'legacy', data: () => ({ videoId: 'lecture', cards: [null, false, { question: 'Question', answer: 'Réponse' }] }) }] : []);
  mount();
  expect(await screen.findByRole('heading', { level: 1, name: 'Anatomie du cœur' })).toBeInTheDocument();
  await screen.findByRole('button', { name: 'Cartes Flash (1)' });
  expect(screen.getByTitle('Anatomie du cœur')).toBeInTheDocument();
});

test('retry renews protected playback URL and keeps the playback position', async () => {
  getDoc.mockResolvedValue({ id: 'lecture', exists: () => true, data: () => ({ title: 'Cours protégé', storagePath: 'videos/private.mp4' }) });
  resolveMediaUrl.mockResolvedValueOnce('https://storage.example.test/video?signature=first').mockResolvedValueOnce('https://storage.example.test/video?signature=renewed');
  const { container } = mount();
  await screen.findByRole('heading', { level: 1, name: 'Cours protégé' });
  let player = container.querySelector('video');
  player.currentTime = 125;
  fireEvent.timeUpdate(player);
  fireEvent.error(player);
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer', exact: true }));
  await waitFor(() => expect(container.querySelector('source')).toHaveAttribute('src', expect.stringContaining('renewed')));
  player = container.querySelector('video');
  fireEvent.loadedMetadata(player);
  expect(player.currentTime).toBe(125);
  expect(resolveMediaUrl).toHaveBeenCalledTimes(2);
});
