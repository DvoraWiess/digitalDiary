import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/prisma';
import { api, bearer, insertLesson, SLOT, setNow, setupBasic } from '../helpers';

describe('Lessons', () => {
  let ctx: Awaited<ReturnType<typeof setupBasic>>;

  beforeEach(async () => {
    setNow();
    ctx = await setupBasic();
  });

  const requestAs = (token: string, startsAt: string, parentNote?: string) =>
    api().post('/api/lessons').set(bearer(token)).send({ startsAt, ...(parentNote ? { parentNote } : {}) });

  describe('requesting a lesson', () => {
    it('a student requests a free slot and gets a PENDING lesson for themselves', async () => {
      const res = await requestAs(ctx.daniToken, SLOT.mon1600, 'נשמח לעבוד על ניקוד');
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        studentId: ctx.dani.id,
        startsAt: SLOT.mon1600,
        endsAt: '2026-10-19T13:45:00.000Z',
        status: 'PENDING',
        parentNote: 'נשמח לעבוד על ניקוד',
        hasReport: false,
      });
    });

    it('rejects a studentId sent by the client (identity comes only from the token)', async () => {
      const res = await api()
        .post('/api/lessons')
        .set(bearer(ctx.daniToken))
        .send({ startsAt: SLOT.mon1600, studentId: ctx.noa.id });
      expect(res.status).toBe(400); // שדה לא מוכר נדחה
      expect(await prisma.lesson.count()).toBe(0);
    });

    it('only a student account can request lessons', async () => {
      expect((await requestAs(ctx.teacherToken, SLOT.mon1600)).status).toBe(403);
      expect((await api().post('/api/lessons').send({ startsAt: SLOT.mon1600 })).status).toBe(401);
    });

    it('rejects times that are not offered', async () => {
      const offGrid = await requestAs(ctx.daniToken, '2026-10-19T13:10:00.000Z');
      expect(offGrid.status).toBe(409);
      expect(offGrid.body.error.code).toBe('SLOT_NOT_AVAILABLE');
      expect((await requestAs(ctx.daniToken, '2026-10-24T13:00:00.000Z')).status).toBe(409); // שבת
      expect((await requestAs(ctx.daniToken, '2026-10-16T13:00:00.000Z')).status).toBe(409); // עבר
      expect((await requestAs(ctx.daniToken, '2026-12-20T14:00:00.000Z')).status).toBe(409); // מעבר לחלון
      expect((await requestAs(ctx.daniToken, 'tomorrow at 4')).status).toBe(400);
    });

    it('prevents double booking of the same time', async () => {
      expect((await requestAs(ctx.daniToken, SLOT.mon1600)).status).toBe(201);
      const second = await requestAs(ctx.noaToken, SLOT.mon1600);
      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('SLOT_NOT_AVAILABLE');
    });

    it('allows only one of two simultaneous requests for the same time', async () => {
      const results = await Promise.all([requestAs(ctx.daniToken, SLOT.wed1600), requestAs(ctx.noaToken, SLOT.wed1600)]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409]);
      expect(await prisma.lesson.count()).toBe(1);
    });

    it('a special slot can be booked only by the student it was opened for', async () => {
      await api()
        .post('/api/special-slots')
        .set(bearer(ctx.teacherToken))
        .send({ date: '2026-10-23', startTime: '10:00', endTime: '10:45', studentId: ctx.dani.id });
      const fridayTen = '2026-10-23T07:00:00.000Z';
      expect((await requestAs(ctx.noaToken, fridayTen)).status).toBe(409);
      expect((await requestAs(ctx.daniToken, fridayTen)).status).toBe(201);
    });
  });

  describe('listing and viewing', () => {
    beforeEach(async () => {
      await insertLesson(ctx.dani.id, SLOT.mon1600, 'PENDING');
      await insertLesson(ctx.dani.id, SLOT.wed1600, 'APPROVED');
      await insertLesson(ctx.noa.id, SLOT.mon1645, 'PENDING');
      await insertLesson(ctx.noa.id, '2026-10-12T13:00:00.000Z', 'COMPLETED');
    });

    it('a student sees only their own lessons, in time order', async () => {
      const res = await api().get('/api/lessons').set(bearer(ctx.daniToken));
      expect(res.status).toBe(200);
      expect(res.body.map((l: { startsAt: string }) => l.startsAt)).toEqual([SLOT.mon1600, SLOT.wed1600]);
      expect(res.body.every((l: { studentId: number }) => l.studentId === ctx.dani.id)).toBe(true);
    });

    it('teacher sees all lessons and can filter by status and dates', async () => {
      const all = await api().get('/api/lessons').set(bearer(ctx.teacherToken));
      expect(all.body).toHaveLength(4);

      const pending = await api().get('/api/lessons').query({ status: 'PENDING' }).set(bearer(ctx.teacherToken));
      expect(pending.body).toHaveLength(2);

      const several = await api()
        .get('/api/lessons')
        .query({ status: 'pending,approved' })
        .set(bearer(ctx.teacherToken));
      expect(several.body).toHaveLength(3);

      const monday = await api()
        .get('/api/lessons')
        .query({ from: '2026-10-19', to: '2026-10-19' })
        .set(bearer(ctx.teacherToken));
      expect(monday.body.map((l: { startsAt: string }) => l.startsAt)).toEqual([SLOT.mon1600, SLOT.mon1645]);

      const past = await api().get('/api/lessons').query({ to: '2026-10-17' }).set(bearer(ctx.teacherToken));
      expect(past.body).toHaveLength(1);
    });

    it('validates list filters', async () => {
      expect((await api().get('/api/lessons').query({ status: 'DONE' }).set(bearer(ctx.teacherToken))).status).toBe(400);
      expect((await api().get('/api/lessons').query({ from: '18-10-2026' }).set(bearer(ctx.teacherToken))).status).toBe(400);
    });

    it("a student cannot open another student's lesson", async () => {
      const noaLesson = await prisma.lesson.findFirstOrThrow({ where: { studentId: ctx.noa.id } });
      expect((await api().get(`/api/lessons/${noaLesson.id}`).set(bearer(ctx.daniToken))).status).toBe(403);
      expect((await api().get(`/api/lessons/${noaLesson.id}`).set(bearer(ctx.noaToken))).status).toBe(200);
      expect((await api().get('/api/lessons/9999').set(bearer(ctx.teacherToken))).status).toBe(404);
    });
  });

  describe('approve and reject (teacher only)', () => {
    it('teacher approves a pending request; approving twice fails', async () => {
      const lesson = await insertLesson(ctx.dani.id, SLOT.mon1600, 'PENDING');
      expect((await api().patch(`/api/lessons/${lesson.id}/approve`).set(bearer(ctx.daniToken))).status).toBe(403);

      const ok = await api().patch(`/api/lessons/${lesson.id}/approve`).set(bearer(ctx.teacherToken));
      expect(ok.status).toBe(200);
      expect(ok.body.status).toBe('APPROVED');

      const again = await api().patch(`/api/lessons/${lesson.id}/approve`).set(bearer(ctx.teacherToken));
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('INVALID_STATUS');
    });

    it('rejecting frees the time for others', async () => {
      const lesson = await insertLesson(ctx.dani.id, SLOT.mon1600, 'PENDING');
      const res = await api()
        .patch(`/api/lessons/${lesson.id}/reject`)
        .set(bearer(ctx.teacherToken))
        .send({ reason: 'לא מתאים לי השבוע' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'REJECTED', statusReason: 'לא מתאים לי השבוע' });
      expect((await requestAs(ctx.noaToken, SLOT.mon1600)).status).toBe(201);
    });

    it('cannot approve a lesson whose time has passed', async () => {
      const lesson = await insertLesson(ctx.dani.id, '2026-10-15T13:00:00.000Z', 'PENDING');
      const res = await api().patch(`/api/lessons/${lesson.id}/approve`).set(bearer(ctx.teacherToken));
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('LESSON_IN_PAST');
    });
  });

  describe('cancel', () => {
    it('a student can cancel a pending request at any time', async () => {
      const lesson = await insertLesson(ctx.dani.id, SLOT.sun1600, 'PENDING'); // בעוד 3 שעות
      const res = await api().patch(`/api/lessons/${lesson.id}/cancel`).set(bearer(ctx.daniToken)).send({});
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'CANCELLED', cancelledByRole: 'STUDENT' });
    });

    it('a student can cancel an approved lesson only 24+ hours ahead', async () => {
      const soon = await insertLesson(ctx.dani.id, SLOT.sun1600, 'APPROVED'); // בעוד 3 שעות
      const late = await api().patch(`/api/lessons/${soon.id}/cancel`).set(bearer(ctx.daniToken));
      expect(late.status).toBe(409);
      expect(late.body.error.code).toBe('CANCEL_TOO_LATE');

      const later = await insertLesson(ctx.dani.id, SLOT.mon1600, 'APPROVED'); // בעוד 27 שעות
      const ok = await api().patch(`/api/lessons/${later.id}/cancel`).set(bearer(ctx.daniToken));
      expect(ok.status).toBe(200);
    });

    it('teacher must give a reason, and can cancel even close to the lesson', async () => {
      const lesson = await insertLesson(ctx.dani.id, SLOT.sun1600, 'APPROVED');
      const noReason = await api().patch(`/api/lessons/${lesson.id}/cancel`).set(bearer(ctx.teacherToken)).send({});
      expect(noReason.status).toBe(400);

      const ok = await api()
        .patch(`/api/lessons/${lesson.id}/cancel`)
        .set(bearer(ctx.teacherToken))
        .send({ reason: 'נא לקבוע מחדש' });
      expect(ok.status).toBe(200);
      expect(ok.body).toMatchObject({ status: 'CANCELLED', statusReason: 'נא לקבוע מחדש', cancelledByRole: 'TEACHER' });

      const twice = await api()
        .patch(`/api/lessons/${lesson.id}/cancel`)
        .set(bearer(ctx.teacherToken))
        .send({ reason: 'שוב' });
      expect(twice.status).toBe(409);
    });

    it("a student cannot cancel another student's lesson", async () => {
      const lesson = await insertLesson(ctx.noa.id, SLOT.mon1600, 'PENDING');
      expect((await api().patch(`/api/lessons/${lesson.id}/cancel`).set(bearer(ctx.daniToken))).status).toBe(403);
    });
  });
});
