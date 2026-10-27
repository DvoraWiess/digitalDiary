import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

const body = (code: string, message: string, details?: unknown): ErrorBody => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

/** כתובת שלא קיימת -> 404 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body('ROUTE_NOT_FOUND', `הכתובת ${req.method} ${req.originalUrl} לא קיימת`));
};

function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err && typeof (err as { type: unknown }).type === 'string') {
    return (err as { type: string }).type;
  }
  return undefined;
}

/** טיפול מרכזי בכל השגיאות - כל שגיאה חוזרת ללקוח באותו מבנה */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(body(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json(body('VALIDATION_ERROR', 'הנתונים שנשלחו אינם תקינים', details));
    return;
  }

  const parserType = bodyParserErrorType(err);
  if (parserType === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'גוף הבקשה אינו JSON תקין'));
    return;
  }
  if (parserType === 'entity.too.large') {
    res.status(413).json(body('PAYLOAD_TOO_LARGE', 'גוף הבקשה גדול מדי'));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json(body('DUPLICATE', 'ערך זה כבר קיים במערכת'));
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json(body('NOT_FOUND', 'המשאב המבוקש לא נמצא'));
      return;
    }
    if (err.code === 'P2034') {
      res.status(409).json(body('CONFLICT', 'הפעולה התנגשה בפעולה אחרת. נסו שוב'));
      return;
    }
  }

  console.error('Unexpected error:', err);
  res.status(500).json(body('INTERNAL_ERROR', 'אירעה שגיאה בשרת'));
};
