import { config } from 'dotenv';

/** הגדרות סביבה קבועות לבדיקות (רץ לפני כל קובץ בדיקות) */
config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-0123456789';
process.env.JWT_EXPIRES_IN_SECONDS = '3600';
process.env.TIMEZONE = 'Asia/Jerusalem';
process.env.LESSON_DURATION_MINUTES = '45';
process.env.CANCEL_LIMIT_HOURS = '24';
process.env.BOOKING_WINDOW_DAYS = '28';
process.env.BCRYPT_ROUNDS = '4';
process.env.CORS_ORIGINS = '*';
