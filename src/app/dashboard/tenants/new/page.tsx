"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { createTenant } from "../actions";

type TenantFormValues = {
  name: string;
  email?: string;
  phone: string;
  unitId: string;
  leaseStart: string;
  leaseEnd?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  notes?: string;
};

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const labelCls = "block text-sm font-medium text-slate-700";

export default function NewTenantPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<TenantFormValues>();
  const [pending, startTransition] = useTransition();

  function onSubmit(data: TenantFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => {
      await createTenant(fd);
    });
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Tenant</h1>
        <p className="mt-2 text-slate-500">Fill in the tenant details below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelCls}>Full Name *</label>
            <input id="name" className={inputCls} placeholder="John Doe"
              {...register("name", { required: "Required" })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input id="email" type="email" className={inputCls} placeholder="john@example.com"
              {...register("email")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelCls}>Phone Number *</label>
            <input id="phone" type="tel" className={inputCls} placeholder="0801234567"
              {...register("phone", { required: "Required" })} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="unitId" className={labelCls}>Unit ID *</label>
            <input id="unitId" className={inputCls} placeholder="Unit ID"
              {...register("unitId", { required: "Required" })} />
            {errors.unitId && <p className="mt-1 text-xs text-red-500">{errors.unitId.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="leaseStart" className={labelCls}>Lease Start *</label>
            <input id="leaseStart" type="date" className={inputCls}
              {...register("leaseStart", { required: "Required" })} />
            {errors.leaseStart && <p className="mt-1 text-xs text-red-500">{errors.leaseStart.message}</p>}
          </div>
          <div>
            <label htmlFor="leaseEnd" className={labelCls}>Lease End</label>
            <input id="leaseEnd" type="date" className={inputCls} {...register("leaseEnd")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="monthlyRent" className={labelCls}>Monthly Rent (NGN)</label>
            <input id="monthlyRent" type="number" min={0} step="0.01" className={inputCls} placeholder="0"
              {...register("monthlyRent", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="securityDeposit" className={labelCls}>Security Deposit (NGN)</label>
            <input id="securityDeposit" type="number" min={0} step="0.01" className={inputCls} placeholder="0"
              {...register("securityDeposit", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
            {pending ? "Creating…" : "Create Tenant"}
          </button>
          <a href="/dashboard/tenants"
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
