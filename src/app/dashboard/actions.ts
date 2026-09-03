"use server";

import { db } from "@/db";

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
  const tenants = await db.query.tenants.findMany({
    with: { property: true },
    orderBy: (t, { asc }) => asc(t.name),
  });
  return tenants.map((t) => ({ id: t.id, label: `${t.name} — ${t.property.name}` }));
}
