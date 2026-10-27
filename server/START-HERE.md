# 🚀 מתחילים כאן: העלאת השרת לאינטרנט

המדריך הזה מיועד למי שמעולם לא העלתה שרת לאינטרנט. עוברים עליו לפי הסדר.
בסוף יהיה לך שרת שעובד באינטרנט, עם כתובת שאפשר לחבר אליה את ה-React.

**איך זה בנוי:**

```
GitHub  (שמירת הקוד)  ──►  Render  (מריץ את השרת)  ──►  Neon  (מסד הנתונים)
```

**כל השירותים במדריך חינמיים**, ואף אחד מהם לא אמור לבקש כרטיס אשראי. במסלולים החינמיים יש מגבלות, שמפורטות בסוף המדריך.

> ⚠️ **הערה חשובה:** אתרי האינטרנט משנים מדי פעם את העיצוב ואת שמות הכפתורים. שמות הכפתורים במדריך נכונים לפי המידע שהיה לי, אבל לא יכולתי לבדוק כל מסך בעצמי. אם כפתור נקרא קצת אחרת, חפשי כפתור עם משמעות דומה.

**זמן משוער:** שעה עד שעתיים בפעם הראשונה.

---

## חלק א: GitHub (שמירת הקוד)

### 1. פתיחת חשבון
1. נכנסים ל-**https://github.com**
2. לוחצים **Sign up**.
3. ממלאים אימייל, סיסמה ושם משתמש, ומאשרים את האימייל לפי ההוראות שנשלחות.

### 2. יצירת Repository (מאגר לקוד)
1. אחרי ההתחברות לוחצים על **+** בפינה הימנית העליונה ← **New repository**.
2. **Repository name**: `lesson-diary-backend`
3. בוחרים **Private** (פרטי) או **Public** (ציבורי). שניהם עובדים עם Render.
4. **לא** מסמנים "Add a README file", כי יש לנו README משלנו.
5. לוחצים **Create repository**.

### 3. חילוץ קובץ ה-ZIP
1. מורידים את קובץ ה-ZIP למחשב.
2. **Windows:** לחיצה ימנית על הקובץ ← **Extract All** (חילוץ הכל) ← **Extract**.
   **Mac:** לחיצה כפולה על הקובץ.
3. נוצרת תיקייה בשם `backend-project`. נכנסים אליה. אמורים לראות בה, בין השאר, את `package.json`, `src`, `prisma` ואת הקובץ הזה.

> 🍎 **ב-Mac:** קבצים ששמם מתחיל בנקודה (כמו `.gitignore` ו-`.env.example`) מוסתרים. כדי לראות אותם, לוחצים בתוך התיקייה **Cmd + Shift + .** (נקודה).

### 4. העלאת הקבצים דרך הדפדפן
1. בדף ה-Repository החדש לוחצים על הקישור **uploading an existing file**.
   (או: **Add file** ← **Upload files**.)
2. **חשוב מאוד:** בוחרים את **כל מה שבתוך** התיקייה `backend-project`, ולא את התיקייה עצמה. מסמנים הכל (Ctrl+A ב-Windows, Cmd+A ב-Mac) וגוררים לחלון הדפדפן.
   - צריך לגרור גם את התיקיות `src`, `prisma`, `tests`, `docs`, `scripts`. הדפדפן שומר על מבנה התיקיות.
   - צריך לגרור גם את הקבצים שמתחילים בנקודה: `.gitignore`, `.env.example`, `.env.test.example`, `.node-version`.
3. מחכים שכל הקבצים יסיימו לעלות (ברשימה מופיע כל קובץ).
4. למטה, ב-**Commit changes**, לוחצים על הכפתור הירוק **Commit changes**.

### 5. בדיקה שהקבצים במקום
בדף הראשי של ה-Repository צריך לראות **ישר** (לא בתוך תיקייה נוספת):
- `package.json`
- `render.yaml`
- התיקיות `src`, `prisma`, `tests`, `docs`

