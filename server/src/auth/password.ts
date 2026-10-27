import { compare, hash } from 'bcryptjs';
import { env } from '../config/env';

/** הצפנה חד-כיוונית (Hash) של סיסמה. הסיסמה עצמה לעולם לא נשמרת */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}
