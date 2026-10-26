import { hasAdminAccess } from './access';

test('admin access requires the current numeric claim version and admin role', () => {
  expect(hasAdminAccess({ role: 'admin', adminAccessVersion: 1 })).toBe(true);
  for (const claims of [undefined, {}, { role: 'admin' }, { role: 'admin', adminAccessVersion: '1' },
    { role: 'admin', adminAccessVersion: 0 }, { role: 'student', adminAccessVersion: 1 }]) {
    expect(hasAdminAccess(claims)).toBe(false);
  }
});
