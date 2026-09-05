"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";

export async function getExpenses() {
  const rows = await db.query.expenses.findMany({
    with: { property: true },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });
  return rows;
}

export async function createExpense(formData: FormData) {
  const dateStr = formData.get("date") as string;
  const receiptFile = formData.get("receipt");
  let receiptUrl: string | null = null;
  if (receiptFile instanceof File && receiptFile.size > 0) {
    receiptUrl = `data:${receiptFile.type || "application/octet-stream"};base64,${Buffer.from(await receiptFile.arrayBuffer()).toString("base64")}`;
  }

  await db.insert(expenses).values({
    propertyId: String(formData.get("propertyId") || ""),
    category: String(formData.get("category") || "OTHER"),
    amount: Number(formData.get("amount") || 0),
    expenseDate: dateStr ? new Date(dateStr) : new Date(),
    description: String(formData.get("description") || ""),
    receiptUrl,
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  redirect("/dashboard/expenses");
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}