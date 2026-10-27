import { sign, TokenExpiredError, verify } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';
import { AppError, unauthorized } from '../utils/AppError';

export interface TokenPayload {
  userId: number;
  role: Role;
}

/** יוצר JWT חתום עם תוקף מוגבל (ברירת מחדל: 8 שעות) */
export function signAccessToken(payload: TokenPayload): string {
  return sign({ userId: payload.userId, role: payload.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
  });
}

/** מאמת JWT. זורק 401 אם ה-Token לא תקין או שפג תוקפו */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (
      typeof decoded === 'string' ||
      typeof decoded.userId !== 'number' ||
      (decoded.role !== 'TEACHER' && decoded.role !== 'STUDENT')
    ) {
      throw unauthorized('ה-Token אינו תקין', 'TOKEN_INVALID');
    }
    return { userId: decoded.userId, role: decoded.role };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof TokenExpiredError) {
      throw unauthorized('תוקף ה-Token פג. יש להתחבר מחדש', 'TOKEN_EXPIRED');
    }
    throw unauthorized('ה-Token אינו תקין', 'TOKEN_INVALID');
  }
}
