import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";

export default async function PaymentsPage() {
  const obligations = await db.query.rentObligations.findMany({
    with: { lease: { with: { tenant: true, property: true } } },
    orderBy: (obligations, { desc }) => desc(obligations.dueDate),
  });

  const statusStyles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    OVERDUE: "bg-red-50 text-red-700",
    PARTIALLY_PAID: "bg-blue-50 text-blue-700",
    DUE: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Rent & Payments</h1>
          <p className="mt-1.5 text-sm text-slate-400">Track all rent obligations and payments.</p>
        </div>
        <Link
          href="/dashboard/payments/new"
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          + Record Payment
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Tenant</th>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Amount Due</th>
                <th className="px-5 py-3.5">Paid</th>
                <th className="px-5 py-3.5">Outstanding</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {obligations.map((obligation) => {
                const outstanding = obligation.amountDue - obligation.amountPaid;
                return (
                  <tr key={obligation.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">{obligation.lease.tenant.name}</td>
                    <td className="px-5 py-4 text-slate-600">{obligation.lease.property.name}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(obligation.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-slate-800">{money(obligation.amountDue, "NGN")}</td>
                    <td className="px-5 py-4 text-slate-600">{money(obligation.amountPaid, "NGN")}</td>
                    <td className={`px-5 py-4 font-medium ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {money(outstanding, "NGN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[obligation.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {obligation.status.replaceAll("_", " ").toLowerCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!obligations.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                    No rent obligations yet. <Link href="/dashboard/payments/new" className="text-indigo-500 hover:underline">Record one</Link>.
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
