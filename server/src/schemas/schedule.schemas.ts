import { z } from 'zod';
import { diffDays, timeToMinutes } from '../utils/time';
import { dateSchema, timeSchema } from './common';

const startBeforeEnd = {
  check: (v: { startTime: string; endTime: string }) => v.startTime < v.endTime,
  message: { message: 'שעת ההתחלה חייבת להיות לפני שעת הסיום', path: ['endTime'] },
};

export const workingHoursItemSchema = z
  .object({
    dayOfWeek: z.number().int().min(0, 'יום בשבוע: 0 (ראשון) עד 6 (שבת)').max(6, 'יום בשבוע: 0 (ראשון) עד 6 (שבת)'),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .strict()
  .refine(startBeforeEnd.check, startBeforeEnd.message);

/** החלפת כל שעות העבודה השבועיות בבת אחת */
export const putWorkingHoursSchema = z
  .object({
    hours: z.array(workingHoursItemSchema).max(50),
  })
  .strict()
  .superRefine((data, ctx) => {
    const sorted = data.hours
      .map((h, index) => ({ ...h, index }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.dayOfWeek === curr.dayOfWeek && curr.startTime < prev.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hours', curr.index],
          message: 'טווח שעות זה חופף לטווח אחר באותו יום',
        });
      }
    }
  });

export const specialSlotCreateSchema = z
  .object({
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    /** ריק / null = פתוח לכל התלמידים */
    studentId: z.number().int().positive().nullable().optional(),
  })
  .strict()
  .refine(startBeforeEnd.check, startBeforeEnd.message);

export const optionalDateRangeQuerySchema = z
  .object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'from חייב להיות לפני או שווה ל-to', path: ['to'] });

export const MAX_AVAILABILITY_RANGE_DAYS = 31;

export const availabilityQuerySchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
    studentId: z.coerce.number().int().positive().optional(),
  })
  .refine((q) => q.from <= q.to, { message: 'from חייב להיות לפני או שווה ל-to', path: ['to'] })
  .refine((q) => diffDays(q.from, q.to) <= MAX_AVAILABILITY_RANGE_DAYS, {
    message: `אפשר לבקש טווח של עד ${MAX_AVAILABILITY_RANGE_DAYS} ימים`,
    path: ['to'],
  });

/** אורך טווח בדקות */
export const rangeMinutes = (startTime: string, endTime: string): number => timeToMinutes(endTime) - timeToMinutes(startTime);

export type PutWorkingHoursInput = z.infer<typeof putWorkingHoursSchema>;
export type SpecialSlotCreateInput = z.infer<typeof specialSlotCreateSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
