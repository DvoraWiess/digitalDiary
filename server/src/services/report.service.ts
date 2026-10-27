import { prisma } from '../db/prisma';
import type { ReportInput } from '../schemas/report.schemas';
import type { AuthUser } from '../types/express';
import { conflict, notFound } from '../utils/AppError';
import { clock } from '../utils/clock';
import { assertCanAccessStudent } from './access';
import { presentReport } from './presenters';

/** צפייה בדוח שיעור. חשבון תלמיד לא רואה את "מה לעשות בשיעור הבא" */
export async function getReport(user: AuthUser, lessonId: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { report: true } });
  if (!lesson) throw notFound('השיעור לא נמצא');
  assertCanAccessStudent(user, lesson.studentId);
  if (!lesson.report) throw notFound('עדיין לא נכתב דוח לשיעור זה', 'REPORT_NOT_FOUND');
  return presentReport(lesson.report, user.role);
}

/**
 * המורה כותבת או עורכת דוח שיעור (PUT מחליף את כל הדוח).
 * אפשר רק לשיעור מאושר שזמנו כבר הגיע. הדוח מעדכן גם את סטטוס השיעור:
 * הגיע -> COMPLETED, לא הגיע -> NO_SHOW.
 */
export async function upsertReport(lessonId: number, input: ReportInput) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw notFound('השיעור לא נמצא');

  if (!['APPROVED', 'COMPLETED', 'NO_SHOW'].includes(lesson.status)) {
    throw conflict('אפשר לכתוב דוח רק לשיעור מאושר', 'INVALID_STATUS');
  }
  if (lesson.startsAt.getTime() > clock.now().getTime()) {
    throw conflict('אפשר לכתוב דוח רק אחרי שהשיעור התחיל', 'LESSON_NOT_STARTED');
  }

  const data = {
    attendance: input.attendance,
    topicsCovered: input.topicsCovered ?? null,
    behavior: input.behavior ?? null,
    behaviorNote: input.behaviorNote ?? null,
    previousHomework: input.previousHomework ?? null,
    homeworkAssigned: input.homeworkAssigned ?? null,
    nextLessonPlan: input.nextLessonPlan ?? null,
    extraLessonRecommended: input.extraLessonRecommended ?? false,
    extraLessonNote: input.extraLessonNote ?? null,
  };

  const [report] = await prisma.$transaction([
    prisma.lessonReport.upsert({
      where: { lessonId },
      create: { lessonId, ...data },
      update: data,
    }),
    prisma.lesson.update({
      where: { id: lessonId },
      data: { status: input.attendance === 'ATTENDED' ? 'COMPLETED' : 'NO_SHOW' },
    }),
  ]);

  return presentReport(report, 'TEACHER');
}
