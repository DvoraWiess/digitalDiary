/**
 * נתוני הדגמה (Seed).
 *
 * בפיתוח (NODE_ENV שאינו production) - npm run db:seed:
 *   מוחק את כל הנתונים ויוצר מחדש: מורה, 4 תלמידים, שעות עבודה, זמנים מיוחדים, שיעורים ודוחות.
 *   סיסמאות: מורה teacher / Teacher123!  תלמידים: Student123!
 *
 * בפרודקשן (NODE_ENV=production) - רץ אוטומטית בכל עליית שרת ב-Render, ולעולם לא מוחק נתונים:
 *   - יוצר חשבון מורה רק אם הוגדרו SEED_TEACHER_USERNAME ו-SEED_TEACHER_PASSWORD ואם עדיין אין מורה.
 *   - יוצר נתוני הדגמה רק אם SEED_DEMO_DATA=true, הוגדרה SEED_DEMO_PASSWORD, ועדיין אין תלמידים.
 *   אין סיסמאות קבועות וידועות בפרודקשן.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jerusalem';
const DURATION_MIN = Number(process.env.LESSON_DURATION_MINUTES || 45);
const isProduction = process.env.NODE_ENV === 'production';

// ---------- עזרי זמן (עצמאיים כדי שה-seed לא יטען את הגדרות השרת) ----------

function offsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes): number => Number(parts.find((p) => p.type === t)?.value);
  const hour = get('hour') === 24 ? 0 : get('hour');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000);
}

function localDate(daysFromToday: number): string {
  const now = new Date();
  const local = new Date(now.getTime() + offsetMinutes(now) * 60_000);
  local.setUTCDate(local.getUTCDate() + daysFromToday);
  return local.toISOString().slice(0, 10);
}

/** תאריך מקומי + שעה מקומית -> Date ב-UTC */
function at(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - offsetMinutes(new Date(guess)) * 60_000;
  result = guess - offsetMinutes(new Date(result)) * 60_000;
  return new Date(result);
}

const plusDuration = (d: Date): Date => new Date(d.getTime() + DURATION_MIN * 60_000);

/** התאריך הקרוב (מחר והלאה) שנופל ביום מסוים בשבוע */
function nextWeekday(dayOfWeek: number, minDaysAhead = 1): string {
  for (let i = minDaysAhead; i < minDaysAhead + 7; i++) {
    const date = localDate(i);
    if (new Date(`${date}T00:00:00Z`).getUTCDay() === dayOfWeek) return date;
  }
  return localDate(minDaysAhead);
}

/** התאריך האחרון (לפני היום) שנופל ביום מסוים בשבוע */
function previousWeekday(dayOfWeek: number, minDaysBack = 1): string {
  for (let i = minDaysBack; i < minDaysBack + 7; i++) {
    const date = localDate(-i);
    if (new Date(`${date}T00:00:00Z`).getUTCDay() === dayOfWeek) return date;
  }
  return localDate(-minDaysBack);
}

// ---------- יצירת הנתונים ----------

async function createTeacher(username: string, password: string): Promise<number> {
  const teacher = await prisma.user.create({
    data: { role: 'TEACHER', username, passwordHash: await hash(password, 10) },
  });
  return teacher.id;
}

