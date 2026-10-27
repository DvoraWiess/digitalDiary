import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import type { AuthUser } from '../types/express';
import { forbidden, notFound } from '../utils/AppError';
import { clock } from '../utils/clock';
import { addDays, dbDateToString, startOfZonedDay, stringToDbDate } from '../utils/time';
import { computeAvailability, type AvailabilityDay } from './availability.logic';

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * מחשב זמנים פנויים בטווח תאריכים עבור תלמיד מסוים.
 * studentId = null (רק מורה): מוצגים כל הזמנים המיוחדים.
 */
export async function computeAvailabilityFor(
  from: string,
  to: string,
  studentId: number | null,
  db: Db = prisma,
): Promise<AvailabilityDay[]> {
  const rangeStart = startOfZonedDay(from, env.TIMEZONE);
  const rangeEnd = startOfZonedDay(addDays(to, 1), env.TIMEZONE);

  // השאילתות רצות אחת אחרי השנייה כי הפונקציה משמשת גם בתוך טרנזקציה
  const workingHours = await db.workingHours.findMany();
  const specialSlots = await db.specialSlot.findMany({
    where: {
      date: { gte: stringToDbDate(from), lte: stringToDbDate(to) },
      ...(studentId !== null ? { OR: [{ studentId: null }, { studentId }] } : {}),
    },
  });
  const busyLessons = await db.lesson.findMany({
    where: {
      status: { in: ['PENDING', 'APPROVED'] },
      startsAt: { lt: rangeEnd },
      endsAt: { gt: rangeStart },
    },
    select: { startsAt: true, endsAt: true },
  });

  return computeAvailability({
    from,
    to,
    workingHours,
    specialSlots: specialSlots.map((s) => ({
      date: dbDateToString(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
      studentId: s.studentId,
    })),
    busy: busyLessons,
    now: clock.now(),
    lessonDurationMinutes: env.LESSON_DURATION_MINUTES,
    bookingWindowDays: env.BOOKING_WINDOW_DAYS,
    timeZone: env.TIMEZONE,
  });
}

/** GET /api/availability */
export async function getAvailability(user: AuthUser, query: { from: string; to: string; studentId?: number }) {
  let studentId: number | null;
  if (user.role === 'STUDENT') {
    if (query.studentId !== undefined && query.studentId !== user.studentId) {
      throw forbidden('אפשר לצפות רק בזמנים הפנויים של התלמיד שלך');
    }
    studentId = user.studentId;
  } else {
    studentId = query.studentId ?? null;
    if (studentId !== null) {
      const exists = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
      if (!exists) throw notFound('התלמיד לא נמצא');
    }
  }

  const days = await computeAvailabilityFor(query.from, query.to, studentId);
  return {
    from: query.from,
    to: query.to,
    timeZone: env.TIMEZONE,
    lessonDurationMinutes: env.LESSON_DURATION_MINUTES,
    bookingWindowDays: env.BOOKING_WINDOW_DAYS,
    days,
  };
}
