import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";

export default async function TenantsPage() {
  const tenants = await db.query.tenants.findMany({
    with: { property: true },
    orderBy: (tenants, { desc }) => desc(tenants.createdAt),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Tenants</h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage all your tenants and their leases.</p>
        </div>
        <Link
          href="/dashboard/tenants/new"
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          + Add Tenant
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Monthly Rent</th>
                <th className="px-5 py-3.5">Deposit</th>
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
                </tr>
              ))}
              {!tenants.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400">
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
