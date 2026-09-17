import Link from "next/link";
import { db } from "@/db";
import { money, formatDate } from "@/lib/fx";
import { getCurrency, getDataMode, getDateFormat } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";
import { getPayments } from "./actions";
import { SearchInput } from "@/components/search-input";
import { SortHeader } from "@/components/sort-header";
import { Suspense } from "react";

type RentObligationListItem = {
  id: string;
  propertyId: string;
  unitId: string | null;
  amountDue: number;
  amountPaid: number;
  status: string;
  dueDate: Date;
  lease: {
    tenant: { id?: string; name: string };
    property: { name: string };
  };
};

export default async function PaymentsPage({ searchParams }: Readonly<{ searchParams: Promise<{ q?: string; sort?: string; dir?: string; propertyId?: string; tenantId?: string }> }>) {
  const { q, sort, dir, propertyId, tenantId } = await searchParams;
  const [isDemo, dateFormat, currency] = await Promise.all([
    getDataMode().then((m) => m === "demo"),
    getDateFormat(),
    getCurrency(),
  ]);
  const allObligations: RentObligationListItem[] = isDemo
    ? [...DEMO.obligations]
    : await db.query.rentObligations.findMany({
        with: { lease: { with: { tenant: true, property: true } } },
        orderBy: (obligations, { desc }) => desc(obligations.dueDate),
      });
  const filteredObligations = (() => {
    let list = allObligations as typeof allObligations;
    if (propertyId) list = list.filter((o) => o.propertyId === propertyId);
    if (tenantId) list = list.filter((o) => o.lease.tenant.id === tenantId);
    if (q) list = list.filter((o) =>
      [o.lease.tenant.name, o.lease.property.name, o.status].some((v) => v?.toLowerCase().includes(q.toLowerCase()))
    );
    return list;
  })();
  const asc = dir !== "desc";
  const obligations = [...filteredObligations].sort((a, b) => {
    let av: string | number = 0, bv: string | number = 0;
    if (sort === "tenant") { av = a.lease.tenant.name; bv = b.lease.tenant.name; }
    else if (sort === "property") { av = a.lease.property.name; bv = b.lease.property.name; }
    else if (sort === "due") { av = a.dueDate instanceof Date ? a.dueDate.getTime() : String(a.dueDate); bv = b.dueDate instanceof Date ? b.dueDate.getTime() : String(b.dueDate); }
    else if (sort === "amount") { av = a.amountDue; bv = b.amountDue; }
    else if (sort === "paid") { av = a.amountPaid; bv = b.amountPaid; }
    else if (sort === "outstanding") { av = a.amountDue - a.amountPaid; bv = b.amountDue - b.amountPaid; }
    else if (sort === "status") { av = a.status; bv = b.status; }
    else return 0;
    return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
  const paymentRecords = isDemo ? [] : await getPayments();

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
        <div className="flex items-center gap-3">
          <Suspense>
            <SearchInput placeholder="Search payments..." />
          </Suspense>
          <Link
            href="/dashboard/payments/new"
            className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            + Record Payment
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-xs">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
          Formula: outstanding = amountDue − amountPaid; status is derived from due date + payment totals
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="tenant" label="Tenant" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="property" label="Property" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="due" label="Due Date" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="amount" label="Amount Due" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="paid" label="Paid" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="outstanding" label="Outstanding" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="status" label="Status" /></Suspense></th>
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
                      {formatDate(obligation.dueDate, dateFormat)}
                    </td>
                    <td className="px-5 py-4 text-slate-800">{money(obligation.amountDue, currency)}</td>
                    <td className="px-5 py-4 text-slate-600">{money(obligation.amountPaid, currency)}</td>
                    <td className={`px-5 py-4 font-medium ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {money(outstanding, currency)}
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

      {paymentRecords.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Property</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {paymentRecords.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-xs text-slate-500">{formatDate(p.paymentDate, dateFormat)}</td>
                    <td className="px-5 py-4 text-slate-600">{p.unit?.property.name ?? "—"}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{money(p.amount, currency)}</td>
                    <td className="px-5 py-4 text-slate-500">{p.notes || "—"}</td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/payments/edit/${p.id}`} className="text-xs text-indigo-500 hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
