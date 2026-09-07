"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { updatePayment } from "@/app/dashboard/payments/actions";

type PaymentFormValues = {
  amount: number;
  paidDate: string;
  notes?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

type Payment = { id: string; amount: number; paymentDate: Date | null; notes: string | null; lease: { id: string } | null };

export function EditPaymentForm({ payment }: { payment: Payment }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormValues>({
    defaultValues: {
      amount: payment.amount,
      paidDate: new Date(payment.paymentDate ?? new Date()).toISOString().slice(0, 10),
      notes: payment.notes ?? "",
    },
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(data: PaymentFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => { await updatePayment(payment.id, fd); router.back(); });
  }

  return (
    <Modal title="Edit Payment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amount" className={lbl}>Amount (NGN) *</label>
            <input id="amount" type="number" min={0} step="0.01" className={inp}
              {...register("amount", { required: "Required", valueAsNumber: true })} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label htmlFor="paidDate" className={lbl}>Payment Date *</label>
            <input id="paidDate" type="date" className={inp} {...register("paidDate", { required: "Required" })} />
            {errors.paidDate && <p className="mt-1 text-xs text-red-500">{errors.paidDate.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={lbl}>Notes</label>
          <input id="notes" className={inp} {...register("notes")} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors">
            {pending ? "Saving…" : "Save Changes"}
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
