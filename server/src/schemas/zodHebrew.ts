import { z } from 'zod';

/**
 * הודעות שגיאה בעברית לולידציה (Zod).
 * הקובץ נטען פעם אחת בעליית השרת (ב-app.ts).
 */
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') return { message: 'שדה חובה' };
      if (issue.received === 'null') return { message: 'השדה לא יכול להיות ריק' };
      return { message: `סוג ערך שגוי: צפוי ${issue.expected}` };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') return { message: `נדרשים לפחות ${String(issue.minimum)} תווים` };
      if (issue.type === 'number') return { message: `הערך המינימלי הוא ${String(issue.minimum)}` };
      if (issue.type === 'array') return { message: `נדרשים לפחות ${String(issue.minimum)} פריטים` };
      return { message: 'הערך קטן מדי' };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `מותרים לכל היותר ${String(issue.maximum)} תווים` };
      if (issue.type === 'number') return { message: `הערך המקסימלי הוא ${String(issue.maximum)}` };
      if (issue.type === 'array') return { message: `מותרים לכל היותר ${String(issue.maximum)} פריטים` };
      return { message: 'הערך גדול מדי' };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `ערך לא חוקי. ערכים אפשריים: ${issue.options.join(', ')}` };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `שדות לא מוכרים: ${issue.keys.join(', ')}` };
    case z.ZodIssueCode.invalid_string:
      return { message: 'פורמט לא תקין' };
    default:
      return { message: ctx.defaultError };
  }
});
