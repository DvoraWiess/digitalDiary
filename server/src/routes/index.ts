import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { health } from '../controllers/health.controller';
import * as lessons from '../controllers/lesson.controller';
import * as schedule from '../controllers/schedule.controller';
import * as students from '../controllers/student.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { asyncHandler as h } from '../utils/asyncHandler';

/**
 * כל ה-Endpoints של השרת. כולם תחת /api
 * authenticate = חובה Token, requireRole = רק לתפקיד מסוים
 */
export const apiRouter = Router();
const teacherOnly = requireRole('TEACHER');
const studentOnly = requireRole('STUDENT');

// בדיקת שרת (ציבורי)
apiRouter.get('/health', h(health));

// התחברות
apiRouter.post('/auth/login', h(auth.login));
apiRouter.get('/auth/me', authenticate, h(auth.me));
apiRouter.post('/auth/change-password', authenticate, h(auth.changePassword));

// תלמידים
apiRouter.get('/students', authenticate, teacherOnly, h(students.list));
apiRouter.post('/students', authenticate, teacherOnly, h(students.create));
apiRouter.get('/students/:id', authenticate, h(students.getOne));
apiRouter.patch('/students/:id', authenticate, h(students.update));
apiRouter.patch('/students/:id/password', authenticate, teacherOnly, h(students.resetPassword));
apiRouter.get('/students/:id/overview', authenticate, h(students.overview));

// שעות עבודה וזמנים מיוחדים
apiRouter.get('/working-hours', authenticate, h(schedule.listWorkingHours));
apiRouter.put('/working-hours', authenticate, teacherOnly, h(schedule.replaceWorkingHours));
apiRouter.get('/special-slots', authenticate, teacherOnly, h(schedule.listSpecialSlots));
apiRouter.post('/special-slots', authenticate, teacherOnly, h(schedule.createSpecialSlot));
apiRouter.delete('/special-slots/:id', authenticate, teacherOnly, h(schedule.deleteSpecialSlot));

// זמנים פנויים
apiRouter.get('/availability', authenticate, h(schedule.availability));

// שיעורים
apiRouter.get('/lessons', authenticate, h(lessons.list));
apiRouter.post('/lessons', authenticate, studentOnly, h(lessons.request));
apiRouter.get('/lessons/:id', authenticate, h(lessons.getOne));
apiRouter.patch('/lessons/:id/approve', authenticate, teacherOnly, h(lessons.approve));
apiRouter.patch('/lessons/:id/reject', authenticate, teacherOnly, h(lessons.reject));
apiRouter.patch('/lessons/:id/cancel', authenticate, h(lessons.cancel));

// דוח שיעור
apiRouter.get('/lessons/:id/report', authenticate, h(lessons.getReport));
apiRouter.put('/lessons/:id/report', authenticate, teacherOnly, h(lessons.putReport));
