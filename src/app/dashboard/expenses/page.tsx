import Link from "next/link";
import { money, formatDate } from "@/lib/fx";
import { getExpenses } from "./actions";
import { getCurrency, getDataMode, getDateFormat } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";
import { MediaGrid } from "@/components/media-grid";
import { SearchInput } from "@/components/search-input";
import { SortHeader } from "@/components/sort-header";
import { Suspense } from "react";

type ExpenseListItem = {
  id: string;
  propertyId: string;
  tenantId: string | null;
  category: string;
  description: string;
  amount: number;
  expenseDate: Date;
  vendor: string | null;
  receiptUrl: string | null;
  property: { id: string; name: string; currency?: string };
  tenant: { id: string; name: string } | null;
};

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; dir?: string; propertyId?: string; tenantId?: string }> }) {
  const { q, sort, dir, propertyId, tenantId } = await searchParams;
  const [isDemo, dateFormat, currency] = await Promise.all([
    getDataMode().then((m) => m === "demo"),
    getDateFormat(),
    getCurrency(),
  ]);
  const allExpenses: ExpenseListItem[] = isDemo ? [...DEMO.expenses] : await getExpenses();
  const filtered = (() => {
    let list = allExpenses as typeof allExpenses;
    if (propertyId) list = list.filter((e) => e.propertyId === propertyId);
    if (tenantId) list = list.filter((e) => e.tenantId === tenantId);
    if (q) list = list.filter((e) =>
      [e.category, e.description, e.vendor, e.property.name, e.tenant?.name].some((v) =>
        v?.toLowerCase().includes(q.toLowerCase())
      )
    );
    return list;
  })();
  const asc = dir !== "desc";
  const expenses = [...filtered].sort((a, b) => {
    let av: string | number = 0, bv: string | number = 0;
    if (sort === "date") {
      av = a.expenseDate instanceof Date ? a.expenseDate.getTime() : (a.expenseDate ?? "");
      bv = b.expenseDate instanceof Date ? b.expenseDate.getTime() : (b.expenseDate ?? "");
    }
    else if (sort === "property") { av = a.property.name; bv = b.property.name; }
    else if (sort === "category") { av = a.category; bv = b.category; }
    else if (sort === "amount") { av = a.amount; bv = b.amount; }
    else if (sort === "vendor") { av = a.vendor ?? ""; bv = b.vendor ?? ""; }
    else if (sort === "tenant") { av = a.tenant?.name ?? ""; bv = b.tenant?.name ?? ""; }
    else return 0;
    return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryStyles: Record<string, string> = {
    MAINTENANCE: "bg-blue-50 text-blue-700",
    REPAIRS: "bg-orange-50 text-orange-700",
    UTILITIES: "bg-emerald-50 text-emerald-700",
    PROPERTY_TAX: "bg-purple-50 text-purple-700",
    INSURANCE: "bg-pink-50 text-pink-700",
    MANAGEMENT: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Expenses</h1>
          <p className="mt-1.5 text-sm text-slate-400">Track all property expenses and costs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SearchInput placeholder="Search expenses..." />
          </Suspense>
          <Link
            href="/dashboard/expenses/new"
            className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-xs">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-slate-900">{money(totalExpenses, currency)}</p>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Formula: Σ expense.amount for filtered rows
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="date" label="Date" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="property" label="Property" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="category" label="Category" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="tenant" label="Tenant" /></Suspense></th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="amount" label="Amount" /></Suspense></th>
                <th className="px-5 py-3.5"><Suspense><SortHeader column="vendor" label="Vendor" /></Suspense></th>
                <th className="px-5 py-3.5">Receipt</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {formatDate(expense.expenseDate, dateFormat)}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/properties/${expense.property.id}`} className="text-indigo-500 hover:underline">
                      {expense.property.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[expense.category] ?? "bg-slate-100 text-slate-600"}`}>
                      {expense.category.replaceAll("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{expense.tenant?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600">{expense.description || "—"}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{money(expense.amount, currency)}</td>
                  <td className="px-5 py-4 text-slate-500">{expense.vendor || "—"}</td>
                  <td className="px-5 py-4">
                    {expense.receiptUrl ? (
                      <MediaGrid items={[{ id: expense.id, url: expense.receiptUrl, mime: expense.receiptUrl.match(/^data:([^;]+);/)?.[1], caption: expense.description }]} />
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/expenses/edit/${expense.id}`} className="text-xs text-indigo-500 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
              {!expenses.length && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-400">
                    No expenses yet. <Link href="/dashboard/expenses/new" className="text-indigo-500 hover:underline">Add one</Link>.
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
