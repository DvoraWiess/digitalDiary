import request from 'supertest';
import { vi } from 'vitest';
import { createApp } from '../src/app';
import { hashPassword } from '../src/auth/password';
import { prisma } from '../src/db/prisma';
import { clock } from '../src/utils/clock';

export const app = createApp();
export const api = () => request(app);

/**
 * "עכשיו" קבוע לבדיקות: יום ראשון 18.10.2026 בשעה 13:00 שעון ישראל (10:00 UTC).
 * שעות העבודה בבדיקות: ראשון-חמישי 16:00-19:00, כלומר השיעור הראשון היום ב-13:00 UTC.
 */
export const NOW = '2026-10-18T10:00:00.000Z';
export const TODAY = '2026-10-18';

/** זמני שיעור מוכנים (UTC) בהתאם לשעות העבודה */
export const SLOT = {
  sun1600: '2026-10-18T13:00:00.000Z',
  sun1645: '2026-10-18T13:45:00.000Z',
  sun1730: '2026-10-18T14:30:00.000Z',
  mon1600: '2026-10-19T13:00:00.000Z',
  mon1645: '2026-10-19T13:45:00.000Z',
  wed1600: '2026-10-21T13:00:00.000Z',
};

export function setNow(iso: string = NOW): void {
  vi.spyOn(clock, 'now').mockImplementation(() => new Date(iso));
}

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "LessonReport", "Lesson", "SpecialSlot", "WorkingHours", "Student", "User" RESTART IDENTITY CASCADE',
  );
}

export async function createTeacher(username = 'teacher', password = 'Teacher123!') {
  return prisma.user.create({ data: { role: 'TEACHER', username, passwordHash: await hashPassword(password) } });
}

export async function createStudent(opts: {
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  isActive?: boolean;
  teacherNotes?: string;
}) {
  return prisma.student.create({
    data: {
      firstName: opts.firstName,
      lastName: opts.lastName,
      age: 8,
      parentName: 'הורה לדוגמה',
      parentPhone: '050-0000000',
      isActive: opts.isActive ?? true,
      teacherNotes: opts.teacherNotes ?? 'הערה פרטית של המורה',
      user: {
        create: {
          role: 'STUDENT',
          username: opts.username,
          passwordHash: await hashPassword(opts.password ?? 'Student123!'),
        },
      },
    },
  });
}

export async function loginAs(username: string, password: string): Promise<string> {
  const res = await api().post('/api/auth/login').send({ username, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${username}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}

export const bearer = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

/**
 * מצב בסיסי לרוב הבדיקות: מורה, שני תלמידים (דני ונועה), שעות עבודה ראשון-חמישי 16:00-19:00.
 */
export async function setupBasic() {
  await resetDb();
  await createTeacher();
  const dani = await createStudent({ username: 'cohen.dani', firstName: 'דני', lastName: 'כהן' });
  const noa = await createStudent({ username: 'levi.noa', firstName: 'נועה', lastName: 'לוי' });
  await prisma.workingHours.createMany({
    data: [0, 1, 2, 3, 4].map((dayOfWeek) => ({ dayOfWeek, startTime: '16:00', endTime: '19:00' })),
  });
  const teacherToken = await loginAs('teacher', 'Teacher123!');
  const daniToken = await loginAs('cohen.dani', 'Student123!');
  const noaToken = await loginAs('levi.noa', 'Student123!');
  return { dani, noa, teacherToken, daniToken, noaToken };
}

/** יוצר שיעור ישירות במסד הנתונים (למשל שיעור שכבר עבר) */
export async function insertLesson(
  studentId: number,
  startsAt: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW',
) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const start = new Date(startsAt);
  return prisma.lesson.create({
    data: {
      studentId,
      requestedById: student.userId,
      startsAt: start,
      endsAt: new Date(start.getTime() + 45 * 60_000),
      status,
    },
  });
}
