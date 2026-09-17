import { db } from "@/db";
import { eq } from "drizzle-orm";
import { expenses } from "@/db/schema";
import { getProperties, getTenants } from "@/app/dashboard/actions";
import { EditExpenseForm } from "./form";
import { notFound } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";

export default async function EditExpenseModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDemo = (await getDataMode()) === "demo";
  const [expense, properties, tenants] = await Promise.all([
    isDemo
      ? (DEMO.expenses.find((e) => e.id === id) ?? null)
      : db.query.expenses.findFirst({ where: eq(expenses.id, id) }),
    isDemo
      ? DEMO.properties.map((p) => ({ id: p.id, label: p.name }))
      : getProperties(),
    isDemo
      ? DEMO.tenants.map((t) => ({ id: t.id, label: `${t.name} — ${t.property.name}` }))
      : getTenants(),
  ]);
  if (!expense) notFound();
  return <EditExpenseForm expense={expense} properties={properties} tenants={tenants} />;
}
