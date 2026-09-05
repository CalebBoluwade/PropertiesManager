"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, FileText } from "lucide-react";
import { createExpense } from "../actions";
import { EXPENSE_CATEGORIES } from "../constants";

type ExpenseFormValues = {
  propertyId: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
};

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const labelCls = "block text-sm font-medium text-slate-700";

const MAX_BYTES = 50 * 1024 * 1024;

export default function NewExpensePage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseFormValues>({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });
  const [pending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{ url: string; file: File; mime: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) { setFileError("File exceeds 50 MB."); e.target.value = ""; return; }
    if (receipt) URL.revokeObjectURL(receipt.url);
    setReceipt({ url: URL.createObjectURL(file), file, mime: file.type });
    e.target.value = "";
  }

  function removeReceipt() {
    if (receipt) URL.revokeObjectURL(receipt.url);
    setReceipt(null);
  }

  function onSubmit(data: ExpenseFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    if (receipt) fd.append("receipt", receipt.file);
    startTransition(async () => {
      await createExpense(fd);
      router.push("/dashboard/expenses");
    });
  }

  const isImage = receipt?.mime.startsWith("image/");
  const isVideo = receipt?.mime.startsWith("video/");

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Expense</h1>
        <p className="mt-2 text-slate-500">Record a property expense</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border bg-white p-6">
        <div>
          <label htmlFor="propertyId" className={labelCls}>Property ID *</label>
          <input id="propertyId" className={inputCls} placeholder="Property ID"
            {...register("propertyId", { required: "Required" })} />
          {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className={labelCls}>Category *</label>
          <select id="category" className={inputCls} {...register("category", { required: "Required" })}>
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <input id="description" className={inputCls} placeholder="e.g., Roof repair" {...register("description")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amount" className={labelCls}>Amount (NGN) *</label>
            <input id="amount" type="number" min={0.01} step="0.01" className={inputCls} placeholder="0.00"
              {...register("amount", { required: "Required", valueAsNumber: true, min: { value: 0.01, message: "Must be > 0" } })} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label htmlFor="date" className={labelCls}>Expense Date</label>
            <input id="date" type="date" className={inputCls} {...register("date")} />
          </div>
        </div>

        {/* Receipt attachment */}
        <div>
          <span className={labelCls}>Receipt / Document <span className="font-normal text-slate-400">(image, video or PDF, max 50 MB)</span></span>
          {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
          <div className="mt-2 flex items-start gap-3">
            {receipt ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={receipt.url} alt="" className="h-full w-full object-cover" />
                ) : isVideo ? (
                  <video src={receipt.url} className="h-full w-full object-cover" muted />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2">
                    <FileText size={28} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 text-center leading-tight line-clamp-2">{receipt.file.name}</span>
                  </div>
                )}
                <button type="button" onClick={removeReceipt}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-2xl text-slate-400 hover:border-slate-400 hover:text-slate-500">
                +
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={onFileChange} />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
            {pending ? "Saving…" : "Create Expense"}
          </button>
          <Link href="/dashboard/expenses"
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