ובתוך `prisma/migrations` שתי תיקיות שמתחילות ב-`2026...`.

אם רואים רק תיקייה אחת בשם `backend-project`, העליתן את התיקייה עצמה במקום את התוכן שלה. אפשר למחוק את ה-Repository ‏(**Settings** ← למטה **Delete this repository**) ולנסות שוב, או לקרוא בחלק ה' על **Root Directory**.

---

## חלק ב: מסד נתונים חינמי (Neon)

**למה לא מסד הנתונים של Render?** כי מסד הנתונים החינמי של Render **נמחק אחרי 30 יום**. ב-Neon המסלול החינמי קבוע.

### 1. פתיחת חשבון
1. נכנסים ל-**https://neon.com**
2. לוחצים **Sign up**. הכי פשוט להירשם עם חשבון ה-GitHub: **Continue with GitHub**.

### 2. יצירת מסד נתונים
1. כשנפתח מסך יצירת פרויקט (Create project):
   - **Project name**: `lesson-diary`
   - **Region** (מיקום השרת): בוחרים אזור קרוב, למשל **Europe (Frankfurt)**.
   - את שאר ההגדרות משאירים כמו שהן.
2. לוחצים **Create project**.

### 3. קבלת כתובת החיבור (Connection String)
1. בדף הפרויקט לוחצים **Connect** (או **Connection Details**).
2. אם יש מתג **Connection pooling**, **מכבים** אותו. צריך את הכתובת הרגילה (direct), כי היא מתאימה גם להרצת migrations.
3. מעתיקים את הכתובת. היא נראית בערך כך:
   ```
   postgresql://neondb_owner:XXXXXXXX@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### 4. שמירה בטוחה
- הכתובת כוללת סיסמה. **אסור** לשים אותה בקוד, ב-GitHub או בצ'אט.
- שומרים אותה זמנית בקובץ טקסט פרטי במחשב. היא תוזן רק ב-Render, בהגדרות המוסתרות.

### 5. חיבור השרת למסד הנתונים
החיבור נעשה בחלק ג', כשמזינים את הכתובת במשתנה `DATABASE_URL`. השרת יוצר את כל הטבלאות **לבד** בעלייה הראשונה, דרך Prisma Migrations.

---

## חלק ג: Render (הרצת השרת)

### 1. פתיחת חשבון
1. נכנסים ל-**https://render.com**
2. לוחצים **Get Started** או **Sign Up** ← **GitHub**. כך החשבון כבר מחובר ל-GitHub.

### 2. חיבור GitHub
אם נרשמתן עם GitHub, החיבור כבר קיים. כשיוצרים שירות, Render יבקש הרשאה למאגרים. אפשר לאשר גישה **רק** למאגר `lesson-diary-backend` (**Only select repositories**).

### 3. יצירת Web Service
1. בלוח הבקרה (Dashboard) לוחצים **New +** ← **Web Service**.
2. בוחרים את המאגר **lesson-diary-backend** ← **Connect**.

### 4. בחירת המאגר והגדרות בסיסיות
| שדה | ערך |
|---|---|
| **Name** | `lesson-diary-api` (השם יופיע בכתובת האתר) |
| **Language / Runtime** | `Node` |
| **Branch** | `main` |
| **Region** | `Frankfurt (EU Central)` (קרוב ל-Neon) |
| **Root Directory** | להשאיר **ריק** |

### 5. Build ו-Start
| שדה | ערך (להעתיק בדיוק) |
|---|---|
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm run start:render` |
| **Instance Type** | **Free** |

### 6. משתני סביבה (Environment Variables)
גוללים ל-**Environment Variables** ולוחצים **Add Environment Variable** לכל שורה:

