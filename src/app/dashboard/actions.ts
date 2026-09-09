"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { tenants, payments, expenses, leases, rentObligations, units, properties, propertyTypes, propertyFieldValues, propertyTypeFields, documents, propertyPhotos } from "@/db/schema";

export async function getPropertyTypes() {
  return db.query.propertyTypes.findMany({ orderBy: (t, { asc }) => asc(t.name) });
}

export async function getVacantUnits() {
  const units = await db.query.units.findMany({
    where: (u, { eq }) => eq(u.status, "VACANT"),
    with: { property: true },
    orderBy: (u, { asc }) => asc(u.unitNumber),
  });
  return units.map((u) => ({ id: u.id, label: `${u.property.name} — ${u.unitNumber}` }));
}

export async function getProperties() {
  const props = await db.query.properties.findMany({ orderBy: (p, { asc }) => asc(p.name) });
  return props.map((p) => ({ id: p.id, label: p.name }));
}

export async function getTenants() {
  const ts = await db.query.tenants.findMany({
    with: { property: true },
    orderBy: (t, { asc }) => asc(t.name),
  });
  return ts.map((t) => ({ id: t.id, label: `${t.name} — ${t.property.name}` }));
}

export async function resetLiveData() {
  await db.delete(payments);
  await db.delete(rentObligations);
  await db.delete(leases);
  await db.delete(tenants);
  await db.delete(expenses);
  await db.delete(documents);
  await db.delete(propertyPhotos);
  await db.delete(propertyFieldValues);
  await db.delete(units);
  await db.delete(properties);
  await db.delete(propertyTypeFields);
  await db.delete(propertyTypes);
  revalidatePath("/dashboard", "layout");
}
