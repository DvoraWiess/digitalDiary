import type { Student } from "./student"

export type Role= 'TEACHER'|'STUDENT'
export type User={
    id:number
    role:Role
    username:string
    student:Student|null

    
}
export type LoginResponse={
    token:string
    user:User
}