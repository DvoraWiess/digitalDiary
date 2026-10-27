import  { useState } from "react"
import {  todayIso, yesterdayIso } from "../helpers/date"
import { cancelLesson, getLessons } from "../api/lessons"
import type { ApiError } from "../api/api"
import {  type Lesson } from "../types/lesson"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import LessonItem from "../components/LessonItem"
import { Plus } from "lucide-react"

const ParentLessons = () => {
   const queryClient = useQueryClient()
   const [tab, setTab]=useState<'upcoming' | 'past'>('upcoming')
   const filters = tab === 'upcoming' ? { from: todayIso() } : { to: yesterdayIso() }
   const { data, isLoading, error } = useQuery({
      queryKey: ["lessons", filters],
      queryFn: () => getLessons(filters)
   })
   const cancelMutation = useMutation<Lesson, ApiError, { id: number, reason: string }>({
      mutationFn: ({ id, reason }) => cancelLesson(id, reason),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] })

   })
   const handleCancel=(id:number)=>{
      const reason = window.prompt("סיבת הביטול"); if (reason === null) { return; }cancelMutation.mutate({ id, reason }) 
   }
   return <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 className="font-heading text-3xl text-sage-700">השיעורים שלי</h1>
      <Link to="/parent/book" className="inline-flex items-center gap-1.5 rounded-lg bg-sage-600 px-4 py-2 font-bold text-white hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"><Plus className="size-5" aria-hidden="true" />קביעת שיעור</Link>
      </div>
      <div className="inline-flex gap-1 rounded-full border border-sage-200 bg-sage-100 p-1 mb-4">
      <button type="button" onClick={()=>setTab('upcoming')} disabled={tab === 'upcoming'} className="rounded-full border border-transparent px-4 py-1.5 font-semibold text-sage-500 cursor-pointer hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:bg-white disabled:text-sage-700 disabled:border-sage-300 disabled:cursor-default">השיעורים הקרובים</button>
      <button type="button" onClick={()=>setTab('past')} disabled={tab === 'past'} className="rounded-full border border-transparent px-4 py-1.5 font-semibold text-sage-500 cursor-pointer hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:bg-white disabled:text-sage-700 disabled:border-sage-300 disabled:cursor-default">שיעורים שהיו</button>
      </div>
       {isLoading && <p className="flex items-center justify-center gap-2.5 py-3 font-semibold text-sage-500 before:content-[''] before:size-5 before:rounded-full before:border-3 before:border-sage-200 before:border-t-sage-600 before:animate-spin">טוען...</p>}
        {error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error.message}</p>}
        {data && data.length === 0 && <p className="py-3 text-center font-semibold text-sage-500">אין שיעורים</p>}
        {cancelMutation.isError && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{cancelMutation.error.message}</p>}
        <div className="flex flex-col gap-3">
        {data?.map((les)=>{return <LessonItem key={les.id} lesson={les} onCancel={handleCancel} isBusy={cancelMutation.isPending} />})}
        </div>

   </>
}
export default ParentLessons