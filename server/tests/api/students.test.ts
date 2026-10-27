import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/prisma';
import { api, bearer, createStudent, insertLesson, loginAs, setNow, setupBasic } from '../helpers';

const newStudent = {
  firstName: 'יוסי',
  lastName: 'כהן',
  age: 6,
  gradeText: 'מכינה',
  readingLevel: 'BEGINNER',
  goals: 'זיהוי אותיות',
  schoolTeacherName: 'המורה דינה',
  schoolTeacherPhone: '050-1234567',
  parentName: 'שרה כהן',
  parentPhone: '052-7654321',
  teacherNotes: 'ביישן בהתחלה',
  username: 'cohen.yossi',
  password: 'Yossi123',
};

describe('Students', () => {
  let ctx: Awaited<ReturnType<typeof setupBasic>>;

  beforeEach(async () => {
    setNow();
    ctx = await setupBasic();
  });

  describe('create (teacher only)', () => {
    it('creates a student with a login account', async () => {
      const res = await api().post('/api/students').set(bearer(ctx.teacherToken)).send(newStudent);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        username: 'cohen.yossi',
        firstName: 'יוסי',
        age: 6,
        readingLevel: 'BEGINNER',
        isActive: true,
        teacherNotes: 'ביישן בהתחלה',
      });
      expect(res.body.password).toBeUndefined();
      await expect(loginAs('cohen.yossi', 'Yossi123')).resolves.toEqual(expect.any(String));
    });

    it('rejects a username that is already taken (case-insensitive)', async () => {
      const res = await api()
        .post('/api/students')
        .set(bearer(ctx.teacherToken))
        .send({ ...newStudent, username: 'Cohen.Dani' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USERNAME_TAKEN');
    });

    it('validates fields and returns details per field', async () => {
      const res = await api()
        .post('/api/students')
        .set(bearer(ctx.teacherToken))
        .send({ ...newStudent, age: 30, username: 'bad name!', parentPhone: undefined });
      expect(res.status).toBe(400);
      const fields = res.body.error.details.map((d: { field: string }) => d.field);
      expect(fields).toEqual(expect.arrayContaining(['age', 'username', 'parentPhone']));
    });

    it('forbids a student account from listing or creating students', async () => {
      expect((await api().get('/api/students').set(bearer(ctx.daniToken))).status).toBe(403);
      expect((await api().post('/api/students').set(bearer(ctx.daniToken)).send(newStudent)).status).toBe(403);
      expect((await api().get('/api/students')).status).toBe(401);
    });
  });

  describe('list and search', () => {
    it('searches by first and last name, active students first', async () => {
      await createStudent({ username: 'cohen.old', firstName: 'אבי', lastName: 'כהן', isActive: false });

      const all = await api().get('/api/students').set(bearer(ctx.teacherToken));
      expect(all.status).toBe(200);
      expect(all.body).toHaveLength(3);
      expect(all.body[all.body.length - 1].isActive).toBe(false);

      const cohen = await api().get('/api/students').query({ q: 'כהן' }).set(bearer(ctx.teacherToken));
      expect(cohen.body.map((s: { username: string }) => s.username)).toEqual(['cohen.dani', 'cohen.old']);

      const full = await api().get('/api/students').query({ q: 'דני כהן' }).set(bearer(ctx.teacherToken));
      expect(full.body.map((s: { username: string }) => s.username)).toEqual(['cohen.dani']);

      const none = await api().get('/api/students').query({ q: 'אין כזה' }).set(bearer(ctx.teacherToken));
      expect(none.body).toEqual([]);
    });
  });

  describe('view', () => {
    it('a student can view only their own details, without teacher notes', async () => {
      const own = await api().get(`/api/students/${ctx.dani.id}`).set(bearer(ctx.daniToken));
      expect(own.status).toBe(200);
      expect(own.body.firstName).toBe('דני');
      expect(own.body.teacherNotes).toBeUndefined();

      const other = await api().get(`/api/students/${ctx.noa.id}`).set(bearer(ctx.daniToken));
      expect(other.status).toBe(403);
    });

    it('teacher sees teacher notes; unknown id returns 404; bad id returns 400', async () => {
      const res = await api().get(`/api/students/${ctx.dani.id}`).set(bearer(ctx.teacherToken));
      expect(res.body.teacherNotes).toBe('הערה פרטית של המורה');
      expect((await api().get('/api/students/9999').set(bearer(ctx.teacherToken))).status).toBe(404);
      expect((await api().get('/api/students/abc').set(bearer(ctx.teacherToken))).status).toBe(400);
    });
  });

  describe('update', () => {
    it('a student can update the allowed fields of their own record', async () => {
      const res = await api()
        .patch(`/api/students/${ctx.dani.id}`)
        .set(bearer(ctx.daniToken))
        .send({ gradeText: "כיתה ג'", schoolTeacherName: 'המורה אסתר', schoolTeacherPhone: '', parentPhone: '053-1111111' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        gradeText: "כיתה ג'",
        schoolTeacherName: 'המורה אסתר',
        schoolTeacherPhone: null,
        parentPhone: '053-1111111',
      });
    });

    it('a student cannot update teacher-only fields or another student', async () => {
      const forbiddenField = await api()
        .patch(`/api/students/${ctx.dani.id}`)
        .set(bearer(ctx.daniToken))
        .send({ readingLevel: 'FLUENT' });
      expect(forbiddenField.status).toBe(403);
      expect(forbiddenField.body.error.code).toBe('FIELD_NOT_ALLOWED');

      const other = await api()
        .patch(`/api/students/${ctx.noa.id}`)
        .set(bearer(ctx.daniToken))
        .send({ gradeText: 'x' });
      expect(other.status).toBe(403);
    });

    it('teacher can edit all fields, deactivate a student and reset a password', async () => {
      const res = await api()
        .patch(`/api/students/${ctx.dani.id}`)
        .set(bearer(ctx.teacherToken))
        .send({ readingLevel: 'ADVANCED', goals: 'קריאה שוטפת', isActive: false });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ readingLevel: 'ADVANCED', goals: 'קריאה שוטפת', isActive: false });

      const login = await api().post('/api/auth/login').send({ username: 'cohen.dani', password: 'Student123!' });
      expect(login.status).toBe(403);

      const reset = await api()
        .patch(`/api/students/${ctx.noa.id}/password`)
        .set(bearer(ctx.teacherToken))
        .send({ password: 'Fresh1234' });
      expect(reset.status).toBe(204);
      await expect(loginAs('levi.noa', 'Fresh1234')).resolves.toEqual(expect.any(String));
    });

    it('rejects an empty update and an invalid value', async () => {
      const empty = await api().patch(`/api/students/${ctx.dani.id}`).set(bearer(ctx.teacherToken)).send({});
      expect(empty.status).toBe(400);
      const bad = await api()
        .patch(`/api/students/${ctx.dani.id}`)
        .set(bearer(ctx.teacherToken))
        .send({ readingLevel: 'GENIUS' });
      expect(bad.status).toBe(400);
    });
  });

  describe('overview', () => {
    it('shows last report, next lesson and recent lessons; hides the teacher plan from the student', async () => {
      const past = await insertLesson(ctx.dani.id, '2026-10-14T13:00:00.000Z', 'COMPLETED');
      await prisma.lessonReport.create({
        data: {
          lessonId: past.id,
          attendance: 'ATTENDED',
          topicsCovered: 'ניקוד',
          behavior: 'GOOD',
          previousHomework: 'DONE',
          nextLessonPlan: 'סגול וצירה',
        },
      });
      await insertLesson(ctx.dani.id, '2026-10-19T13:00:00.000Z', 'APPROVED');

      const teacherView = await api().get(`/api/students/${ctx.dani.id}/overview`).set(bearer(ctx.teacherToken));
      expect(teacherView.status).toBe(200);
      expect(teacherView.body.lastReport.report.nextLessonPlan).toBe('סגול וצירה');
      expect(teacherView.body.nextLesson.startsAt).toBe('2026-10-19T13:00:00.000Z');
      expect(teacherView.body.recentLessons).toHaveLength(1);

      const studentView = await api().get(`/api/students/${ctx.dani.id}/overview`).set(bearer(ctx.daniToken));
      expect(studentView.status).toBe(200);
      expect(studentView.body.lastReport.report.nextLessonPlan).toBeUndefined();
      expect(studentView.body.student.teacherNotes).toBeUndefined();

      const otherView = await api().get(`/api/students/${ctx.dani.id}/overview`).set(bearer(ctx.noaToken));
      expect(otherView.status).toBe(403);
    });
  });
});
