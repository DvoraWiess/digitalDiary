import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayOfWeekOf,
  diffDays,
  getOffsetMinutes,
  isValidDateString,
  utcToZoned,
  zonedDateTimeToUtc,
} from '../../src/utils/time';

const TZ = 'Asia/Jerusalem';

describe('time utils', () => {
  it('converts Israel local time to UTC in winter and summer', () => {
    expect(zonedDateTimeToUtc('2026-12-06', 16 * 60, TZ).toISOString()).toBe('2026-12-06T14:00:00.000Z');
    expect(zonedDateTimeToUtc('2026-07-05', 16 * 60, TZ).toISOString()).toBe('2026-07-05T13:00:00.000Z');
  });

  it('handles the October clock change (25.10.2026)', () => {
    expect(zonedDateTimeToUtc('2026-10-23', 10 * 60, TZ).toISOString()).toBe('2026-10-23T07:00:00.000Z');
    expect(zonedDateTimeToUtc('2026-10-25', 16 * 60, TZ).toISOString()).toBe('2026-10-25T14:00:00.000Z');
  });

  it('converts UTC back to local date and time', () => {
    expect(utcToZoned(new Date('2026-10-18T13:00:00Z'), TZ)).toEqual({ date: '2026-10-18', time: '16:00' });
    expect(utcToZoned(new Date('2026-10-18T21:30:00Z'), TZ)).toEqual({ date: '2026-10-19', time: '00:30' });
    expect(getOffsetMinutes(new Date('2026-01-01T00:00:00Z'), TZ)).toBe(120);
  });

  it('validates and manipulates date strings', () => {
    expect(isValidDateString('2026-02-28')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('18/10/2026')).toBe(false);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(diffDays('2026-10-18', '2026-11-18')).toBe(31);
    expect(dayOfWeekOf('2026-10-18')).toBe(0);
  });
});
