import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { hashPassword } from '../auth/password';
import {
  STUDENT_SELF_EDITABLE_FIELDS,
  studentSelfUpdateSchema,
  studentTeacherUpdateSchema,
  type StudentCreateInput,
} from '../schemas/student.schemas';
import type { AuthUser } from '../types/express';
import { clock } from '../utils/clock';
import { conflict, forbidden, notFound } from '../utils/AppError';
import { assertCanAccessStudent } from './access';
import { lessonInclude, presentLesson, presentReport, presentStudent, studentInclude } from './presenters';

const usernameTaken = () => conflict('שם המשתמש כבר תפוס. בחרו שם אחר, למשל עם ספרה בסוף', 'USERNAME_TAKEN');

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

async function findStudentOr404(id: number) {
  const student = await prisma.student.findUnique({ where: { id }, include: studentInclude });
  if (!student) throw notFound('התלמיד לא נמצא');
  return student;
}

/** רשימת תלמידים (מורה בלבד) עם חיפוש לפי שם. פעילים קודם, אחר כך לפי שם משפחה */
export async function listStudents(q?: string) {
  const words = (q ?? '').split(/\s+/).filter(Boolean);
  const where: Prisma.StudentWhereInput =
    words.length === 0
      ? {}
      : {
          AND: words.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: 'insensitive' as const } },
              { lastName: { contains: word, mode: 'insensitive' as const } },
            ],
          })),
        };

  const students = await prisma.student.findMany({
    where,
    include: studentInclude,
    orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }, { firstName: 'asc' }],
  });
  return students.map((s) => presentStudent(s, 'TEACHER'));
}

/** המורה מוסיפה תלמיד חדש יחד עם חשבון הכניסה שלו */
export async function createStudent(input: StudentCreateInput) {
  const { username, password, ...fields } = input;
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw usernameTaken();

  try {
    const student = await prisma.student.create({
      data: {
        ...fields,
        user: {
          create: {
            role: 'STUDENT',
            username,
            passwordHash: await hashPassword(password),
          },
        },
      },
      include: studentInclude,
    });
    return presentStudent(student, 'TEACHER');
  } catch (err) {
    if (isUniqueViolation(err)) throw usernameTaken();
    throw err;
  }
}

export async function getStudent(user: AuthUser, id: number) {
  assertCanAccessStudent(user, id);
  const student = await findStudentOr404(id);
  return presentStudent(student, user.role);
}

/**
 * עריכת תלמיד.
 * מורה - כל השדות. חשבון תלמיד - רק השדות המותרים, ורק לעצמו.
 */
export async function updateStudent(user: AuthUser, id: number, rawBody: unknown) {
  assertCanAccessStudent(user, id);
  await findStudentOr404(id);

  if (user.role === 'STUDENT') {
    if (typeof rawBody === 'object' && rawBody !== null && !Array.isArray(rawBody)) {
      const allowed = STUDENT_SELF_EDITABLE_FIELDS as readonly string[];
      const notAllowed = Object.keys(rawBody).filter((key) => !allowed.includes(key));
      if (notAllowed.length > 0) {
        throw forbidden(`אין הרשאה לעדכן את השדות: ${notAllowed.join(', ')}`, 'FIELD_NOT_ALLOWED');
      }
    }
    const input = studentSelfUpdateSchema.parse(rawBody);
    const updated = await prisma.student.update({ where: { id }, data: input, include: studentInclude });
    return presentStudent(updated, user.role);
  }

  const { username, ...fields } = studentTeacherUpdateSchema.parse(rawBody);
  try {
    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...fields,
        ...(username !== undefined ? { user: { update: { username } } } : {}),
      },
      include: studentInclude,
    });
    return presentStudent(updated, user.role);
  } catch (err) {
    if (isUniqueViolation(err)) throw usernameTaken();
    throw err;
  }
}

/** המורה מאפסת את הסיסמה של חשבון תלמיד */
export async function resetStudentPassword(id: number, password: string): Promise<void> {
  const student = await findStudentOr404(id);
  await prisma.user.update({
    where: { id: student.userId },
    data: { passwordHash: await hashPassword(password) },
  });
}

/**
 * תמונת מצב של תלמיד לפני שיעור:
 * פרטים, הדוח האחרון, השיעור הקרוב, ו-10 השיעורים האחרונים.
 */
export async function getStudentOverview(user: AuthUser, id: number) {
  assertCanAccessStudent(user, id);
  const student = await findStudentOr404(id);
  const now = clock.now();

  const [lastReported, nextLesson, recentLessons] = await Promise.all([
    prisma.lesson.findFirst({
      where: { studentId: id, report: { isNot: null } },
      orderBy: { startsAt: 'desc' },
      include: { ...lessonInclude, report: true },
    }),
    prisma.lesson.findFirst({
      where: { studentId: id, status: { in: ['PENDING', 'APPROVED'] }, startsAt: { gt: now } },
      orderBy: { startsAt: 'asc' },
      include: lessonInclude,
    }),
    prisma.lesson.findMany({
      where: { studentId: id, startsAt: { lte: now } },
      orderBy: { startsAt: 'desc' },
      take: 10,
      include: lessonInclude,
    }),
  ]);

  return {
    student: presentStudent(student, user.role),
    lastReport:
      lastReported && lastReported.report
        ? {
            lesson: presentLesson({ ...lastReported, report: { id: lastReported.report.id } }),
            report: presentReport(lastReported.report, user.role),
          }
        : null,
    nextLesson: nextLesson ? presentLesson(nextLesson) : null,
    recentLessons: recentLessons.map(presentLesson),
  };
}
