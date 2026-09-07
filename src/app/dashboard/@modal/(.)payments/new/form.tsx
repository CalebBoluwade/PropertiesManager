"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { MediaUpload, type MediaFile } from "@/components/media-upload";
import { createPayment } from "@/app/dashboard/payments/actions";
import { FormActions } from "@/components/form-actions";

type Unit = { id: string; number: string; leases: { id: string; tenantName: string }[] };
type Property = { id: string; name: string; units: Unit[] };

type PaymentFormValues = {
  leaseId: string;
  amount: number;
  paidDate: string;
  notes?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

export function NewPaymentForm({ properties }: { properties: Property[] }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PaymentFormValues>({
    defaultValues: { amount: 0, paidDate: new Date().toISOString().slice(0, 10) },
  });
  const [pending, startTransition] = useTransition();
  const [proof, setProof] = useState<MediaFile[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const router = useRouter();

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const selectedUnit = selectedProperty?.units.find((u) => u.id === selectedUnitId);

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
          <label className={lbl}>Property *</label>
          <select className={inp} value={selectedPropertyId} onChange={(e) => {
            setSelectedPropertyId(e.target.value);
            setSelectedUnitId("");
            setValue("leaseId", "");
          }}>
            <option value="">Select property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {selectedPropertyId && (
          <div>
            <label className={lbl}>Unit *</label>
            <select className={inp} value={selectedUnitId} onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setValue("leaseId", "");
            }}>
              <option value="">Select unit</option>
              {selectedProperty!.units.map((u) => <option key={u.id} value={u.id}>{u.number}</option>)}
            </select>
          </div>
        )}

        {selectedUnitId && (
          <div>
            <label htmlFor="leaseId" className={lbl}>Tenant *</label>
            <select id="leaseId" className={inp} {...register("leaseId", { required: "Required" })}>
              <option value="">Select tenant</option>
              {selectedUnit!.leases.map((l) => <option key={l.id} value={l.id}>{l.tenantName}</option>)}
            </select>
            {errors.leaseId && <p className="mt-1 text-xs text-red-500">{errors.leaseId.message}</p>}
          </div>
        )}

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

        <FormActions pending={pending} submitLabel="Record Payment" pendingLabel="Saving…" onCancel={() => router.back()} />
      </form>
    </Modal>
  );
}
