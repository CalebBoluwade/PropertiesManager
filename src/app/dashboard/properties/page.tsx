import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";

export default async function PropertiesPage() {
  const properties = await db.query.properties.findMany({
    with: { propertyType: true, units: true },
    orderBy: (properties, { desc }) => desc(properties.createdAt),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Properties</h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage your property portfolio.</p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          + Add Property
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Units</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Value</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/properties/${property.id}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                      {property.name}
                    </Link>
                    <div className="text-xs text-slate-400 mt-0.5">{property.address}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{property.propertyType.name}</td>
                  <td className="px-5 py-4 text-slate-600">{property.units.length}</td>
                  <td className="px-5 py-4">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                      {property.status.replaceAll("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {money(Number(property.currentValue ?? 0), property.currency)}
                  </td>
                </tr>
              ))}
              {!properties.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400">
                    No properties yet. <Link href="/dashboard/properties/new" className="text-indigo-500 hover:underline">Add one</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
