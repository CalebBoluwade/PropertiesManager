import { getActiveTenantsForBilling } from "@/app/dashboard/payments/actions";
import { NewPaymentForm } from "./form";

export default async function NewPaymentModal() {
  const rows = await getActiveTenantsForBilling();

  const propertyMap = new Map<string, { id: string; name: string; units: Map<string, { id: string; number: string; leases: { id: string; tenantName: string }[] }> }>();
  for (const l of rows) {
    if (!propertyMap.has(l.propertyId)) propertyMap.set(l.propertyId, { id: l.propertyId, name: l.propertyName, units: new Map() });
    const propEntry = propertyMap.get(l.propertyId)!;
    if (!propEntry.units.has(l.unitId)) propEntry.units.set(l.unitId, { id: l.unitId, number: l.unitNumber, leases: [] });
    propEntry.units.get(l.unitId)!.leases.push({ id: l.id, tenantName: l.tenantName });
  }

  const properties = Array.from(propertyMap.values()).map((p) => ({
    ...p,
    units: Array.from(p.units.values()),
  }));

  return <NewPaymentForm properties={properties} />;
}
