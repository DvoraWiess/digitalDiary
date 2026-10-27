import { z } from 'zod';
import { dateSchema, optionalText } from './common';

export const lessonStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']);

/** status יכול להגיע כ-"PENDING" או "PENDING,APPROVED" או כמה פרמטרים */
const splitStatuses = (value: unknown): unknown => {
  if (value === undefined || value === '') return undefined;
  const list = Array.isArray(value) ? value : [value];
  return list
    .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
    .map((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v))
    .filter((v) => v !== '');
};

export const lessonListQuerySchema = z
  .object({
    status: z.preprocess(splitStatuses, z.array(lessonStatusSchema).min(1).optional()),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'from חייב להיות לפני או שווה ל-to', path: ['to'] });

export const lessonRequestSchema = z
  .object({
    startsAt: z
      .string()
      .datetime({ offset: true, message: 'זמן בפורמט ISO 8601, למשל 2026-10-18T13:00:00.000Z' }),
    parentNote: optionalText(500),
  })
  .strict();

export const reasonSchema = z
  .object({
    reason: optionalText(500),
  })
  .strict();

export type LessonListQuery = z.infer<typeof lessonListQuerySchema>;
export type LessonRequestInput = z.infer<typeof lessonRequestSchema>;
