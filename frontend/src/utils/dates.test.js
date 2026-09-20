import { toDate } from './dates';

test('supports Firebase timestamps, serialized timestamps, and ISO dates', () => {
  const iso = '2026-09-20T00:00:00.000Z';
  const seconds = new Date(iso).getTime() / 1000;
  for (const value of [iso, new Date(iso), { seconds }, { _seconds: seconds }, { toDate: () => new Date(iso) }]) {
    expect(toDate(value).toISOString()).toBe(iso);
  }
});

test('invalid and missing dates do not appear as Invalid Date', () => {
  expect(toDate('not a date')).toBeNull();
  expect(toDate(null)).toBeNull();
});
