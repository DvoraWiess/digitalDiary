import type { Role } from "./auth";

export type LessonStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export const statusLabels: Record<LessonStatus, string> = {
  PENDING: 'ממתין',
  APPROVED: 'מאושר',
  REJECTED: 'נדחה',
  CANCELLED: 'בוטל',
  COMPLETED: 'התקיים',
  NO_SHOW: 'לא הגיע',
}


export type LessonStudent = {
  id: number;
  firstName: string;
  lastName: string;
};
export type Lesson = {
  id: number;
  studentId: number;
  student: LessonStudent;
  startsAt: string;            
  endsAt: string;
  status: LessonStatus;
  parentNote: string | null;
  statusReason: string | null; 
  cancelledByRole: Role | null;
  hasReport: boolean;
  createdAt: string;
  updatedAt: string;
};
export type NewLesson = {
  startsAt: string;
  parentNote?: string;
};