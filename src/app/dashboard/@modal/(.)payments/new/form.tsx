"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { MediaUpload, type MediaFile } from "@/components/media-upload";
import { createPayment } from "@/app/dashboard/payments/actions";

type PaymentFormValues = {
  leaseId: string;
  amount: number;
  paidDate: string;
  notes?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

type Lease = { id: string; label: string };

export function NewPaymentForm({ leases }: { leases: Lease[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormValues>({
    defaultValues: { amount: 0, paidDate: new Date().toISOString().slice(0, 10) },
  });
  const [pending, startTransition] = useTransition();
  const [proof, setProof] = useState<MediaFile[]>([]);
  const router = useRouter();

  function onSubmit(data: PaymentFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    if (proof[0]) fd.append("proof", proof[0].file);
    startTransition(async () => { await createPayment(fd); router.back(); });
  }

  return (
    <Modal title="Record Payment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="leaseId" className={lbl}>Lease *</label>
          <select id="leaseId" className={inp} {...register("leaseId", { required: "Required" })}>
            <option value="">Select lease</option>
            {leases.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          {errors.leaseId && <p className="mt-1 text-xs text-red-500">{errors.leaseId.message}</p>}
          {leases.length === 0 && <p className="mt-1 text-xs text-amber-500">No active leases found.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amount" className={lbl}>Amount (NGN) *</label>
            <input id="amount" type="number" min={0} step="0.01" className={inp} placeholder="0.00"
              {...register("amount", { required: "Required", valueAsNumber: true })} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label htmlFor="paidDate" className={lbl}>Payment Date *</label>
            <input id="paidDate" type="date" className={inp}
              {...register("paidDate", { required: "Required" })} />
            {errors.paidDate && <p className="mt-1 text-xs text-red-500">{errors.paidDate.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={lbl}>Notes</label>
          <input id="notes" className={inp} placeholder="Optional notes" {...register("notes")} />
        </div>

        <MediaUpload
          value={proof}
          onChange={(files) => setProof(files.slice(-1))}
          accept="image/*,application/pdf"
          maxFiles={1}
          maxMB={10}
          label="Proof of Payment"
        />

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
