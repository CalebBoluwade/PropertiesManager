import Link from "next/link";
import { money } from "@/lib/fx";
import { getExpenses } from "./actions";
import { MediaGrid } from "@/components/media-grid";

export default async function ExpensesPage() {
  const expenses = await getExpenses();
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
        <Link
          href="/dashboard/expenses/new"
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          + Add Expense
        </Link>
      </div>

      {expenses.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-xs">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-slate-900">{money(totalExpenses, "NGN")}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Vendor</th>
                <th className="px-5 py-3.5">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(expense.expenseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
                  <td className="px-5 py-4 text-slate-600">{expense.description || "—"}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{money(expense.amount, expense.currency)}</td>
                  <td className="px-5 py-4 text-slate-500">{expense.vendor || "—"}</td>
                  <td className="px-5 py-4">
                    {expense.receiptUrl ? (
                      <MediaGrid items={[{ id: expense.id, url: expense.receiptUrl, mime: expense.receiptUrl.match(/^data:([^;]+);/)?.[1], caption: expense.description }]} />
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
              {!expenses.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
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
