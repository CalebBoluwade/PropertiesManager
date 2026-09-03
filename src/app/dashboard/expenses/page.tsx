import Link from "next/link";
import { money } from "@/lib/fx";
import { getExpenses } from "./actions";

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryColors: Record<string, string> = {
    MAINTENANCE: "bg-blue-100 text-blue-800",
    REPAIRS: "bg-orange-100 text-orange-800",
    UTILITIES: "bg-green-100 text-green-800",
    PROPERTY_TAX: "bg-purple-100 text-purple-800",
    INSURANCE: "bg-pink-100 text-pink-800",
    MANAGEMENT: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="p-5 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track all property expenses and costs.
          </p>
        </div>
        <Link
          href="/dashboard/expenses/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add Expense
        </Link>
      </div>

      {expenses.length > 0 && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="text-sm text-slate-600">Total Expenses</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {money(totalExpenses, "NGN")}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Property</th>
              <th className="p-4">Category</th>
              <th className="p-4">Description</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="border-b last:border-0 hover:bg-slate-50"
              >
                <td className="p-4 text-sm">
                  {new Date(expense.expenseDate).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <Link
                    href={`/dashboard/properties/${expense.property.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {expense.property.name}
                  </Link>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      categoryColors[expense.category] ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {expense.category.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="p-4">{expense.description}</td>
                <td className="p-4 font-medium">
                  {money(expense.amount, expense.currency)}
                </td>
                <td className="p-4 text-slate-600">{expense.vendor || "—"}</td>
              </tr>
            ))}
            {!expenses.length && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  No expenses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
