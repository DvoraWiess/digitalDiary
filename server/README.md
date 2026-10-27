# יומן שיעורים – Backend

שרת (Backend) למערכת "יומן שיעורים" של מורה לקריאה בשיעורים פרטיים.

- **מורה**: מנהלת תלמידים, שעות עבודה וזמנים מיוחדים, מאשרת או דוחה בקשות לשיעור, מבטלת שיעורים וכותבת דוח לכל שיעור.
- **חשבון תלמיד** (ההורה משתמש בו): רואה את פרטי התלמיד, את השיעורים ואת הדוחות, מבקש שיעור מתוך הזמנים הפנויים ומבטל שיעורים.

> 👩‍🎓 **מתחילות?** פתחו את [START-HERE.md](START-HERE.md) – הוראות צעד אחר צעד להעלאה לאינטרנט.
> 💻 **כותבות את ה-React?** פתחו את [FRONTEND-API-GUIDE.md](FRONTEND-API-GUIDE.md).
> 📋 **האפיון המלא:** [docs/SPEC.md](docs/SPEC.md)

---

## טכנולוגיות

| תחום | טכנולוגיה |
|---|---|
| שפה | TypeScript (strict) על Node.js 22 LTS |
| שרת | Express 4 |
| מסד נתונים | PostgreSQL + Prisma ORM |
| ולידציה | Zod (הודעות שגיאה בעברית) |
| התחברות | JWT (Bearer) + סיסמאות מוצפנות ב-bcrypt |
| תיעוד | Swagger UI ‏(OpenAPI 3) בכתובת `/api-docs` |
| בדיקות | Vitest + Supertest מול PostgreSQL אמיתי |

אין שימוש בשירותי AI או במפתחות בתשלום. השרת עובד באופן עצמאי לגמרי.

---

## מבנה התיקיות

```
backend-project/
├── src/
│   ├── app.ts               יצירת אפליקציית Express (CORS, Swagger, routes, שגיאות)
│   ├── server.ts            הפעלת השרת
│   ├── config/env.ts        קריאה ובדיקה של משתני סביבה
│   ├── db/prisma.ts         חיבור למסד הנתונים
│   ├── auth/                JWT וסיסמאות
│   ├── middleware/          authenticate (Token), authorize (תפקיד), errorHandler
│   ├── routes/index.ts      כל ה-Endpoints במקום אחד
│   ├── controllers/         קבלת הבקשה, ולידציה, החזרת תשובה
│   ├── services/            הלוגיקה העסקית (הרשאות, זמנים פנויים, סטטוסים)
│   ├── schemas/             סכמות ולידציה (Zod)
│   ├── docs/openapi.ts      תיעוד Swagger
│   ├── seed/seed.ts         נתוני הדגמה
│   ├── types/               טיפוסים (המשתמש המחובר)
│   └── utils/               שגיאות, זמן ואזורי זמן
├── prisma/
│   ├── schema.prisma        מבנה מסד הנתונים
│   └── migrations/          קובצי SQL ליצירת הטבלאות
├── tests/                   בדיקות אוטומטיות
├── docs/                    אפיון ו-openapi.json
├── scripts/                 סקריפטים (ייצוא openapi.json)
├── render.yaml              הגדרות פריסה ל-Render
├── START-HERE.md            מדריך העלאה לאינטרנט (עברית פשוטה)
└── FRONTEND-API-GUIDE.md    מדריך API לכתיבת ה-React
```

---

## הרצה במחשב (למי שיש Node.js ו-PostgreSQL)

```bash
npm install                    # מתקין תלויות ויוצר package-lock.json
cp .env.example .env           # ואז לערוך את DATABASE_URL ו-JWT_SECRET
npm run db:deploy              # יוצר את הטבלאות (migrations)
npm run db:seed                # נתוני הדגמה
npm run dev                    # שרת פיתוח: http://localhost:3000/api-docs
```

**משתמשי הדגמה** (רק בסביבת פיתוח, אחרי `db:seed`):

| שם משתמש | סיסמה | תפקיד |
|---|---|---|
| `teacher` | `Teacher123!` | מורה |
| `cohen.dani` | `Student123!` | תלמיד (יש לו זמן מיוחד ביום שישי, דוח ושיעור מאושר) |
| `cohen.yossi` | `Student123!` | תלמיד (אח של דני, לא הגיע לשיעור אחד) |
| `levi.noa` | `Student123!` | תלמידה (בקשה ממתינה לאישור) |
| `mizrahi.avi` | `Student123!` | תלמיד **מושבת**, הכניסה נחסמת |

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | שרת פיתוח עם רענון אוטומטי |
| `npm run build` | `prisma generate` + קומפילציה ל-`dist/` |
| `npm start` | הפעלת השרת המקומפל |
| `npm run start:render` | migrations + seed בטוח + הפעלה (לשימוש ב-Render) |
| `npm run typecheck` | בדיקת טיפוסים של TypeScript |
| `npm test` | כל הבדיקות האוטומטיות (צריך `.env.test`) |
| `npm run db:migrate` | יצירת migration חדש אחרי שינוי ב-`schema.prisma` |
| `npm run db:deploy` | הרצת migrations קיימים |
| `npm run db:seed` | נתוני הדגמה (בפיתוח **מוחק** את כל הנתונים ויוצר מחדש) |
| `npm run db:studio` | ממשק גרפי לצפייה בטבלאות |
| `npm run openapi:export` | עדכון `docs/openapi.json` אחרי שינוי בתיעוד |

## בדיקות

```bash
cp .env.test.example .env.test     # מסד נתונים נפרד ששמו כולל "test" (צריך ליצור אותו מראש)
npm test
```

**תוצאה אחרונה:** 9 קובצי בדיקות, ‏**78 בדיקות עברו** (Node 22, PostgreSQL 16, Prisma 6.19).

הבדיקות מריצות migrations על מסד הנתונים של הבדיקות, מנקות אותו לפני כל בדיקה, ובודקות: התחברות, Token חסר, לא תקין או שפג תוקפו, הרשאות מורה ותלמיד, CRUD, ולידציה, חיפוש וסינון, חסימת גישה למידע של תלמיד אחר, חישוב זמנים פנויים (כולל מעבר שעון), מניעת קביעה כפולה (גם כששתי בקשות מגיעות בו-זמנית), חוק 24 השעות, דוחות שיעור, Swagger, תקינות Prisma וה-Seed.

## אבטחה בקצרה

- סיסמאות נשמרות רק כ-Hash ‏(bcrypt), ולא מוחזרות אף פעם ב-API.
- JWT חתום ב-`JWT_SECRET` עם תוקף מוגבל.
- המשתמש נקבע **רק** לפי ה-Token. מזהה תלמיד שנשלח מהלקוח לא משמש לזיהוי.
- כל בדיקות ההרשאה נעשות בשרת: 401 = לא מחובר, 403 = אין הרשאה.
- תלמיד מושבת נחסם מיד, גם אם יש לו Token בתוקף.
- הערות המורה (`teacherNotes`) ו"מה לעשות בשיעור הבא" (`nextLessonPlan`) לא נשלחים לחשבון תלמיד.
- בפרודקשן אין חשבונות עם סיסמאות קבועות. חשבון המורה נוצר ממשתני סביבה.
