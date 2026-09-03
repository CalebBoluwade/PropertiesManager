"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { createTenant } from "@/app/dashboard/tenants/actions";

type TenantFormValues = {
  name: string;
  email?: string;
  phone: string;
  unitId: string;
  leaseStart: string;
  leaseEnd?: string;
  monthlyRent?: number;
  securityDeposit?: number;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

export function NewTenantForm({ units }: { units: { id: string; label: string }[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<TenantFormValues>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(data: TenantFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => { await createTenant(fd); router.back(); });
  }

  return (
    <Modal title="Add Tenant">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={lbl}>Full Name *</label>
            <input id="name" className={inp} placeholder="John Doe"
              {...register("name", { required: "Required" })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className={lbl}>Email</label>
            <input id="email" type="email" className={inp} placeholder="john@example.com" {...register("email")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={lbl}>Phone Number *</label>
            <input id="phone" type="tel" className={inp} placeholder="0801234567"
              {...register("phone", { required: "Required" })} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="unitId" className={lbl}>Unit *</label>
            <select id="unitId" className={inp} {...register("unitId", { required: "Required" })}>
              <option value="">Select vacant unit</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            {errors.unitId && <p className="mt-1 text-xs text-red-500">{errors.unitId.message}</p>}
            {units.length === 0 && <p className="mt-1 text-xs text-amber-500">No vacant units available.</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="leaseStart" className={lbl}>Lease Start *</label>
            <input id="leaseStart" type="date" className={inp}
              {...register("leaseStart", { required: "Required" })} />
            {errors.leaseStart && <p className="mt-1 text-xs text-red-500">{errors.leaseStart.message}</p>}
          </div>
          <div>
            <label htmlFor="leaseEnd" className={lbl}>Lease End</label>
            <input id="leaseEnd" type="date" className={inp} {...register("leaseEnd")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="monthlyRent" className={lbl}>Monthly Rent (NGN)</label>
            <input id="monthlyRent" type="number" min={0} step="0.01" className={inp} placeholder="0"
              {...register("monthlyRent", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="securityDeposit" className={lbl}>Security Deposit (NGN)</label>
            <input id="securityDeposit" type="number" min={0} step="0.01" className={inp} placeholder="0"
              {...register("securityDeposit", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors">
            {pending ? "Creating…" : "Create Tenant"}
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
