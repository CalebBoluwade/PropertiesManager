import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";
import { eq } from "drizzle-orm";
import { leases, properties as propertiesTable } from "@/db/schema";
import { MediaGrid } from "@/components/media-grid";
import { getCurrency, getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";
import { AddUnitForm } from "./add-unit-form";

function mimeFromDataUri(url: string) {
  const m = url.match(/^data:([^;]+);/);
  return m ? m[1] : null;
}

export default async function PropertyDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const [dataMode, currency] = await Promise.all([getDataMode(), getCurrency()]);
  const isDemo = dataMode === "demo";

  const property = isDemo
    ? DEMO.properties.find((p) => p.id === id) ?? null
    : await db.query.properties.findFirst({
        where: eq(propertiesTable.id, id),
        with: { propertyType: true, units: true, expenses: true, obligations: true, photos: true, documents: true },
      }) ?? null;

  if (!property) notFound();

  const activeLeases = isDemo
    ? []
    : await db.query.leases.findMany({
        where: eq(leases.propertyId, id),
        with: { tenant: true, unit: true },
      });

  const unitTenantMap = new Map<string, string>();
  if (isDemo) {
    const demoUnitTenantMap: Record<string, string> = {
      "demo-u-1": "Adaeze Okonkwo",
      "demo-u-2": "Emeka Nwosu",
      "demo-u-3": "Fatima Aliyu",
      "demo-u-7": "Chidi Enterprises",
      "demo-u-8": "Zenith Consulting",
      "demo-u-11": "Bola Tinubu-James",
      "demo-u-12": "Ngozi Adeyemi",
      "demo-u-13": "Tunde Bakare",
      "demo-u-14": "Amina Suleiman",
    };
    Object.entries(demoUnitTenantMap).forEach(([unitId, tenantName]) => unitTenantMap.set(unitId, tenantName));
  } else {
    activeLeases.forEach((lease) => {
      if (lease.unitId && lease.tenant) unitTenantMap.set(lease.unitId, lease.tenant.name);
    });
  }

  const monthlyRent = property.units.reduce((sum: number, u) => sum + Number(u.monthlyRent ?? 0), 0);
  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
  const totalIncome = isDemo
    ? (DEMO.tenants.filter((t) => t.propertyId === id).reduce((sum, t) => sum + t.monthlyRent, 0))
    : ((property as { obligations?: { amountPaid: number }[] }).obligations ?? [])
        .reduce((sum, o) => sum + Number(o.amountPaid ?? 0), 0);
  const totalExpenses = property.expenses.reduce((sum: number, e) => sum + Number(e.amount ?? 0), 0);
  const pl = totalIncome - totalExpenses;

  const mediaItems = property.photos.map((p) => ({
    id: p.id,
    url: p.url,
    mime: mimeFromDataUri(p.url),
    caption: p.caption,
  }));

  const docItems = property.documents.map((d) => ({
    id: d.id,
    url: d.url,
    mime: d.mimeType,
    caption: d.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{property.propertyType.name}</p>
        <h1 className="text-[1.6rem] font-bold text-slate-900 tracking-tight leading-none">{property.name}</h1>
        <p className="mt-1.5 text-sm text-slate-400">{property.address}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Metric label="Current Value" value={money(Number(property.currentValue ?? 0), currency)} formula="stored property value" />
        <Metric label="Purchase Price" value={money(Number(property.purchasePrice ?? 0), currency)} formula="stored purchase price" />
        <Metric label="Monthly Rent" value={money(monthlyRent, currency)} formula="Σ unit.monthlyRent" />
        <Metric label="Occupancy" value={`${occupied} / ${property.units.length}`} formula="occupied ÷ totalUnits × 100" />
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
            {/* Income rows — paid payments only */}
            {isDemo
              ? DEMO.tenants.filter((t) => t.propertyId === id).map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-24">Income</td>
                    <td className="px-5 py-3 text-slate-700">{t.name}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">Monthly rent</td>
                    <td className="px-5 py-3 text-right font-medium text-emerald-600">{money(t.monthlyRent, currency)}</td>
                  </tr>
                ))
              : ((property as { obligations?: { id: string; amountPaid: number; amountDue: number; leaseId: string }[] }).obligations ?? [])
                  .filter((o) => o.amountPaid > 0)
                  .map((o) => (
                    <tr key={o.id} className="border-b border-slate-50">
                      <td className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wide w-24">Income</td>
                      <td className="px-5 py-3 text-slate-700">Rent collected</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{o.amountPaid < o.amountDue ? "Partial" : "Full"}</td>
                      <td className="px-5 py-3 text-right font-medium text-emerald-600">
                        <Link href={`/dashboard/payments?propertyId=${property.id}`} className="hover:underline">{money(o.amountPaid, currency)}</Link>
                      </td>
                    </tr>
                  ))
            }
            {/* Expense rows */}
            {property.expenses.map((e) => (
              <tr key={e.id} className="border-b border-slate-50">
                <td className="px-5 py-3 text-slate-500 text-xs uppercase tracking-wide">Expense</td>
                <td className="px-5 py-3 text-slate-700">{e.description || e.category}</td>
                <td className="px-5 py-3 text-slate-400 text-xs capitalize">{e.category.replaceAll("_", " ").toLowerCase()}</td>
                <td className="px-5 py-3 text-right font-medium text-red-500">
                  <Link href={`/dashboard/expenses?propertyId=${property.id}`} className="hover:underline">−{money(e.amount, currency)}</Link>
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

      {mediaItems.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
          <p className="text-sm font-semibold text-slate-800 mb-3">Photos & Videos</p>
          <MediaGrid items={mediaItems} />
        </div>
      )}

      {docItems.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
          <p className="text-sm font-semibold text-slate-800 mb-3">Documents</p>
          <MediaGrid items={docItems} />
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Units</p>
        </div>
        <div className="divide-y divide-slate-50">
          {property.units.map((unit) => {
            const tenantName = unitTenantMap.get(unit.id);
            const isOccupied = unit.status === "OCCUPIED";

            return (
              <div key={unit.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-medium text-slate-900">{unit.unitNumber}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{unit.unitType || "Unit"}</div>
                  {isOccupied && tenantName && (
                    <div className="mt-1 text-[11px] font-medium text-indigo-600">Tenant: {tenantName}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-800">{money(Number(unit.monthlyRent ?? 0), currency)}</div>
                  <div className="text-xs text-slate-400 mt-0.5 capitalize">{unit.status.toLowerCase()}</div>
                </div>
              </div>
            );
          })}
          {!property.units.length && (
            <p className="px-5 py-10 text-sm text-slate-400 text-center">
              This property has no units — valid for assets such as land.
            </p>
          )}
        </div>
        {!isDemo && <AddUnitForm propertyId={property.id} propertyTypeName={property.propertyType.name} />}
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
