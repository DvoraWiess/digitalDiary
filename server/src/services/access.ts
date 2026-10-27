import type { AuthUser } from '../types/express';
import { forbidden } from '../utils/AppError';

/**
 * חשבון תלמיד רשאי לגשת רק למידע של עצמו. המורה רשאית לגשת לכולם.
 * הבדיקה נעשית בשרת לפי ה-Token, ולא לפי מזהה שהלקוח שולח.
 */
export function assertCanAccessStudent(user: AuthUser, studentId: number): void {
  if (user.role === 'TEACHER') return;
  if (user.studentId !== studentId) {
    throw forbidden('אין לך הרשאה לצפות במידע של תלמיד אחר');
  }
}
