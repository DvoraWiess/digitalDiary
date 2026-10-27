import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/authenticate';
import { idParamSchema } from '../schemas/common';
import {
  availabilityQuerySchema,
  optionalDateRangeQuerySchema,
  putWorkingHoursSchema,
  specialSlotCreateSchema,
} from '../schemas/schedule.schemas';
import { getAvailability } from '../services/availability.service';
import * as scheduleService from '../services/schedule.service';

export async function listWorkingHours(_req: Request, res: Response): Promise<void> {
  res.json(await scheduleService.listWorkingHours());
}

export async function replaceWorkingHours(req: Request, res: Response): Promise<void> {
  const input = putWorkingHoursSchema.parse(req.body);
  res.json(await scheduleService.replaceWorkingHours(input));
}

export async function listSpecialSlots(req: Request, res: Response): Promise<void> {
  const { from, to } = optionalDateRangeQuerySchema.parse(req.query);
  res.json(await scheduleService.listSpecialSlots(from, to));
}

export async function createSpecialSlot(req: Request, res: Response): Promise<void> {
  const input = specialSlotCreateSchema.parse(req.body);
  res.status(201).json(await scheduleService.createSpecialSlot(input));
}

export async function deleteSpecialSlot(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  await scheduleService.deleteSpecialSlot(id);
  res.status(204).send();
}

export async function availability(req: Request, res: Response): Promise<void> {
  const query = availabilityQuerySchema.parse(req.query);
  res.json(await getAvailability(getAuthUser(req), query));
}
