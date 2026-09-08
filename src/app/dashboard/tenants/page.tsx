import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";
import { getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";
import { SearchInput } from "@/components/search-input";
import { SortHeader } from "@/components/sort-header";
import { Suspense } from "react";

export default async function TenantsPage({ searchParams }: Readonly<{ searchParams: Promise<{ q?: string; sort?: string; dir?: string }> }>) {
  const { q, sort, dir } = await searchParams;
  const isDemo = (await getDataMode()) === "demo";
  const allTenants = isDemo
    ? DEMO.tenants
    : await db.query.tenants.findMany({
        with: { property: true },
        orderBy: (tenants, { desc }) => desc(tenants.createdAt),
      });
  const filtered = q
    ? allTenants.filter((t) =>
        [t.name, t.email, t.phone, t.property.name].some((v) =>
          v?.toLowerCase().includes(q.toLowerCase())
        )
      )
    : allTenants;
  const asc = dir !== "desc";
  const tenants = [...filtered].sort((a, b) => {
    let av: string | number = 0, bv: string | number = 0;
    if (sort === "name") { av = a.name; bv = b.name; }
    else if (sort === "property") { av = a.property.name; bv = b.property.name; }
    else if (sort === "rent") { av = a.monthlyRent; bv = b.monthlyRent; }
    else if (sort === "deposit") { av = a.securityDeposit; bv = b.securityDeposit; }
    else if (sort === "movein") {
      av = a.moveInDate instanceof Date ? a.moveInDate.getTime() : (a.moveInDate ?? "");
      bv = b.moveInDate instanceof Date ? b.moveInDate.getTime() : (b.moveInDate ?? "");
    }
    else return 0;
    return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Tenants</h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage all your tenants and their leases.</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SearchInput placeholder="Search tenants..." />
          </Suspense>
          <Link
            href="/dashboard/tenants/new"
            className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            + Add Tenant
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="name" label="Name" /></Suspense></th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="property" label="Property" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="rent" label="Monthly Rent" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="deposit" label="Deposit" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="movein" label="Move-in Date" /></Suspense></th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-900">{tenant.name}</td>
                  <td className="px-5 py-4">
                    <div className="text-slate-700">{tenant.phone}</div>
                    {tenant.email && <div className="text-xs text-slate-400 mt-0.5">{tenant.email}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/properties/${tenant.property.id}`} className="text-indigo-500 hover:underline">
                      {tenant.property.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {money(tenant.monthlyRent, tenant.property.currency)}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {money(tenant.securityDeposit, tenant.property.currency)}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : "—"}
                    {tenant.moveOutDate && <span className="block text-slate-400">→ {new Date(tenant.moveOutDate).toLocaleDateString()}</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/tenants/edit/${tenant.id}`} className="text-xs text-indigo-500 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
              {!tenants.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                    No tenants yet. <Link href="/dashboard/tenants/new" className="text-indigo-500 hover:underline">Add one</Link>.
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
