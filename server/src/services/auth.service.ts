import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { signAccessToken } from '../auth/jwt';
import { hashPassword, verifyPassword } from '../auth/password';
import type { ChangePasswordInput, LoginInput } from '../schemas/auth.schemas';
import type { AuthUser } from '../types/express';
import { badRequest, forbidden, unauthorized } from '../utils/AppError';
import { presentStudent, studentInclude } from './presenters';

async function loadMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: { include: studentInclude } },
  });
  if (!user) throw unauthorized();
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    student: user.student ? presentStudent(user.student, user.role) : null,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
    include: { student: { select: { isActive: true } } },
  });

  const passwordOk = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !passwordOk) {
    throw unauthorized('שם משתמש או סיסמה שגויים', 'INVALID_CREDENTIALS');
  }
  if (user.role === 'STUDENT' && user.student && !user.student.isActive) {
    throw forbidden('החשבון הושבת. יש לפנות למורה', 'ACCOUNT_DISABLED');
  }

  const token = signAccessToken({ userId: user.id, role: user.role });
  return {
    token,
    tokenType: 'Bearer' as const,
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
    user: await loadMe(user.id),
  };
}

export function getMe(user: AuthUser) {
  return loadMe(user.id);
}

export async function changePassword(user: AuthUser, input: ChangePasswordInput): Promise<void> {
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) throw unauthorized();
  const ok = await verifyPassword(input.currentPassword, record.passwordHash);
  if (!ok) {
    throw badRequest('הסיסמה הנוכחית שגויה', 'WRONG_PASSWORD');
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
}
