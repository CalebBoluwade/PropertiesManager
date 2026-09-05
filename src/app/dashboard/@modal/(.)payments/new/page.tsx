import { getActiveTenantsForBilling } from "@/app/dashboard/payments/actions";
import { NewPaymentForm } from "./form";

export default async function NewPaymentModal() {
  const rows = await getActiveTenantsForBilling();
  const leases = rows.map((l) => ({
    id: l.id,
    label: `${l.tenant.name} — ${l.unit?.property.name} ${l.unit?.unitNumber}`,
  }));
  return <NewPaymentForm leases={leases} />;
}
