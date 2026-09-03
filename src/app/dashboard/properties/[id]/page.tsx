import { notFound } from "next/navigation";
import { db } from "@/db";
import { money } from "@/lib/fx";
import { eq } from "drizzle-orm";
import { properties as propertiesTable } from "@/db/schema";

export default async function PropertyDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const property = await db.query.properties.findFirst({
    where: eq(propertiesTable.id, id),
    with: { propertyType: true, units: true, expenses: true, payments: true },
  });

  if (!property) notFound();

  const monthlyRent = property.units.reduce((sum: number, u) => sum + Number(u.monthlyRent ?? 0), 0);
  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;

  return (
    <div className="p-5 md:p-8">
      <div className="mb-8">
        <div className="text-sm text-slate-500">{property.propertyType.name}</div>
        <h1 className="mt-1 text-3xl font-bold">{property.name}</h1>
        <p className="mt-1 text-slate-500">{property.address}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Current value" value={money(Number(property.currentValue ?? 0), property.currency)} />
        <Metric label="Purchase price" value={money(Number(property.purchasePrice ?? 0), property.currency)} />
        <Metric label="Monthly rent" value={money(monthlyRent, property.currency)} />
        <Metric label="Occupancy" value={`${occupied}/${property.units.length}`} />
      </div>

      <section className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Units</h2>
        <div className="mt-4 divide-y">
          {property.units.map((unit) => (
            <div key={unit.id} className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium">{unit.unitNumber}</div>
                <div className="text-xs text-slate-500">{unit.unitType || "Unit"}</div>
              </div>
              <div className="text-right">
                <div>{money(Number(unit.monthlyRent ?? 0), property.currency)}</div>
                <div className="text-xs text-slate-500">{unit.status}</div>
              </div>
            </div>
          ))}
          {!property.units.length && <p className="py-6 text-sm text-slate-500">This property has no units. This is valid for assets such as land.</p>}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="rounded-xl border bg-white p-5"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></div>;
}