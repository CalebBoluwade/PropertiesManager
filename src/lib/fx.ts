export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";

/**
 * Payment status is never stored — it's always derived from amounts and
 * today's date, so it can never drift out of sync with reality.
 */
export function getPaymentStatus(payment: {
  amountDue: number;
  amountPaid: number;
  dueDate: string;
}): PaymentStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(payment.dueDate);
  const isPastDue = due.getTime() < today.getTime();

  if (payment.amountPaid >= payment.amountDue) return "PAID";
  if (payment.amountPaid > 0) return isPastDue ? "OVERDUE" : "PARTIAL";
  return isPastDue ? "OVERDUE" : "PENDING";
}

export function occupancyRate(occupiedUnits: number, totalUnits: number): number {
  if (totalUnits === 0) return 0;
  return (occupiedUnits / totalUnits) * 100;
}

/** Gross rental yield: annual rent as a percentage of current property value. */
export function rentalYield(annualRent: number, propertyValue: number | null | undefined): number | null {
  if (!propertyValue || propertyValue <= 0) return null;
  return (annualRent / propertyValue) * 100;
}

export function daysOverdue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export const CURRENCY_SYMBOL = "₦";
 
export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  const sign = value < 0 ? "-" : "";
  return `${sign}${CURRENCY_SYMBOL}${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function money(value: number | string | null | undefined, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}
 
/** Compact form for headline dashboard stats: $4.2M, $28.5K */
export function formatCurrencyCompact(amount: number | null | undefined): string {
  const value = amount ?? 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${CURRENCY_SYMBOL}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}${CURRENCY_SYMBOL}${(abs / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}
 
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
 
export function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
 
export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}
 
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}