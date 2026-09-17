import { getProperty } from "@/app/dashboard/properties/actions";
import { getPropertyTypes } from "@/app/dashboard/actions";
import { EditPropertyForm } from "@/app/dashboard/@modal/(.)properties/edit/[id]/form";
import { notFound } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDemo = (await getDataMode()) === "demo";
  const [property, propertyTypes] = await Promise.all([
    isDemo ? DEMO.properties.find((p) => p.id === id) ?? null : getProperty(id),
    getPropertyTypes(),
  ]);
  if (!property) notFound();
  return <EditPropertyForm property={property} propertyTypes={propertyTypes} />;
}