async function createDemoData(studentPassword: string): Promise<void> {
  const passwordHash = await hash(studentPassword, 10);

  // שעות עבודה: ראשון-חמישי 16:00-19:00
  await prisma.workingHours.createMany({
    data: [0, 1, 2, 3, 4].map((dayOfWeek) => ({ dayOfWeek, startTime: '16:00', endTime: '19:00' })),
  });

  const mkStudent = (data: {
    username: string;
    firstName: string;
    lastName: string;
    age: number;
    gradeText: string;
    readingLevel: 'BEGINNER' | 'BASIC' | 'ADVANCED' | 'FLUENT';
    goals: string;
    parentName: string;
    parentPhone: string;
    schoolTeacherName?: string;
    schoolTeacherPhone?: string;
    teacherNotes?: string;
    isActive?: boolean;
  }) => {
    const { username, ...fields } = data;
    return prisma.student.create({
      data: { ...fields, user: { create: { role: 'STUDENT', username, passwordHash } } },
    });
  };

  const dani = await mkStudent({
    username: 'cohen.dani',
    firstName: 'דני',
    lastName: 'כהן',
    age: 7,
    gradeText: "כיתה ב'",
    readingLevel: 'BASIC',
    goals: 'שטף קריאה, הבנת הנקרא',
    parentName: 'שרה כהן',
    parentPhone: '052-1000001',
    schoolTeacherName: 'המורה רחל',
    schoolTeacherPhone: '050-1000002',
    teacherNotes: 'מתבלבל בין ב/כ. לחזק בכל שיעור.',
  });
  const yossi = await mkStudent({
    username: 'cohen.yossi',
    firstName: 'יוסי',
    lastName: 'כהן',
    age: 6,
    gradeText: 'מכינה',
    readingLevel: 'BEGINNER',
    goals: 'זיהוי אותיות וצירוף הברות',
    parentName: 'שרה כהן',
    parentPhone: '052-1000001',
  });
  const noa = await mkStudent({
    username: 'levi.noa',
    firstName: 'נועה',
    lastName: 'לוי',
    age: 9,
    gradeText: "כיתה ד'",
    readingLevel: 'ADVANCED',
    goals: 'הבנת הנקרא בטקסטים ארוכים',
    parentName: 'מירי לוי',
    parentPhone: '054-1000003',
    schoolTeacherName: 'המורה אסתר',
    schoolTeacherPhone: '050-1000004',
  });
  await mkStudent({
    username: 'mizrahi.avi',
    firstName: 'אבי',
    lastName: 'מזרחי',
    age: 10,
    gradeText: "כיתה ה'",
    readingLevel: 'FLUENT',
    goals: 'סיים את התוכנית',
    parentName: 'רונית מזרחי',
    parentPhone: '053-1000005',
    isActive: false,
  });

  const studentUserId = async (studentId: number): Promise<number> =>
    (await prisma.student.findUniqueOrThrow({ where: { id: studentId } })).userId;
  const daniUser = await studentUserId(dani.id);
  const yossiUser = await studentUserId(yossi.id);
  const noaUser = await studentUserId(noa.id);

  // זמנים מיוחדים: אחד לדני בלבד, אחד פתוח לכולם
  await prisma.specialSlot.create({
    data: { date: new Date(`${nextWeekday(5)}T00:00:00Z`), startTime: '10:00', endTime: '11:00', studentId: dani.id },
  });
  await prisma.specialSlot.create({
    data: { date: new Date(`${nextWeekday(5, 8)}T00:00:00Z`), startTime: '09:00', endTime: '10:30', studentId: null },
  });

  // שיעורים שעברו + דוחות
  const pastSunday = previousWeekday(0, 2);
  const pastMonday = previousWeekday(1, 2);
  const pastTuesday = previousWeekday(2, 2);

  const lesson1 = await prisma.lesson.create({
    data: {
      studentId: dani.id,
      requestedById: daniUser,
      startsAt: at(pastSunday, '16:00'),
      endsAt: plusDuration(at(pastSunday, '16:00')),
      status: 'COMPLETED',
    },
  });
  await prisma.lessonReport.create({
    data: {
      lessonId: lesson1.id,
      attendance: 'ATTENDED',
      topicsCovered: 'קריאת סיפור קצר, תרגול ניקוד קמץ ופתח',
      behavior: 'GOOD',
      behaviorNote: 'היה מרוכז רוב השיעור',
      previousHomework: 'PARTIAL',
      homeworkAssigned: 'לקרוא עמוד 12 בקול פעמיים',
      nextLessonPlan: 'לחזור על סגול וצירה, להתחיל משפטים קצרים',
      extraLessonRecommended: true,
      extraLessonNote: 'כדאי להוסיף שיעור השבוע',
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      studentId: noa.id,
      requestedById: noaUser,
      startsAt: at(pastMonday, '17:30'),
      endsAt: plusDuration(at(pastMonday, '17:30')),
      status: 'COMPLETED',
    },
  });
  await prisma.lessonReport.create({
    data: {
      lessonId: lesson2.id,
      attendance: 'ATTENDED',
      topicsCovered: 'הבנת הנקרא - שאלות על קטע מידע',
      behavior: 'EXCELLENT',
      previousHomework: 'DONE',
      homeworkAssigned: 'לענות על 3 שאלות בדף העבודה',
      nextLessonPlan: 'טקסט ארוך יותר, סיכום בעל פה',
    },
  });

  const lesson3 = await prisma.lesson.create({
    data: {
      studentId: yossi.id,
      requestedById: yossiUser,
      startsAt: at(pastTuesday, '16:45'),
      endsAt: plusDuration(at(pastTuesday, '16:45')),
      status: 'NO_SHOW',
    },
  });
  await prisma.lessonReport.create({
    data: { lessonId: lesson3.id, attendance: 'NO_SHOW', nextLessonPlan: 'להתחיל מחדש את האותיות ש-ת' },
  });

  // שיעור שעבר, מאושר, שעדיין לא נכתב לו דוח (כדי לתרגל כתיבת דוח)
  const pastWednesday = previousWeekday(3, 1);
  await prisma.lesson.create({
    data: {
      studentId: dani.id,
      requestedById: daniUser,
      startsAt: at(pastWednesday, '16:00'),
      endsAt: plusDuration(at(pastWednesday, '16:00')),
      status: 'APPROVED',
    },
  });

  // שיעורים עתידיים: מאושר, ממתין, בוטל
  const futureSunday = nextWeekday(0, 3);
  const futureMonday = nextWeekday(1, 3);
  await prisma.lesson.create({
    data: {
      studentId: dani.id,
      requestedById: daniUser,
      startsAt: at(futureSunday, '16:00'),
      endsAt: plusDuration(at(futureSunday, '16:00')),
      status: 'APPROVED',
    },
  });
  await prisma.lesson.create({
    data: {
      studentId: noa.id,
      requestedById: noaUser,
      startsAt: at(futureMonday, '17:30'),
      endsAt: plusDuration(at(futureMonday, '17:30')),
      status: 'PENDING',
      parentNote: 'אם אפשר, לעבוד על מבחן הבנת הנקרא שיש לה בכיתה',
    },
  });
  await prisma.lesson.create({
    data: {
      studentId: yossi.id,
      requestedById: yossiUser,
      startsAt: at(futureMonday, '16:00'),
      endsAt: plusDuration(at(futureMonday, '16:00')),
      status: 'PENDING',
    },
  });
}

