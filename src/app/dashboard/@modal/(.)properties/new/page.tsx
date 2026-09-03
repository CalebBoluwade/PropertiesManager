import { getPropertyTypes } from "@/app/dashboard/actions";
import { NewPropertyForm } from "./form";

export default async function NewPropertyModal() {
  const propertyTypes = await getPropertyTypes();
  return <NewPropertyForm propertyTypes={propertyTypes} />;
}
