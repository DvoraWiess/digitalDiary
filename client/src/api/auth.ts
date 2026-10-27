import type { LoginResponse, User } from "../types/auth"
import request, { clearToken, saveToken } from "./api"
export  const login=async(password:string,username:string)=>{
    const response=await request<LoginResponse>("/auth/login",{method:'POST',body:{username:username,password:password}})
    saveToken(response.token)
    return response.user
}
export const logOut=()=>{
    clearToken()
}
export const getMe=()=>{
   return  request<User>("/auth/me")
}
export const changePassword=(newPassword:string,currentPassword:string)=>{
    return request<void>("/auth/change-password",{method:'POST',body:{newPassword,currentPassword}})
}







