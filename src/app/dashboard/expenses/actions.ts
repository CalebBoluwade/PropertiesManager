"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { getCurrency } from "@/lib/data-mode";

export async function getExpenses() {
  const rows = await db.query.expenses.findMany({
    with: { property: true, tenant: true },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });
  return rows;
}

export async function createExpense(formData: FormData) {
  const currency = await getCurrency();
  const dateStr = formData.get("date") as string;
  const receiptFile = formData.get("receipt");
  let receiptUrl: string | null = null;
  if (receiptFile instanceof File && receiptFile.size > 0) {
    receiptUrl = `data:${receiptFile.type || "application/octet-stream"};base64,${Buffer.from(await receiptFile.arrayBuffer()).toString("base64")}`;
  }

  await db.insert(expenses).values({
    propertyId: String(formData.get("propertyId") || ""),
    tenantId: (formData.get("tenantId") as string) || null,
    category: String(formData.get("category") || "OTHER"),
    amount: Number(formData.get("amount") || 0),
    currency,
    expenseDate: dateStr ? new Date(dateStr) : new Date(),
    description: String(formData.get("description") || ""),
    receiptUrl,
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}

export async function updateExpense(id: string, formData: FormData) {
  const dateStr = formData.get("date") as string;
  await db
    .update(expenses)
    .set({
      propertyId: String(formData.get("propertyId") || ""),
      tenantId: (formData.get("tenantId") as string) || null,
      category: String(formData.get("category") || "OTHER"),
      amount: Number(formData.get("amount") || 0),
      expenseDate: dateStr ? new Date(dateStr) : new Date(),
      description: String(formData.get("description") || ""),
    })
    .where(eq(expenses.id, id));

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}
