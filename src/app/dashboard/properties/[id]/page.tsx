import { notFound } from "next/navigation";
import { db } from "@/db";
import { money } from "@/lib/fx";
import { eq } from "drizzle-orm";
import { properties as propertiesTable } from "@/db/schema";
import { MediaGrid } from "@/components/media-grid";

function mimeFromDataUri(url: string) {
  const m = url.match(/^data:([^;]+);/);
  return m ? m[1] : null;
}

export default async function PropertyDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const property = await db.query.properties.findFirst({
    where: eq(propertiesTable.id, id),
    with: { propertyType: true, units: true, expenses: true, payments: true, photos: true, documents: true },
  });

  if (!property) notFound();

  const monthlyRent = property.units.reduce((sum: number, u) => sum + Number(u.monthlyRent ?? 0), 0);
  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;

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
        <Metric label="Current Value" value={money(Number(property.currentValue ?? 0), property.currency)} />
        <Metric label="Purchase Price" value={money(Number(property.purchasePrice ?? 0), property.currency)} />
        <Metric label="Monthly Rent" value={money(monthlyRent, property.currency)} />
        <Metric label="Occupancy" value={`${occupied} / ${property.units.length}`} />
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
          {property.units.map((unit) => (
            <div key={unit.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-medium text-slate-900">{unit.unitNumber}</div>
                <div className="text-xs text-slate-400 mt-0.5">{unit.unitType || "Unit"}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-slate-800">{money(Number(unit.monthlyRent ?? 0), property.currency)}</div>
                <div className="text-xs text-slate-400 mt-0.5 capitalize">{unit.status.toLowerCase()}</div>
              </div>
            </div>
          ))}
          {!property.units.length && (
            <p className="px-5 py-10 text-sm text-slate-400 text-center">
              This property has no units — valid for assets such as land.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xs">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
