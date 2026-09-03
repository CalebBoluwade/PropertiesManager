"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, units, tenants } from "@/db/schema";
import { getPaymentStatus } from "@/lib/fx";

export async function getPayments() {
  const rows = await db.query.payments.findMany({
    with: { unit: { with: { property: true } }, tenant: true },
    orderBy: (p, { desc }) => [desc(p.dueDate)],
  });
  return rows.map((p) => ({ ...p, computedStatus: getPaymentStatus(p) }));
}

export async function getPayment(id: string) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, id),
    with: { unit: { with: { property: true } }, tenant: true },
  });
  if (!payment) return null;
  return { ...payment, computedStatus: getPaymentStatus(payment) };
}

/** For a "record charge" form: active tenants with their unit/rent. */
export async function getActiveTenantsForBilling() {
  const rows = await db.query.tenants.findMany({
    with: { unit: { with: { property: true } } },
    orderBy: (t, { asc }) => [asc(t.name)],
  });
  const today = new Date().toISOString().slice(0, 10);
  return rows.filter((t) => !t.leaseEnd || t.leaseEnd >= today);
}

export async function createPayment(formData: FormData) {
  const tenantId = String(formData.get("tenantId") || "");
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
  if (!tenant) throw new Error("Select a tenant");

  const amountDue = Number(formData.get("amountDue") || 0);
  const amountPaid = Number(formData.get("amountPaid") || 0);
  const paidDate = (formData.get("paidDate") as string) || null;

  await db.insert(payments).values({
    unitId: tenant.unitId,
    tenantId: tenant.id,
    amountDue,
    amountPaid,
    dueDate: String(formData.get("dueDate") || ""),
    paidDate: amountPaid > 0 ? paidDate || new Date().toISOString().slice(0, 10) : null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/payments");
  revalidatePath("/");
  redirect("/payments");
}

/** Add a payment towards an existing charge (supports partial payments
 *  accruing over time) and stamp the date it was received. */
export async function recordPayment(id: string, formData: FormData) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, id) });
  if (!payment) redirect("/payments");

  const amount = Number(formData.get("amount") || 0);
  const paidDate = (formData.get("paidDate") as string) || new Date().toISOString().slice(0, 10);

  await db
    .update(payments)
    .set({
      amountPaid: payment!.amountPaid + amount,
      paidDate,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(payments.id, id));

  revalidatePath("/payments");
  revalidatePath("/");
  redirect("/payments");
}

export async function deletePayment(id: string) {
  await db.delete(payments).where(eq(payments.id, id));
  revalidatePath("/payments");
  revalidatePath("/");
}

/**
 * Creates this month's rent charge for every occupied unit with an active
 * tenant that doesn't already have one, due on the 1st. Run manually from
 * the Payments page — see README for wiring this to a scheduler (e.g.
 * Vercel Cron) so it runs automatically.
 */
export async function generateMonthlyCharges() {
  const activeTenants = await db.query.tenants.findMany({ with: { unit: true } });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const existing = await db.query.payments.findMany();

  let created = 0;
  for (const tenant of activeTenants) {
    if (tenant.leaseEnd && tenant.leaseEnd < today) continue; // lease already ended
    const alreadyBilled = existing.some(
      (p) => p.unitId === tenant.unitId && p.dueDate >= monthStart && p.dueDate < nextMonthStart
    );
    if (alreadyBilled) continue;

    await db.insert(payments).values({
      unitId: tenant.unitId,
      tenantId: tenant.id,
      amountDue: tenant.monthlyRent,
      amountPaid: 0,
      dueDate: monthStart,
    });
    created++;
  }

  revalidatePath("/payments");
  revalidatePath("/");
  return created;
}