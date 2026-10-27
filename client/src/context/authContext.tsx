import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "../types/auth"
import { getMe, logOut } from "../api/auth"
import { getToken } from "../api/api"
import { useQueryClient } from "@tanstack/react-query"

type AuthContextValue={
    user:User|null,
    setUser:(user:User|null)=>void,
    logout:()=>void
    isLoading:boolean
}
const AuthContext=createContext<AuthContextValue|undefined>(undefined)
export const AuthProvider=({children}:{children: ReactNode})=>{
    const [user,setUser]=useState<User|null>(null)
    const [isLoading,setLoading]=useState(getToken()!==null)
    const  queryClient=useQueryClient()
    useEffect(()=>{
        if(!isLoading){
            return
        }
         getMe().then((user=>setUser(user))).catch(()=>{}).finally(()=>setLoading(false))
    },[])
    const logout=()=>{
        logOut();
        queryClient.clear();
        setUser(null)
    }
    return <AuthContext.Provider value={{user,setUser,logout,isLoading}}>{children}</AuthContext.Provider>
}
export function useAuth(){
    const context=useContext(AuthContext)
    if(!context){
        throw new Error("useAuth must be used inside AuthProvider")
    }
    return context
}