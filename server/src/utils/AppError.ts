/**
 * שגיאה "צפויה" שהשרת מחזיר ללקוח עם קוד HTTP ומבנה קבוע:
 * { "error": { "code": "...", "message": "...", "details": ... } }
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, code = 'BAD_REQUEST', details?: unknown): AppError =>
  new AppError(400, code, message, details);

export const unauthorized = (message = 'נדרשת התחברות', code = 'UNAUTHORIZED'): AppError =>
  new AppError(401, code, message);

export const forbidden = (message = 'אין לך הרשאה לבצע פעולה זו', code = 'FORBIDDEN'): AppError =>
  new AppError(403, code, message);

export const notFound = (message = 'המשאב המבוקש לא נמצא', code = 'NOT_FOUND'): AppError =>
  new AppError(404, code, message);

export const conflict = (message: string, code = 'CONFLICT'): AppError => new AppError(409, code, message);
