import { describe, expect, it } from 'vitest';
import { computeAvailability, type ComputeAvailabilityParams } from '../../src/services/availability.logic';

const base: Omit<ComputeAvailabilityParams, 'from' | 'to'> = {
  workingHours: [
    { dayOfWeek: 0, startTime: '16:00', endTime: '19:00' },
    { dayOfWeek: 1, startTime: '16:00', endTime: '19:00' },
  ],
  specialSlots: [],
  busy: [],
  now: new Date('2026-10-18T13:30:00Z'), // ראשון 16:30 שעון ישראל
  lessonDurationMinutes: 45,
  bookingWindowDays: 28,
  timeZone: 'Asia/Jerusalem',
};

describe('computeAvailability', () => {
  it('splits working hours into lesson-length slots and drops past times', () => {
    const [sunday] = computeAvailability({ ...base, from: '2026-10-18', to: '2026-10-18' });
    expect(sunday.slots.map((s) => s.time)).toEqual(['16:45', '17:30', '18:15']);
    expect(sunday.slots[0]).toMatchObject({
      startsAt: '2026-10-18T13:45:00.000Z',
      endsAt: '2026-10-18T14:30:00.000Z',
      special: false,
      forStudentId: null,
    });
  });

  it('returns every day in the range, including days without slots', () => {
    const days = computeAvailability({ ...base, from: '2026-10-18', to: '2026-10-24' });
    expect(days.map((d) => d.date)).toEqual([
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
    ]);
    expect(days[2].slots).toEqual([]);
  });

  it('removes slots that overlap busy lessons', () => {
    const [monday] = computeAvailability({
      ...base,
      from: '2026-10-19',
      to: '2026-10-19',
      busy: [{ startsAt: new Date('2026-10-19T13:45:00Z'), endsAt: new Date('2026-10-19T14:30:00Z') }],
    });
    expect(monday.slots.map((s) => s.time)).toEqual(['16:00', '17:30', '18:15']);
  });

  it('adds special slots and marks them', () => {
    const [friday] = computeAvailability({
      ...base,
      from: '2026-10-23',
      to: '2026-10-23',
      specialSlots: [{ date: '2026-10-23', startTime: '10:00', endTime: '11:00', studentId: 7 }],
    });
    expect(friday.slots).toHaveLength(1); // 10:45 לא נכנס עד 11:00
    expect(friday.slots[0]).toMatchObject({ time: '10:00', special: true, forStudentId: 7 });
  });

  it('respects the booking window', () => {
    const inside = computeAvailability({ ...base, from: '2026-11-08', to: '2026-11-08' });
    const outside = computeAvailability({ ...base, from: '2026-11-29', to: '2026-11-29' });
    expect(inside[0].slots.length).toBeGreaterThan(0);
    expect(inside[0].slots[0].startsAt).toBe('2026-11-08T14:00:00.000Z'); // שעון חורף
    expect(outside[0].slots).toEqual([]);
  });
});