| NAME | VALUE |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | הכתובת שהעתקתן מ-Neon |
| `JWT_SECRET` | מחרוזת אקראית ארוכה, לפחות 32 תווים. אפשר ללחוץ **Generate** אם יש כפתור כזה, או להקליד משהו ארוך כמו `k3P9x...` (40 תווים מעורבבים) |
| `SEED_TEACHER_USERNAME` | שם המשתמש של המורה, למשל `teacher` |
| `SEED_TEACHER_PASSWORD` | סיסמה חזקה למורה, לפחות 8 תווים. **שומרים אותה!** |
| `CORS_ORIGINS` | `*` (אחרי שיהיה אתר React, כדאי לשים כאן את הכתובת שלו) |

**לא חובה, אבל מומלץ להצגת הפרויקט:** כדי שיהיו בענן נתוני הדגמה (4 תלמידים, שיעורים ודוחות), מוסיפים:

| NAME | VALUE |
|---|---|
| `SEED_DEMO_DATA` | `true` |
| `SEED_DEMO_PASSWORD` | סיסמה לכל תלמידי ההדגמה, לפחות 8 תווים |

שמות התלמידים להתחברות: `cohen.dani`, `cohen.yossi`, `levi.noa`. התלמיד `mizrahi.avi` מושבת.

### 7. הפעלת Prisma Migrations
**אין צורך לעשות כלום.** פקודת ה-Start ‏(`npm run start:render`) מריצה בכל עלייה:
1. `prisma migrate deploy`: יוצרת את הטבלאות ומעדכנת אותן, בלי למחוק נתונים.
2. יצירת חשבון המורה, אם עדיין אין מורה.
3. הפעלת השרת.

### 8. Deploy
1. ב-**Advanced** (אם מופיע) אפשר לרשום ב-**Health Check Path** את הערך `/api/health`.
2. לוחצים **Deploy Web Service** (או **Create Web Service**).
3. נפתח מסך **Logs**. הבנייה לוקחת כמה דקות. בסיום אמורים להופיע:
   ```
   ✅ Teacher account "teacher" created.
   ✅ Lesson Diary API is running on port 10000
   ```
   ולמעלה הסטטוס **Live**.

> 💡 **דרך חלופית:** Render יודע לקרוא את הקובץ `render.yaml` שבפרויקט: **New +** ← **Blueprint** ← בוחרים את המאגר. הוא ימלא את רוב ההגדרות לבד, וישאל רק על הערכים הסודיים.

### 9. בדיקה שהשרת פעיל
למעלה בדף השירות מופיעה הכתובת שלו, למשל:
```
https://lesson-diary-api.onrender.com
```
פותחים בדפדפן:
```
https://lesson-diary-api.onrender.com/api/health
```
צריך לראות:
```json
{"status":"ok","database":"ok","time":"..."}
```

> 😴 **השרת "ישן":** במסלול החינמי, אחרי 15 דקות בלי שימוש השרת נרדם. הפנייה הבאה תיקח בערך דקה, ואחר כך הכל מהיר. זה תקין. לפני הצגת הפרויקט, פתחו את `/api/health` כמה דקות מראש.

---

## חלק ד: בדיקה דרך Swagger

### 1. פתיחת `/api/health`
כבר עשינו בחלק ג'. ✔️

### 2. פתיחת Swagger
```
https://lesson-diary-api.onrender.com/api-docs
```
נפתח דף עם כל ה-Endpoints, מחולקים לקבוצות (Auth, Students, Lessons...).

### 3. התחברות מתוך Swagger
1. פותחים **POST /api/auth/login** ← **Try it out**.
2. בתיבה כותבים:
   ```json
   { "username": "teacher", "password": "הסיסמה שהגדרתן ב-SEED_TEACHER_PASSWORD" }
   ```
3. לוחצים **Execute**.

### 4. קבלת ה-JWT
בתשובה (**Response body**) מופיע `"token": "eyJhbGciOi..."`. מעתיקים את הטקסט שבין המרכאות, בלי המרכאות.

