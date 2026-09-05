"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { MediaUpload, type MediaFile } from "@/components/media-upload";
import { createProperty } from "@/app/dashboard/properties/actions";
import { uploadPhotos } from "@/app/photos/actions";

type PropertyFormValues = {
  name: string;
  address: string;
  city?: string;
  state?: string;
  propertyTypeId: string;
  numberOfUnits?: number;
  purchasePrice?: number;
  currentValue?: number;
  currency?: string;
  notes?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

export function NewPropertyForm({ propertyTypes }: Readonly<{ propertyTypes: { id: string; name: string }[] }>) {
  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormValues>();
  const [pending, startTransition] = useTransition();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const router = useRouter();

  function onSubmit(data: PropertyFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => {
      const propertyId = await createProperty(fd);
      if (media.length > 0) {
        const photoFd = new FormData();
        media.forEach(({ file }) => photoFd.append("photos", file));
        await uploadPhotos(propertyId, photoFd);
      }
      router.push(`/dashboard/properties/${propertyId}`);
    });
  }

  return (
    <Modal title="Add Property">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={lbl}>Property Name *</label>
            <input id="name" className={inp} placeholder="e.g., Lekki Estate"
              {...register("name", { required: "Required" })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="propertyTypeId" className={lbl}>Property Type *</label>
            <select id="propertyTypeId" className={inp}
              {...register("propertyTypeId", { required: "Required" })}>
              <option value="">Select type</option>
              {propertyTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.propertyTypeId && <p className="mt-1 text-xs text-red-500">{errors.propertyTypeId.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address" className={lbl}>Address *</label>
          <input id="address" className={inp} placeholder="Street address"
            {...register("address", { required: "Required" })} />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={lbl}>City</label>
            <input id="city" className={inp} placeholder="Lagos" {...register("city")} />
          </div>
          <div>
            <label htmlFor="state" className={lbl}>State</label>
            <input id="state" className={inp} placeholder="Lagos" {...register("state")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="numberOfUnits" className={lbl}>Number of Units</label>
            <input id="numberOfUnits" type="number" min={0} className={inp} placeholder="0"
              {...register("numberOfUnits", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="purchasePrice" className={lbl}>Purchase Price (NGN)</label>
            <input id="purchasePrice" type="number" min={0} step="0.01" className={inp} placeholder="0"
              {...register("purchasePrice", { valueAsNumber: true })} />
          </div>
        </div>

        <div>
          <label htmlFor="currentValue" className={lbl}>Current Value (NGN)</label>
          <input id="currentValue" type="number" min={0} step="0.01" className={inp} placeholder="0"
            {...register("currentValue", { valueAsNumber: true })} />
        </div>

        <MediaUpload
          value={media}
          onChange={setMedia}
          accept="image/*,video/*"
          maxFiles={10}
          maxMB={50}
          label="Photos & Videos"
        />

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors">
            {pending ? "Creating…" : "Create Property"}
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
