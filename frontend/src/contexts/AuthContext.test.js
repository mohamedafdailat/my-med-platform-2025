import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { onIdTokenChanged } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { AuthProvider, useAuth } from './AuthContext';

jest.mock('../firebase/config', () => ({ auth: {}, db: {} }));
jest.mock('firebase/auth', () => ({ onIdTokenChanged: jest.fn(), signOut: jest.fn(), sendPasswordResetEmail: jest.fn() }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn((db, name, id) => id), onSnapshot: jest.fn() }));

let authChange, profileChange, stopProfile;
const Probe = () => {
  const { user, loading, logout } = useAuth();
  return <><output data-testid="state">{JSON.stringify({ user, loading })}</output><button onClick={logout}>Logout</button></>;
};
const state = () => JSON.parse(screen.getByTestId('state').textContent);
const account = (uid = 'student', claims = {}) => ({ uid, email: `${uid}@example.test`, displayName: 'Auth Name', getIdTokenResult: () => Promise.resolve({ claims }) });

beforeEach(() => {
  jest.clearAllMocks(); stopProfile = jest.fn();
  onIdTokenChanged.mockImplementation((auth, callback) => { authChange = callback; return jest.fn(); });
  onSnapshot.mockImplementation((ref, callback) => { profileChange = callback; return stopProfile; });
  render(<AuthProvider><Probe /></AuthProvider>);
});
afterEach(cleanup);

test('stored profile cannot override authenticated identity or elevate role', async () => {
  await act(async () => authChange(account()));
  act(() => profileChange({ data: () => ({ uid: 'admin', email: 'another@example.test', role: 'admin', fullName: 'Nom Profil' }) }));
  expect(state().user).toMatchObject({ uid: 'student', email: 'student@example.test', role: 'student', displayName: 'Nom Profil' });
});
test('late profile callback cannot resurrect a signed-out session', async () => {
  await act(async () => authChange(account()));
  const lateCallback = profileChange;
  await act(async () => authChange(null));
  act(() => lateCallback({ data: () => ({ fullName: 'Stale' }) }));
  expect(state()).toEqual({ user: null, loading: false });
  expect(stopProfile).toHaveBeenCalled();
});
test('late token result cannot replace a newer account', async () => {
  let resolveOld;
  const old = { ...account('old'), getIdTokenResult: () => new Promise(resolve => { resolveOld = resolve; }) };
  let pending;
  act(() => { pending = authChange(old); });
  await act(async () => authChange(account('new')));
  act(() => profileChange({ data: () => ({ fullName: 'New' }) }));
  await act(async () => { resolveOld({ claims: { role: 'admin' } }); await pending; });
  expect(state().user.uid).toBe('new');
  expect(state().user.role).toBe('student');
});
test('profile updates appear without signing in again', async () => {
  await act(async () => authChange(account('admin', { role: 'admin' })));
  act(() => profileChange({ data: () => ({ fullName: 'Initial', semester: '1' }) }));
  act(() => profileChange({ data: () => ({ fullName: 'Modifié', semester: '4', role: 'student' }) }));
  expect(state().user).toMatchObject({ fullName: 'Modifié', semester: '4', role: 'admin' });
});

test('same-account token refresh preserves the active page while claims load', async () => {
  await act(async () => authChange(account()));
  act(() => profileChange({ data: () => ({ fullName: 'Initial' }) }));
  let resolveToken, pending;
  const refreshed = { ...account(), getIdTokenResult: () => new Promise(resolve => { resolveToken = resolve; }) };
  act(() => { pending = authChange(refreshed); });
  expect(state().loading).toBe(false);
  expect(state().user.uid).toBe('student');
  await act(async () => { resolveToken({ claims: {} }); await pending; });
  act(() => profileChange({ data: () => ({ fullName: 'Updated' }) }));
  expect(state().user.fullName).toBe('Updated');
});
