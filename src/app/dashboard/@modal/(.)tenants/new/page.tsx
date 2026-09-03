import { getVacantUnits } from "@/app/dashboard/actions";
import { NewTenantForm } from "./form";

export default async function NewTenantModal() {
  const units = await getVacantUnits();
  return <NewTenantForm units={units} />;
}
