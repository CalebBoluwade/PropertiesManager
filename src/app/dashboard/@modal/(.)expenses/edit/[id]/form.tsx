"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { updateExpense } from "@/app/dashboard/expenses/actions";
import { EXPENSE_CATEGORIES } from "@/app/dashboard/expenses/constants";
import { FormActions } from "@/components/form-actions";
import { useCurrency } from "@/components/providers";

type ExpenseFormValues = {
  propertyId: string;
  tenantId?: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

type Expense = { id: string; propertyId: string; tenantId?: string | null; category: string; amount: number; expenseDate: Date; description: string | null };

export function EditExpenseForm({ expense, properties, tenants }: { expense: Expense; properties: { id: string; label: string }[]; tenants: { id: string; label: string }[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseFormValues>({
    defaultValues: {
      propertyId: expense.propertyId,
      tenantId: expense.tenantId ?? "",
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.expenseDate).toISOString().slice(0, 10),
      description: expense.description ?? "",
    },
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const currency = useCurrency();

  function onSubmit(data: ExpenseFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => { await updateExpense(expense.id, fd); router.back(); });
  }

  return (
    <Modal title="Edit Expense">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="propertyId" className={lbl}>Property *</label>
          <select id="propertyId" className={inp} {...register("propertyId", { required: "Required" })}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId.message}</p>}
        </div>

        <div>
          <label htmlFor="tenantId" className={lbl}>Tenant <span className="font-normal text-slate-400">(optional)</span></label>
          <select id="tenantId" className={inp} {...register("tenantId")}>
            <option value="">— None —</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="category" className={lbl}>Category *</label>
          <select id="category" className={inp} {...register("category", { required: "Required" })}>
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className={lbl}>Description</label>
          <input id="description" className={inp} {...register("description")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amount" className={lbl}>Amount ({currency}) *</label>
            <input id="amount" type="number" min={0.01} step="0.01" className={inp}
              {...register("amount", { required: "Required", valueAsNumber: true, min: { value: 0.01, message: "Must be > 0" } })} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label htmlFor="date" className={lbl}>Expense Date</label>
            <input id="date" type="date" className={inp} {...register("date")} />
          </div>
        </div>

        <FormActions pending={pending} submitLabel="Save Changes" pendingLabel="Saving…" onCancel={() => router.back()} />
      </form>
    </Modal>
  );
}
