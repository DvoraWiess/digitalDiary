import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/prisma';
import { resetDb } from '../helpers';

const run = (cmd: string, env: Record<string, string | undefined> = {}) =>
  execSync(cmd, { encoding: 'utf8', stdio: 'pipe', env: { ...process.env, ...env } });

describe('Prisma schema, migrations and seed', () => {
  it('the Prisma schema is valid', () => {
    expect(() => run('npx prisma validate')).not.toThrow();
  });

  it('all migrations are applied', () => {
    const out = run('npx prisma migrate status');
    expect(out).toMatch(/up to date/i);
  });

  it('the migrated database matches schema.prisma exactly (no drift)', () => {
    // exit code 0 = no difference, 2 = there is a difference (execSync throws)
    expect(() =>
      run('npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code'),
    ).not.toThrow();
  });

  it('database CHECK constraints reject invalid rows', async () => {
    await resetDb();
    await expect(
      prisma.workingHours.create({ data: { dayOfWeek: 9, startTime: '16:00', endTime: '19:00' } }),
    ).rejects.toThrow();
    await expect(
      prisma.workingHours.create({ data: { dayOfWeek: 1, startTime: '19:00', endTime: '16:00' } }),
    ).rejects.toThrow();
  });

  it('development seed creates demo data with searchable students and lessons', async () => {
    run('npx tsx src/seed/seed.ts', { NODE_ENV: 'development' });
    expect(await prisma.user.count({ where: { role: 'TEACHER' } })).toBe(1);
    expect(await prisma.student.count()).toBe(4);
    expect(await prisma.student.count({ where: { isActive: false } })).toBe(1);
    expect(await prisma.lesson.count({ where: { status: 'PENDING' } })).toBeGreaterThan(0);
    expect(await prisma.lessonReport.count()).toBe(3);
    expect(await prisma.workingHours.count()).toBe(5);
  });

  it('production seed never uses fixed passwords and never deletes data', async () => {
    await resetDb();
    run('npx tsx src/seed/seed.ts', { NODE_ENV: 'production', SEED_TEACHER_USERNAME: '', SEED_TEACHER_PASSWORD: '' });
    expect(await prisma.user.count()).toBe(0);

    const prodEnv = {
      NODE_ENV: 'production',
      SEED_TEACHER_USERNAME: 'Rivka',
      SEED_TEACHER_PASSWORD: 'Secret-Pass-987',
      SEED_DEMO_DATA: 'true',
      SEED_DEMO_PASSWORD: 'Demo-Pass-654',
    };
    run('npx tsx src/seed/seed.ts', prodEnv);
    run('npx tsx src/seed/seed.ts', prodEnv); // פעם שנייה - לא משכפל
    expect(await prisma.user.count({ where: { role: 'TEACHER', username: 'rivka' } })).toBe(1);
    expect(await prisma.student.count()).toBe(4);
  });
});
