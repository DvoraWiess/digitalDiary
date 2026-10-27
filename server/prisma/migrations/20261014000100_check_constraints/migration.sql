-- אילוצי תקינות במסד הנתונים עצמו (שכבת הגנה נוספת מעבר לולידציה בשרת).
-- Prisma לא מנהל אילוצי CHECK, ולכן הם נכתבו כאן ידנית.

-- גיל תלמיד בין 3 ל-18
ALTER TABLE "Student" ADD CONSTRAINT "Student_age_check" CHECK ("age" BETWEEN 3 AND 18);

-- יום בשבוע 0-6 ושעה בפורמט HH:mm, שעת התחלה לפני שעת סיום
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_dayOfWeek_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6);
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_time_format_check" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_time_order_check" CHECK ("startTime" < "endTime");

ALTER TABLE "SpecialSlot" ADD CONSTRAINT "SpecialSlot_time_format_check" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "SpecialSlot" ADD CONSTRAINT "SpecialSlot_time_order_check" CHECK ("startTime" < "endTime");

-- שיעור מסתיים אחרי שהוא מתחיל
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_time_order_check" CHECK ("endsAt" > "startsAt");
