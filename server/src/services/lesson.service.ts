import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import type { LessonListQuery, LessonRequestInput } from '../schemas/lesson.schemas';
import type { AuthUser } from '../types/express';
import { badRequest, conflict, forbidden, notFound } from '../utils/AppError';
import { clock } from '../utils/clock';
import { addDays, startOfZonedDay, utcToZoned } from '../utils/time';
import { assertCanAccessStudent } from './access';
import { computeAvailabilityFor } from './availability.service';
import { lessonInclude, presentLesson } from './presenters';

const ACTIVE_STATUSES = ['PENDING', 'APPROVED'] as const;

/** שתי בקשות באותו רגע לאותה שעה - PostgreSQL מבטל אחת מהן (serialization failure) */
function isSerializationFailure(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') return true;
  return err instanceof Error && /40001|could not serialize|write conflict/i.test(err.message);
}

export async function findLessonOr404(id: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: lessonInclude });
  if (!lesson) throw notFound('השיעור לא נמצא');
  return lesson;
}

/** רשימת שיעורים. חשבון תלמיד רואה רק את השיעורים שלו. ממוין לפי זמן השיעור */
export async function listLessons(user: AuthUser, query: LessonListQuery) {
  const startsAt: Prisma.DateTimeFilter = {};
  if (query.from) startsAt.gte = startOfZonedDay(query.from, env.TIMEZONE);
  if (query.to) startsAt.lt = startOfZonedDay(addDays(query.to, 1), env.TIMEZONE);

  const lessons = await prisma.lesson.findMany({
    where: {
      ...(user.role === 'STUDENT' ? { studentId: user.studentId ?? -1 } : {}),
      ...(query.status ? { status: { in: query.status } } : {}),
      startsAt,
    },
    include: lessonInclude,
    orderBy: { startsAt: 'asc' },
    take: 500,
  });
  return lessons.map(presentLesson);
}

export async function getLesson(user: AuthUser, id: number) {
  const lesson = await findLessonOr404(id);
  assertCanAccessStudent(user, lesson.studentId);
  return presentLesson(lesson);
}

/**
 * ההורה (חשבון תלמיד) מבקש שיעור.
 * 1. בודקים שהזמן שנבחר מופיע ברשימת הזמנים הפנויים של התלמיד.
 * 2. בתוך טרנזקציה (Serializable) בודקים שוב שאין התנגשות ויוצרים בקשה בסטטוס PENDING.
 */
export async function requestLesson(user: AuthUser, input: LessonRequestInput) {
  if (user.role !== 'STUDENT' || user.studentId === null) {
    throw forbidden('רק חשבון תלמיד יכול לבקש שיעור');
  }
  const studentId = user.studentId;
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + env.LESSON_DURATION_MINUTES * 60_000);
  const localDate = utcToZoned(startsAt, env.TIMEZONE).date;

  const notAvailable = () =>
    conflict('השעה שנבחרה אינה פנויה. רעננו את רשימת הזמנים הפנויים ובחרו שעה אחרת', 'SLOT_NOT_AVAILABLE');

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const [day] = await computeAvailabilityFor(localDate, localDate, studentId, tx);
        const isOffered = day?.slots.some((slot) => slot.startsAt === startsAt.toISOString()) ?? false;
        if (!isOffered) throw notAvailable();

        const clash = await tx.lesson.count({
          where: {
            status: { in: [...ACTIVE_STATUSES] },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });
        if (clash > 0) throw notAvailable();

        return tx.lesson.create({
          data: {
            studentId,
            requestedById: user.id,
            startsAt,
            endsAt,
            status: 'PENDING',
            parentNote: input.parentNote ?? null,
          },
          include: lessonInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return presentLesson(created);
  } catch (err) {
    if (isSerializationFailure(err)) {
      throw notAvailable();
    }
    throw err;
  }
}

/** המורה מאשרת בקשה */
export async function approveLesson(id: number) {
  const lesson = await findLessonOr404(id);
  if (lesson.status !== 'PENDING') {
    throw conflict('אפשר לאשר רק בקשה שממתינה לאישור', 'INVALID_STATUS');
  }
  if (lesson.startsAt.getTime() <= clock.now().getTime()) {
    throw conflict('אי אפשר לאשר שיעור שזמנו כבר עבר', 'LESSON_IN_PAST');
  }
  const updated = await prisma.lesson.update({
    where: { id },
    data: { status: 'APPROVED', statusReason: null },
    include: lessonInclude,
  });
  return presentLesson(updated);
}

/** המורה דוחה בקשה (סיבה לא חובה) */
export async function rejectLesson(id: number, reason?: string | null) {
  const lesson = await findLessonOr404(id);
  if (lesson.status !== 'PENDING') {
    throw conflict('אפשר לדחות רק בקשה שממתינה לאישור', 'INVALID_STATUS');
  }
  const updated = await prisma.lesson.update({
    where: { id },
    data: { status: 'REJECTED', statusReason: reason ?? null },
    include: lessonInclude,
  });
  return presentLesson(updated);
}

/**
 * ביטול שיעור.
 * מורה: בכל זמן לפני השיעור, חובה לכתוב סיבה.
 * חשבון תלמיד: רק שיעור שלו. בקשה ממתינה - בכל זמן. שיעור מאושר - עד 24 שעות לפני.
 */
export async function cancelLesson(user: AuthUser, id: number, reason?: string | null) {
  const lesson = await findLessonOr404(id);
  assertCanAccessStudent(user, lesson.studentId);

  if (lesson.status !== 'PENDING' && lesson.status !== 'APPROVED') {
    throw conflict('אפשר לבטל רק שיעור שממתין לאישור או מאושר', 'INVALID_STATUS');
  }
  const now = clock.now();
  if (lesson.startsAt.getTime() <= now.getTime()) {
    throw conflict('אי אפשר לבטל שיעור שכבר התחיל או עבר', 'LESSON_IN_PAST');
  }

  if (user.role === 'TEACHER') {
    if (!reason) {
      throw badRequest('המורה חייבת לכתוב סיבת ביטול', 'VALIDATION_ERROR', [
        { field: 'reason', message: 'שדה חובה בביטול על ידי המורה' },
      ]);
    }
  } else if (lesson.status === 'APPROVED') {
    const hoursLeft = (lesson.startsAt.getTime() - now.getTime()) / 3_600_000;
    if (hoursLeft < env.CANCEL_LIMIT_HOURS) {
      throw conflict(
        `אפשר לבטל שיעור מאושר עד ${env.CANCEL_LIMIT_HOURS} שעות לפני תחילתו. לביטול מאוחר יש לפנות למורה`,
        'CANCEL_TOO_LATE',
      );
    }
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data: { status: 'CANCELLED', statusReason: reason ?? null, cancelledById: user.id },
    include: lessonInclude,
  });
  return presentLesson(updated);
}
