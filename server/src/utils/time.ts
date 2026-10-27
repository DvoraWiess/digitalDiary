/**
 * כלי עזר לתאריכים ושעות.
 * שעות העבודה של המורה נשמרות בשעון מקומי (למשל Asia/Jerusalem),
 * ושעות השיעורים נשמרות במסד הנתונים ב-UTC. כאן נעשית ההמרה ביניהם,
 * כולל מעבר בין שעון חורף לשעון קיץ.
 */

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** בודק שמחרוזת היא תאריך אמיתי בפורמט YYYY-MM-DD */
export function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** "16:30" -> 990 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 990 -> "16:30" */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** "2026-10-18" + 3 -> "2026-10-21" */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** מספר הימים מ-from עד to */
export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / MS_PER_DAY);
}

/** 0 = ראשון ... 6 = שבת */
export function dayOfWeekOf(date: string): number {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay();
}

/** תאריך (מסוג DATE במסד הנתונים) -> "YYYY-MM-DD" */
export function dbDateToString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" -> ערך לשמירה בעמודה מסוג DATE */
export function stringToDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = getFormatter(timeZone).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((p) => p.type === type)?.value);
  const hour = get('hour');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: hour === 24 ? 0 : hour,
    minute: get('minute'),
    second: get('second'),
  };
}

/** ההפרש בדקות בין השעון המקומי ל-UTC ברגע מסוים (בישראל: 120 בחורף, 180 בקיץ) */
export function getOffsetMinutes(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const wholeSeconds = Math.floor(date.getTime() / 1000) * 1000;
  return Math.round((asUtc - wholeSeconds) / MS_PER_MINUTE);
}

/**
 * תאריך ושעה מקומיים -> רגע מדויק ב-UTC.
 * לדוגמה: ("2026-10-18", 16:00, "Asia/Jerusalem") -> 2026-10-18T13:00:00.000Z
 */
export function zonedDateTimeToUtc(date: string, minutesFromMidnight: number, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, day, 0, minutesFromMidnight);
  const firstOffset = getOffsetMinutes(new Date(guess), timeZone);
  let result = guess - firstOffset * MS_PER_MINUTE;
  const secondOffset = getOffsetMinutes(new Date(result), timeZone);
  if (secondOffset !== firstOffset) {
    result = guess - secondOffset * MS_PER_MINUTE;
  }
  return new Date(result);
}

/** רגע ב-UTC -> תאריך ושעה מקומיים */
export function utcToZoned(date: Date, timeZone: string): { date: string; time: string } {
  const p = getZonedParts(date, timeZone);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** תחילת היום המקומי (00:00) ב-UTC */
export function startOfZonedDay(date: string, timeZone: string): Date {
  return zonedDateTimeToUtc(date, 0, timeZone);
}
