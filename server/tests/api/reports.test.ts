import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/db/prisma';
import { api, bearer, insertLesson, SLOT, setNow, setupBasic } from '../helpers';

const fullReport = {
  attendance: 'ATTENDED',
  topicsCovered: 'קריאת סיפור קצר',
  behavior: 'GOOD',
  behaviorNote: 'מרוכז',
  previousHomework: 'PARTIAL',
  homeworkAssigned: 'עמוד 12 בקול',
  nextLessonPlan: 'סגול וצירה',
  extraLessonRecommended: true,
  extraLessonNote: 'כדאי שיעור תגבור השבוע',
};

describe('Lesson reports', () => {
  let ctx: Awaited<ReturnType<typeof setupBasic>>;
  let pastLessonId: number;

  beforeEach(async () => {
    setNow();
    ctx = await setupBasic();
    pastLessonId = (await insertLesson(ctx.dani.id, '2026-10-15T13:00:00.000Z', 'APPROVED')).id;
  });

  const putReport = (lessonId: number, body: object, token = ctx.teacherToken) =>
    api().put(`/api/lessons/${lessonId}/report`).set(bearer(token)).send(body);

  it('teacher writes a report; the lesson becomes COMPLETED', async () => {
    const res = await putReport(pastLessonId, fullReport);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...fullReport, lessonId: pastLessonId });

    const lesson = await api().get(`/api/lessons/${pastLessonId}`).set(bearer(ctx.teacherToken));
    expect(lesson.body).toMatchObject({ status: 'COMPLETED', hasReport: true });
  });

  it('requires topics, behavior and homework status when the student attended', async () => {
    const res = await putReport(pastLessonId, { attendance: 'ATTENDED' });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['topicsCovered', 'behavior', 'previousHomework']));
  });

  it('a NO_SHOW report needs no details and marks the lesson NO_SHOW', async () => {
    const res = await putReport(pastLessonId, { attendance: 'NO_SHOW' });
    expect(res.status).toBe(200);
    expect(res.body.extraLessonRecommended).toBe(false);
    const lesson = await prisma.lesson.findUniqueOrThrow({ where: { id: pastLessonId } });
    expect(lesson.status).toBe('NO_SHOW');
  });

  it('editing replaces the report and can change attendance', async () => {
    await putReport(pastLessonId, { attendance: 'NO_SHOW' });
    const res = await putReport(pastLessonId, fullReport);
    expect(res.status).toBe(200);
    expect(await prisma.lessonReport.count()).toBe(1);
    const lesson = await prisma.lesson.findUniqueOrThrow({ where: { id: pastLessonId } });
    expect(lesson.status).toBe('COMPLETED');
  });

  it('the student sees their own report without the teacher plan; others are blocked', async () => {
    await putReport(pastLessonId, fullReport);

    const own = await api().get(`/api/lessons/${pastLessonId}/report`).set(bearer(ctx.daniToken));
    expect(own.status).toBe(200);
    expect(own.body.homeworkAssigned).toBe('עמוד 12 בקול');
    expect(own.body.extraLessonRecommended).toBe(true);
    expect(own.body.nextLessonPlan).toBeUndefined();

    const teacher = await api().get(`/api/lessons/${pastLessonId}/report`).set(bearer(ctx.teacherToken));
    expect(teacher.body.nextLessonPlan).toBe('סגול וצירה');

    const other = await api().get(`/api/lessons/${pastLessonId}/report`).set(bearer(ctx.noaToken));
    expect(other.status).toBe(403);
  });

  it('only the teacher can write reports', async () => {
    const res = await putReport(pastLessonId, fullReport, ctx.daniToken);
    expect(res.status).toBe(403);
  });

  it('cannot report on a future lesson or on a pending request', async () => {
    const future = await insertLesson(ctx.dani.id, SLOT.mon1600, 'APPROVED');
    const futureRes = await putReport(future.id, fullReport);
    expect(futureRes.status).toBe(409);
    expect(futureRes.body.error.code).toBe('LESSON_NOT_STARTED');

    const pending = await insertLesson(ctx.dani.id, '2026-10-14T13:00:00.000Z', 'PENDING');
    const pendingRes = await putReport(pending.id, fullReport);
    expect(pendingRes.status).toBe(409);
    expect(pendingRes.body.error.code).toBe('INVALID_STATUS');
  });

  it('returns 404 when there is no report yet or the lesson does not exist', async () => {
    const none = await api().get(`/api/lessons/${pastLessonId}/report`).set(bearer(ctx.teacherToken));
    expect(none.status).toBe(404);
    expect(none.body.error.code).toBe('REPORT_NOT_FOUND');
    expect((await putReport(9999, fullReport)).status).toBe(404);
  });
});
