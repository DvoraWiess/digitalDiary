import { useState } from "react"
import { addDays, formatDate, todayIso } from "../helpers/date"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getAvailability } from "../api/availability"
import type { Lesson, NewLesson } from "../types/lesson"
import type { ApiError } from "../api/api"
import { createLesson } from "../api/lessons"
import { useNavigate } from "react-router-dom"
import type { Slot } from "../types/availability"
import { ChevronLeft, ChevronRight } from "lucide-react"

const BookLesson = () => {
   const queryClient = useQueryClient()
   const [weekStart, setWeekStart] = useState<string>(todayIso())
   const to = addDays(weekStart, 6)
   const navigate = useNavigate()
   const { data, isLoading, error } = useQuery({ queryKey: ['availability', weekStart], queryFn: () => getAvailability(weekStart, to) })
   const createLessonMutation = useMutation<Lesson, ApiError, NewLesson>({
      mutationFn: (data: NewLesson) => createLesson(data),
      onSuccess: () => {
         navigate("/parent/lessons"),
            queryClient.invalidateQueries({ queryKey: ['availability'] })
         queryClient.invalidateQueries({ queryKey: ['lessons'] })

      },
      onError: () => queryClient.invalidateQueries({ queryKey: ['availability'] })
   })
   const handleBook = (slot: Slot) => {
      const res = window.prompt(`לקבוע שיעור ב-${formatDate(slot.startsAt)}? אפשר לשלוח הערה למורה`)
      if (res === null) { return }
      createLessonMutation.mutate({ startsAt: slot.startsAt, parentNote: res })
   }
   return <>
      <h1 className="font-heading text-3xl text-sage-700 mb-4">קביעת שיעור</h1>
      <div className="flex items-center justify-between gap-2 bg-white border border-sage-200 rounded-xl p-2 mb-4">
      <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={weekStart >= addDays(todayIso(), 21)} className="order-3 inline-flex shrink-0 items-center gap-1 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm font-bold text-sage-700 cursor-pointer hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-45 disabled:cursor-not-allowed">שבוע הבא<ChevronLeft className="size-4" aria-hidden="true" /></button>
      <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} disabled={weekStart <= todayIso()} className="order-1 inline-flex shrink-0 items-center gap-1 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm font-bold text-sage-700 cursor-pointer hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-45 disabled:cursor-not-allowed"><ChevronRight className="size-4" aria-hidden="true" />שבוע הקודם</button>
      <span className="order-2 min-w-0 text-center text-sm sm:text-base font-bold text-sage-700">{formatDate(weekStart)} – {formatDate(to)}</span>
      </div>
      {createLessonMutation.error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{createLessonMutation.error.message}</p>}
      {isLoading && <p className="flex items-center justify-center gap-2.5 py-3 font-semibold text-sage-500 before:content-[''] before:size-5 before:rounded-full before:border-3 before:border-sage-200 before:border-t-sage-600 before:animate-spin">טוען...</p>}
      {error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error.message}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data?.days.map((day) => {
         return <div key={day.date} className="bg-white border border-sage-200 rounded-xl p-3 flex flex-wrap content-start gap-1.5 has-[p]:bg-sage-50"><span className="w-full border-b border-sage-100 pb-1.5 mb-0.5 font-bold text-sage-700">{formatDate(day.date)}</span>{day.slots.length === 0 && <p className="w-full text-sm text-sage-500">אין שעות פנויות</p>}{day.slots.map((slot) => (
            <button key={slot.startsAt} type="button" onClick={() => handleBook(slot)} disabled={createLessonMutation.isPending} className="rounded-full border border-sage-300 bg-sage-100 px-3 py-1 text-sm font-bold text-sage-700 cursor-pointer hover:bg-sage-600 hover:border-sage-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-50 disabled:cursor-wait">{slot.time}</button>
         ))}</div>
      })}
      </div>
   </>
}
export default BookLesson