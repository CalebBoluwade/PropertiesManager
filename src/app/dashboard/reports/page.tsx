import { db } from "@/db";
import { money } from "@/lib/fx";

export default async function ReportsPage() {
  const [properties, tenants, rentObligations, expenses] = await Promise.all([
    db.query.properties.findMany({ with: { units: true } }),
    db.query.tenants.findMany(),
    db.query.rentObligations.findMany(),
    db.query.expenses.findMany(),
  ]);

  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length, 0);
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : "0";
  const portfolioValue = properties.reduce((sum, p) => sum + Number(p.currentValue ?? 0), 0);
  const totalTenants = tenants.length;

  const paidRent = rentObligations.filter((r) => r.status === "PAID").reduce((sum, r) => sum + r.amountDue, 0);
  const pendingRent = rentObligations.filter((r) => r.status === "PENDING" || r.status === "DUE").reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);
  const overdueRent = rentObligations.filter((r) => r.status === "OVERDUE").reduce((sum, r) => sum + (r.amountDue - r.amountPaid), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();
  const monthlyExpenses = expenses
    .filter((e) => { const d = new Date(e.expenseDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory: Record<string, number> = {};
  expenses.forEach((e) => { expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">Reports</h1>
        <p className="mt-1.5 text-sm text-slate-400">Portfolio performance overview.</p>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Properties", value: String(totalProperties) },
          { label: "Total Units", value: String(totalUnits) },
          { label: "Occupancy", value: `${occupancyRate}%`, sub: `${occupiedUnits} of ${totalUnits} units` },
          { label: "Portfolio Value", value: money(portfolioValue, "NGN") },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Rent summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 shadow-xs">
          <p className="text-xs font-medium text-emerald-500 uppercase tracking-widest mb-1">Paid Rent</p>
          <p className="text-2xl font-bold text-emerald-900">{money(paidRent, "NGN")}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 shadow-xs">
          <p className="text-xs font-medium text-amber-500 uppercase tracking-widest mb-1">Pending Rent</p>
          <p className="text-2xl font-bold text-amber-900">{money(pendingRent, "NGN")}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 shadow-xs">
          <p className="text-xs font-medium text-red-400 uppercase tracking-widest mb-1">Overdue Rent</p>
          <p className="text-2xl font-bold text-red-900">{money(overdueRent, "NGN")}</p>
        </div>
      </div>

      {/* Expenses + Tenants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">All-time Expenses</p>
          <p className="text-2xl font-bold text-slate-900">{money(totalExpenses, "NGN")}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">This Month</p>
          <p className="text-2xl font-bold text-slate-900">{money(monthlyExpenses, "NGN")}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Active Tenants</p>
          <p className="text-2xl font-bold text-slate-900">{totalTenants}</p>
        </div>
      </div>

      {/* Expenses by category */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Expenses by Category</p>
        </div>
        <div className="divide-y divide-slate-50">
          {Object.entries(expensesByCategory).length > 0 ? (
            Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-slate-700 capitalize">{category.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="text-sm font-semibold text-slate-900">{money(amount, "NGN")}</span>
                </div>
              ))
          ) : (
            <p className="px-5 py-10 text-sm text-slate-400 text-center">No expenses recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
