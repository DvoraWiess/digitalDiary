import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { approveLesson, cancelLesson, getLessons, rejectLesson } from "../api/lessons"
import { statusLabels, type Lesson, type LessonStatus } from "../types/lesson"
import {  todayIso } from "../helpers/date"
import { useState } from "react"
import { ApiError } from "../api/api"
import LessonItem from "../components/LessonItem"

const TeacherLessons = () => {
    const [status, setStatus] = useState<LessonStatus | ''>('')
    const [from, setFrom] = useState<string>(todayIso())
    const [to, setTo] = useState<string>(todayIso())

    const filters = {
        status: status || undefined,
        from,
        to,
    }
    const { data, isLoading, error } = useQuery({
        queryKey: ["lessons", filters],
        queryFn: () => getLessons(filters)
    })
    const queryClient = useQueryClient()
    const approveMutation = useMutation<Lesson, ApiError, number>({
        mutationFn: (id: number) => approveLesson(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] })

    })
    const rejectMutation = useMutation<Lesson, ApiError, { id: number, reason: string }>({
        mutationFn: ({ id, reason }) => rejectLesson(id, reason),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] })

    })
    const cancelMutation = useMutation<Lesson, ApiError, { id: number, reason: string }>({
        mutationFn: ({ id, reason }) => cancelLesson(id, reason),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] })

    })
    const handleCancel = (id: number) => {
        const reason = window.prompt("סיבת הביטול :( חובה)"); if (reason === null) { return; } if (reason.trim() === '') { alert("חובה לכתוב סיבה לביטול"); return } cancelMutation.mutate({ id, reason })
    }

const handleReject = (id: number) => {
    const reason = window.prompt("סיבת הדחייה :(לא חובה)"); if (reason === null) { return; } rejectMutation.mutate({ id, reason })
    }
    return <>
        <h1 className="font-heading text-3xl text-sage-700 mb-4">כל השיעורים</h1>
        <div className="bg-white border border-sage-200 rounded-xl p-4 mb-4 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3 sm:grid-rows-2 sm:grid-flow-col">
        <label htmlFor="select" className="text-sm font-semibold text-sage-700">סטטוס</label>
        <select id="select" value={status} onChange={(e) => setStatus(e.target.value as LessonStatus | "")} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 mb-3 sm:mb-0">
            <option value="">הכל</option>
            {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
            )

            )}
        </select>

        <label htmlFor="selectFrom" className="text-sm font-semibold text-sage-700">מתאריך</label>
        <input id="selectFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 mb-3 sm:mb-0"></input>
        <label htmlFor="selectTo" className="text-sm font-semibold text-sage-700">עד תאריך</label>
        <input id="selectTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200"></input>
        </div>
        {approveMutation.isError && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{approveMutation.error.message}</p>}
        {rejectMutation.isError && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{rejectMutation.error.message}</p>}
        {cancelMutation.isError && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{cancelMutation.error.message}</p>}

        {isLoading && <p className="flex items-center justify-center gap-2.5 py-3 font-semibold text-sage-500 before:content-[''] before:size-5 before:rounded-full before:border-3 before:border-sage-200 before:border-t-sage-600 before:animate-spin">טוען...</p>}
        {error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error.message}</p>}
        {data && data.length === 0 && <p className="py-3 text-center font-semibold text-sage-500">אין שיעורים</p>}
        <div className="flex flex-col gap-3">
        { data?.map((les)=>{return <LessonItem key={les.id} lesson={les} showStudent onApprove={(id)=>approveMutation.mutate(id)}onReject={handleReject} onCancel={handleCancel} isBusy={approveMutation.isPending||cancelMutation.isPending||rejectMutation.isPending} />})}
        </div>
    </>
}
export default TeacherLessons