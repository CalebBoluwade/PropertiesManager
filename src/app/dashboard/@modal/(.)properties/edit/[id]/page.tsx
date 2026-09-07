import { getProperty } from "@/app/dashboard/properties/actions";
import { getPropertyTypes } from "@/app/dashboard/actions";
import { EditPropertyForm } from "./form";
import { notFound } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";

export default async function EditPropertyModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDemo = (await getDataMode()) === "demo";
  const [property, propertyTypes] = await Promise.all([
    isDemo ? DEMO.properties.find((p) => p.id === id) ?? null : getProperty(id),
    isDemo
      ? [{ id: "demo-type-1", name: "Residential" }, { id: "demo-type-2", name: "Commercial" }, { id: "demo-type-3", name: "Land" }]
      : getPropertyTypes(),
  ]);
  if (!property) notFound();
  return <EditPropertyForm property={property} propertyTypes={propertyTypes} />;
}
