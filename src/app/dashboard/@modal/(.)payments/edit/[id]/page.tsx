import { getPayment } from "@/app/dashboard/payments/actions";
import { EditPaymentForm } from "./form";
import { notFound } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";

export default async function EditPaymentModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDemo = (await getDataMode()) === "demo";
  if (isDemo) notFound();
  const payment = await getPayment(id);
  if (!payment) notFound();
  return <EditPaymentForm payment={payment} />;
}