### 5. Authorize
1. למעלה בדף לוחצים על הכפתור **Authorize** 🔓.
2. מדביקים את ה-Token, בלי המילה Bearer.
3. **Authorize** ← **Close**. המנעולים נסגרים 🔒.

### 6. קריאה ל-Endpoint מוגן
פותחים **GET /api/auth/me** ← **Try it out** ← **Execute**. אמורים לקבל את פרטי המורה עם `"role": "TEACHER"`.

**בדיקת שגיאות:** לוחצים **Authorize** ← **Logout** ומריצים שוב. מתקבל **401**. מתחברים כתלמיד ומנסים **GET /api/students**. מתקבל **403**.

### 7. הוספת רשומה
1. **PUT /api/working-hours** ← Try it out ← השאירו את הדוגמה ← **Execute**. כך נקבעות שעות העבודה.
2. **POST /api/students** ← Try it out ← השאירו את הדוגמה (התלמידה נועה לוי). אם הפעלתן נתוני הדגמה, החליפו את `username` ל-`levi.noa2` ← **Execute**.
   מתקבל **201** עם פרטי התלמידה.

### 8. שליפת הרשומה ממסד הנתונים
**GET /api/students** ← Try it out ← **Execute**. התלמידה החדשה מופיעה ברשימה. המידע נשמר ב-Neon, ונשאר גם אחרי שהשרת נרדם או מופעל מחדש.

אפשר גם לראות את הטבלאות עצמן: ב-Neon ← **Tables** (או **SQL Editor** ← `SELECT * FROM "Student";`).

---

## חלק ה: פתרון תקלות

