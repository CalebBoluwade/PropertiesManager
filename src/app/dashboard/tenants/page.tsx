import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";

export default async function TenantsPage() {
  const tenants = await db.query.tenants.findMany({
    with: { property: true },
    orderBy: (tenants, { desc }) => desc(tenants.createdAt),
  });

  return (
    <div className="p-5 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all your tenants and their leases.
          </p>
        </div>
        <Link
          href="/dashboard/tenants/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add Tenant
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Property</th>
              <th className="p-4">Monthly Rent</th>
              <th className="p-4">Security Deposit</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="border-b last:border-0 hover:bg-slate-50"
              >
                <td className="p-4 font-medium">{tenant.name}</td>
                <td className="p-4 text-slate-600">{tenant.email || "—"}</td>
                <td className="p-4">{tenant.phone}</td>
                <td className="p-4">
                  <Link
                    href={`/dashboard/properties/${tenant.property.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {tenant.property.name}
                  </Link>
                </td>
                <td className="p-4">
                  {money(tenant.monthlyRent, tenant.property.currency)}
                </td>
                <td className="p-4">
                  {money(tenant.securityDeposit, tenant.property.currency)}
                </td>
              </tr>
            ))}
            {!tenants.length && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  No tenants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
