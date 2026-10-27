import { z } from 'zod';
import {
  hasAtLeastOneField,
  optionalPhone,
  optionalText,
  passwordSchema,
  phoneSchema,
  usernameSchema,
} from './common';

export const readingLevelSchema = z.enum(['BEGINNER', 'BASIC', 'ADVANCED', 'FLUENT']);

const studentFields = {
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  age: z.coerce.number().int().min(3, 'הגיל חייב להיות בין 3 ל-18').max(18, 'הגיל חייב להיות בין 3 ל-18'),
  gradeText: optionalText(50),
  readingLevel: readingLevelSchema.optional(),
  goals: optionalText(1000),
  schoolTeacherName: optionalText(100),
  schoolTeacherPhone: optionalPhone,
  parentName: z.string().trim().min(2).max(100),
  parentPhone: phoneSchema,
  teacherNotes: optionalText(2000),
};

/** המורה מוסיפה תלמיד חדש + פרטי כניסה */
export const studentCreateSchema = z
  .object({
    ...studentFields,
    username: usernameSchema,
    password: passwordSchema,
  })
  .strict();

/** המורה עורכת תלמיד - כל השדות אפשריים (חוץ מסיסמה, שיש לה Endpoint נפרד) */
export const studentTeacherUpdateSchema = z
  .object({
    ...studentFields,
    username: usernameSchema,
    isActive: z.boolean(),
  })
  .partial()
  .strict()
  .refine(hasAtLeastOneField, 'יש לשלוח לפחות שדה אחד לעדכון');

/** השדות שחשבון התלמיד (ההורה) רשאי לערוך */
export const STUDENT_SELF_EDITABLE_FIELDS = ['gradeText', 'schoolTeacherName', 'schoolTeacherPhone', 'parentPhone'] as const;

export const studentSelfUpdateSchema = z
  .object({
    gradeText: studentFields.gradeText,
    schoolTeacherName: studentFields.schoolTeacherName,
    schoolTeacherPhone: studentFields.schoolTeacherPhone,
    parentPhone: phoneSchema,
  })
  .partial()
  .strict()
  .refine(hasAtLeastOneField, 'יש לשלוח לפחות שדה אחד לעדכון');

export const resetPasswordSchema = z.object({ password: passwordSchema }).strict();

export const studentListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentTeacherUpdateInput = z.infer<typeof studentTeacherUpdateSchema>;
export type StudentSelfUpdateInput = z.infer<typeof studentSelfUpdateSchema>;
