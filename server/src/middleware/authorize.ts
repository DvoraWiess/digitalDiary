import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { forbidden, unauthorized } from '../utils/AppError';

/**
 * Authorization: מאפשר גישה רק לתפקידים שצוינו.
 * דוגמה: router.post('/', requireRole('TEACHER'), handler)
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden());
      return;
    }
    next();
  };
