import { sign } from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/prisma';
import { api, bearer, createStudent, loginAs, setNow, setupBasic } from '../helpers';

describe('Auth', () => {
  let ctx: Awaited<ReturnType<typeof setupBasic>>;

  beforeEach(async () => {
    setNow();
    ctx = await setupBasic();
  });

  it('GET /api/health works without a token', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('logs in a teacher and returns a JWT without leaking secrets', async () => {
    const res = await api().post('/api/auth/login').send({ username: 'teacher', password: 'Teacher123!' });
    expect(res.status).toBe(200);
    expect(res.body.tokenType).toBe('Bearer');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.expiresIn).toBe(3600);
    expect(res.body.user).toMatchObject({ username: 'teacher', role: 'TEACHER', student: null });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|Teacher123/);
  });

  it('login is case-insensitive for the username', async () => {
    const res = await api().post('/api/auth/login').send({ username: 'Cohen.Dani', password: 'Student123!' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.student.firstName).toBe('דני');
    expect(res.body.user.student.teacherNotes).toBeUndefined();
  });

  it('rejects a wrong password or unknown user with 401', async () => {
    const wrong = await api().post('/api/auth/login').send({ username: 'teacher', password: 'nope' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');

    const unknown = await api().post('/api/auth/login').send({ username: 'ghost', password: 'whatever1' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('validates the login body', async () => {
    const res = await api().post('/api/auth/login').send({ username: 'teacher' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('password');
  });

  it('blocks login for an inactive student with 403', async () => {
    await createStudent({ username: 'old.student', firstName: 'אבי', lastName: 'מזרחי', isActive: false });
    const res = await api().post('/api/auth/login').send({ username: 'old.student', password: 'Student123!' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });

  it('returns 401 for missing, malformed, wrongly signed and expired tokens', async () => {
    const missing = await api().get('/api/auth/me');
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe('TOKEN_MISSING');

    const malformed = await api().get('/api/auth/me').set(bearer('not-a-jwt'));
    expect(malformed.status).toBe(401);
    expect(malformed.body.error.code).toBe('TOKEN_INVALID');

    const teacher = await prisma.user.findUniqueOrThrow({ where: { username: 'teacher' } });
    const forged = sign({ userId: teacher.id, role: 'TEACHER' }, 'some-other-secret-that-is-long-enough!!');
    const forgedRes = await api().get('/api/auth/me').set(bearer(forged));
    expect(forgedRes.status).toBe(401);
    expect(forgedRes.body.error.code).toBe('TOKEN_INVALID');

    const expired = sign(
      { userId: teacher.id, role: 'TEACHER', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET as string,
    );
    const expiredRes = await api().get('/api/auth/me').set(bearer(expired));
    expect(expiredRes.status).toBe(401);
    expect(expiredRes.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('GET /api/auth/me returns the user identified by the token', async () => {
    const res = await api().get('/api/auth/me').set(bearer(ctx.daniToken));
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('cohen.dani');
    expect(res.body.student.id).toBe(ctx.dani.id);
  });

  it('a deactivated student is blocked immediately even with a valid token', async () => {
    await prisma.student.update({ where: { id: ctx.dani.id }, data: { isActive: false } });
    const res = await api().get('/api/auth/me').set(bearer(ctx.daniToken));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });

  it('changes password only with the correct current password', async () => {
    const wrong = await api()
      .post('/api/auth/change-password')
      .set(bearer(ctx.daniToken))
      .send({ currentPassword: 'bad-password', newPassword: 'NewPass123' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe('WRONG_PASSWORD');

    const ok = await api()
      .post('/api/auth/change-password')
      .set(bearer(ctx.daniToken))
      .send({ currentPassword: 'Student123!', newPassword: 'NewPass123' });
    expect(ok.status).toBe(204);
    await expect(loginAs('cohen.dani', 'NewPass123')).resolves.toEqual(expect.any(String));
  });

  it('returns structured errors for unknown routes and invalid JSON', async () => {
    const notFound = await api().get('/api/nothing-here');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.code).toBe('ROUTE_NOT_FOUND');

    const badJson = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username": "teacher",');
    expect(badJson.status).toBe(400);
    expect(badJson.body.error.code).toBe('INVALID_JSON');
  });
});
