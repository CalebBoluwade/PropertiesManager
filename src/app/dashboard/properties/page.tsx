import Link from "next/link";
import { db } from "@/db";
import { money } from "@/lib/fx";

export default async function PropertiesPage() {
  const properties = await db.query.properties.findMany({
    with: { propertyType: true, units: true },
    orderBy: (properties, { desc }) => desc(properties.createdAt),
  });

  return (
    <div className="p-5 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your property portfolio.
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Add Property
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Property</th>
              <th className="p-4">Type</th>
              <th className="p-4">Units</th>
              <th className="p-4">Status</th>
              <th className="p-4">Value</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr
                key={property.id}
                className="border-b last:border-0 hover:bg-slate-50"
              >
                <td className="p-4">
                  <Link
                    href={`/properties/${property.id}`}
                    className="font-medium hover:underline"
                  >
                    {property.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {property.address}
                  </div>
                </td>
                <td className="p-4">{property.propertyType.name}</td>
                <td className="p-4">{property.units.length}</td>
                <td className="p-4">{property.status.replaceAll("_", " ")}</td>
                <td className="p-4">
                  {money(Number(property.currentValue ?? 0), property.currency)}
                </td>
              </tr>
            ))}
            {!properties.length && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-500">
                  No properties yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
