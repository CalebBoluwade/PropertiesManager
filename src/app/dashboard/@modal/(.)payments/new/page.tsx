import { getTenants } from "@/app/dashboard/actions";
import { NewPaymentForm } from "./form";

export default async function NewPaymentModal() {
  const tenants = await getTenants();
  return <NewPaymentForm tenants={tenants} />;
}
