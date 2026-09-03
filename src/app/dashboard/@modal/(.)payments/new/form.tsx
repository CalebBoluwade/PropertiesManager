"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { createPayment } from "@/app/dashboard/payments/actions";

type PaymentFormValues = {
  tenantId: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate?: string;
  notes?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

export function NewPaymentForm({ tenants }: { tenants: { id: string; label: string }[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormValues>({
    defaultValues: { amountPaid: 0, dueDate: new Date().toISOString().slice(0, 10) },
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(data: PaymentFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => { await createPayment(fd); router.back(); });
  }

  return (
    <Modal title="Record Payment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="tenantId" className={lbl}>Tenant *</label>
          <select id="tenantId" className={inp} {...register("tenantId", { required: "Required" })}>
            <option value="">Select tenant</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {errors.tenantId && <p className="mt-1 text-xs text-red-500">{errors.tenantId.message}</p>}
          {tenants.length === 0 && <p className="mt-1 text-xs text-amber-500">No tenants found. Add a tenant first.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amountDue" className={lbl}>Amount Due (NGN) *</label>
            <input id="amountDue" type="number" min={0} step="0.01" className={inp} placeholder="0.00"
              {...register("amountDue", { required: "Required", valueAsNumber: true })} />
            {errors.amountDue && <p className="mt-1 text-xs text-red-500">{errors.amountDue.message}</p>}
          </div>
          <div>
            <label htmlFor="amountPaid" className={lbl}>Amount Paid (NGN)</label>
            <input id="amountPaid" type="number" min={0} step="0.01" className={inp} placeholder="0.00"
              {...register("amountPaid", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dueDate" className={lbl}>Due Date *</label>
            <input id="dueDate" type="date" className={inp}
              {...register("dueDate", { required: "Required" })} />
            {errors.dueDate && <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>}
          </div>
          <div>
            <label htmlFor="paidDate" className={lbl}>Paid Date</label>
            <input id="paidDate" type="date" className={inp} {...register("paidDate")} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={lbl}>Notes</label>
          <input id="notes" className={inp} placeholder="Optional notes" {...register("notes")} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors">
            {pending ? "Saving…" : "Record Payment"}
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
