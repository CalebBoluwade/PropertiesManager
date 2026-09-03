"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { payments, leases, rentObligations } from "@/db/schema";
import { getPaymentStatus } from "@/lib/fx";

export async function getPayments() {
  const rows = await db.query.payments.findMany({
    with: { unit: { with: { property: true } }, lease: true, obligation: true },
    orderBy: (p, { desc }) => [desc(p.paymentDate)],
  });
  return rows.map((p) => ({
    ...p,
    computedStatus: p.obligation
      ? getPaymentStatus({
          amountDue: p.obligation.amountDue,
          amountPaid: p.obligation.amountPaid,
          dueDate: p.obligation.dueDate.toISOString().slice(0, 10),
        })
      : null,
  }));
}

export async function getPayment(id: string) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, id),
    with: { unit: { with: { property: true } }, lease: true, obligation: true },
  });
  if (!payment) return null;
  return {
    ...payment,
    computedStatus: payment.obligation
      ? getPaymentStatus({
          amountDue: payment.obligation.amountDue,
          amountPaid: payment.obligation.amountPaid,
          dueDate: payment.obligation.dueDate.toISOString().slice(0, 10),
        })
      : null,
  };
}

/** Active leases with their unit/property for billing forms. */
export async function getActiveTenantsForBilling() {
  const today = new Date();
  const rows = await db.query.leases.findMany({
    where: eq(leases.status, "ACTIVE"),
    with: { tenant: true, unit: { with: { property: true } } },
    orderBy: (l, { asc }) => [asc(l.tenantId)],
  });
  return rows.filter((l) => l.endDate >= today);
}

export async function createPayment(formData: FormData) {
  const leaseId = String(formData.get("leaseId") || "");
  const lease = await db.query.leases.findFirst({ where: eq(leases.id, leaseId) });
  if (!lease) throw new Error("Select a lease");

  const paidDate = (formData.get("paidDate") as string) || new Date().toISOString().slice(0, 10);

  await db.insert(payments).values({
    propertyId: lease.propertyId,
    unitId: lease.unitId,
    leaseId: lease.id,
    amount: Number(formData.get("amount") || 0),
    paymentDate: new Date(paidDate),
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/payments");
  revalidatePath("/");
  redirect("/payments");
}

export async function recordPayment(id: string, formData: FormData) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, id) });
  if (!payment) redirect("/payments");

  const amount = Number(formData.get("amount") || 0);
  const paidDate = (formData.get("paidDate") as string) || new Date().toISOString().slice(0, 10);

  // Update the payment record
  await db
    .update(payments)
    .set({ amount, paymentDate: new Date(paidDate) })
    .where(eq(payments.id, id));

  // If linked to an obligation, accrue amountPaid on it
  if (payment!.obligationId) {
    const obligation = await db.query.rentObligations.findFirst({
      where: eq(rentObligations.id, payment!.obligationId),
    });
    if (obligation) {
      const newAmountPaid = obligation.amountPaid + amount;
      await db
        .update(rentObligations)
        .set({
          amountPaid: newAmountPaid,
          status: newAmountPaid >= obligation.amountDue ? "PAID" : "PARTIALLY_PAID",
        })
        .where(eq(rentObligations.id, obligation.id));
    }
  }

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
 * Creates this month's rent obligations for every active lease that doesn't
 * already have one, due on the 1st.
 */
export async function generateMonthlyCharges() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const activeLeases = await db.query.leases.findMany({
    where: eq(leases.status, "ACTIVE"),
  });

  const existing = await db.query.rentObligations.findMany({
    where: and(
      gte(rentObligations.dueDate, monthStart),
      lt(rentObligations.dueDate, nextMonthStart)
    ),
  });

  let created = 0;
  for (const lease of activeLeases) {
    if (lease.endDate < monthStart) continue;
    const alreadyBilled = existing.some((o) => o.leaseId === lease.id);
    if (alreadyBilled) continue;

    await db.insert(rentObligations).values({
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      leaseId: lease.id,
      periodStart: monthStart,
      periodEnd: nextMonthStart,
      dueDate: monthStart,
      amountDue: lease.monthlyRent,
      amountPaid: 0,
      status: "DUE",
    });
    created++;
  }

  revalidatePath("/payments");
  revalidatePath("/");
  return created;
}
