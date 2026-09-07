import { getTenant } from "@/app/dashboard/tenants/actions";
import { getProperties } from "@/app/dashboard/actions";
import { EditTenantForm } from "@/app/dashboard/@modal/(.)tenants/edit/[id]/form";
import { notFound } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";

export default async function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDemo = (await getDataMode()) === "demo";
  const [tenant, properties] = await Promise.all([
    isDemo ? (DEMO.tenants.find((t) => t.id === id) ?? null) : getTenant(id),
    isDemo
      ? DEMO.properties.map((p) => ({ id: p.id, name: p.name }))
      : getProperties().then((ps) => ps.map(({ id, label }) => ({ id, name: label }))),
  ]);
  if (!tenant) notFound();
  return <EditTenantForm tenant={tenant} properties={properties} />;
}
