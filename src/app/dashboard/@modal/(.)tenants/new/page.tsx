import { getProperties } from "@/app/dashboard/actions";
import { NewTenantForm } from "./form";

export default async function NewTenantModal() {
  const properties = (await getProperties()).map(({ id, label }) => ({ id, name: label }));
  return <NewTenantForm properties={properties} />;
}
