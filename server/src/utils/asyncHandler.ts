import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * עוטף פונקציה אסינכרונית כך שכל שגיאה תגיע ל-errorHandler המרכזי.
 * (ב-Express 4 שגיאות ב-async לא נתפסות אוטומטית)
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
