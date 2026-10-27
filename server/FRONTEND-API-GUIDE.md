# 💻 מדריך API לכתיבת צד ה-React

המסמך הזה מסביר איך צד ה-React מדבר עם השרת: לאיזו כתובת שולחים, מה שולחים, ומה מקבלים בחזרה.
**אין כאן קוד React.** את הקומפוננטות, ה-Hooks והטפסים כותבים בעצמכן.

> 🧪 את כל מה שכתוב כאן אפשר לנסות קודם ב-Swagger: `‎<BASE_URL>/api-docs`

---

## 1. כתובת השרת (Base URL)

| סביבה | Base URL |
|---|---|
| במחשב | `http://localhost:3000` |
| בענן (Render) | `https://lesson-diary-api.onrender.com` (או הכתובת שקיבלתן) |

כל ה-Endpoints מתחילים ב-`/api`. לדוגמה: `https://lesson-diary-api.onrender.com/api/lessons`

💡 כדאי לשמור את ה-Base URL במשתנה סביבה של פרויקט ה-React (למשל ב-Vite: ‏`VITE_API_URL`), ולא לכתוב אותו בכל מקום בקוד.

---

## 2. התחברות (Authentication) בקצרה

1. המשתמש ממלא שם משתמש וסיסמה ← שולחים `POST /api/auth/login`.
2. מקבלים `token` ו-`user` (כולל `role`: ‏`TEACHER` או `STUDENT`).
3. שומרים את ה-Token, למשל ב-`localStorage`.
4. בכל בקשה אחרת שולחים כותרת (Header):
   ```
   Authorization: Bearer <token>
   ```
5. לפי `user.role` מחליטים אילו מסכים להציג: מסכי מורה או מסכי הורה.
6. **יציאה (Logout):** מוחקים את ה-Token מהדפדפן. אין Endpoint ליציאה.
7. **תוקף:** ה-Token תקף 8 שעות (`expiresIn` בשניות). אם מתקבל `401`, מוחקים את ה-Token ומעבירים למסך התחברות.
8. **רענון דף:** אם יש Token שמור, אפשר לקרוא ל-`GET /api/auth/me` כדי לדעת מי מחובר.

### דוגמת בקשה ותשובה

**בקשה**
```http
POST /api/auth/login
Content-Type: application/json

{ "username": "cohen.dani", "password": "Student123!" }
```

