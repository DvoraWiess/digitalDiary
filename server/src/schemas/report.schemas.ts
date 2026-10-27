import { z } from 'zod';
import { optionalText } from './common';

export const attendanceSchema = z.enum(['ATTENDED', 'NO_SHOW']);
export const behaviorSchema = z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'DIFFICULT']);
export const homeworkStatusSchema = z.enum(['DONE', 'PARTIAL', 'NOT_DONE', 'NONE_GIVEN']);

/**
 * דוח שיעור (כתיבה או עריכה - PUT מחליף את כל הדוח).
 * כשהתלמיד הגיע (ATTENDED) חובה למלא: מה למדנו, התנהגות, שיעורי בית קודמים.
 */
export const reportSchema = z
  .object({
    attendance: attendanceSchema,
    topicsCovered: optionalText(2000),
    behavior: behaviorSchema.nullable().optional(),
    behaviorNote: optionalText(1000),
    previousHomework: homeworkStatusSchema.nullable().optional(),
    homeworkAssigned: optionalText(2000),
    nextLessonPlan: optionalText(2000),
    extraLessonRecommended: z.boolean().optional(),
    extraLessonNote: optionalText(1000),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.attendance !== 'ATTENDED') return;
    const required = 'שדה חובה כשהתלמיד הגיע לשיעור';
    if (!r.topicsCovered) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['topicsCovered'], message: required });
    if (!r.behavior) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['behavior'], message: required });
    if (!r.previousHomework) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['previousHomework'], message: required });
    }
  });

export type ReportInput = z.infer<typeof reportSchema>;
