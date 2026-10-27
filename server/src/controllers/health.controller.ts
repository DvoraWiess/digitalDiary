import type { Request, Response } from 'express';
import { prisma } from '../db/prisma';

/** GET /api/health - בדיקה שהשרת ומסד הנתונים פעילים */
export async function health(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable', time: new Date().toISOString() });
  }
}
