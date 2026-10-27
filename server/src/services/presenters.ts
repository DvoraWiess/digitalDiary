import type { LessonReport, Prisma, Role } from '@prisma/client';

/**
 * "Presenters" - קובעים בדיוק אילו שדות יוצאים ב-API.
 * כך אף פעם לא נחשפים passwordHash, וחשבון תלמיד לא רואה שדות פרטיים של המורה.
 */

export const studentInclude = {
  user: { select: { username: true } },
} satisfies Prisma.StudentInclude;

export type StudentWithUser = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

export function presentStudent(student: StudentWithUser, viewerRole: Role) {
  const base = {
    id: student.id,
    username: student.user.username,
    firstName: student.firstName,
    lastName: student.lastName,
    age: student.age,
    gradeText: student.gradeText,
    readingLevel: student.readingLevel,
    goals: student.goals,
    schoolTeacherName: student.schoolTeacherName,
    schoolTeacherPhone: student.schoolTeacherPhone,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    isActive: student.isActive,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
  if (viewerRole === 'TEACHER') {
    return { ...base, teacherNotes: student.teacherNotes };
  }
  return base;
}

export const lessonInclude = {
  student: { select: { id: true, firstName: true, lastName: true } },
  report: { select: { id: true } },
  cancelledBy: { select: { role: true } },
} satisfies Prisma.LessonInclude;

export type LessonWithRelations = Prisma.LessonGetPayload<{ include: typeof lessonInclude }>;

export function presentLesson(lesson: LessonWithRelations) {
  return {
    id: lesson.id,
    studentId: lesson.studentId,
    student: {
      id: lesson.student.id,
      firstName: lesson.student.firstName,
      lastName: lesson.student.lastName,
    },
    startsAt: lesson.startsAt.toISOString(),
    endsAt: lesson.endsAt.toISOString(),
    status: lesson.status,
    parentNote: lesson.parentNote,
    statusReason: lesson.statusReason,
    cancelledByRole: lesson.cancelledBy?.role ?? null,
    hasReport: lesson.report !== null,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  };
}

export function presentReport(report: LessonReport, viewerRole: Role) {
  const base = {
    id: report.id,
    lessonId: report.lessonId,
    attendance: report.attendance,
    topicsCovered: report.topicsCovered,
    behavior: report.behavior,
    behaviorNote: report.behaviorNote,
    previousHomework: report.previousHomework,
    homeworkAssigned: report.homeworkAssigned,
    extraLessonRecommended: report.extraLessonRecommended,
    extraLessonNote: report.extraLessonNote,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
  if (viewerRole === 'TEACHER') {
    return { ...base, nextLessonPlan: report.nextLessonPlan };
  }
  return base;
}
