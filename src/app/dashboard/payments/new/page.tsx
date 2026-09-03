"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { createPayment } from "../actions";

type PaymentFormValues = {
  tenantId: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate?: string;
  notes?: string;
};

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const labelCls = "block text-sm font-medium text-slate-700";

export default function NewPaymentPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormValues>({
    defaultValues: { amountPaid: 0, dueDate: new Date().toISOString().slice(0, 10) },
  });
  const [pending, startTransition] = useTransition();

  function onSubmit(data: PaymentFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => {
      await createPayment(fd);
    });
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Record Payment</h1>
        <p className="mt-2 text-slate-500">Create a new rent charge or payment record</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border bg-white p-6">
        <div>
          <label htmlFor="tenantId" className={labelCls}>Tenant ID *</label>
          <input id="tenantId" className={inputCls} placeholder="Tenant ID"
            {...register("tenantId", { required: "Required" })} />
          {errors.tenantId && <p className="mt-1 text-xs text-red-500">{errors.tenantId.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amountDue" className={labelCls}>Amount Due (NGN) *</label>
            <input id="amountDue" type="number" min={0} step="0.01" className={inputCls} placeholder="0.00"
              {...register("amountDue", { required: "Required", valueAsNumber: true })} />
            {errors.amountDue && <p className="mt-1 text-xs text-red-500">{errors.amountDue.message}</p>}
          </div>
          <div>
            <label htmlFor="amountPaid" className={labelCls}>Amount Paid (NGN)</label>
            <input id="amountPaid" type="number" min={0} step="0.01" className={inputCls} placeholder="0.00"
              {...register("amountPaid", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dueDate" className={labelCls}>Due Date *</label>
            <input id="dueDate" type="date" className={inputCls}
              {...register("dueDate", { required: "Required" })} />
            {errors.dueDate && <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>}
          </div>
          <div>
            <label htmlFor="paidDate" className={labelCls}>Paid Date</label>
            <input id="paidDate" type="date" className={inputCls} {...register("paidDate")} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelCls}>Notes</label>
          <input id="notes" className={inputCls} placeholder="Optional notes" {...register("notes")} />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
            {pending ? "Saving…" : "Record Payment"}
          </button>
          <a href="/dashboard/payments"
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
