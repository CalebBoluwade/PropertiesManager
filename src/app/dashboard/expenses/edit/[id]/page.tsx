import { db } from "@/db";
import { eq } from "drizzle-orm";
import { expenses } from "@/db/schema";
import { getProperties } from "@/app/dashboard/actions";
import { EditExpenseForm } from "@/app/dashboard/@modal/(.)expenses/edit/[id]/form";
import { notFound } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { DEMO } from "@/lib/demo-data";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDemo = (await getDataMode()) === "demo";
  const [expense, properties] = await Promise.all([
    isDemo
      ? (DEMO.expenses.find((e) => e.id === id) ?? null)
      : db.query.expenses.findFirst({ where: eq(expenses.id, id) }),
    isDemo
      ? DEMO.properties.map((p) => ({ id: p.id, label: p.name }))
      : getProperties(),
  ]);
  if (!expense) notFound();
  return <EditExpenseForm expense={expense} properties={properties} />;
}
