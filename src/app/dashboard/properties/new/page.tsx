"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createProperty } from "../actions";
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
  defaultRent?: number;
};

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const labelCls = "block text-sm font-medium text-slate-700";

export default function NewPropertyPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormValues>();
  const [pending, startTransition] = useTransition();
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const MAX_FILES = 10;
  const MAX_MB = 5;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const files = Array.from(e.target.files ?? []);
    const oversized = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (oversized) { setUploadError(`"${oversized.name}" exceeds ${MAX_MB} MB.`); e.target.value = ""; return; }
    if (previews.length + files.length > MAX_FILES) { setUploadError(`Maximum ${MAX_FILES} photos allowed.`); e.target.value = ""; return; }
    const next = files.map((file) => ({ url: URL.createObjectURL(file), file }));
    setPreviews((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  function removePreview(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
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
    <div className="p-5 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Property</h1>
        <p className="mt-2 text-slate-500">Fill in the property details below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelCls}>Property Name *</label>
            <input id="name" className={inputCls} placeholder="e.g., Lekki Estate"
              {...register("name", { required: "Required" })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="propertyTypeId" className={labelCls}>Property Type *</label>
            <input id="propertyTypeId" className={inputCls} placeholder="e.g., residential"
              {...register("propertyTypeId", { required: "Required" })} />
            {errors.propertyTypeId && <p className="mt-1 text-xs text-red-500">{errors.propertyTypeId.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address" className={labelCls}>Address *</label>
          <input id="address" className={inputCls} placeholder="Street address"
            {...register("address", { required: "Required" })} />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={labelCls}>City</label>
            <input id="city" className={inputCls} placeholder="Lagos" {...register("city")} />
          </div>
          <div>
            <label htmlFor="state" className={labelCls}>State</label>
            <input id="state" className={inputCls} placeholder="Lagos" {...register("state")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="numberOfUnits" className={labelCls}>Number of Units</label>
            <input id="numberOfUnits" type="number" min={0} className={inputCls} placeholder="0"
              {...register("numberOfUnits", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="purchasePrice" className={labelCls}>Purchase Price (NGN)</label>
            <input id="purchasePrice" type="number" min={0} step="0.01" className={inputCls} placeholder="0"
              {...register("purchasePrice", { valueAsNumber: true })} />
          </div>
        </div>

        <div>
          <label htmlFor="currentValue" className={labelCls}>Current Value (NGN)</label>
          <input id="currentValue" type="number" min={0} step="0.01" className={inputCls} placeholder="0"
            {...register("currentValue", { valueAsNumber: true })} />
        </div>

        {/* Photo upload */}
        <div>
          <span className={labelCls}>Photos <span className="text-slate-400 font-normal">(max {MAX_FILES} files, {MAX_MB} MB each)</span></span>
          {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          <div className="mt-2 flex flex-wrap gap-3">
            {previews.map(({ url }, i) => (
              <div key={url} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removePreview(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
                  <X size={12} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={previews.length >= MAX_FILES}
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-2xl text-slate-400 hover:border-slate-400 hover:text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed">
              +
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
            {pending ? "Creating…" : "Create Property"}
          </button>
          <Link href="/dashboard/properties"
            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