**תשובה 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "user": {
    "id": 2,
    "username": "cohen.dani",
    "role": "STUDENT",
    "student": {
      "id": 1, "username": "cohen.dani", "firstName": "דני", "lastName": "כהן", "age": 7,
      "gradeText": "כיתה ב'", "readingLevel": "BASIC", "goals": "שטף קריאה, הבנת הנקרא",
      "schoolTeacherName": "המורה רחל", "schoolTeacherPhone": "050-1000002",
      "parentName": "שרה כהן", "parentPhone": "052-1000001", "isActive": true,
      "createdAt": "2026-10-14T19:00:00.000Z", "updatedAt": "2026-10-14T19:00:00.000Z"
    }
  }
}
```
אצל המורה, `user.student` הוא `null`.

### שליחת Bearer Token: דוגמה ב-JavaScript רגיל (fetch)

```js
const response = await fetch(`${API_URL}/api/lessons?status=PENDING`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
if (!response.ok) {
  // data.error.code, data.error.message, data.error.details
}
```
בבקשות עם גוף (POST, PUT, PATCH) מוסיפים גם `'Content-Type': 'application/json'` ושולחים `body: JSON.stringify(...)`.

---

## 3. מבנה שגיאה (זהה בכל ה-API)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "הנתונים שנשלחו אינם תקינים",
    "details": [
      { "field": "age", "message": "הגיל חייב להיות בין 3 ל-18" },
      { "field": "parentPhone", "message": "שדה חובה" }
    ]
  }
}
```
- `message` כתוב בעברית, ואפשר להציג אותו למשתמש.
- `details` מופיע בשגיאות ולידציה. `field` הוא שם השדה בטופס, וכך אפשר להציג את השגיאה ליד השדה הנכון.

### קודי HTTP

| קוד | משמעות | מה עושים ב-React |
|---|---|---|
| 200 | הצליח | מציגים את התוצאה |
| 201 | נוצר | למשל "הבקשה נשלחה" |
| 204 | הצליח, בלי תוכן | אין גוף לקרוא (לא לקרוא ל-`json()`!) |
| 400 | נתונים לא תקינים | מציגים את `details` ליד השדות |
| 401 | לא מחובר או Token לא תקין | מוחקים Token ומעבירים להתחברות |
| 403 | אין הרשאה | מציגים "אין הרשאה" (או `message`) |
| 404 | לא נמצא | "לא נמצא" |
| 409 | התנגשות | מציגים את `message`, למשל "השעה כבר לא פנויה" |
| 500 | שגיאת שרת | "אירעה שגיאה, נסו שוב" |

### קודי שגיאה חשובים (`error.code`)

| code | מתי |
|---|---|
| `VALIDATION_ERROR` | שדה חסר או לא תקין |
| `INVALID_CREDENTIALS` | שם משתמש או סיסמה שגויים |
| `ACCOUNT_DISABLED` | התלמיד הושבת |
| `TOKEN_MISSING` / `TOKEN_INVALID` / `TOKEN_EXPIRED` | בעיה ב-Token |
| `FORBIDDEN` | אין הרשאה לפעולה |
| `FIELD_NOT_ALLOWED` | הורה ניסה לערוך שדה שרק המורה רשאית לערוך |
| `USERNAME_TAKEN` | שם המשתמש תפוס |
| `SLOT_NOT_AVAILABLE` | השעה כבר לא פנויה (מישהו קבע לפניך) |
| `CANCEL_TOO_LATE` | ביטול שיעור מאושר פחות מ-24 שעות לפני |
| `INVALID_STATUS` | הפעולה לא מתאימה לסטטוס הנוכחי של השיעור |
| `LESSON_IN_PAST` / `LESSON_NOT_STARTED` | זמן השיעור לא מתאים לפעולה |
| `REPORT_NOT_FOUND` | עדיין לא נכתב דוח לשיעור |
| `WRONG_PASSWORD` | הסיסמה הנוכחית שגויה (בשינוי סיסמה) |

---

## 4. תאריכים ושעות

- כל זמן שיעור (`startsAt`, `endsAt`) מגיע ב-**UTC** בפורמט ISO, למשל `"2026-10-18T13:00:00.000Z"`.
- להצגה בשעון ישראל אפשר להשתמש ב:
  `new Date(lesson.startsAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })`
- בזמנים הפנויים (`/api/availability`) השרת כבר מחזיר גם `time` מקומי ("16:00") להצגה, וגם `startsAt` לשליחה.
- פרמטרי סינון של תאריכים (`from`, `to`) נשלחים כתאריך פשוט בשעון ישראל: `YYYY-MM-DD`, למשל `2026-10-18`.
- `dayOfWeek`: ‏0 = ראשון, 1 = שני ... 6 = שבת.

---

## 5. ערכים קבועים ותרגום לעברית

| שדה | ערך | להצגה |
|---|---|---|
| `role` | `TEACHER` / `STUDENT` | מורה / תלמיד (הורה) |
| `readingLevel` | `BEGINNER` / `BASIC` / `ADVANCED` / `FLUENT` | מתחיל / בסיסי / מתקדם / שוטף |
| `status` (שיעור) | `PENDING` | ממתין לאישור |
| | `APPROVED` | מאושר |
| | `REJECTED` | נדחה |
| | `CANCELLED` | בוטל |
| | `COMPLETED` | התקיים |
| | `NO_SHOW` | התלמיד לא הגיע |
| `attendance` | `ATTENDED` / `NO_SHOW` | הגיע / לא הגיע |
| `behavior` | `EXCELLENT` / `GOOD` / `AVERAGE` / `DIFFICULT` | מצוינת / טובה / בינונית / קשה |
| `previousHomework` | `DONE` / `PARTIAL` / `NOT_DONE` / `NONE_GIVEN` | הכין / חלקית / לא הכין / לא ניתנו |

---

## 6. מבני הנתונים

### Student (תלמיד)
```json
{
  "id": 1,
  "username": "cohen.dani",
  "firstName": "דני",
  "lastName": "כהן",
  "age": 7,
  "gradeText": "כיתה ב'",
  "readingLevel": "BASIC",
  "goals": "שטף קריאה, הבנת הנקרא",
  "schoolTeacherName": "המורה רחל",
  "schoolTeacherPhone": "050-1000002",
  "parentName": "שרה כהן",
  "parentPhone": "052-1000001",
  "isActive": true,
  "createdAt": "2026-09-01T08:00:00.000Z",
  "updatedAt": "2026-10-10T08:00:00.000Z",
  "teacherNotes": "מתבלבל בין ב/כ"
}
```
`teacherNotes` מגיע **רק למורה**. אצל ההורה השדה לא קיים בכלל.

### Lesson (שיעור)
```json
{
  "id": 12,
  "studentId": 1,
  "student": { "id": 1, "firstName": "דני", "lastName": "כהן" },
  "startsAt": "2026-10-18T13:00:00.000Z",
  "endsAt": "2026-10-18T13:45:00.000Z",
  "status": "APPROVED",
  "parentNote": "נשמח להתמקד בקריאה בקול",
  "statusReason": null,
  "cancelledByRole": null,
  "hasReport": false,
  "createdAt": "2026-10-14T19:00:00.000Z",
  "updatedAt": "2026-10-14T19:05:00.000Z"
}
```
- `statusReason`: סיבת דחייה או ביטול (אם נכתבה).
- `cancelledByRole`: מי ביטל, `TEACHER` או `STUDENT`.
- `hasReport`: האם כבר יש דוח. כך יודעים אם להציג כפתור "צפייה בדוח" או "כתיבת דוח".

### Report (דוח שיעור)
```json
{
  "id": 5,
  "lessonId": 12,
  "attendance": "ATTENDED",
  "topicsCovered": "קריאת סיפור קצר, ניקוד קמץ ופתח",
  "behavior": "GOOD",
  "behaviorNote": "היה מרוכז",
  "previousHomework": "PARTIAL",
  "homeworkAssigned": "לקרוא עמוד 12 בקול",
  "extraLessonRecommended": true,
  "extraLessonNote": "כדאי שיעור תגבור השבוע",
  "createdAt": "2026-10-18T14:00:00.000Z",
  "updatedAt": "2026-10-18T14:00:00.000Z",
  "nextLessonPlan": "סגול וצירה"
}
```
`nextLessonPlan` מגיע **רק למורה**.

---

## 7. רשימת ה-Endpoints

🔓 = בלי Token. 👩‍🏫 = מורה בלבד. 👪 = חשבון תלמיד בלבד. 👥 = שניהם (הורה רואה רק את שלו).

| Method | URL | מי | תיאור | הצלחה |
|---|---|---|---|---|
| GET | `/api/health` | 🔓 | בדיקת שרת | 200 |
| POST | `/api/auth/login` | 🔓 | התחברות | 200 + token |
| GET | `/api/auth/me` | 👥 | מי מחובר | 200 |
| POST | `/api/auth/change-password` | 👥 | שינוי סיסמה | 204 |
| GET | `/api/students?q=` | 👩‍🏫 | רשימת תלמידים + חיפוש | 200 מערך |
| POST | `/api/students` | 👩‍🏫 | הוספת תלמיד | 201 |
| GET | `/api/students/:id` | 👥 | פרטי תלמיד | 200 |
| PATCH | `/api/students/:id` | 👥 | עריכה (הורה: שדות מוגבלים) | 200 |
| PATCH | `/api/students/:id/password` | 👩‍🏫 | איפוס סיסמה | 204 |
| GET | `/api/students/:id/overview` | 👥 | תמונת מצב | 200 |
| GET | `/api/working-hours` | 👥 | שעות עבודה | 200 מערך |
| PUT | `/api/working-hours` | 👩‍🏫 | שמירת שעות עבודה | 200 מערך |
| GET | `/api/special-slots?from=&to=` | 👩‍🏫 | זמנים מיוחדים | 200 מערך |
| POST | `/api/special-slots` | 👩‍🏫 | הוספת זמן מיוחד | 201 |
| DELETE | `/api/special-slots/:id` | 👩‍🏫 | מחיקת זמן מיוחד | 204 |
| GET | `/api/availability?from=&to=` | 👥 | זמנים פנויים | 200 |
| GET | `/api/lessons?status=&from=&to=` | 👥 | רשימת שיעורים | 200 מערך |
| POST | `/api/lessons` | 👪 | בקשה לשיעור | 201 |
| GET | `/api/lessons/:id` | 👥 | פרטי שיעור | 200 |
| PATCH | `/api/lessons/:id/approve` | 👩‍🏫 | אישור | 200 |
| PATCH | `/api/lessons/:id/reject` | 👩‍🏫 | דחייה | 200 |
| PATCH | `/api/lessons/:id/cancel` | 👥 | ביטול | 200 |
| GET | `/api/lessons/:id/report` | 👥 | צפייה בדוח | 200 |
| PUT | `/api/lessons/:id/report` | 👩‍🏫 | כתיבה או עריכה של דוח | 200 |

---

## 8. אילו Endpoints צריך בכל מסך

### מסך התחברות (שני התפקידים)
- `POST /api/auth/login`
- **שדות חובה בטופס:** `username`, `password`
- אחרי הצלחה: לפי `user.role` עוברים למסכי מורה או הורה.

---

### מסכי המורה

#### 1. רשימת השיעורים (נפתחת על היום, משמשת גם לאישור בקשות)
- **שיעורי היום:** `GET /api/lessons?from=2026-10-18&to=2026-10-18`
- **שבוע:** `GET /api/lessons?from=2026-10-18&to=2026-10-24`
- **סינון "ממתין לאישור":** `GET /api/lessons?status=PENDING`
- **כמה סטטוסים יחד:** `GET /api/lessons?status=PENDING,APPROVED`
- כפתורים בכל שורה:
  - **אישור:** `PATCH /api/lessons/:id/approve` (בלי גוף)
  - **דחייה:** `PATCH /api/lessons/:id/reject` עם `{ "reason": "..." }`. הסיבה לא חובה.
  - **ביטול:** `PATCH /api/lessons/:id/cancel` עם `{ "reason": "..." }`. **הסיבה חובה למורה.**
  - **דוח:** אם `hasReport` הוא `false` והשיעור מאושר וזמנו הגיע, מציגים "כתיבת דוח".

#### 2. פרטי שיעור ודוח
- `GET /api/lessons/:id`
- `GET /api/lessons/:id/report`. ‏404 עם `REPORT_NOT_FOUND` פירושו שעדיין אין דוח.
- **כתיבה או עריכה:** `PUT /api/lessons/:id/report`

**טופס דוח: שדות**

| שדה | סוג | חובה |
|---|---|---|
| `attendance` | `ATTENDED` / `NO_SHOW` | ✅ תמיד |
| `topicsCovered` | טקסט (עד 2000) | ✅ כשהגיע |
| `behavior` | בחירה | ✅ כשהגיע |
| `behaviorNote` | טקסט (עד 1000) | ❌ |
| `previousHomework` | בחירה | ✅ כשהגיע |
| `homeworkAssigned` | טקסט (עד 2000) | ❌ |
| `nextLessonPlan` | טקסט (עד 2000), רק המורה רואה | ❌ |
| `extraLessonRecommended` | true/false | ❌ (ברירת מחדל false) |
| `extraLessonNote` | טקסט (עד 1000) | ❌ |

```json
{
  "attendance": "ATTENDED",
  "topicsCovered": "קריאת סיפור קצר",
  "behavior": "GOOD",
  "previousHomework": "DONE",
  "homeworkAssigned": "עמוד 12",
  "nextLessonPlan": "סגול וצירה",
  "extraLessonRecommended": false
}
```
⚠️ PUT **מחליף** את כל הדוח. בעריכה שולחים את כל השדות מחדש, לא רק את מה שהשתנה.
אפשר לכתוב דוח רק לשיעור **מאושר** (או שכבר יש לו דוח) **שזמנו כבר התחיל**.

#### 3. רשימת תלמידים
- `GET /api/students`
- **חיפוש לפי שם:** `GET /api/students?q=כהן` (כמה מילים, למשל "דני כהן", מחפש את כולן).
- הרשימה כבר ממוינת: פעילים קודם, אחר כך לפי שם משפחה.

#### 4. פרטי תלמיד ותמונת מצב (מסך אחד)
- `GET /api/students/:id/overview`
```json
{
  "student": { "...": "Student" },
  "lastReport": { "lesson": { "...": "Lesson" }, "report": { "...": "Report" } },
  "nextLesson": { "...": "Lesson" },
  "recentLessons": [ { "...": "Lesson" } ]
}
```
`lastReport` ו-`nextLesson` יכולים להיות `null`. `recentLessons` מכיל עד 10 שיעורים אחרונים, מהחדש לישן.

#### 5. הוספה ועריכה של תלמיד
- **הוספה:** `POST /api/students`
- **עריכה:** `PATCH /api/students/:id`. שולחים **רק** את השדות שהשתנו.
- **השבתה:** `PATCH /api/students/:id` עם `{ "isActive": false }` (תיבת סימון).
- **איפוס סיסמה:** `PATCH /api/students/:id/password` עם `{ "password": "..." }`

**טופס תלמיד: שדות**

| שדה | חובה בהוספה | כללים |
|---|---|---|
| `firstName` | ✅ | עד 50 תווים |
| `lastName` | ✅ | עד 50 תווים |
| `age` | ✅ | מספר 3–18 |
| `gradeText` | ❌ | טקסט חופשי (גן, מכינה, כיתה ב'...) |
| `readingLevel` | ❌ | ברירת מחדל `BEGINNER` |
| `goals` | ❌ | עד 1000 תווים |
| `schoolTeacherName` | ❌ | |
| `schoolTeacherPhone` | ❌ | 7–20 ספרות, מותר `-` ורווח |
| `parentName` | ✅ | 2–100 תווים |
| `parentPhone` | ✅ | 7–20 ספרות |
| `teacherNotes` | ❌ | רק המורה רואה |
| `username` | ✅ | 3–30 תווים: אותיות קטנות באנגלית, ספרות, `.` `_` `-`, למשל `cohen.dani` |
| `password` | ✅ (רק בהוספה) | לפחות 6 תווים |
| `isActive` | (רק בעריכה) | true/false |

💡 שדה טקסט ריק (`""`) נשמר כ"אין ערך" (`null`).

#### 6. זמינות (שעות עבודה וזמנים מיוחדים)
- **הצגת שעות עבודה:** `GET /api/working-hours`
- **שמירה:** `PUT /api/working-hours`. שולחים את **כל** הרשימה:
```json
{ "hours": [
  { "dayOfWeek": 0, "startTime": "16:00", "endTime": "19:00" },
  { "dayOfWeek": 1, "startTime": "16:00", "endTime": "19:00" }
] }
```
  כללים: שעה בפורמט `HH:mm`, התחלה לפני סיום, טווח באורך שיעור אחד לפחות (45 דקות), בלי חפיפה באותו יום. כדי למחוק את כל השעות שולחים `{ "hours": [] }`.
- **זמנים מיוחדים:** `GET /api/special-slots?from=2026-10-18`
- **הוספה:** `POST /api/special-slots`
```json
{ "date": "2026-10-23", "startTime": "10:00", "endTime": "11:00", "studentId": 1 }
```
  `studentId` ריק או `null` פירושו פתוח לכולם. לבחירת תלמיד ברשימה נפתחת אפשר להשתמש ב-`GET /api/students`.
- **מחיקה:** `DELETE /api/special-slots/:id`

---

### מסכי ההורה (חשבון תלמיד)

#### 1. פרטי התלמיד
- `GET /api/auth/me` (כולל `student`) או `GET /api/students/:id`
- **עריכה:** `PATCH /api/students/:id`. מותר **רק**:

| שדה | הערה |
|---|---|
| `gradeText` | כיתה או מסגרת |
| `schoolTeacherName` | שם המורה בבית הספר |
| `schoolTeacherPhone` | טלפון המורה בבית הספר |
| `parentPhone` | טלפון ההורה (לא יכול להיות ריק) |

  שליחת שדה אחר מחזירה `403 FIELD_NOT_ALLOWED`.

#### 2. שיעורים (קרובים ושהיו)
- **קרובים:** `GET /api/lessons?from=<היום>`
- **שהיו:** `GET /api/lessons?to=<אתמול>`
- **סינון:** `GET /api/lessons?status=PENDING,APPROVED`
- השרת מחזיר רק את השיעורים של התלמיד המחובר.
- **ביטול:** `PATCH /api/lessons/:id/cancel`. סיבה לא חובה. בקשה ממתינה אפשר לבטל תמיד. שיעור מאושר אפשר לבטל עד 24 שעות לפני, ואחרי זה מתקבל `409 CANCEL_TOO_LATE`.
  💡 אפשר להסתיר מראש את כפתור הביטול כש-`startsAt` פחות מ-24 שעות מעכשיו. השרת בודק בכל מקרה.

#### 3. דוח שיעור
- `GET /api/lessons/:id/report`, כש-`hasReport` הוא `true`.
- כדאי להבליט את `homeworkAssigned` ואת `extraLessonRecommended` עם `extraLessonNote`.

#### 4. קביעת שיעור
**שלב א: שבוע של זמנים פנויים**
```http
GET /api/availability?from=2026-10-18&to=2026-10-24
```
```json
{
  "from": "2026-10-18",
  "to": "2026-10-24",
  "timeZone": "Asia/Jerusalem",
  "lessonDurationMinutes": 45,
  "bookingWindowDays": 28,
  "days": [
    {
      "date": "2026-10-18",
      "dayOfWeek": 0,
      "slots": [
        { "startsAt": "2026-10-18T13:00:00.000Z", "endsAt": "2026-10-18T13:45:00.000Z",
          "time": "16:00", "special": false, "forStudentId": null },
        { "startsAt": "2026-10-18T14:30:00.000Z", "endsAt": "2026-10-18T15:15:00.000Z",
          "time": "17:30", "special": false, "forStudentId": null }
      ]
    },
    { "date": "2026-10-20", "dayOfWeek": 2, "slots": [] },
    {
      "date": "2026-10-23",
      "dayOfWeek": 5,
      "slots": [
        { "startsAt": "2026-10-23T07:00:00.000Z", "endsAt": "2026-10-23T07:45:00.000Z",
          "time": "10:00", "special": true, "forStudentId": 1 }
      ]
    }
  ]
}
```
- מציגים יום אחרי יום. כל `slot` הוא כפתור עם `time`. אם `slots` ריק, מציגים "אין זמנים פנויים".
- `special: true` מסמן זמן מיוחד, ואפשר להציג אותו עם ⭐.
- "שבוע הבא" ו"שבוע קודם" מזיזים את `from` ואת `to` ב-7 ימים. אפשר לבקש עד 31 ימים בפעם אחת.
- השרת מחזיר רק זמנים עתידיים, עד 4 שבועות קדימה.

**שלב ב: שליחת בקשה**
```http
POST /api/lessons
{ "startsAt": "2026-10-18T13:00:00.000Z", "parentNote": "לא חובה" }
```
- שולחים את `startsAt` **בדיוק** כמו שהתקבל מהזמנים הפנויים.
- **אין** לשלוח `studentId`. השרת יודע מי התלמיד לפי ה-Token.
- **201**: הבקשה נשלחה, בסטטוס `PENDING`.
- **409 `SLOT_NOT_AVAILABLE`**: מישהו קבע את השעה רגע לפני. מציגים את ההודעה ומרעננים את הזמנים הפנויים.

#### 5. שינוי סיסמה
```http
POST /api/auth/change-password
{ "currentPassword": "Student123!", "newPassword": "NewPass123" }
```
מחזיר **204** בלי גוף. ‏400 עם `WRONG_PASSWORD` פירושו שהסיסמה הנוכחית שגויה.

---

## 9. טיפים לבדיקה

- **משתמשי הדגמה** (בפיתוח): `teacher` / `Teacher123!`, `cohen.dani` / `Student123!`, `levi.noa` / `Student123!`
- בדקו כל מסך גם כמורה וגם כהורה, ונסו לגשת לדברים שאסור (למשל `/api/students/2` כשמחוברים כ-`cohen.dani`). השרת צריך להחזיר 403.
- **CORS:** אם ה-React רץ על `http://localhost:5173` והשרת בענן, ודאו ש-`CORS_ORIGINS` ב-Render כולל את הכתובת הזו, או שהערך הוא `*`.
