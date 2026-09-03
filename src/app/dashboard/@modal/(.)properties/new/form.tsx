"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Modal } from "@/components/modal";
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

export function NewPropertyForm({ propertyTypes }: { propertyTypes: { id: string; name: string }[] }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormValues>();
  const [pending, startTransition] = useTransition();
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const MAX_FILES = 10, MAX_MB = 5;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const files = Array.from(e.target.files ?? []);
    const oversized = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (oversized) { setUploadError(`"${oversized.name}" exceeds ${MAX_MB} MB.`); e.target.value = ""; return; }
    if (previews.length + files.length > MAX_FILES) { setUploadError(`Maximum ${MAX_FILES} photos.`); e.target.value = ""; return; }
    setPreviews((p) => [...p, ...files.map((file) => ({ url: URL.createObjectURL(file), file }))]);
    e.target.value = "";
  }

  function removePreview(i: number) {
    setPreviews((p) => { URL.revokeObjectURL(p[i].url); return p.filter((_, j) => j !== i); });
  }

  function onSubmit(data: PropertyFormValues) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, String(v)));
    startTransition(async () => {
      const propertyId = await createProperty(fd);
      if (previews.length > 0) {
        const photoFd = new FormData();
        previews.forEach(({ file }) => photoFd.append("photos", file));
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

        <div>
          <span className={lbl}>Photos <span className="text-slate-400 font-normal">(max {MAX_FILES}, {MAX_MB} MB each)</span></span>
          {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {previews.map(({ url }, i) => (
              <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removePreview(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                  <X size={11} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={previews.length >= MAX_FILES}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-xl text-slate-300 hover:border-slate-300 hover:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed">
              +
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
        </div>

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
