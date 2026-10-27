import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Quizzes from './Quizzes';
import { getVisibleDocuments, getOwnQuizAttempts } from '../services/contentService';

let mockUser;
let mockLanguage;
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mockLanguage }) }));
jest.mock('../services/contentService', () => ({ getVisibleDocuments: jest.fn(), getOwnQuizAttempts: jest.fn() }));
jest.mock('../components/ContentPublication', () => ({ item }) => <div data-testid="publication">{item.id}</div>);
const document = (id, data = {}) => ({ id, data: () => ({ title: id, visibility: 'shared', questions: [{}], ...data }) });
const view = () => <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Quizzes /></MemoryRouter>;
const cards = container => [...container.querySelectorAll('.ql-card')].map(card => card.dataset.quizId);
const fixtures = [document('Partagé IA', { type: 'ai-generated' }), document('Personnel classique', { visibility: 'private', creatorId: 'student' }), document('Autre partagé')];
beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { uid: 'student', semester: '1', customClaims: { role: 'student' } };
  mockLanguage = 'fr';
  getVisibleDocuments.mockResolvedValue(fixtures);
  getOwnQuizAttempts.mockResolvedValue([{ userId: 'student', quizId: 'Partagé IA', score: 0 }]);
});

test('shared AI is discoverable and local filters never refetch or alter global statistics', async () => {
  const { container, rerender } = render(view());
  await waitFor(() => expect(cards(container)).toHaveLength(3));
  expect(container.querySelector('[data-quiz-stat="accessible"]')).toHaveTextContent('3');
  expect(container.querySelector('[data-quiz-stat="completed"]')).toHaveTextContent('1');
  expect(container.querySelector('[data-quiz-stat="average"]')).toHaveTextContent('0 %');
  expect(container.querySelector('[data-quiz-id="Partagé IA"] .ql-card-score strong')).toHaveTextContent('0 %');
  fireEvent.click(container.querySelector('[data-quiz-space="library"]'));
  fireEvent.change(screen.getByLabelText('Origine du quiz'), { target: { value: 'ai-generated' } });
  expect(cards(container)).toEqual(['Partagé IA']);
  fireEvent.change(screen.getByLabelText('Rechercher dans les quiz'), { target: { value: 'partage' } });
  fireEvent.change(screen.getByLabelText('Trier les quiz'), { target: { value: 'title' } });
  expect(cards(container)).toEqual(['Partagé IA']);
  expect(container.querySelector('[data-quiz-stat="accessible"]')).toHaveTextContent('3');
  expect(container.querySelector('[data-quiz-stat="completed"]')).toHaveTextContent('1');
  expect(getVisibleDocuments).toHaveBeenCalledTimes(1);
  expect(getOwnQuizAttempts).toHaveBeenCalledTimes(1);
  mockLanguage = 'ar'; rerender(view());
  expect(container.querySelector('.quiz-library')).toHaveAttribute('dir', 'rtl');
  expect(getVisibleDocuments).toHaveBeenCalledTimes(1);
});

test('a history failure leaves the catalog usable and completion status unknown', async () => {
  getOwnQuizAttempts.mockRejectedValue(new Error('Sensitive historical detail'));
  const { container } = render(view());
  await waitFor(() => expect(cards(container)).toHaveLength(3));
  expect(screen.getByText(/Votre historique est momentanément indisponible/)).toBeInTheDocument();
  expect(screen.getByLabelText('Votre activité')).toBeDisabled();
  expect(container.querySelector('[data-quiz-stat="average"]')).toHaveTextContent('—');
  expect(screen.queryByText('Sensitive historical detail')).not.toBeInTheDocument();
  expect(container.querySelector('.ql-card .ql-start')).toHaveAttribute('href', expect.stringContaining('/quizzes/'));
});

test('a catalog failure preserves real history statistics and can be retried', async () => {
  getVisibleDocuments.mockRejectedValueOnce(new Error('Sensitive catalog detail')).mockResolvedValue(fixtures);
  const { container } = render(view());
  expect(await screen.findByRole('alert')).not.toHaveTextContent('Sensitive catalog detail');
  expect(container.querySelector('[data-quiz-stat="completed"]')).toHaveTextContent('1');
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer', exact: true }));
  await waitFor(() => expect(cards(container)).toHaveLength(3));
});

test('old account responses cannot disclose the previous private catalog or attempts', async () => {
  let resolveCatalog, resolveAttempts;
  getVisibleDocuments.mockImplementationOnce(() => new Promise(resolve => { resolveCatalog = resolve; })).mockResolvedValueOnce([document('Nouveau catalogue')]);
  getOwnQuizAttempts.mockImplementationOnce(() => new Promise(resolve => { resolveAttempts = resolve; })).mockResolvedValueOnce([]);
  const { rerender, container } = render(view());
  mockUser = { uid: 'second', semester: '2', customClaims: { role: 'student' } };
  rerender(view());
  await waitFor(() => expect(cards(container)).toEqual(['Nouveau catalogue']));
  await act(async () => { resolveCatalog([document('Ancien contenu privé')]); resolveAttempts([{ userId: 'student', quizId: 'old', score: 100 }]); });
  expect(screen.queryByText('Ancien contenu privé')).not.toBeInTheDocument();
  expect(container.querySelector('[data-quiz-stat="completed"]')).toHaveTextContent('0');
});

test('only current admin claims expose publication and private management', async () => {
  mockUser = { uid: 'legacy-admin', customClaims: { role: 'admin' } };
  const { rerender, container } = render(view());
  await waitFor(() => expect(cards(container)).toHaveLength(3));
  expect(screen.queryByTestId('publication')).not.toBeInTheDocument();
  expect(container.querySelector('[data-quiz-space="admin"]')).toBeNull();
  mockUser = { uid: 'admin', customClaims: { role: 'admin', adminAccessVersion: 1 } };
  rerender(view());
  await waitFor(() => expect(screen.getAllByTestId('publication')).toHaveLength(3));
  expect(container.querySelector('[data-quiz-space="admin"]')).toBeInTheDocument();
});
