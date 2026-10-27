import { yupResolver } from "@hookform/resolvers/yup";
import type { Student, StudentUpdate } from "../types/student";
import { useForm } from "react-hook-form";

type StudentEditFormProps = {
    student: Student;
    onDone: () => void;
};
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "../api/api";
import { updateStudent } from "../api/student";

const phoneRegex = /^[0-9\- ]{7,20}$/;

const editSchema = yup.object({
    gradeText: yup.string().max(50, "עד 50 תווים"),
    schoolTeacherName: yup.string().max(100, "עד 100 תווים"),
    schoolTeacherPhone: yup.string().matches(phoneRegex, {
        message: "7 עד 20 ספרות (מותר מקף ורווח)",
        excludeEmptyString: true,
    }),
    parentPhone: yup
        .string()
        .required("שדה חובה")
        .matches(phoneRegex, "7 עד 20 ספרות (מותר מקף ורווח)"),
});

type EditFormValues = yup.InferType<typeof editSchema>;
const StudentEditForm = ({ student, onDone }: StudentEditFormProps) => {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<EditFormValues>({
        defaultValues: {
            gradeText: student.gradeText ?? "",
            schoolTeacherName: student.schoolTeacherName ?? "",
            schoolTeacherPhone: student.schoolTeacherPhone ?? "",
            parentPhone: student.parentPhone

        },
        resolver: yupResolver(editSchema),

    })
    
    const queryClient = useQueryClient()
    const updateStudentMutation = useMutation<Student, ApiError, StudentUpdate>({
        mutationFn: (data: StudentUpdate) => updateStudent(student.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student'] })
            onDone()
        },
        onError: (error) => {
            error.details?.forEach((d) => {
                setError(d.field as keyof EditFormValues, { message: d.message });
            });
        },
    })
    const onSubmit = (data: EditFormValues) => {
        updateStudentMutation.mutate(data)

    }


    return ( <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-sage-200 rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div className="flex flex-col">
        <label htmlFor="grade" className="mb-1 text-sm font-semibold text-sage-700">כיתה</label>
        <input type="text" id="grade"{...register('gradeText')} aria-invalid={!!errors.gradeText} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
        {errors.gradeText && <p className="mt-1 text-sm font-semibold text-red-700">{errors.gradeText.message}</p>}
        </div>
        <div className="flex flex-col">
        <label htmlFor="tName" className="mb-1 text-sm font-semibold text-sage-700">שם מורה</label>
        <input type="text" id="tName"{...register('schoolTeacherName')} aria-invalid={!!errors.schoolTeacherName} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
        {errors.schoolTeacherName && <p className="mt-1 text-sm font-semibold text-red-700">{errors.schoolTeacherName.message}</p>}
        </div>
        <div className="flex flex-col">
        <label htmlFor="tPhone" className="mb-1 text-sm font-semibold text-sage-700">מספר טלפון מורה</label>
        <input type="text" id="tPhone"{...register('schoolTeacherPhone')} aria-invalid={!!errors.schoolTeacherPhone} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
        {errors.schoolTeacherPhone && <p className="mt-1 text-sm font-semibold text-red-700">{errors.schoolTeacherPhone.message}</p>}
        </div>

        <div className="flex flex-col">
        <label htmlFor="pPhone" className="mb-1 text-sm font-semibold text-sage-700">מספר טלפון הורה</label>
        <input type="text" id="pPhone"{...register('parentPhone')} aria-invalid={!!errors.parentPhone} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
        {errors.parentPhone && <p className="mt-1 text-sm font-semibold text-red-700">{errors.parentPhone.message}</p>}
        </div>
        {updateStudentMutation.isError&&<p className="sm:col-span-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{updateStudentMutation.error.message}</p>}
        <div className="sm:col-span-2 flex gap-2.5 mt-1.5">
        <button type="button" onClick={onDone} className="order-2 flex-1 sm:flex-none h-11 px-6 rounded-lg border border-sage-300 bg-white font-bold text-sage-700 cursor-pointer hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600">ביטול</button>
        <button type="submit" disabled={updateStudentMutation.isPending} className="order-1 flex-1 sm:flex-none h-11 px-7 rounded-lg bg-sage-600 font-bold text-white cursor-pointer hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-50 disabled:cursor-wait">שמירה</button>
        </div>
    </form>
    )

}
export default StudentEditForm