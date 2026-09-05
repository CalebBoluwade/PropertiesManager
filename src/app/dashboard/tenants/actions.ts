"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";

export async function getTenants() {
  const rows = await db.query.tenants.findMany({
    with: { property: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return rows;
}

export async function getTenant(id: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, id),
    with: { property: true },
  });
  return tenant ?? null;
}

export async function createTenant(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const propertyId = String(formData.get("propertyId") || "");
  const monthlyRent = Number(formData.get("monthlyRent") || 0);
  const securityDeposit = Number(formData.get("securityDeposit") || 0);

  if (!name || !phone || !propertyId) {
    throw new Error("Name, phone and property are required.");
  }

  const [tenant] = await db.insert(tenants).values({
    name,
    phone,
    propertyId,
    monthlyRent,
    securityDeposit,
    email: (formData.get("email") as string) || null,
  }).returning();

  // Store any attached documents as base64 in the documents table
  const files = formData.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 0) {
    const { documents: docsTable } = await import("@/db/schema");
    for (const file of files) {
      const base64 = `data:${file.type || "application/octet-stream"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
      await db.insert(docsTable).values({ propertyId, name: file.name, url: base64, mimeType: file.type || null });
    }
  }

  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
}

export async function updateTenant(id: string, formData: FormData) {
  const monthlyRent = Number(formData.get("monthlyRent") || 0);
  const securityDeposit = Number(formData.get("securityDeposit") || 0);

  await db
    .update(tenants)
    .set({
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || ""),
      email: (formData.get("email") as string) || null,
      propertyId: String(formData.get("propertyId") || ""),
      monthlyRent,
      securityDeposit,
    })
    .where(eq(tenants.id, id));

  revalidatePath("/dashboard/tenants");
  revalidatePath(`/dashboard/tenants/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/tenants/${id}`);
}

export async function deleteTenant(id: string) {
  await db.delete(tenants).where(eq(tenants.id, id));
  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  redirect("/dashboard/tenants");
}
