import type { NewStudent, Student, StudentUpdate } from "../types/student"
import request from "./api"
export const getStudents = (q?: string) => {
  return request<Student[]>('/students', { query: { q } })
}
export const createStudent = (data: NewStudent) =>
  request<Student>("/students", { method: "POST", body: data });
export const getStudent = (id: number) =>
  request<Student>(`/students/${id}`);

export const updateStudent = (id: number, data: StudentUpdate) =>
  request<Student>(`/students/${id}`, { method: "PATCH", body: data });
export const resetStudentPassword = (id: number, password: string) =>
  request<void>(`/students/${id}/password`, { method: "PATCH", body: { password } });