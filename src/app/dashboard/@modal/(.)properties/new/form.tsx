"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { MediaUpload, type MediaFile } from "@/components/media-upload";
import { createProperty } from "@/app/dashboard/properties/actions";
import { uploadPhotos } from "@/app/photos/actions";
import { COUNTRIES } from "@/lib/countries";
import { FormActions } from "@/components/form-actions";

const RESIDENTIAL_UNIT_TYPES = ["Studio","1 Bedroom","2 Bedroom","3 Bedroom","4 Bedroom","5+ Bedroom","Duplex","Penthouse","Self-Contain"];
const COMMERCIAL_UNIT_TYPES = ["Open Plan Office","Private Office","Shop","Warehouse","Showroom","Restaurant Space","Co-working Space","Storage Unit"];

function getUnitTypes(propertyTypeName: string) {
  const name = propertyTypeName.toLowerCase();
  if (name.includes("commercial") || name.includes("office") || name.includes("retail") || name.includes("industrial")) {
    return COMMERCIAL_UNIT_TYPES;
  }
  return RESIDENTIAL_UNIT_TYPES;
}

type PropertyFormValues = {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  propertyTypeId: string;
  numberOfUnits?: number;
  defaultUnitType?: string;
  purchasePrice?: number;
  currentValue?: number;
  currency?: string;
  notes?: string;
};

const inp = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";
const lbl = "block text-sm font-medium text-slate-700";

export function NewPropertyForm({ propertyTypes }: Readonly<{ propertyTypes: { id: string; name: string }[] }>) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PropertyFormValues>();
  const [pending, startTransition] = useTransition();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const router = useRouter();

  const selectedTypeId = watch("propertyTypeId");
  const selectedType = propertyTypes.find((t) => t.id === selectedTypeId);
  const unitTypes = getUnitTypes(selectedType?.name ?? "");

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

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className={lbl}>City</label>
            <input id="city" className={inp} placeholder="Lagos" {...register("city")} />
          </div>
          <div>
            <label htmlFor="state" className={lbl}>State</label>
            <input id="state" className={inp} placeholder="Lagos" {...register("state")} />
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
            <label htmlFor="numberOfUnits" className={lbl}>Number of Units</label>
            <input id="numberOfUnits" type="number" min={0} className={inp} placeholder="0"
              {...register("numberOfUnits", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="defaultUnitType" className={lbl}>Unit Type</label>
            <select id="defaultUnitType" className={inp} {...register("defaultUnitType")}>
              <option value="">Select type</option>
              {unitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="purchasePrice" className={lbl}>Purchase Price (NGN)</label>
            <input id="purchasePrice" type="number" min={0} step="0.01" className={inp} placeholder="0"
              {...register("purchasePrice", { valueAsNumber: true })} />
          </div>
          <div>
            <label htmlFor="currentValue" className={lbl}>Current Value (NGN)</label>
            <input id="currentValue" type="number" min={0} step="0.01" className={inp} placeholder="0"
              {...register("currentValue", { valueAsNumber: true })} />
          </div>
        </div>

        <MediaUpload
          value={media}
          onChange={setMedia}
          accept="image/*,video/*"
          maxFiles={10}
          maxMB={50}
          label="Photos & Videos"
        />

        <FormActions pending={pending} submitLabel="Create Property" pendingLabel="Creating…" onCancel={() => router.back()} />
      </form>
    </Modal>
  );
}
