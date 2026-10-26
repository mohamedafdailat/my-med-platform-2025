import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Videos from './Videos';
import { getVisibleDocuments } from '../services/contentService';

let mockUser;
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'fr' }) }));
jest.mock('../services/contentService', () => ({ getVisibleDocuments: jest.fn() }));
const video = (id, title) => ({ id, data: () => ({ title, semester: '1', storagePath: `videos/${id}.mp4` }) });
const view = () => <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Videos /></MemoryRouter>;
beforeEach(() => { jest.clearAllMocks(); mockUser = { uid: 'student', semester: '1', customClaims: { role: 'student' } }; });

test('failed catalog can be retried without disclosing backend error details', async () => {
  getVisibleDocuments.mockRejectedValueOnce(new Error('Sensitive upstream detail')).mockResolvedValueOnce([video('lecture', 'Cours autorisé')]);
  const { container } = render(view());
  expect(await screen.findByRole('alert')).not.toHaveTextContent('Sensitive upstream');
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer', exact: true }));
  await waitFor(() => expect(container.querySelectorAll('.vl-card')).toHaveLength(1));
  expect(container.querySelector('video, iframe')).toBeNull();
  expect(container.querySelector('.vl-card-art')).toHaveAttribute('href', '/videos/lecture');
});

test('late response from an old account cannot replace the current library', async () => {
  let resolveOld;
  getVisibleDocuments.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce([video('second', 'Bibliothèque du second compte')]);
  const { rerender, container } = render(view());
  mockUser = { uid: 'second-account', semester: '2', customClaims: { role: 'student' } };
  rerender(view());
  await waitFor(() => expect(container.querySelector('.vl-card h3')).toHaveTextContent('Bibliothèque du second compte'));
  await act(async () => resolveOld([video('old', 'Bibliothèque privée précédente')]));
  expect(screen.queryByText('Bibliothèque privée précédente')).not.toBeInTheDocument();
  expect(container.querySelector('.vl-card h3')).toHaveTextContent('Bibliothèque du second compte');
});