async function seedDevelopment(): Promise<void> {
  console.log('🌱 Development seed: resetting all data...');
  await prisma.lessonReport.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.specialSlot.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  await createTeacher('teacher', 'Teacher123!');
  await createDemoData('Student123!');
  console.log('✅ Done. Teacher: teacher / Teacher123!   Students: cohen.dani, cohen.yossi, levi.noa (password Student123!)');
  console.log('   mizrahi.avi is an inactive student (login is blocked).');
}

async function seedProduction(): Promise<void> {
  const teacherUsername = process.env.SEED_TEACHER_USERNAME?.trim().toLowerCase();
  const teacherPassword = process.env.SEED_TEACHER_PASSWORD;

  const teacherCount = await prisma.user.count({ where: { role: 'TEACHER' } });
  if (teacherCount === 0) {
    if (!teacherUsername || !teacherPassword || teacherPassword.length < 8) {
      console.warn(
        '⚠️  No teacher account exists. Set SEED_TEACHER_USERNAME and SEED_TEACHER_PASSWORD (8+ chars) and restart.',
      );
      return;
    }
    await createTeacher(teacherUsername, teacherPassword);
    console.log(`✅ Teacher account "${teacherUsername}" created.`);
  } else {
    console.log('ℹ️  Teacher account already exists - skipping.');
  }

  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (process.env.SEED_DEMO_DATA === 'true') {
    const studentCount = await prisma.student.count();
    if (studentCount > 0) {
      console.log('ℹ️  Students already exist - demo data skipped.');
    } else if (!demoPassword || demoPassword.length < 8) {
      console.warn('⚠️  SEED_DEMO_DATA=true but SEED_DEMO_PASSWORD is missing (8+ chars) - demo data skipped.');
    } else {
      await createDemoData(demoPassword);
      console.log('✅ Demo students created (password from SEED_DEMO_PASSWORD).');
    }
  }
}

async function main(): Promise<void> {
  if (isProduction) {
    await seedProduction();
  } else {
    await seedDevelopment();
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
