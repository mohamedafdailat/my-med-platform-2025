import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { PaidFeatureWrapper } from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'fr' }) }));
jest.mock('../contexts/PaymentContext', () => ({ usePayment: () => ({ checkFeatureAccess: () => false }) }));

const renderAdminRoute = (user) => {
  useAuth.mockReturnValue({ user, loading: false });
  return render(
    <MemoryRouter initialEntries={['/admin']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<p>Accueil public</p>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><p>Gestion des comptes</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );
};

test.each([{}, { role: 'admin' }, { role: 'admin', adminAccessVersion: '1' }])(
  'a stored admin role or legacy claims cannot open an admin route: %j', (customClaims) => {
    renderAdminRoute({ uid: 'legacy', role: 'admin', customClaims });
    expect(screen.getByText('Accueil public')).toBeInTheDocument();
    expect(screen.queryByText('Gestion des comptes')).not.toBeInTheDocument();
  }
);

test('current admin claims can open an admin route', () => {
  renderAdminRoute({ uid: 'admin', customClaims: { role: 'admin', adminAccessVersion: 1 } });
  expect(screen.getByText('Gestion des comptes')).toBeInTheDocument();
});

test('legacy admin claims do not bypass paid feature access', () => {
  useAuth.mockReturnValue({ user: { uid: 'legacy', role: 'admin', customClaims: { role: 'admin' } }, loading: false });
  render(<PaidFeatureWrapper featureName="videos"><p>Lecteur premium</p></PaidFeatureWrapper>);
  expect(screen.getByText('Abonnement Premium Requis')).toBeInTheDocument();
  expect(screen.queryByText('Lecteur premium')).not.toBeInTheDocument();
});
