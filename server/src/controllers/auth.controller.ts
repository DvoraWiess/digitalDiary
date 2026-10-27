import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/authenticate';
import { changePasswordSchema, loginSchema } from '../schemas/auth.schemas';
import * as authService from '../services/auth.service';

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  res.json(await authService.login(input));
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json(await authService.getMe(getAuthUser(req)));
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const input = changePasswordSchema.parse(req.body);
  await authService.changePassword(getAuthUser(req), input);
  res.status(204).send();
}
