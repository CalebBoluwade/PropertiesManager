"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { updateTenant } from "@/app/dashboard/tenants/actions";
import { FormActions } from "@/components/form-actions";

type TenantFormValues = {
  name: string;
  email?: string;
  phone: string;
  propertyId: string;
  monthlyRent?: number;
  securityDeposit?: number;
  moveInDate?: string;
  moveOutDate?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

type Tenant = { id: string; name: string; email: string | null; phone: string; propertyId: string; monthlyRent: number; securityDeposit: number; moveInDate?: Date | null; moveOutDate?: Date | null };

export function EditTenantForm({ tenant, properties }: { tenant: Tenant; properties: { id: string; name: string }[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<TenantFormValues>({
    defaultValues: {
      name: tenant.name,
      email: tenant.email ?? "",
      phone: tenant.phone,
      propertyId: tenant.propertyId,
      monthlyRent: tenant.monthlyRent,
      securityDeposit: tenant.securityDeposit,
      moveInDate: tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().split("T")[0] : "",
      moveOutDate: tenant.moveOutDate ? new Date(tenant.moveOutDate).toISOString().split("T")[0] : "",
    },
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(data: TenantFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => { await updateTenant(tenant.id, fd); router.back(); });
  }

  return (
    <Modal title="Edit Tenant">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={lbl}>Full Name *</label>
            <input id="name" className={inp} {...register("name", { required: "Required" })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className={lbl}>Email</label>
            <input id="email" type="email" className={inp} {...register("email")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={lbl}>Phone Number *</label>
            <input id="phone" type="tel" className={inp} {...register("phone", { required: "Required" })} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="propertyId" className={lbl}>Property *</label>
            <select id="propertyId" className={inp} {...register("propertyId", { required: "Required" })}>
              <option value="">Select property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="monthlyRent" className={lbl}>Monthly Rent (NGN)</label>
            <input id="monthlyRent" type="number" min={0} step="0.01" className={inp} {...register("monthlyRent", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="securityDeposit" className={lbl}>Security Deposit (NGN)</label>
            <input id="securityDeposit" type="number" min={0} step="0.01" className={inp} {...register("securityDeposit", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="moveInDate" className={lbl}>Move-in Date</label>
            <input id="moveInDate" type="date" className={inp} {...register("moveInDate")} />
          </div>
          <div>
            <label htmlFor="moveOutDate" className={lbl}>Move-out Date</label>
            <input id="moveOutDate" type="date" className={inp} {...register("moveOutDate")} />
          </div>
        </div>

        <FormActions pending={pending} submitLabel="Save Changes" pendingLabel="Saving…" onCancel={() => router.back()} />
      </form>
    </Modal>
  );
}
