"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { MediaUpload, type MediaFile } from "@/components/media-upload";
import { createExpense } from "@/app/dashboard/expenses/actions";
import { EXPENSE_CATEGORIES } from "@/app/dashboard/expenses/constants";

type ExpenseFormValues = {
  propertyId: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

export function NewExpenseForm({ properties }: { properties: { id: string; label: string }[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseFormValues>({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });
  const [pending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<MediaFile[]>([]);
  const router = useRouter();

  function onSubmit(data: ExpenseFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    if (receipt[0]) fd.append("receipt", receipt[0].file);
    startTransition(async () => { await createExpense(fd); router.back(); });
  }

  return (
    <Modal title="Add Expense">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="propertyId" className={lbl}>Property *</label>
          <select id="propertyId" className={inp} {...register("propertyId", { required: "Required" })}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId.message}</p>}
          {properties.length === 0 && <p className="mt-1 text-xs text-amber-500">No properties found. Add a property first.</p>}
        </div>

        <div>
          <label htmlFor="category" className={lbl}>Category *</label>
          <select id="category" className={inp} {...register("category", { required: "Required" })}>
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className={lbl}>Description</label>
          <input id="description" className={inp} placeholder="e.g., Roof repair" {...register("description")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amount" className={lbl}>Amount (NGN) *</label>
            <input id="amount" type="number" min={0.01} step="0.01" className={inp} placeholder="0.00"
              {...register("amount", { required: "Required", valueAsNumber: true, min: { value: 0.01, message: "Must be > 0" } })} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label htmlFor="date" className={lbl}>Expense Date</label>
            <input id="date" type="date" className={inp} {...register("date")} />
          </div>
        </div>

        <MediaUpload
          value={receipt}
          onChange={(files) => setReceipt(files.slice(-1))}
          accept="image/*,video/*,application/pdf"
          maxFiles={1}
          maxMB={50}
          label="Receipt / Document"
        />

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors">
            {pending ? "Creating…" : "Create Expense"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