| התקלה | מה רואים | הפתרון |
|---|---|---|
| **Build Failed** | בלוג: `npm error` או `tsc` עם שגיאה | ודאו שה-Build Command הוא בדיוק `npm install --include=dev && npm run build`, ושב-GitHub הקובץ `package.json` נמצא בשורש המאגר. אם בלוג יש שגיאת TypeScript, העתיקו אותה ובקשו עזרה. |
| **הקבצים בתוך תיקייה נוספת** | בלוג: `Could not read package.json` | ב-Render ← **Settings** ← **Root Directory**: כתבו `backend-project` ← שמירה ← **Manual Deploy**. |
| **DATABASE_URL שגוי** | בלוג: `P1001: Can't reach database server` או `P1000: Authentication failed` | העתיקו שוב את הכתובת מ-Neon, בלי רווחים ובלי מרכאות. ודאו שמסתיים ב-`sslmode=require`. ב-Render ← **Environment** ← עדכון ← **Save Changes**. |
| **DATABASE_URL חסר** | בלוג: `DATABASE_URL is required` או `Environment variable not found: DATABASE_URL` | הוסיפו את המשתנה ב-**Environment**. |
| **בעיית Prisma עם channel_binding** | בלוג: שגיאה על `channel_binding` | בכתובת מ-Neon מחקו את החלק `&channel_binding=require` והשאירו `?sslmode=require`. |
| **בעיית Prisma Migrations** | בלוג: `P3009` או `migrate found failed migrations` | בדרך כלל זה קורה אחרי ניסיון קודם שנכשל. ב-Neon אפשר למחוק את הטבלאות (SQL Editor: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`) ולעשות **Manual Deploy**. ⚠️ זה מוחק את כל הנתונים. |
| **JWT_SECRET חסר או קצר** | בלוג: `JWT_SECRET must be at least 32 characters` | הוסיפו `JWT_SECRET` ארוך (32 תווים ומעלה). |
| **אין חשבון מורה** | בלוג: `No teacher account exists` | הוסיפו `SEED_TEACHER_USERNAME` ו-`SEED_TEACHER_PASSWORD` (8 תווים ומעלה) ← שמירה. השרת יופעל מחדש וייצור את החשבון. |
| **שגיאת CORS** | ב-React, בקונסול הדפדפן: `blocked by CORS policy` | ב-`CORS_ORIGINS` רשמו את כתובת אתר ה-React בדיוק, בלי `/` בסוף, למשל `http://localhost:5173`. כמה כתובות מפרידים בפסיק. לבדיקה מהירה אפשר `*`. |
| **401** | `TOKEN_MISSING`, `TOKEN_INVALID` או `TOKEN_EXPIRED` | לא נשלח Token, או שהועתק לא נכון (בלי מרכאות, בלי Bearer ב-Swagger), או שפג תוקפו אחרי 8 שעות. התחברו מחדש. |
| **403** | `FORBIDDEN`, `ACCOUNT_DISABLED` או `FIELD_NOT_ALLOWED` | הפעולה לא מותרת לתפקיד הזה, למשל תלמיד שמנסה לראות תלמיד אחר, או שהחשבון הושבת. זו התנהגות נכונה. |
| **Swagger לא נפתח** | דף ריק או 404 | ודאו שהכתובת היא `/api-docs` (עם מקף). אם השרת ישן, חכו דקה ורעננו. |
| **השרת לא עולה** | הסטטוס **Failed** או **Deploy failed** | ב-**Logs** חפשו את השורה הראשונה עם `❌` או `Error`. בדרך כלל זה משתנה סביבה חסר (ראו למעלה). |
| **הכל איטי בפעם הראשונה** | הדף נטען בערך דקה | זה תקין, השרת "התעורר" מהשינה. |
| **אזהרה על `package.json#prisma` deprecated** | שורה צהובה בלוג | זו רק אזהרה לגבי גרסה עתידית של Prisma. אפשר להתעלם, השרת עובד. |

---

## חלק ו: מגבלות המסלולים החינמיים

- **Render Free:** השרת נרדם אחרי 15 דקות בלי שימוש ומתעורר תוך בערך דקה. יש 750 שעות ריצה בחודש, וזה מספיק לשרת אחד. אין גישה ל-Shell, ולכן ה-migrations רצים אוטומטית בעלייה.
- **Neon Free:** בערך 1GB אחסון לפרויקט, הרבה יותר ממה שהפרויקט צריך. המסד "נרדם" אחרי כמה דקות ומתעורר לבד בפנייה הבאה.
- התנאים של השירותים עשויים להשתנות. אם אחד השירותים כבר לא חינמי, חלופות נפוצות לשרת הן **Koyeb** או **Railway** (באותן הגדרות Build ו-Start), ולמסד הנתונים **Supabase**. ב-Supabase משתמשים בכתובת **Session pooler**.

---

## נספח: הרצת הבדיקות האוטומטיות מהדפדפן (לא חובה)

כל 78 הבדיקות האוטומטיות כבר הורצו ועברו לפני שהפרויקט נמסר. הנספח הזה מיועד רק למי שרוצה להריץ אותן בעצמה, למשל אחרי שינוי בקוד, בלי להתקין כלום במחשב:

1. **ב-Neon:** פתחו **מסד נתונים נוסף לבדיקות**. בפרויקט ← **Databases** ← **New Database** ← שם: `lesson_diary_test`. העתיקו את כתובת החיבור שלו.
   ⚠️ השם חייב לכלול `test`. הבדיקות מוחקות את הנתונים במסד הזה, ולכן לעולם לא משתמשים בכתובת של המסד הראשי.
2. **ב-GitHub**, בדף המאגר: **Code** (הכפתור הירוק) ← לשונית **Codespaces** ← **Create codespace on main**. נפתח עורך קוד בדפדפן.
3. בחלון ה-Terminal למטה מקלידים, שורה אחרי שורה:
   ```bash
   npm install
   echo 'TEST_DATABASE_URL="הכתובת של lesson_diary_test"' > .env.test
   npm run typecheck
   npm test
   ```
4. בסוף אמורה להופיע השורה `Tests  78 passed (78)`.
5. בסיום סוגרים את ה-Codespace (בדף **github.com/codespaces** ← **Delete**), כדי לא לנצל את השעות החינמיות.
