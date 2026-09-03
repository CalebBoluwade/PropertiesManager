import { getProperties } from "@/app/dashboard/actions";
import { NewExpenseForm } from "./form";

export default async function NewExpenseModal() {
  const properties = await getProperties();
  return <NewExpenseForm properties={properties} />;
}
