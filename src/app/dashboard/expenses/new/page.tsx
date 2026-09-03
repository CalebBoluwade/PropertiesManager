"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
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

export default function NewExpensePage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseFormValues>({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });
  const [pending, startTransition] = useTransition();

  function onSubmit(data: ExpenseFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => {
      await createExpense(fd);
    });
  }

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
          <select id="category" className={inputCls}
            {...register("category", { required: "Required" })}>
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <input id="description" className={inputCls} placeholder="e.g., Roof repair"
            {...register("description")} />
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

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
            {pending ? "Creating…" : "Create Expense"}
          </button>
          <a href="/dashboard/expenses"
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
