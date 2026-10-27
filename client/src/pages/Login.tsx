import { useForm } from "react-hook-form";
import { login } from "../api/auth";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import type { User } from "../types/auth";
import type { ApiError } from "../api/api";
import {  useAuth } from "../context/authContext";
import {  useNavigate } from "react-router-dom";

const loginSchema=yup.object({
    passWord:yup.string().required("יש להכניס סיסמה"),
    userName:yup.string().required("יש להכניס שם משתמש")
})
  type LoginForm={
        passWord:string,
        userName:string
    }
const Login=()=>{
   const {setUser}=useAuth()
   const navigate=useNavigate()
    const{
        register,
        handleSubmit,
        formState:{errors},
        resetField,
    }=useForm<LoginForm>({
            resolver: yupResolver(loginSchema),

    })
    const loginMutation=useMutation<User,ApiError,LoginForm>({
        
        mutationFn:(data:LoginForm)=>login(data.passWord,data.userName),
        onError:(error:ApiError)=>{
            resetField("passWord")
            console.log("נכשל" ,error.status);            
        },
        onSuccess(user){
            setUser(user)
            navigate(user.role==='STUDENT'?"/parent/lessons":"/teacher/lessons",{replace:true})
            
        }

    })
    const onSubmit=(data:LoginForm)=>{
        loginMutation.mutate(data)
    }
    return(<>
    <div className="min-h-screen bg-sage-100 bg-[url(/letters.svg)] bg-repeat bg-[length:900px_640px] flex items-center justify-center px-4 py-10">
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg bg-white border-2 border-sage-600 ring-8 ring-sage-200 rounded-2xl p-6 sm:p-9 flex flex-col gap-5">
       <h1 className="font-heading text-4xl text-center text-sage-700">יומן שיעורים</h1>
       <div>
        <label htmlFor="username" className="block mb-1.5 text-base font-semibold text-sage-700">שם משתמש</label>
        <input id="username" {...register("userName")} className="w-full h-12 rounded-lg border border-sage-300 bg-white px-3 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200"/>
        {errors.userName&&<p className="mt-1 text-sm font-semibold text-red-700">{errors.userName.message}</p>} </div>
        <div>
        <label htmlFor="password" className="block mb-1.5 text-base font-semibold text-sage-700">סיסמה</label>
        <input id="password" type="password" {...register("passWord")} className="w-full h-12 rounded-lg border border-sage-300 bg-white px-3 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200" />
       {errors.passWord&&<p className="mt-1 text-sm font-semibold text-red-700">{errors.passWord.message}</p>}</div>
       <button type="submit" disabled={ loginMutation.isPending} className="h-12 rounded-lg bg-sage-600 text-base text-white font-bold cursor-pointer hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:bg-sage-300 disabled:text-sage-700 disabled:cursor-wait">{loginMutation.isPending? "מתחבר":"התחברות"}</button>
       {loginMutation.isError&&<p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{loginMutation.error.message}</p>}
    </form>
    </div>

    
    </>)
}
export default Login