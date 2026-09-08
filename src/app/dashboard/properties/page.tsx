import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";
import { getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";
import { SearchInput } from "@/components/search-input";
import { SortHeader } from "@/components/sort-header";
import { Suspense } from "react";

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; dir?: string }> }) {
  const { q, sort, dir } = await searchParams;
  const isDemo = (await getDataMode()) === "demo";
  const allProperties = isDemo
    ? DEMO.properties
    : await db.query.properties.findMany({
        with: { propertyType: true, units: true },
        orderBy: (properties, { desc }) => desc(properties.createdAt),
      });
  const filtered = q
    ? allProperties.filter((p) =>
        [p.name, p.address, p.city, p.state, p.status].some((v) =>
          v?.toLowerCase().includes(q.toLowerCase())
        )
      )
    : allProperties;
  const asc = dir !== "desc";
  const properties = [...filtered].sort((a, b) => {
    let av: string | number = 0, bv: string | number = 0;
    if (sort === "name") { av = a.name; bv = b.name; }
    else if (sort === "type") { av = a.propertyType.name; bv = b.propertyType.name; }
    else if (sort === "units") { av = a.units.length; bv = b.units.length; }
    else if (sort === "status") { av = a.status; bv = b.status; }
    else if (sort === "value") { av = Number(a.currentValue ?? 0); bv = Number(b.currentValue ?? 0); }
    else return 0;
    return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Properties</h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage your property portfolio.</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SearchInput placeholder="Search properties..." />
          </Suspense>
          <Link
            href="/dashboard/properties/new"
            className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            + Add Property
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="name" label="Property" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="type" label="Type" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="units" label="Units" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="status" label="Status" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="value" label="Value" /></Suspense></th>
                <th className="px-5 py-3.5"></th>
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
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/properties/edit/${property.id}`} className="text-xs text-indigo-500 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
              {!properties.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-400">
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
