import { addDays, dayOfWeekOf, timeToMinutes, utcToZoned, zonedDateTimeToUtc } from '../utils/time';

/**
 * חישוב הזמנים הפנויים - פונקציה "טהורה" (בלי מסד נתונים) כדי שיהיה קל לבדוק אותה.
 *
 * האלגוריתם לכל יום בטווח:
 * 1. לוקחים את שעות העבודה של אותו יום בשבוע ומחלקים לחלונות באורך שיעור.
 * 2. מוסיפים את הזמנים המיוחדים של אותו תאריך (שכבר סוננו לפי התלמיד).
 * 3. מורידים זמנים שכבר עברו, זמנים רחוקים מדי (מעבר לחלון ההזמנה),
 *    וזמנים שמתנגשים בשיעור קיים (ממתין לאישור או מאושר).
 */

export interface WorkingHoursInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface SpecialSlotInput {
  date: string;
  startTime: string;
  endTime: string;
  studentId: number | null;
}

export interface BusyInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface AvailableSlot {
  startsAt: string;
  endsAt: string;
  time: string;
  special: boolean;
  forStudentId: number | null;
}

export interface AvailabilityDay {
  date: string;
  dayOfWeek: number;
  slots: AvailableSlot[];
}

export interface ComputeAvailabilityParams {
  from: string;
  to: string;
  workingHours: WorkingHoursInput[];
  specialSlots: SpecialSlotInput[];
  busy: BusyInterval[];
  now: Date;
  lessonDurationMinutes: number;
  bookingWindowDays: number;
  timeZone: string;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

export function computeAvailability(params: ComputeAvailabilityParams): AvailabilityDay[] {
  const { from, to, workingHours, specialSlots, busy, now, lessonDurationMinutes, bookingWindowDays, timeZone } = params;
  const durationMs = lessonDurationMinutes * 60_000;
  const latestStart = now.getTime() + bookingWindowDays * 86_400_000;
  const days: AvailabilityDay[] = [];

  for (let date = from; date <= to; date = addDays(date, 1)) {
    const dayOfWeek = dayOfWeekOf(date);
    const byStart = new Map<string, AvailableSlot>();

    const addRange = (startTime: string, endTime: string, special: boolean, forStudentId: number | null): void => {
      const rangeStart = timeToMinutes(startTime);
      const rangeEnd = timeToMinutes(endTime);
      for (let minute = rangeStart; minute + lessonDurationMinutes <= rangeEnd; minute += lessonDurationMinutes) {
        const startsAt = zonedDateTimeToUtc(date, minute, timeZone);
        const endsAt = new Date(startsAt.getTime() + durationMs);
        if (startsAt.getTime() <= now.getTime()) continue;
        if (startsAt.getTime() > latestStart) continue;
        if (busy.some((b) => overlaps(startsAt, endsAt, b.startsAt, b.endsAt))) continue;

        const key = startsAt.toISOString();
        const existing = byStart.get(key);
        if (existing) {
          if (special && !existing.special) {
            existing.special = true;
            existing.forStudentId = forStudentId;
          }
          continue;
        }
        byStart.set(key, {
          startsAt: key,
          endsAt: endsAt.toISOString(),
          time: utcToZoned(startsAt, timeZone).time,
          special,
          forStudentId,
        });
      }
    };

    for (const wh of workingHours) {
      if (wh.dayOfWeek === dayOfWeek) addRange(wh.startTime, wh.endTime, false, null);
    }
    for (const slot of specialSlots) {
      if (slot.date === date) addRange(slot.startTime, slot.endTime, true, slot.studentId);
    }

    const slots = [...byStart.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    days.push({ date, dayOfWeek, slots });
  }

  return days;
}
