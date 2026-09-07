"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { updateProperty } from "@/app/dashboard/properties/actions";
import { COUNTRIES } from "@/lib/countries";
import { FormActions } from "@/components/form-actions";

type PropertyFormValues = {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  propertyTypeId: string;
  purchasePrice?: number;
  currentValue?: number;
  notes?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

type Property = { id: string; name: string; address: string; city: string | null; state: string | null; country: string | null; propertyTypeId: string; purchasePrice: number | null; currentValue: number | null; notes: string | null };

export function EditPropertyForm({ property, propertyTypes }: { property: Property; propertyTypes: { id: string; name: string }[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormValues>({
    defaultValues: {
      name: property.name,
      address: property.address,
      city: property.city ?? "",
      state: property.state ?? "",
      country: property.country ?? "Nigeria",
      propertyTypeId: property.propertyTypeId,
      purchasePrice: property.purchasePrice ?? undefined,
      currentValue: property.currentValue ?? undefined,
      notes: property.notes ?? "",
    },
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(data: PropertyFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => { await updateProperty(property.id, fd); });
  }

  return (
    <Modal title="Edit Property">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={lbl}>Property Name *</label>
            <input id="name" className={inp} {...register("name", { required: "Required" })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="propertyTypeId" className={lbl}>Property Type *</label>
            <select id="propertyTypeId" className={inp} {...register("propertyTypeId", { required: "Required" })}>
              <option value="">Select type</option>
              {propertyTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.propertyTypeId && <p className="mt-1 text-xs text-red-500">{errors.propertyTypeId.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address" className={lbl}>Address *</label>
          <input id="address" className={inp} {...register("address", { required: "Required" })} />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className={lbl}>City</label>
            <input id="city" className={inp} {...register("city")} />
          </div>
          <div>
            <label htmlFor="state" className={lbl}>State</label>
            <input id="state" className={inp} {...register("state")} />
          </div>
          <div>
            <label htmlFor="country" className={lbl}>Country</label>
            <select id="country" className={inp} {...register("country")}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="purchasePrice" className={lbl}>Purchase Price (NGN)</label>
            <input id="purchasePrice" type="number" min={0} step="0.01" className={inp} {...register("purchasePrice", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="currentValue" className={lbl}>Current Value (NGN)</label>
            <input id="currentValue" type="number" min={0} step="0.01" className={inp} {...register("currentValue", { valueAsNumber: true })} />
          </div>
        </div>

        <FormActions pending={pending} submitLabel="Save Changes" pendingLabel="Saving…" onCancel={() => router.back()} />
      </form>
    </Modal>
  );
}
