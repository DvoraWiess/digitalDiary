import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";
import type { Role } from "../types/auth";

const ProtectedRoute=({role}:{role:Role})=>{
    const {user,isLoading}=useAuth()
    if(isLoading){
        return<p>laoding</p>
    }
    if(!user){
        return <Navigate to="/login" replace />
    }
    if(user.role!==role){
       return <Navigate to={user.role==="STUDENT"?"/parent/lessons":"/teacher/lessons"}/>
    }
    return <Outlet/>
}
export default ProtectedRoute