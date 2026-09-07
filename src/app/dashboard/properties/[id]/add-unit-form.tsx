"use client";

import { useTransition, useRef } from "react";
import { addUnit } from "@/app/dashboard/properties/actions";

const RESIDENTIAL_UNIT_TYPES = ["Studio","1 Bedroom","2 Bedroom","3 Bedroom","4 Bedroom","5+ Bedroom","Duplex","Penthouse","Self-Contain"];
const COMMERCIAL_UNIT_TYPES = ["Open Plan Office","Private Office","Shop","Warehouse","Showroom","Restaurant Space","Co-working Space","Storage Unit"];

function getUnitTypes(propertyTypeName: string) {
  const name = propertyTypeName.toLowerCase();
  if (name.includes("commercial") || name.includes("office") || name.includes("retail") || name.includes("industrial")) {
    return COMMERCIAL_UNIT_TYPES;
  }
  return RESIDENTIAL_UNIT_TYPES;
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors";

export function AddUnitForm({ propertyId, propertyTypeName }: { propertyId: string; propertyTypeName: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const unitTypes = getUnitTypes(propertyTypeName);

  function action(formData: FormData) {
    startTransition(async () => {
      await addUnit(propertyId, formData);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={action} className="px-5 py-4 border-t border-slate-100 bg-slate-50/60">
      <p className="text-xs font-medium text-slate-500 mb-3">Add Unit</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="unitNumber" required placeholder="Unit number / name" className={inp} />
        <select name="unitType" className={inp}>
          <option value="">Unit type</option>
          {unitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input name="monthlyRent" type="number" min={0} step="0.01" placeholder="Monthly rent" className={inp} />
      </div>
      <button type="submit" disabled={pending}
        className="mt-3 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors">
        {pending ? "Adding…" : "+ Add Unit"}
      </button>
    </form>
  );
}
