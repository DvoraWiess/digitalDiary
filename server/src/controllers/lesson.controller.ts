import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/authenticate';
import { idParamSchema } from '../schemas/common';
import { lessonListQuerySchema, lessonRequestSchema, reasonSchema } from '../schemas/lesson.schemas';
import { reportSchema } from '../schemas/report.schemas';
import * as lessonService from '../services/lesson.service';
import * as reportService from '../services/report.service';

export async function list(req: Request, res: Response): Promise<void> {
  const query = lessonListQuerySchema.parse(req.query);
  res.json(await lessonService.listLessons(getAuthUser(req), query));
}

export async function request(req: Request, res: Response): Promise<void> {
  const input = lessonRequestSchema.parse(req.body);
  res.status(201).json(await lessonService.requestLesson(getAuthUser(req), input));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json(await lessonService.getLesson(getAuthUser(req), id));
}

export async function approve(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json(await lessonService.approveLesson(id));
}

export async function reject(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = reasonSchema.parse(req.body ?? {});
  res.json(await lessonService.rejectLesson(id, reason));
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = reasonSchema.parse(req.body ?? {});
  res.json(await lessonService.cancelLesson(getAuthUser(req), id, reason));
}

export async function getReport(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json(await reportService.getReport(getAuthUser(req), id));
}

export async function putReport(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const input = reportSchema.parse(req.body);
  res.json(await reportService.upsertReport(id, input));
}
