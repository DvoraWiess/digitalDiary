import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/authenticate';
import { idParamSchema } from '../schemas/common';
import { resetPasswordSchema, studentCreateSchema, studentListQuerySchema } from '../schemas/student.schemas';
import * as studentService from '../services/student.service';

export async function list(req: Request, res: Response): Promise<void> {
  const { q } = studentListQuerySchema.parse(req.query);
  res.json(await studentService.listStudents(q));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = studentCreateSchema.parse(req.body);
  res.status(201).json(await studentService.createStudent(input));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json(await studentService.getStudent(getAuthUser(req), id));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json(await studentService.updateStudent(getAuthUser(req), id, req.body));
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { password } = resetPasswordSchema.parse(req.body);
  await studentService.resetStudentPassword(id, password);
  res.status(204).send();
}

export async function overview(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  res.json(await studentService.getStudentOverview(getAuthUser(req), id));
}
