import type { Role } from '@prisma/client';

/** המשתמש המחובר - נקבע אך ורק לפי ה-Token (ולא לפי מה שהלקוח שולח) */
export interface AuthUser {
  id: number;
  role: Role;
  username: string;
  /** מזהה התלמיד כשהמשתמש הוא חשבון תלמיד, אחרת null */
  studentId: number | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
