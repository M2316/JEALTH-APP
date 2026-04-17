import { todayString, addDays, isoDate } from './date';

describe('date utils', () => {
  it('todayString returns YYYY-MM-DD for today (local)', () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(todayString()).toBe(expected);
  });

  it('isoDate formats Date → YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 3, 16))).toBe('2026-04-16'); // month is 0-indexed
  });

  it('addDays(+1) moves forward', () => {
    expect(addDays('2026-04-16', 1)).toBe('2026-04-17');
  });

  it('addDays(-7) moves backward across month boundary', () => {
    expect(addDays('2026-04-03', -7)).toBe('2026-03-27');
  });

  it('addDays(-13) moves backward across year boundary', () => {
    expect(addDays('2026-01-05', -13)).toBe('2025-12-23');
  });
});
