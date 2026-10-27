import { beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, insertLesson, SLOT, setNow, setupBasic } from '../helpers';

describe('Working hours, special slots and availability', () => {
  let ctx: Awaited<ReturnType<typeof setupBasic>>;

  beforeEach(async () => {
    setNow();
    ctx = await setupBasic();
  });

  describe('working hours', () => {
    it('any logged-in user can read working hours', async () => {
      const res = await api().get('/api/working-hours').set(bearer(ctx.daniToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
      expect(res.body[0]).toEqual({ id: expect.any(Number), dayOfWeek: 0, startTime: '16:00', endTime: '19:00' });
    });

    it('only the teacher can replace working hours', async () => {
      const body = { hours: [{ dayOfWeek: 3, startTime: '15:00', endTime: '18:00' }] };
      expect((await api().put('/api/working-hours').set(bearer(ctx.daniToken)).send(body)).status).toBe(403);

      const res = await api().put('/api/working-hours').set(bearer(ctx.teacherToken)).send(body);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ dayOfWeek: 3, startTime: '15:00', endTime: '18:00' });
    });

    it('rejects invalid working hours', async () => {
      const put = (hours: unknown) => api().put('/api/working-hours').set(bearer(ctx.teacherToken)).send({ hours });
      expect((await put([{ dayOfWeek: 7, startTime: '16:00', endTime: '19:00' }])).status).toBe(400);
      expect((await put([{ dayOfWeek: 1, startTime: '19:00', endTime: '16:00' }])).status).toBe(400);
      expect((await put([{ dayOfWeek: 1, startTime: '4pm', endTime: '19:00' }])).status).toBe(400);
      expect((await put([{ dayOfWeek: 1, startTime: '16:00', endTime: '16:30' }])).status).toBe(400); // קצר משיעור
      const overlap = await put([
        { dayOfWeek: 1, startTime: '16:00', endTime: '18:00' },
        { dayOfWeek: 1, startTime: '17:00', endTime: '19:00' },
      ]);
      expect(overlap.status).toBe(400);
      expect(overlap.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('special slots (teacher only)', () => {
    it('creates, lists and deletes special slots', async () => {
      const created = await api()
        .post('/api/special-slots')
        .set(bearer(ctx.teacherToken))
        .send({ date: '2026-10-23', startTime: '10:00', endTime: '11:00', studentId: ctx.dani.id });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ date: '2026-10-23', studentId: ctx.dani.id, studentName: 'דני כהן' });

      const list = await api().get('/api/special-slots').query({ from: '2026-10-18' }).set(bearer(ctx.teacherToken));
      expect(list.body).toHaveLength(1);

      expect((await api().get('/api/special-slots').set(bearer(ctx.daniToken))).status).toBe(403);

      const del = await api().delete(`/api/special-slots/${created.body.id}`).set(bearer(ctx.teacherToken));
      expect(del.status).toBe(204);
      const again = await api().delete(`/api/special-slots/${created.body.id}`).set(bearer(ctx.teacherToken));
      expect(again.status).toBe(404);
    });

    it('validates special slots', async () => {
      const post = (body: object) => api().post('/api/special-slots').set(bearer(ctx.teacherToken)).send(body);
      expect((await post({ date: '2026-10-10', startTime: '10:00', endTime: '11:00' })).status).toBe(400); // עבר
      expect((await post({ date: '2026-10-23', startTime: '10:00', endTime: '10:30' })).status).toBe(400); // קצר
      expect((await post({ date: '2026-13-01', startTime: '10:00', endTime: '11:00' })).status).toBe(400);
      expect((await post({ date: '2026-10-23', startTime: '10:00', endTime: '11:00', studentId: 999 })).status).toBe(404);
    });
  });

  describe('availability', () => {
    beforeEach(async () => {
      await api()
        .post('/api/special-slots')
        .set(bearer(ctx.teacherToken))
        .send({ date: '2026-10-23', startTime: '10:00', endTime: '11:00', studentId: ctx.dani.id });
      await api()
        .post('/api/special-slots')
        .set(bearer(ctx.teacherToken))
        .send({ date: '2026-10-23', startTime: '12:00', endTime: '12:45', studentId: null });
    });

    it('returns a week grouped by day for a student, including their own special slot only', async () => {
      const dani = await api()
        .get('/api/availability')
        .query({ from: '2026-10-18', to: '2026-10-24' })
        .set(bearer(ctx.daniToken));
      expect(dani.status).toBe(200);
      expect(dani.body).toMatchObject({ lessonDurationMinutes: 45, timeZone: 'Asia/Jerusalem' });
      expect(dani.body.days).toHaveLength(7);
      const sunday = dani.body.days[0];
      expect(sunday.slots.map((s: { time: string }) => s.time)).toEqual(['16:00', '16:45', '17:30', '18:15']);
      const friday = dani.body.days[5];
      expect(friday.slots.map((s: { time: string; special: boolean }) => [s.time, s.special])).toEqual([
        ['10:00', true],
        ['12:00', true],
      ]);

      const noa = await api()
        .get('/api/availability')
        .query({ from: '2026-10-23', to: '2026-10-23' })
        .set(bearer(ctx.noaToken));
      expect(noa.body.days[0].slots.map((s: { time: string }) => s.time)).toEqual(['12:00']);
    });

    it('teacher without studentId sees all special slots', async () => {
      const res = await api()
        .get('/api/availability')
        .query({ from: '2026-10-23', to: '2026-10-23' })
        .set(bearer(ctx.teacherToken));
      expect(res.status).toBe(200);
      expect(res.body.days[0].slots).toHaveLength(2);
    });

    it('hides times taken by pending or approved lessons, but not by cancelled ones', async () => {
      await insertLesson(ctx.noa.id, SLOT.sun1600, 'PENDING');
      await insertLesson(ctx.noa.id, SLOT.sun1645, 'CANCELLED');
      await insertLesson(ctx.noa.id, SLOT.sun1730, 'APPROVED');
      const res = await api()
        .get('/api/availability')
        .query({ from: '2026-10-18', to: '2026-10-18' })
        .set(bearer(ctx.daniToken));
      expect(res.body.days[0].slots.map((s: { time: string }) => s.time)).toEqual(['16:45', '18:15']);
    });

    it('validates the range and blocks looking at another student', async () => {
      const q = (query: object, token = ctx.daniToken) => api().get('/api/availability').query(query).set(bearer(token));
      expect((await q({ from: '2026-10-24', to: '2026-10-18' })).status).toBe(400);
      expect((await q({ from: '2026-10-01', to: '2026-12-01' })).status).toBe(400);
      expect((await q({ from: '2026-10-18' })).status).toBe(400);
      expect((await q({ from: '2026-10-18', to: '2026-10-18', studentId: ctx.noa.id })).status).toBe(403);
      expect((await q({ from: '2026-10-18', to: '2026-10-18', studentId: 999 }, ctx.teacherToken)).status).toBe(404);
    });
  });
});
