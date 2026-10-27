import type { SpecialSlot, WorkingHours } from '@prisma/client';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { rangeMinutes, type PutWorkingHoursInput, type SpecialSlotCreateInput } from '../schemas/schedule.schemas';
import { badRequest, notFound } from '../utils/AppError';
import { clock } from '../utils/clock';
import { dbDateToString, stringToDbDate, utcToZoned } from '../utils/time';

function presentWorkingHours(h: WorkingHours) {
  return { id: h.id, dayOfWeek: h.dayOfWeek, startTime: h.startTime, endTime: h.endTime };
}

function presentSpecialSlot(s: SpecialSlot & { student: { firstName: string; lastName: string } | null }) {
  return {
    id: s.id,
    date: dbDateToString(s.date),
    startTime: s.startTime,
    endTime: s.endTime,
    studentId: s.studentId,
    studentName: s.student ? `${s.student.firstName} ${s.student.lastName}` : null,
    createdAt: s.createdAt.toISOString(),
  };
}

const specialSlotInclude = { student: { select: { firstName: true, lastName: true } } } as const;

export async function listWorkingHours() {
  const hours = await prisma.workingHours.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
  return hours.map(presentWorkingHours);
}

/** מחליף את כל שעות העבודה. שיעורים שכבר נקבעו לא משתנים */
export async function replaceWorkingHours(input: PutWorkingHoursInput) {
  for (const h of input.hours) {
    if (rangeMinutes(h.startTime, h.endTime) < env.LESSON_DURATION_MINUTES) {
      throw badRequest(`כל טווח שעות חייב להיות באורך שיעור אחד לפחות (${env.LESSON_DURATION_MINUTES} דקות)`);
    }
  }
  await prisma.$transaction([
    prisma.workingHours.deleteMany({}),
    prisma.workingHours.createMany({ data: input.hours }),
  ]);
  return listWorkingHours();
}

export async function listSpecialSlots(from?: string, to?: string) {
  const slots = await prisma.specialSlot.findMany({
    where: {
      date: {
        ...(from ? { gte: stringToDbDate(from) } : {}),
        ...(to ? { lte: stringToDbDate(to) } : {}),
      },
    },
    include: specialSlotInclude,
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return slots.map(presentSpecialSlot);
}

export async function createSpecialSlot(input: SpecialSlotCreateInput) {
  const today = utcToZoned(clock.now(), env.TIMEZONE).date;
  if (input.date < today) {
    throw badRequest('אי אפשר להוסיף זמן מיוחד בתאריך שכבר עבר');
  }
  if (rangeMinutes(input.startTime, input.endTime) < env.LESSON_DURATION_MINUTES) {
    throw badRequest(`הזמן המיוחד חייב להיות באורך שיעור אחד לפחות (${env.LESSON_DURATION_MINUTES} דקות)`);
  }
  const studentId = input.studentId ?? null;
  if (studentId !== null) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw notFound('התלמיד לא נמצא');
  }
  const slot = await prisma.specialSlot.create({
    data: { date: stringToDbDate(input.date), startTime: input.startTime, endTime: input.endTime, studentId },
    include: specialSlotInclude,
  });
  return presentSpecialSlot(slot);
}

export async function deleteSpecialSlot(id: number): Promise<void> {
  const slot = await prisma.specialSlot.findUnique({ where: { id } });
  if (!slot) throw notFound('הזמן המיוחד לא נמצא');
  await prisma.specialSlot.delete({ where: { id } });
}
