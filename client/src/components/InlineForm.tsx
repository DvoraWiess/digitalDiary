import { useForm } from "react-hook-form";

type InlineFormProps = {
    label: string;
    inputType?: "text" | "password";
    required?: boolean;
    minLength?: number;
    confirmText?: string;
    isBusy?: boolean;
    error?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
};
const InlineForm = ({ label, inputType = "text", confirmText = "שמירה", required, minLength, isBusy, error, onConfirm, onCancel }: InlineFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ value: string }>({
        defaultValues: { value: "" },


    })
    const onSubmit = (data: { value: string }) => {
        onConfirm(data.value.trim())
    }
    return (<form onSubmit={handleSubmit(onSubmit)} className="bg-sage-100 border border-sage-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
        <label htmlFor="inline-value" className="w-full text-sm font-semibold text-sage-700">{label}</label>
        <input id="inline-value" type={inputType} {...register('value', {
            required: required ? "שדה חובה" : false,
            minLength: minLength ? { value: minLength, message: `לפחות ${minLength} תווים` } : undefined
        })} aria-invalid={!!errors.value || !!error} className="h-10 flex-1 min-w-48 rounded-lg border border-sage-300 bg-white px-2.5 text-base text-sage-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-200 aria-invalid:border-red-600 aria-invalid:focus:ring-red-100" />
        {(errors.value?.message || error) && <p className="w-full order-last text-sm font-semibold text-red-700">{errors.value?.message || error}</p>}        <button type="submit" disabled={isBusy} className="h-10 px-5 rounded-lg bg-sage-600 text-sm font-bold text-white cursor-pointer hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:opacity-50 disabled:cursor-wait">{confirmText}</button>
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg border border-sage-300 bg-white text-sm font-bold text-sage-700 cursor-pointer hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600">סגירה</button>
    </form>)
}
export default InlineForm