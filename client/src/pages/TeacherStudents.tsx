import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { getStudents, resetStudentPassword } from "../api/student"
import type { ApiError } from "../api/api"
import { Link } from "react-router-dom"
import { Check, KeyRound, Plus, Search } from "lucide-react"
import { readingLevelLabels } from "../types/student"
import InlineForm from "../components/InlineForm"
type SortByType = "lastName" | "firstName" | "age" | "readingLevel";
const levelOrder = Object.keys(readingLevelLabels);

const TeacherStudents = () => {
   const [resetId, setResetId] = useState<number | null>(null)
   const resetPasswordMutation = useMutation<void, ApiError, { id: number, password: string }>({
      mutationFn: ({ id, password }) => resetStudentPassword(id, password),
      onSuccess: () => setResetId(null)
   })
   const [sortBy, setSortBy] = useState<SortByType>('lastName')

   const [search, setSearch] = useState<string>('')
   const { data, isLoading, error } = useQuery({
      queryKey: ['students'],
      queryFn: () => getStudents()
   })
   const filtered = data?.filter((stu) => `${stu.firstName} ${stu.lastName}`.includes(search.trim()))
   const sorted = filtered
      ? [...filtered].sort((a, b) => {
         if (sortBy === "lastName") return a.lastName.localeCompare(b.lastName, "he");
         if (sortBy === "firstName") return a.firstName.localeCompare(b.firstName, "he");
         if (sortBy === "age") return a.age - b.age;
         return levelOrder.indexOf(a.readingLevel) - levelOrder.indexOf(b.readingLevel);
      })
      : undefined;
   return <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
         <h1 className="font-heading text-3xl text-sage-700">תלמידים</h1>
         <Link to={"/teacher/students/new"} className="inline-flex items-center gap-1.5 rounded-lg bg-sage-600 px-4 py-2 font-bold text-white hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"><Plus className="size-5" aria-hidden="true" />הוספת תלמיד חדש</Link>
      </div>
      <div className="bg-white border border-sage-200 rounded-xl p-4 mb-4 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 sm:grid-rows-2 sm:grid-flow-col">
         <label htmlFor="search" className="text-sm font-semibold text-sage-700">חיפוש לפי שם</label>
         <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="peer row-start-2 col-start-1 h-10 w-full rounded-lg border border-sage-300 bg-white ps-9 pe-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200"></input>
         <Search className="row-start-2 col-start-1 self-center justify-self-start ms-3 size-[18px] text-sage-500 pointer-events-none transition-opacity peer-focus:opacity-0" aria-hidden="true" />
         <label htmlFor="select" className="mt-3 sm:mt-0 text-sm font-semibold text-sage-700">מיון לפי</label>
         <select id="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortByType)} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200">
            <option value="lastName">שם משפחה</option>
            <option value="firstName">שם פרטי</option>
            <option value="age">גיל</option>
            <option value="readingLevel">רמת קריאה</option>

         </select>
      </div>
      {resetPasswordMutation.isSuccess && <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800"><Check className="size-4" aria-hidden="true" />הסיסמה עודכנה</p>}
      {isLoading && <p className="flex items-center justify-center gap-2.5 py-3 font-semibold text-sage-500 before:content-[''] before:size-5 before:rounded-full before:border-3 before:border-sage-200 before:border-t-sage-600 before:animate-spin">טוען...</p>}
      {error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error.message}</p>}
      {sorted && sorted.length === 0 && <p className="py-3 text-center font-semibold text-sage-500">לא נמצאו תלמידים</p>}
      <div className="flex flex-col gap-3">
         {sorted?.map((stu) => {
            return <div key={stu.id} className="flex flex-col gap-1.5"> <div className="bg-white border border-sage-200 rounded-xl px-4 py-3 grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] items-center gap-x-4"><span className="font-bold text-base text-sage-900">{stu.firstName}{' '}{stu.lastName}</span><span className="text-sm text-sage-500">{stu.username}</span><span className="col-start-2 row-start-1 row-span-2 text-sage-500">{stu.gradeText}</span><span data-active={stu.isActive} className="col-start-3 row-start-1 row-span-2 rounded-full px-2.5 py-0.5 text-sm font-semibold bg-stone-100 text-stone-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-800">{stu.isActive ? 'פעיל' : 'מושבת'}</span>
               <button type="button" onClick={() => { setResetId(stu.id); resetPasswordMutation.reset() }} className="col-span-3 justify-self-start mt-2.5 sm:col-span-1 sm:col-start-4 sm:row-start-1 sm:row-span-2 sm:mt-0 inline-flex items-center gap-1.5 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm font-bold text-sage-700 cursor-pointer hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"><KeyRound className="size-4" aria-hidden="true" />איפוס סיסמה</button>
            </div>
               {resetId === stu.id && (
                  <InlineForm
                     label={`סיסמה חדשה ל${stu.firstName} ${stu.lastName}`}
                     inputType="password"
                     required
                     minLength={6}
                     confirmText="איפוס"
                     isBusy={resetPasswordMutation.isPending}
                     error={resetPasswordMutation.error?.message}
                     onConfirm={(value) => resetPasswordMutation.mutate({ id: stu.id, password: value })}
                     onCancel={() => setResetId(null)}
                  />
               )}
            </div>
         })}

      </div>

   </>
}
export default TeacherStudents