import * as yup from "yup";
import { readingLevelLabels, type NewStudent, type ReadingLevel, type Student } from "../types/student";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { ApiError } from "../api/api";
import { createStudent } from "../api/student";

const studentSchema = yup.object({
    firstName: yup.string().required("שדה חובה").max(50, "עד 50 תווים"),
    lastName: yup.string().required("שדה חובה").max(50, "עד 50 תווים"),
    age: yup
        .number()
        .typeError("יש להזין מספר")
        .required("שדה חובה")
        .integer("יש להזין מספר שלם")
        .min(3, "הגיל חייב להיות בין 3 ל-18")
        .max(18, "הגיל חייב להיות בין 3 ל-18"),
    readingLevel: yup
        .mixed<ReadingLevel>()
        .oneOf(["BEGINNER", "BASIC", "ADVANCED", "FLUENT"], "יש לבחור רמת קריאה")
        .required("שדה חובה"),
    parentName: yup
        .string()
        .required("שדה חובה")
        .min(2, "לפחות 2 תווים")
        .max(100, "עד 100 תווים"),
    parentPhone: yup
        .string()
        .required("שדה חובה")
        .matches(/^[0-9\- ]{7,20}$/, "7 עד 20 ספרות (מותר מקף ורווח)"),
    username: yup
        .string()
        .required("שדה חובה")
        .min(3, "לפחות 3 תווים")
        .max(30, "עד 30 תווים")
        .matches(/^[a-z0-9._-]+$/, "אותיות קטנות באנגלית, ספרות, נקודה, קו תחתון או מקף"),
    password: yup.string().required("שדה חובה").min(6, "לפחות 6 תווים"),
});

type StudentFormValues = yup.InferType<typeof studentSchema>;
const StudentForm = () => {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<StudentFormValues>({
        defaultValues: { readingLevel: 'BEGINNER' },
        resolver: yupResolver(studentSchema),

    })
    const onSubmit = (data: StudentFormValues) => {
        createStudentMutation.mutate(data)
    }
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const createStudentMutation = useMutation<Student, ApiError, NewStudent>({

        mutationFn: (data: NewStudent) => createStudent(data),

        onSuccess:()=> {
            navigate("/teacher/students"),
                queryClient.invalidateQueries({ queryKey: ['students'] })


        },
        onError: (error) => {
            error.details?.forEach((d) => {
                setError(d.field as keyof StudentFormValues, { message: d.message });
            });
        },

    })


    return <>
        <h2 className="font-heading text-3xl text-sage-700 mb-4">תלמיד חדש</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-sage-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <h3 className="sm:col-span-2 border-b border-sage-200 pb-1 text-base font-bold text-sage-600">פרטי התלמיד</h3>
            <div className="flex flex-col">
            <label htmlFor="fName" className="mb-1 text-sm font-semibold text-sage-700">שם פרטי</label>
            <input type="text" id="fName"{...register('firstName')} aria-invalid={!!errors.firstName} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
            {errors.firstName && <p className="mt-1 text-sm font-semibold text-red-700">{errors.firstName.message}</p>}
            </div>
            <div className="flex flex-col">
            <label htmlFor="lName" className="mb-1 text-sm font-semibold text-sage-700">שם משפחה</label>
            <input type="text" id="lName"{...register('lastName')} aria-invalid={!!errors.lastName} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
            {errors.lastName && <p className="mt-1 text-sm font-semibold text-red-700">{errors.lastName.message}</p>}
            </div>
            <div className="flex flex-col">
            <label htmlFor="age" className="mb-1 text-sm font-semibold text-sage-700">גיל</label>
            <input type="number" id="age"{...register('age')} aria-invalid={!!errors.age} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
            {errors.age && <p className="mt-1 text-sm font-semibold text-red-700">{errors.age.message}</p>}
            </div>
            <div className="flex flex-col">
            <label htmlFor="rLevel" className="mb-1 text-sm font-semibold text-sage-700">רמת קריאה</label>
            <select id="rLevel"{...register('readingLevel')} aria-invalid={!!errors.readingLevel} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100">
                {Object.entries(readingLevelLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                ))
                }
            </select>
            {errors.readingLevel && <p className="mt-1 text-sm font-semibold text-red-700">{errors.readingLevel.message}</p>}
            </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <h3 className="sm:col-span-2 border-b border-sage-200 pb-1 text-base font-bold text-sage-600">פרטי ההורה</h3>
            <div className="flex flex-col">
            <label htmlFor="pName" className="mb-1 text-sm font-semibold text-sage-700">שם הורה</label>
            <input type="text" id="pName"{...register('parentName')} aria-invalid={!!errors.parentName} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
            {errors.parentName && <p className="mt-1 text-sm font-semibold text-red-700">{errors.parentName.message}</p>}
            </div>
            <div className="flex flex-col">
            <label htmlFor="pPhone" className="mb-1 text-sm font-semibold text-sage-700">מספר טלפון הורה</label>
            <input type="text" id="pPhone"{...register('parentPhone')} aria-invalid={!!errors.parentPhone} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
            {errors.parentPhone && <p className="mt-1 text-sm font-semibold text-red-700">{errors.parentPhone.message}</p>}
            </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <h3 className="sm:col-span-2 border-b border-sage-200 pb-1 text-base font-bold text-sage-600">פרטי התחברות</h3>
            <div className="flex flex-col">
            <label htmlFor="uName" className="mb-1 text-sm font-semibold text-sage-700">שם משתמש</label>
            <input type="text" id="uName"{...register('username')} aria-invalid={!!errors.username} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
            {errors.username && <p className="mt-1 text-sm font-semibold text-red-700">{errors.username.message}</p>}
            </div>
            <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 text-sm font-semibold text-sage-700">סיסמה</label>
            <input type="password" id="password" {...register('password')} aria-invalid={!!errors.password} className="h-10 w-full rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
            {errors.password && <p className="mt-1 text-sm font-semibold text-red-700">{errors.password.message}</p>}
            </div>
            </div>
            <button type="submit" disabled={createStudentMutation.isPending} className="h-11 w-full sm:w-auto sm:self-start sm:px-10 rounded-lg bg-sage-600 text-white font-bold cursor-pointer hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-50 disabled:cursor-wait">שליחה</button>
            {createStudentMutation.isError && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{createStudentMutation.error.message}</p>}

        </form>
    </>
}
export default StudentForm