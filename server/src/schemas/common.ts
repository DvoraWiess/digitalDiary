import { z } from 'zod';
import { isValidDateString, TIME_REGEX } from '../utils/time';

/** מזהה מספרי בכתובת, למשל /api/students/5 */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** שעה בפורמט HH:mm */
export const timeSchema = z.string().regex(TIME_REGEX, 'שעה בפורמט HH:mm, למשל 16:30');

/** תאריך בפורמט YYYY-MM-DD */
export const dateSchema = z.string().refine(isValidDateString, 'תאריך בפורמט YYYY-MM-DD, למשל 2026-10-18');

/** מחרוזת ריקה נחשבת "אין ערך" (null) */
const emptyToNull = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : value;

/** טקסט חופשי שאינו חובה. אפשר לשלוח null או "" כדי לנקות את השדה */
export const optionalText = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{7,20}$/, 'מספר טלפון לא תקין (7-20 ספרות, אפשר עם מקפים)');

export const optionalPhone = z.preprocess(emptyToNull, phoneSchema.nullable().optional());

export const passwordSchema = z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים').max(100);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9._-]{3,30}$/,
    'שם משתמש: 3-30 תווים באנגלית - אותיות קטנות, ספרות, נקודה, מקף או קו תחתון (למשל cohen.dani)',
  );

/** בדיקה שנשלח לפחות שדה אחד לעדכון */
export const hasAtLeastOneField = (obj: Record<string, unknown>): boolean =>
  Object.values(obj).some((v) => v !== undefined);
