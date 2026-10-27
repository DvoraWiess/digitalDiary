import { execSync } from 'node:child_process';
import { config } from 'dotenv';

/**
 * רץ פעם אחת לפני כל הבדיקות:
 * מוודא שיש מסד נתונים לבדיקות (ששמו כולל "test") ומריץ עליו את ה-migrations.
 * migrate deploy לא מוחק כלום - רק יוצר ומעדכן טבלאות. כל בדיקה מנקה בעצמה את הנתונים שלה.
 */
export default function globalSetup(): void {
  config({ path: '.env.test' });
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Copy .env.test.example to .env.test and point it to a PostgreSQL test database.',
    );
  }
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run tests: the database name "${dbName}" must contain the word "test", because tests delete all data.`,
    );
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
