"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  properties as propertiesTable,
  expenses as expensesTable,
  propertyPhotos,
  units,
} from "@/db/schema";

export async function createProperty(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const propertyTypeId = String(formData.get("propertyTypeId") || "");
  const currency = String(formData.get("currency") || "NGN");
  const numberOfUnits = Math.max(0, Number(formData.get("numberOfUnits") || 0));

  if (!name || !address || !propertyTypeId) {
    throw new Error("Name, address and property type are required.");
  }

  const property = db
    .insert(propertiesTable)
    .values({
      name,
      address,
      propertyTypeId,
      currency,
      city: String(formData.get("city") || "") || null,
      state: String(formData.get("state") || "") || null,
      purchasePrice: formData.get("purchasePrice")
        ? Number(formData.get("purchasePrice"))
        : null,
      currentValue: formData.get("currentValue")
        ? Number(formData.get("currentValue"))
        : null,
      notes: String(formData.get("notes") || "") || null,
    })
    .returning()
    .get();

  if (numberOfUnits > 0) {
    const monthlyRent = formData.get("defaultRent")
      ? Number(formData.get("defaultRent"))
      : null;
    const rows = Array.from({ length: numberOfUnits }, (_, i) => ({
      propertyId: property.id,
      unitNumber: numberOfUnits === 1 ? "Main Unit" : `Unit ${i + 1}`,
      monthlyRent,
    }));

    await db.insert(units).values(rows);
  }

  return property.id;
}

export async function getProperties() {
  const rows = await db.query.properties.findMany({
    with: { units: true, photos: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  return rows.map((p) => {
    const totalUnits = p.units.length;
    const occupiedUnits = p.units.filter((u) => u.status === "OCCUPIED").length;
    return { ...p, totalUnits, occupiedUnits };
  });
}

export async function getProperty(id: string) {
  const property = await db.query.properties.findFirst({
    where: eq(propertiesTable.id, id),
    with: {
      units: true,
      expenses: { orderBy: (e, { desc }) => [desc(e.expenseDate)] },
      photos: true,
    },
  });
  return property ?? null;
}

export async function updateProperty(id: string, formData: FormData) {
  await db
    .update(propertiesTable)
    .set({
      name: String(formData.get("name") || ""),
      address: String(formData.get("address") || ""),
      city: String(formData.get("city") || "") || null,
      state: String(formData.get("state") || "") || null,
      purchasePrice: formData.get("purchasePrice") ? Number(formData.get("purchasePrice")) : null,
      currentValue: formData.get("currentValue") ? Number(formData.get("currentValue")) : null,
      notes: (formData.get("notes") as string) || null,
    })
    .where(eq(propertiesTable.id, id));

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/properties/${id}`);
}

export async function deleteProperty(id: string) {
  await db.delete(expensesTable).where(eq(expensesTable.propertyId, id));
  await db.delete(propertyPhotos).where(eq(propertyPhotos.propertyId, id));
  await db.delete(units).where(eq(units.propertyId, id));
  await db.delete(propertiesTable).where(eq(propertiesTable.id, id));
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");
  redirect("/dashboard/properties");
}

export async function addUnit(propertyId: string, formData: FormData) {
  await db.insert(units).values({
    propertyId,
    unitNumber: String(formData.get("unitNumber") || "New Unit"),
    monthlyRent: formData.get("monthlyRent") ? Number(formData.get("monthlyRent")) : null,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function deleteUnit(propertyId: string, unitId: string) {
  await db.delete(units).where(eq(units.id, unitId));
  revalidatePath(`/dashboard/properties/${propertyId}`);
}
