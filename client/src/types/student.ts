export type ReadingLevel = "BEGINNER" | "BASIC" | "ADVANCED" | "FLUENT";

export const readingLevelLabels: Record<ReadingLevel, string> = {
  BEGINNER: "מתחיל",
  BASIC: "בסיסי",
  ADVANCED: "מתקדם",
  FLUENT: "שוטף",
};

export type Student = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  age: number;
  gradeText: string | null;
  readingLevel: ReadingLevel;
  goals: string | null;
  schoolTeacherName: string | null;
  schoolTeacherPhone: string | null;
  parentName: string;
  parentPhone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherNotes?: string | null; 
};
export type NewStudent = {
  firstName: string;
  lastName: string;
  age: number;
  readingLevel: ReadingLevel;
  parentName: string;
  parentPhone: string;
  username: string;
  password: string;
  gradeText?: string;
  goals?: string;
  schoolTeacherName?: string;
  schoolTeacherPhone?: string;
  teacherNotes?: string;
};
export type StudentUpdate = {
  gradeText?: string;
  schoolTeacherName?: string;
  schoolTeacherPhone?: string;
  parentPhone?: string;
};