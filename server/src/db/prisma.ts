import { PrismaClient } from '@prisma/client';

/** חיבור יחיד למסד הנתונים, משותף לכל השרת */
const logLevels = {
  development: ['warn', 'error'],
  production: ['error'],
  // בבדיקות יש שגיאות מכוונות (למשל התנגשות בין שתי בקשות) - לא מדפיסים אותן
  test: [],
} as const;

const nodeEnv = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production' ? process.env.NODE_ENV : 'development';

export const prisma = new PrismaClient({
  log: [...logLevels[nodeEnv]],
});
