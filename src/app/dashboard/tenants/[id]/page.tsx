import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";
import { eq } from "drizzle-orm";
import { tenants as tenantsTable } from "@/db/schema";
import { getCurrency, getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";

type Obligation = { id: string; amountPaid: number; amountDue: number };
type Expense = { id: string; description: string; category: string; amount: number };

export default async function TenantDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const [dataMode, currency] = await Promise.all([getDataMode(), getCurrency()]);
  const isDemo = dataMode === "demo";

  const tenant = isDemo
    ? (() => {
        const t = DEMO.tenants.find((t) => t.id === id) ?? null;
        if (!t) return null;
        return { ...t, expenses: [] as Expense[], obligations: [] as Obligation[] };
      })()
    : await db.query.tenants.findFirst({
        where: eq(tenantsTable.id, id),
        with: { property: true, leases: { with: { obligations: true } } },
      }).then(async (t) => {
        if (!t) return null;
        const expenses = await db.query.expenses.findMany({
          where: (e, { eq }) => eq(e.tenantId, id),
          orderBy: (e, { desc }) => [desc(e.expenseDate)],
        });
        const obligations = t.leases.flatMap((l) => l.obligations);
        return { ...t, expenses, obligations };
      }) ?? null;

  if (!tenant) notFound();

  const collectedObligations = tenant.obligations.filter((o) => o.amountPaid > 0);
  const totalIncome = collectedObligations.reduce((s, o) => s + Number(o.amountPaid), 0) || tenant.monthlyRent;
  const totalExpenses = tenant.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const pl = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Tenant</p>
          <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">{tenant.name}</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            <Link href={`/dashboard/properties/${tenant.property.id}`} className="text-indigo-500 hover:underline">
              {tenant.property.name}
            </Link>
          </p>
        </div>
        <Link href={`/dashboard/tenants/edit/${tenant.id}`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          Edit
        </Link>
      </div>

      {(tenant.phone || tenant.email) && (
        <div className="flex gap-4 text-sm">
          {tenant.phone && <span className="flex items-center gap-1.5"><span className="text-slate-400">Phone:</span><Link href={`tel:${tenant.phone}`} className="text-indigo-500 hover:underline">{tenant.phone}</Link></span>}
          {tenant.email && <span className="flex items-center gap-1.5"><span className="text-slate-400">Email:</span><Link href={`mailto:${tenant.email}`} className="text-indigo-500 hover:underline">{tenant.email}</Link></span>}
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Metric label="Monthly Rent" value={money(tenant.monthlyRent, currency)} formula="tenant.monthlyRent" />
        <Metric label="Security Deposit" value={money(tenant.securityDeposit, currency)} formula="stored security deposit" />
        <Metric label="Move-in Date" value={tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : "—"} formula="lease start date" />
        <Metric label="Move-out Date" value={tenant.moveOutDate ? new Date(tenant.moveOutDate).toLocaleDateString() : "—"} formula="lease end date" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Profit / Loss</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Formula: totalIncome = Σ amountPaid; totalExpenses = Σ expense.amount; net = totalIncome − totalExpenses
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <tbody>
            {/* Income rows */}
            {collectedObligations.length > 0 ? collectedObligations.map((o, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-24">Income</td>
                <td className="px-5 py-3 text-slate-700">Rent collected</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{o.amountPaid < o.amountDue ? "Partial" : "Full"}</td>
                <td className="px-5 py-3 text-right font-medium text-emerald-600">
                  <Link href={`/dashboard/payments?tenantId=${tenant.id}`} className="hover:underline">{money(o.amountPaid, currency)}</Link>
                </td>
              </tr>
            )) : (
              <tr className="border-b border-slate-50">
                <td className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-24">Income</td>
                <td className="px-5 py-3 text-slate-700">{tenant.name}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">Monthly rent</td>
                <td className="px-5 py-3 text-right font-medium text-emerald-600">
                  <Link href={`/dashboard/payments?tenantId=${tenant.id}`} className="hover:underline">{money(tenant.monthlyRent, currency)}</Link>
                </td>
              </tr>
            )}
            {/* Expense rows */}
            {tenant.expenses.map((e) => (
              <tr key={e.id} className="border-b border-slate-50">
                <td className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wide">Expense</td>
                <td className="px-5 py-3 text-slate-700">{e.description || e.category}</td>
                <td className="px-5 py-3 text-slate-400 text-xs capitalize">{e.category.replaceAll("_", " ").toLowerCase()}</td>
                <td className="px-5 py-3 text-right font-medium text-red-500">
                  <Link href={`/dashboard/expenses?tenantId=${tenant.id}`} className="hover:underline">−{money(e.amount, currency)}</Link>
                </td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Income</td>
              <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{money(totalIncome, currency)}</td>
            </tr>
            <tr className="bg-slate-50">
              <td colSpan={3} className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Expenses</td>
              <td className="px-5 py-3.5 text-right font-semibold text-red-500">−{money(totalExpenses, currency)}</td>
            </tr>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-5 py-4 text-sm font-bold text-slate-800 uppercase tracking-wide">Net Profit / Loss</td>
              <td className={`px-5 py-4 text-right text-lg font-bold ${pl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {pl >= 0 ? "+" : ""}{money(pl, currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, formula }: Readonly<{ label: string; value: string; formula?: string }>) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      {formula && <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">Formula: <span className="normal-case tracking-normal text-slate-500">{formula}</span></p>}
    </div>
  );
}
