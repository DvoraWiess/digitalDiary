/**
 * תיעוד OpenAPI 3 של כל ה-API. מוצג ב-Swagger UI בכתובת /api-docs
 * וזמין כ-JSON בכתובת /openapi.json (וגם בקובץ docs/openapi.json).
 */

type Json = Record<string, unknown>;

const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` });
const errRef = (name: string): Json => ({ $ref: `#/components/responses/${name}` });

const jsonBody = (schema: Json, example?: unknown, description?: string): Json => ({
  required: true,
  ...(description ? { description } : {}),
  content: { 'application/json': { schema, ...(example !== undefined ? { example } : {}) } },
});

const ok = (description: string, schema: Json, example?: unknown): Json => ({
  description,
  content: { 'application/json': { schema, ...(example !== undefined ? { example } : {}) } },
});

const bearer = [{ bearerAuth: [] }];

const idParam = (description: string): Json => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
  example: 1,
});

const authErrors = { '401': errRef('Unauthorized') };
const teacherErrors = { '401': errRef('Unauthorized'), '403': errRef('Forbidden') };

// ---------- דוגמאות ----------

const exampleStudentTeacherView = {
  id: 1,
  username: 'cohen.dani',
  firstName: 'דני',
  lastName: 'כהן',
  age: 7,
  gradeText: "כיתה ב'",
  readingLevel: 'BASIC',
  goals: 'שטף קריאה, הבנת הנקרא',
  schoolTeacherName: 'המורה רחל',
  schoolTeacherPhone: '050-1111111',
  parentName: 'שרה כהן',
  parentPhone: '052-2222222',
  isActive: true,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-10-10T08:00:00.000Z',
  teacherNotes: 'מתקשה באותיות דומות (ב/כ). לחזק בכל שיעור.',
};

const exampleLesson = {
  id: 12,
  studentId: 1,
  student: { id: 1, firstName: 'דני', lastName: 'כהן' },
  startsAt: '2026-10-18T13:00:00.000Z',
  endsAt: '2026-10-18T13:45:00.000Z',
  status: 'PENDING',
  parentNote: 'נשמח אם אפשר להתמקד בקריאה בקול',
  statusReason: null,
  cancelledByRole: null,
  hasReport: false,
  createdAt: '2026-10-14T19:00:00.000Z',
  updatedAt: '2026-10-14T19:00:00.000Z',
};

const exampleReport = {
  id: 5,
  lessonId: 10,
  attendance: 'ATTENDED',
  topicsCovered: 'קריאת סיפור קצר, תרגול ניקוד קמץ ופתח',
  behavior: 'GOOD',
  behaviorNote: 'היה מרוכז רוב השיעור',
  previousHomework: 'PARTIAL',
  homeworkAssigned: 'לקרוא עמוד 12 בקול פעמיים',
  extraLessonRecommended: false,
  extraLessonNote: null,
  createdAt: '2026-10-11T14:00:00.000Z',
  updatedAt: '2026-10-11T14:00:00.000Z',
  nextLessonPlan: 'לחזור על סגול וצירה',
};

// ---------- המסמך ----------

