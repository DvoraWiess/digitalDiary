import {  useState } from "react"
import { useAuth } from "../context/authContext"
import {  useQuery } from "@tanstack/react-query"
import { getStudent } from "../api/student"
import { readingLevelLabels } from "../types/student"
import StudentEditForm from "../components/StudentEditForm"
import { Pencil } from "lucide-react"

const StudentProfile=()=>{
    const { user } = useAuth()
    const studentId = user?.student?.id
    const {data,error,isLoading}=useQuery({
        queryKey:['student',studentId],
        queryFn:()=>getStudent(studentId!),
        enabled: !!studentId
    })
    const[isEditing,setIsEditing]=useState<boolean>(false)
    return(<>
    <h2 className="font-heading text-3xl text-sage-700 mb-4">פרטי התלמיד</h2>
    {isLoading&&<p className="flex items-center justify-center gap-2.5 py-3 font-semibold text-sage-500 before:content-[''] before:size-5 before:rounded-full before:border-3 before:border-sage-200 before:border-t-sage-600 before:animate-spin">טוען...</p>}
    {error&&<p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error.message}</p>}

    { data && (
        isEditing?<StudentEditForm onDone={()=>setIsEditing(false)} student={data}/>:(
  <div className="bg-white border border-sage-200 rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">שם</span> {data.firstName} {data.lastName}</p>
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">גיל</span> {data.age}</p>
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">רמת קריאה</span> {readingLevelLabels[data.readingLevel]}</p>
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">כיתה</span> {data.gradeText ?? "לא צוין"}</p>
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">המורה בבית הספר</span> {data.schoolTeacherName ?? "לא צוין"}</p>
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">טלפון המורה</span> {data.schoolTeacherPhone ?? "לא צוין"}</p>
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">שם ההורה</span> {data.parentName}</p>
    <p className="flex flex-col border-b border-sage-100 py-2.5 text-base font-bold text-sage-900"><span className="text-sm font-semibold text-sage-500">טלפון ההורה</span> {data.parentPhone}</p>
    <button type="button" onClick={()=>setIsEditing(true)} className="sm:col-span-2 justify-self-start mt-4 inline-flex items-center gap-1.5 rounded-lg border border-sage-300 bg-white px-4 py-2 font-bold text-sage-700 cursor-pointer hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"><Pencil className="size-4" aria-hidden="true" />עריכה</button>
  </div>
))}
    </>)
}
export default StudentProfile