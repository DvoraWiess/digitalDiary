import type { Lesson, LessonStatus, NewLesson } from "../types/lesson";
import request from "./api";

export const getLessons=(filters:{status?:LessonStatus,from?:string,to?:string})=>{
    return request<Lesson[]>('/lessons',{query:filters})
}
export const approveLesson=(id:number)=>{
    return request<Lesson>(`/lessons/${id}/approve`,{method:'PATCH'})
}
 export const rejectLesson=(id:number,reason:string)=>{
    return request<Lesson>(`/lessons/${id}/reject`,{method:'PATCH',body:{reason}})
}
export const cancelLesson=(id:number,reason:string)=>{
    return request<Lesson>(`/lessons/${id}/cancel`,{method:'PATCH',body:{reason}})
}
export const createLesson = (data: NewLesson) =>
  request<Lesson>("/lessons", { method: "POST", body: data });