export const openapiDocument: Json = {
  openapi: '3.0.3',
  info: {
    title: 'Lesson Diary API - יומן שיעורים',
    version: '1.0.0',
    description: [
      'שרת ליומן שיעורים פרטיים: מורה וחשבונות תלמידים (ההורה משתמש בחשבון של התלמיד).',
      '',
      '**איך מתחילים:**',
      '1. פתחו את `POST /api/auth/login` ← Try it out ← שלחו שם משתמש וסיסמה.',
      '2. העתיקו את הערך של `token` מהתשובה.',
      '3. לחצו על הכפתור **Authorize** למעלה, הדביקו את ה-Token (בלי המילה Bearer) ← Authorize.',
      '4. מעכשיו אפשר לנסות את כל ה-Endpoints המוגנים.',
      '',
      'כל השעות ב-API הן ב-UTC (ISO 8601). תאריכים בפרמטרים (from/to) הם תאריכים מקומיים בשעון ישראל בפורמט YYYY-MM-DD.',
      '',
      'מבנה שגיאה קבוע: `{ "error": { "code": "...", "message": "...", "details": [...] } }`',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'השרת הנוכחי' }],
  tags: [
    { name: 'System', description: 'בדיקת שרת' },
    { name: 'Auth', description: 'התחברות ופרטי המשתמש המחובר' },
    { name: 'Students', description: 'תלמידים' },
    { name: 'Schedule', description: 'שעות עבודה וזמנים מיוחדים של המורה' },
    { name: 'Availability', description: 'זמנים פנויים לקביעת שיעור' },
    { name: 'Lessons', description: 'שיעורים: בקשה, אישור, דחייה, ביטול' },
    { name: 'Reports', description: 'דוחות שיעור' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'הדביקו כאן את ה-token שקיבלתם מ-POST /api/auth/login',
      },
    },
    responses: {
      ValidationError: {
        description: 'הנתונים שנשלחו אינם תקינים',
        content: {
          'application/json': {
            schema: ref('Error'),
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'הנתונים שנשלחו אינם תקינים',
                details: [{ field: 'age', message: 'הגיל חייב להיות בין 3 ל-18' }],
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'אין Token, ה-Token לא תקין, או שפג תוקפו',
        content: {
          'application/json': {
            schema: ref('Error'),
            example: { error: { code: 'TOKEN_MISSING', message: 'חסר Token. יש להתחבר ולשלוח Authorization: Bearer <token>' } },
          },
        },
      },
      Forbidden: {
        description: 'אין הרשאה (תפקיד לא מתאים, מידע של תלמיד אחר, או חשבון מושבת)',
        content: {
          'application/json': {
            schema: ref('Error'),
            example: { error: { code: 'FORBIDDEN', message: 'אין לך הרשאה לבצע פעולה זו' } },
          },
        },
      },
      NotFound: {
        description: 'לא נמצא',
        content: {
          'application/json': {
            schema: ref('Error'),
            example: { error: { code: 'NOT_FOUND', message: 'המשאב המבוקש לא נמצא' } },
          },
        },
      },
      Conflict: {
        description: 'הפעולה לא אפשרית במצב הנוכחי (שעה תפוסה, סטטוס לא מתאים, ביטול מאוחר וכו׳)',
        content: {
          'application/json': {
            schema: ref('Error'),
            example: {
              error: {
                code: 'SLOT_NOT_AVAILABLE',
                message: 'השעה שנבחרה אינה פנויה. רעננו את רשימת הזמנים הפנויים ובחרו שעה אחרת',
              },
            },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'הנתונים שנשלחו אינם תקינים' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      Role: { type: 'string', enum: ['TEACHER', 'STUDENT'] },
      ReadingLevel: {
        type: 'string',
        enum: ['BEGINNER', 'BASIC', 'ADVANCED', 'FLUENT'],
        description: 'BEGINNER=מתחיל, BASIC=בסיסי, ADVANCED=מתקדם, FLUENT=שוטף',
      },
      LessonStatus: {
        type: 'string',
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
        description: 'PENDING=ממתין לאישור, APPROVED=מאושר, REJECTED=נדחה, CANCELLED=בוטל, COMPLETED=התקיים, NO_SHOW=לא הגיע',
      },
      Attendance: { type: 'string', enum: ['ATTENDED', 'NO_SHOW'] },
      Behavior: {
        type: 'string',
        enum: ['EXCELLENT', 'GOOD', 'AVERAGE', 'DIFFICULT'],
        description: 'EXCELLENT=מצוינת, GOOD=טובה, AVERAGE=בינונית, DIFFICULT=קשה',
      },
      HomeworkStatus: {
        type: 'string',
        enum: ['DONE', 'PARTIAL', 'NOT_DONE', 'NONE_GIVEN'],
        description: 'DONE=הכין, PARTIAL=חלקית, NOT_DONE=לא הכין, NONE_GIVEN=לא ניתנו שיעורי בית',
      },
      Student: {
        type: 'object',
        description: 'תלמיד. השדה teacherNotes מוחזר רק למורה.',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          age: { type: 'integer', minimum: 3, maximum: 18 },
          gradeText: { type: 'string', nullable: true },
          readingLevel: ref('ReadingLevel'),
          goals: { type: 'string', nullable: true },
          schoolTeacherName: { type: 'string', nullable: true },
          schoolTeacherPhone: { type: 'string', nullable: true },
          parentName: { type: 'string' },
          parentPhone: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          teacherNotes: { type: 'string', nullable: true, description: 'רק למורה' },
        },
        example: exampleStudentTeacherView,
      },
      StudentCreate: {
        type: 'object',
        required: ['firstName', 'lastName', 'age', 'parentName', 'parentPhone', 'username', 'password'],
        properties: {
          firstName: { type: 'string', maxLength: 50 },
          lastName: { type: 'string', maxLength: 50 },
          age: { type: 'integer', minimum: 3, maximum: 18 },
          gradeText: { type: 'string', nullable: true, maxLength: 50 },
          readingLevel: ref('ReadingLevel'),
          goals: { type: 'string', nullable: true, maxLength: 1000 },
          schoolTeacherName: { type: 'string', nullable: true, maxLength: 100 },
          schoolTeacherPhone: { type: 'string', nullable: true },
          parentName: { type: 'string', minLength: 2, maxLength: 100 },
          parentPhone: { type: 'string', example: '052-2222222' },
          teacherNotes: { type: 'string', nullable: true, maxLength: 2000 },
          username: { type: 'string', pattern: '^[a-z0-9._-]{3,30}$', example: 'cohen.dani' },
          password: { type: 'string', minLength: 6 },
        },
      },
      StudentTeacherUpdate: {
        type: 'object',
        description: 'המורה: כל שדה אופציונלי, שולחים רק מה שמשתנים. חובה לפחות שדה אחד.',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          age: { type: 'integer', minimum: 3, maximum: 18 },
          gradeText: { type: 'string', nullable: true },
          readingLevel: ref('ReadingLevel'),
          goals: { type: 'string', nullable: true },
          schoolTeacherName: { type: 'string', nullable: true },
          schoolTeacherPhone: { type: 'string', nullable: true },
          parentName: { type: 'string' },
          parentPhone: { type: 'string' },
          teacherNotes: { type: 'string', nullable: true },
          username: { type: 'string' },
          isActive: { type: 'boolean', description: 'false = השבתת התלמיד (לא יוכל להתחבר)' },
        },
      },
      StudentSelfUpdate: {
        type: 'object',
        description: 'חשבון תלמיד (ההורה) רשאי לעדכן רק את השדות האלה. שדה אחר יחזיר 403.',
        properties: {
          gradeText: { type: 'string', nullable: true },
          schoolTeacherName: { type: 'string', nullable: true },
          schoolTeacherPhone: { type: 'string', nullable: true },
          parentPhone: { type: 'string' },
        },
      },
      Me: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          role: ref('Role'),
          student: { allOf: [ref('Student')], nullable: true, description: 'null עבור המורה' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT. שולחים בכותרת Authorization: Bearer <token>' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: { type: 'integer', description: 'תוקף בשניות', example: 28800 },
          user: ref('Me'),
        },
      },
      WorkingHours: {
        type: 'object',
        required: ['dayOfWeek', 'startTime', 'endTime'],
        properties: {
          id: { type: 'integer', readOnly: true },
          dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, description: '0=ראשון ... 6=שבת' },
          startTime: { type: 'string', example: '16:00', description: 'HH:mm, שעון ישראל' },
          endTime: { type: 'string', example: '19:00', description: 'HH:mm, שעון ישראל' },
        },
      },
      SpecialSlot: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          date: { type: 'string', format: 'date', example: '2026-10-23' },
          startTime: { type: 'string', example: '10:00' },
          endTime: { type: 'string', example: '11:00' },
          studentId: { type: 'integer', nullable: true, description: 'null = פתוח לכולם' },
          studentName: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SpecialSlotCreate: {
        type: 'object',
        required: ['date', 'startTime', 'endTime'],
        properties: {
          date: { type: 'string', format: 'date', example: '2026-10-23' },
          startTime: { type: 'string', example: '10:00' },
          endTime: { type: 'string', example: '11:00' },
          studentId: { type: 'integer', nullable: true, description: 'ריק/null = פתוח לכל התלמידים' },
        },
      },
      AvailableSlot: {
        type: 'object',
        properties: {
          startsAt: { type: 'string', format: 'date-time', description: 'את הערך הזה שולחים ב-POST /api/lessons' },
          endsAt: { type: 'string', format: 'date-time' },
          time: { type: 'string', example: '16:00', description: 'שעה מקומית להצגה' },
          special: { type: 'boolean', description: 'true = זמן מיוחד שהמורה פתחה' },
          forStudentId: { type: 'integer', nullable: true },
        },
      },
      AvailabilityResponse: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' },
          timeZone: { type: 'string', example: 'Asia/Jerusalem' },
          lessonDurationMinutes: { type: 'integer', example: 45 },
          bookingWindowDays: { type: 'integer', example: 28 },
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                dayOfWeek: { type: 'integer', description: '0=ראשון ... 6=שבת' },
                slots: { type: 'array', items: ref('AvailableSlot') },
              },
            },
          },
        },
      },
      Lesson: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          studentId: { type: 'integer' },
          student: {
            type: 'object',
            properties: { id: { type: 'integer' }, firstName: { type: 'string' }, lastName: { type: 'string' } },
          },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          status: ref('LessonStatus'),
          parentNote: { type: 'string', nullable: true },
          statusReason: { type: 'string', nullable: true, description: 'סיבת דחייה או ביטול' },
          cancelledByRole: { allOf: [ref('Role')], nullable: true, description: 'מי ביטל' },
          hasReport: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: exampleLesson,
      },
      LessonRequest: {
        type: 'object',
        required: ['startsAt'],
        properties: {
          startsAt: { type: 'string', format: 'date-time', description: 'ערך startsAt מתוך GET /api/availability' },
          parentNote: { type: 'string', nullable: true, maxLength: 500 },
        },
      },
      Reason: {
        type: 'object',
        properties: { reason: { type: 'string', nullable: true, maxLength: 500 } },
      },
      Report: {
        type: 'object',
        description: 'דוח שיעור. השדה nextLessonPlan מוחזר רק למורה.',
        properties: {
          id: { type: 'integer' },
          lessonId: { type: 'integer' },
          attendance: ref('Attendance'),
          topicsCovered: { type: 'string', nullable: true },
          behavior: { allOf: [ref('Behavior')], nullable: true },
          behaviorNote: { type: 'string', nullable: true },
          previousHomework: { allOf: [ref('HomeworkStatus')], nullable: true },
          homeworkAssigned: { type: 'string', nullable: true },
          extraLessonRecommended: { type: 'boolean' },
          extraLessonNote: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          nextLessonPlan: { type: 'string', nullable: true, description: 'רק למורה' },
        },
        example: exampleReport,
      },
      ReportInput: {
        type: 'object',
        required: ['attendance'],
        description:
          'כש-attendance=ATTENDED חובה גם topicsCovered, behavior, previousHomework. כש-NO_SHOW שאר השדות אופציונליים.',
        properties: {
          attendance: ref('Attendance'),
          topicsCovered: { type: 'string', nullable: true, maxLength: 2000 },
          behavior: { allOf: [ref('Behavior')], nullable: true },
          behaviorNote: { type: 'string', nullable: true, maxLength: 1000 },
          previousHomework: { allOf: [ref('HomeworkStatus')], nullable: true },
          homeworkAssigned: { type: 'string', nullable: true, maxLength: 2000 },
          nextLessonPlan: { type: 'string', nullable: true, maxLength: 2000 },
          extraLessonRecommended: { type: 'boolean', default: false },
          extraLessonNote: { type: 'string', nullable: true, maxLength: 1000 },
        },
      },
      StudentOverview: {
        type: 'object',
        properties: {
          student: ref('Student'),
          lastReport: {
            type: 'object',
            nullable: true,
            properties: { lesson: ref('Lesson'), report: ref('Report') },
          },
          nextLesson: { allOf: [ref('Lesson')], nullable: true },
          recentLessons: { type: 'array', items: ref('Lesson') },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'בדיקה שהשרת ומסד הנתונים פעילים',
        security: [],
        responses: {
          '200': ok(
            'השרת פעיל',
            { type: 'object', properties: { status: { type: 'string' }, database: { type: 'string' }, time: { type: 'string' } } },
            { status: 'ok', database: 'ok', time: '2026-10-14T19:00:00.000Z' },
          ),
          '503': ok(
            'אין חיבור למסד הנתונים',
            { type: 'object' },
            { status: 'error', database: 'unreachable', time: '2026-10-14T19:00:00.000Z' },
          ),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'התחברות - מחזיר JWT',
        security: [],
        requestBody: jsonBody(
          {
            type: 'object',
            required: ['username', 'password'],
            properties: { username: { type: 'string' }, password: { type: 'string' } },
          },
          { username: 'teacher', password: 'Teacher123!' },
          'בסביבת פיתוח (אחרי seed): מורה teacher / Teacher123!, תלמיד cohen.dani / Student123!',
        ),
        responses: {
          '200': ok('התחברות הצליחה', ref('LoginResponse')),
          '400': errRef('ValidationError'),
          '401': ok('שם משתמש או סיסמה שגויים', ref('Error'), {
            error: { code: 'INVALID_CREDENTIALS', message: 'שם משתמש או סיסמה שגויים' },
          }),
          '403': ok('החשבון הושבת', ref('Error'), {
            error: { code: 'ACCOUNT_DISABLED', message: 'החשבון הושבת. יש לפנות למורה' },
          }),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'פרטי המשתמש המחובר (כולל פרטי התלמיד בחשבון תלמיד)',
        security: bearer,
        responses: { '200': ok('המשתמש המחובר', ref('Me')), ...authErrors, '403': errRef('Forbidden') },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'שינוי סיסמה של המשתמש המחובר',
        security: bearer,
        requestBody: jsonBody(
          {
            type: 'object',
            required: ['currentPassword', 'newPassword'],
            properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } },
          },
          { currentPassword: 'Student123!', newPassword: 'MyNewPass1' },
        ),
        responses: {
          '204': { description: 'הסיסמה עודכנה' },
          '400': ok('הסיסמה הנוכחית שגויה או ולידציה', ref('Error')),
          ...authErrors,
        },
      },
    },
    '/api/students': {
      get: {
        tags: ['Students'],
        summary: 'רשימת תלמידים + חיפוש לפי שם (מורה בלבד)',
        description: 'ממוין: פעילים קודם, אחר כך לפי שם משפחה ושם פרטי.',
        security: bearer,
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'חיפוש בשם פרטי/משפחה. כמה מילים = כל מילה חייבת להופיע',
            schema: { type: 'string' },
            example: 'דני',
          },
        ],
        responses: { '200': ok('רשימת תלמידים', { type: 'array', items: ref('Student') }), ...teacherErrors },
      },
      post: {
        tags: ['Students'],
        summary: 'הוספת תלמיד חדש + חשבון כניסה (מורה בלבד)',
        security: bearer,
        requestBody: jsonBody(ref('StudentCreate'), {
          firstName: 'נועה',
          lastName: 'לוי',
          age: 8,
          gradeText: "כיתה ג'",
          readingLevel: 'BEGINNER',
          parentName: 'מירי לוי',
          parentPhone: '054-3333333',
          username: 'levi.noa',
          password: 'Noa12345',
        }),
        responses: {
          '201': ok('התלמיד נוצר', ref('Student')),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '409': ok('שם המשתמש תפוס', ref('Error'), {
            error: { code: 'USERNAME_TAKEN', message: 'שם המשתמש כבר תפוס. בחרו שם אחר, למשל עם ספרה בסוף' },
          }),
        },
      },
    },
    '/api/students/{id}': {
      get: {
        tags: ['Students'],
        summary: 'פרטי תלמיד (מורה, או חשבון התלמיד עצמו)',
        security: bearer,
        parameters: [idParam('מזהה התלמיד')],
        responses: {
          '200': ok('פרטי התלמיד (בלי teacherNotes לחשבון תלמיד)', ref('Student')),
          ...teacherErrors,
          '404': errRef('NotFound'),
        },
      },
      patch: {
        tags: ['Students'],
        summary: 'עריכת תלמיד',
        description:
          'מורה: כל השדות (StudentTeacherUpdate). חשבון תלמיד: רק gradeText, schoolTeacherName, schoolTeacherPhone, parentPhone - ורק לעצמו.',
        security: bearer,
        parameters: [idParam('מזהה התלמיד')],
        requestBody: jsonBody(
          { oneOf: [ref('StudentTeacherUpdate'), ref('StudentSelfUpdate')] },
          { gradeText: "כיתה ג'", schoolTeacherName: 'המורה אסתר', schoolTeacherPhone: '050-4444444' },
        ),
        responses: {
          '200': ok('התלמיד עודכן', ref('Student')),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '404': errRef('NotFound'),
          '409': ok('שם המשתמש תפוס', ref('Error')),
        },
      },
    },
    '/api/students/{id}/password': {
      patch: {
        tags: ['Students'],
        summary: 'איפוס סיסמה של תלמיד (מורה בלבד)',
        security: bearer,
        parameters: [idParam('מזהה התלמיד')],
        requestBody: jsonBody(
          { type: 'object', required: ['password'], properties: { password: { type: 'string', minLength: 6 } } },
          { password: 'NewPass123' },
        ),
        responses: {
          '204': { description: 'הסיסמה אופסה' },
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '404': errRef('NotFound'),
        },
      },
    },
    '/api/students/{id}/overview': {
      get: {
        tags: ['Students'],
        summary: 'תמונת מצב: פרטים, הדוח האחרון, השיעור הקרוב ו-10 שיעורים אחרונים',
        security: bearer,
        parameters: [idParam('מזהה התלמיד')],
        responses: { '200': ok('תמונת מצב', ref('StudentOverview')), ...teacherErrors, '404': errRef('NotFound') },
      },
    },
    '/api/working-hours': {
      get: {
        tags: ['Schedule'],
        summary: 'שעות העבודה השבועיות של המורה',
        security: bearer,
        responses: { '200': ok('שעות עבודה', { type: 'array', items: ref('WorkingHours') }), ...authErrors },
      },
      put: {
        tags: ['Schedule'],
        summary: 'החלפת כל שעות העבודה (מורה בלבד)',
        description: 'שולחים את כל הרשימה מחדש. שיעורים שכבר נקבעו לא משתנים.',
        security: bearer,
        requestBody: jsonBody(
          { type: 'object', required: ['hours'], properties: { hours: { type: 'array', items: ref('WorkingHours') } } },
          {
            hours: [
              { dayOfWeek: 0, startTime: '16:00', endTime: '19:00' },
              { dayOfWeek: 1, startTime: '16:00', endTime: '19:00' },
              { dayOfWeek: 3, startTime: '15:00', endTime: '18:00' },
            ],
          },
        ),
        responses: {
          '200': ok('שעות העבודה החדשות', { type: 'array', items: ref('WorkingHours') }),
          '400': errRef('ValidationError'),
          ...teacherErrors,
        },
      },
    },
    '/api/special-slots': {
      get: {
        tags: ['Schedule'],
        summary: 'רשימת זמנים מיוחדים (מורה בלבד)',
        security: bearer,
        parameters: [
          { name: 'from', in: 'query', required: false, schema: { type: 'string', format: 'date' }, example: '2026-10-18' },
          { name: 'to', in: 'query', required: false, schema: { type: 'string', format: 'date' }, example: '2026-11-15' },
        ],
        responses: {
          '200': ok('זמנים מיוחדים', { type: 'array', items: ref('SpecialSlot') }),
          '400': errRef('ValidationError'),
          ...teacherErrors,
        },
      },
      post: {
        tags: ['Schedule'],
        summary: 'הוספת זמן מיוחד - לכולם או לתלמיד מסוים (מורה בלבד)',
        security: bearer,
        requestBody: jsonBody(ref('SpecialSlotCreate'), {
          date: '2026-10-23',
          startTime: '10:00',
          endTime: '11:00',
          studentId: 1,
        }),
        responses: {
          '201': ok('הזמן המיוחד נוצר', ref('SpecialSlot')),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '404': errRef('NotFound'),
        },
      },
    },
    '/api/special-slots/{id}': {
      delete: {
        tags: ['Schedule'],
        summary: 'מחיקת זמן מיוחד (מורה בלבד)',
        security: bearer,
        parameters: [idParam('מזהה הזמן המיוחד')],
        responses: { '204': { description: 'נמחק' }, ...teacherErrors, '404': errRef('NotFound') },
      },
    },
    '/api/availability': {
      get: {
        tags: ['Availability'],
        summary: 'זמנים פנויים לקביעת שיעור, מקובצים לפי יום',
        description:
          'חשבון תלמיד: הזמנים של התלמיד שלו (כולל זמנים מיוחדים שנפתחו בשבילו). מורה: אפשר לשלוח studentId, בלי - כל הזמנים המיוחדים. טווח של עד 31 ימים. מוחזרים רק זמנים עתידיים בתוך חלון ההזמנה (ברירת מחדל 28 ימים).',
        security: bearer,
        parameters: [
          { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2026-10-18' },
          { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2026-10-24' },
          { name: 'studentId', in: 'query', required: false, description: 'למורה בלבד', schema: { type: 'integer' } },
        ],
        responses: {
          '200': ok('זמנים פנויים', ref('AvailabilityResponse'), {
            from: '2026-10-18',
            to: '2026-10-19',
            timeZone: 'Asia/Jerusalem',
            lessonDurationMinutes: 45,
            bookingWindowDays: 28,
            days: [
              {
                date: '2026-10-18',
                dayOfWeek: 0,
                slots: [
                  {
                    startsAt: '2026-10-18T13:00:00.000Z',
                    endsAt: '2026-10-18T13:45:00.000Z',
                    time: '16:00',
                    special: false,
                    forStudentId: null,
                  },
                ],
              },
              { date: '2026-10-19', dayOfWeek: 1, slots: [] },
            ],
          }),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '404': errRef('NotFound'),
        },
      },
    },
    '/api/lessons': {
      get: {
        tags: ['Lessons'],
        summary: 'רשימת שיעורים עם סינון לפי סטטוס וטווח תאריכים',
        description: 'מורה: כל השיעורים. חשבון תלמיד: רק השיעורים שלו. ממוין לפי זמן השיעור (מהמוקדם למאוחר).',
        security: bearer,
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            description: 'סטטוס אחד או כמה מופרדים בפסיק, למשל PENDING או PENDING,APPROVED',
            schema: { type: 'string' },
            example: 'PENDING',
          },
          {
            name: 'from',
            in: 'query',
            required: false,
            description: 'מתאריך (כולל), שעון ישראל',
            schema: { type: 'string', format: 'date' },
            example: '2026-10-18',
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            description: 'עד תאריך (כולל), שעון ישראל',
            schema: { type: 'string', format: 'date' },
            example: '2026-10-24',
          },
        ],
        responses: {
          '200': ok('רשימת שיעורים', { type: 'array', items: ref('Lesson') }),
          '400': errRef('ValidationError'),
          ...authErrors,
        },
      },
      post: {
        tags: ['Lessons'],
        summary: 'בקשה לשיעור חדש (חשבון תלמיד בלבד)',
        description:
          'startsAt חייב להיות אחד מהזמנים שמחזיר GET /api/availability. התלמיד נקבע לפי ה-Token. השיעור נוצר בסטטוס PENDING.',
        security: bearer,
        requestBody: jsonBody(ref('LessonRequest'), {
          startsAt: '2026-10-18T13:00:00.000Z',
          parentNote: 'נשמח אם אפשר להתמקד בקריאה בקול',
        }),
        responses: {
          '201': ok('הבקשה נשלחה', ref('Lesson')),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '409': errRef('Conflict'),
        },
      },
    },
    '/api/lessons/{id}': {
      get: {
        tags: ['Lessons'],
        summary: 'פרטי שיעור',
        security: bearer,
        parameters: [idParam('מזהה השיעור')],
        responses: { '200': ok('השיעור', ref('Lesson')), ...teacherErrors, '404': errRef('NotFound') },
      },
    },
    '/api/lessons/{id}/approve': {
      patch: {
        tags: ['Lessons'],
        summary: 'אישור בקשה (מורה בלבד)',
        security: bearer,
        parameters: [idParam('מזהה השיעור')],
        responses: {
          '200': ok('השיעור אושר', ref('Lesson')),
          ...teacherErrors,
          '404': errRef('NotFound'),
          '409': errRef('Conflict'),
        },
      },
    },
    '/api/lessons/{id}/reject': {
      patch: {
        tags: ['Lessons'],
        summary: 'דחיית בקשה (מורה בלבד, סיבה לא חובה)',
        security: bearer,
        parameters: [idParam('מזהה השיעור')],
        requestBody: { ...jsonBody(ref('Reason'), { reason: 'השעה הזו לא מתאימה לי השבוע' }), required: false },
        responses: {
          '200': ok('הבקשה נדחתה', ref('Lesson')),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '404': errRef('NotFound'),
          '409': errRef('Conflict'),
        },
      },
    },
    '/api/lessons/{id}/cancel': {
      patch: {
        tags: ['Lessons'],
        summary: 'ביטול שיעור',
        description:
          'מורה: חובה reason. חשבון תלמיד: רק שיעור שלו; בקשה ממתינה - בכל זמן; שיעור מאושר - עד 24 שעות לפני (אחרת 409 CANCEL_TOO_LATE).',
        security: bearer,
        parameters: [idParam('מזהה השיעור')],
        requestBody: { ...jsonBody(ref('Reason'), { reason: 'נא לקבוע מחדש, אני לא זמינה ביום רביעי' }), required: false },
        responses: {
          '200': ok('השיעור בוטל', ref('Lesson')),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '404': errRef('NotFound'),
          '409': ok('לא ניתן לבטל', ref('Error'), {
            error: {
              code: 'CANCEL_TOO_LATE',
              message: 'אפשר לבטל שיעור מאושר עד 24 שעות לפני תחילתו. לביטול מאוחר יש לפנות למורה',
            },
          }),
        },
      },
    },
    '/api/lessons/{id}/report': {
      get: {
        tags: ['Reports'],
        summary: 'צפייה בדוח שיעור',
        description: 'חשבון תלמיד רואה רק דוחות שלו, ובלי nextLessonPlan.',
        security: bearer,
        parameters: [idParam('מזהה השיעור')],
        responses: {
          '200': ok('הדוח', ref('Report')),
          ...teacherErrors,
          '404': ok('השיעור לא נמצא או שעדיין אין דוח', ref('Error'), {
            error: { code: 'REPORT_NOT_FOUND', message: 'עדיין לא נכתב דוח לשיעור זה' },
          }),
        },
      },
      put: {
        tags: ['Reports'],
        summary: 'כתיבה או עריכה של דוח שיעור (מורה בלבד)',
        description:
          'אפשר רק לשיעור מאושר שזמנו התחיל. מעדכן את סטטוס השיעור: ATTENDED -> COMPLETED, NO_SHOW -> NO_SHOW.',
        security: bearer,
        parameters: [idParam('מזהה השיעור')],
        requestBody: jsonBody(ref('ReportInput'), {
          attendance: 'ATTENDED',
          topicsCovered: 'קריאת סיפור קצר, תרגול ניקוד קמץ ופתח',
          behavior: 'GOOD',
          behaviorNote: 'היה מרוכז רוב השיעור',
          previousHomework: 'PARTIAL',
          homeworkAssigned: 'לקרוא עמוד 12 בקול פעמיים',
          nextLessonPlan: 'לחזור על סגול וצירה',
          extraLessonRecommended: true,
          extraLessonNote: 'כדאי להוסיף שיעור השבוע לפני המבחן בכיתה',
        }),
        responses: {
          '200': ok('הדוח נשמר', ref('Report')),
          '400': errRef('ValidationError'),
          ...teacherErrors,
          '404': errRef('NotFound'),
          '409': errRef('Conflict'),
        },
      },
    },
  },
};
