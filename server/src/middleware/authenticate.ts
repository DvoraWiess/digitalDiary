import type { Request } from 'express';
import { prisma } from '../db/prisma';
import { verifyAccessToken } from '../auth/jwt';
import type { AuthUser } from '../types/express';
import { asyncHandler } from '../utils/asyncHandler';
import { forbidden, unauthorized } from '../utils/AppError';

/**
 * Authentication: בודק שיש Bearer Token תקין ומזהה את המשתמש.
 * המשתמש נטען מחדש ממסד הנתונים בכל בקשה, כך שתלמיד שהושבת
 * נחסם מיד גם אם ה-Token שלו עדיין בתוקף.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw unauthorized('חסר Token. יש להתחבר ולשלוח Authorization: Bearer <token>', 'TOKEN_MISSING');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw unauthorized('חסר Token. יש להתחבר ולשלוח Authorization: Bearer <token>', 'TOKEN_MISSING');
  }

  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { student: { select: { id: true, isActive: true } } },
  });
  if (!user) {
    throw unauthorized('המשתמש של ה-Token לא קיים', 'TOKEN_INVALID');
  }
  if (user.role === 'STUDENT') {
    if (!user.student) throw unauthorized('המשתמש של ה-Token לא קיים', 'TOKEN_INVALID');
    if (!user.student.isActive) throw forbidden('החשבון הושבת. יש לפנות למורה', 'ACCOUNT_DISABLED');
  }

  req.user = {
    id: user.id,
    role: user.role,
    username: user.username,
    studentId: user.student?.id ?? null,
  };
  next();
});

/** מחזיר את המשתמש המחובר (לשימוש בתוך controllers אחרי authenticate) */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
