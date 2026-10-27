import { formatDate, formatTime, isFuture } from "../helpers/date";
import { statusLabels, type Lesson } from "../types/lesson";
    type LessonItemProps = {
  lesson: Lesson;
  showStudent?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onCancel?: (id: number) => void;
  isBusy?: boolean;
};
const LessonItem=({lesson,showStudent,onApprove,onReject,onCancel,isBusy}:LessonItemProps)=>{
    const statusText =
  lesson.status === "APPROVED" && !isFuture(lesson.startsAt)
    ? "ממתין לדוח"
    : statusLabels[lesson.status];

    return(<>
    <div className="bg-white border border-sage-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-3.5 gap-y-2 [&>button:first-of-type]:ms-auto">
        {showStudent&&<span className="font-bold text-base text-sage-900">{lesson.student.firstName}{' '}{lesson.student.lastName}</span>}<span className="text-sage-500">{formatDate(lesson.startsAt)}{' '}{formatTime(lesson.startsAt)}</span>
        <span data-status={lesson.status} className="rounded-full px-2.5 py-0.5 text-sm font-semibold bg-sage-100 text-sage-700 data-[status=PENDING]:bg-amber-100 data-[status=PENDING]:text-amber-800 data-[status=APPROVED]:bg-green-100 data-[status=APPROVED]:text-green-800 data-[status=REJECTED]:bg-red-100 data-[status=REJECTED]:text-red-800 data-[status=CANCELLED]:bg-stone-100 data-[status=CANCELLED]:text-stone-700 data-[status=COMPLETED]:bg-sky-100 data-[status=COMPLETED]:text-sky-800 data-[status=NO_SHOW]:bg-purple-100 data-[status=NO_SHOW]:text-purple-800">{statusText}</span>
        {isFuture(lesson.startsAt)&& onApprove&&lesson.status==='PENDING'&&(<button type="button" onClick={()=>onApprove(lesson.id)} disabled={isBusy} className="rounded-lg px-3.5 py-1.5 text-sm font-bold cursor-pointer bg-sage-600 text-white hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-50 disabled:cursor-not-allowed">אישור</button>)}
        {isFuture(lesson.startsAt)&&onReject&&lesson.status==='PENDING'&&(<button type="button" onClick={()=>onReject(lesson.id)} disabled={isBusy} className="rounded-lg px-3.5 py-1.5 text-sm font-bold cursor-pointer border border-red-300 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-50 disabled:cursor-not-allowed">דחייה</button>)}
        {isFuture(lesson.startsAt)&&onCancel&&(lesson.status==='PENDING'||lesson.status==='APPROVED')&&(<button type="button" onClick={()=>onCancel(lesson.id)} disabled={isBusy} className="rounded-lg px-3.5 py-1.5 text-sm font-bold cursor-pointer border border-sage-300 bg-white text-sage-700 hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-50 disabled:cursor-not-allowed">ביטול</button>)}</div> 


    </>)
}
export default LessonItem