import 'dotenv/config';
import { z } from 'zod';

/**
 * כל ההגדרות של השרת מגיעות ממשתני סביבה (קובץ .env במחשב, או הגדרות ב-Render).
 * אם חסר משתנה חובה - השרת לא יעלה ויציג הודעה ברורה.
 */
const isValidTimeZone = (tz: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(8 * 60 * 60),
  CORS_ORIGINS: z.string().default('*'),
  TIMEZONE: z.string().default('Asia/Jerusalem').refine(isValidTimeZone, 'TIMEZONE is not a valid IANA time zone'),
  LESSON_DURATION_MINUTES: z.coerce.number().int().min(15).max(180).default(45),
  CANCEL_LIMIT_HOURS: z.coerce.number().int().min(0).max(168).default(24),
  BOOKING_WINDOW_DAYS: z.coerce.number().int().min(1).max(365).default(28),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('   See .env.example for the full list of variables.');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
};

export type Env = typeof env;
