import { safeReturnPath } from './navigation';

test('keeps the requested page, query and fragment', () => {
  expect(safeReturnPath('/courses/abc?lesson=2#notes')).toBe('/courses/abc?lesson=2#notes');
  expect(safeReturnPath({ pathname: '/profile', search: '?edit=1', hash: '#name' })).toBe('/profile?edit=1#name');
});

test.each(['https://example.com', '//example.com', '/\\example.com', '/login', '/register?x=1', '', null])('rejects unsafe or looping redirect %s', (value) => {
  expect(safeReturnPath(value)).toBe('/dashboard');
});
