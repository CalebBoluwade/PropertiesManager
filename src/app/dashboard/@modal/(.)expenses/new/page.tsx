import { getProperties, getTenants } from "@/app/dashboard/actions";
import { NewExpenseForm } from "./form";

export default async function NewExpenseModal() {
  const [properties, tenants] = await Promise.all([getProperties(), getTenants()]);
  return <NewExpenseForm properties={properties} tenants={tenants} />;
}
