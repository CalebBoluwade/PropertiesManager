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

export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (₦)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GHS", symbol: "₵", label: "Ghanaian Cedi (₵)" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling (KSh)" },
  { code: "ZAR", symbol: "R", label: "South African Rand (R)" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar (CA$)" },
  { code: "AED", symbol: "AED", label: "UAE Dirham (AED)" },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export const CURRENCY_SYMBOL = "₦";
 
export function formatCurrency(amount: number | null | undefined, currencySymbol = CURRENCY_SYMBOL): string {
  const value = amount ?? 0;
  const sign = value < 0 ? "-" : "";
  return `${sign}${currencySymbol}${Math.abs(value).toLocaleString("en-US", {
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
export function formatCurrencyCompact(amount: number | null | undefined, currencySymbol = CURRENCY_SYMBOL): string {
  const value = amount ?? 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currencySymbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}${currencySymbol}${(abs / 1_000).toFixed(1)}K`;
  return formatCurrency(value, currencySymbol);
}
 
export const DATE_FORMATS: { value: string; label: string; example: string }[] = [
  { value: "MMM D, YYYY",  label: "Jan 5, 2025",    example: "Jan 5, 2025" },
  { value: "D MMM YYYY",   label: "5 Jan 2025",     example: "5 Jan 2025" },
  { value: "DD/MM/YYYY",   label: "05/01/2025",     example: "05/01/2025" },
  { value: "MM/DD/YYYY",   label: "01/05/2025",     example: "01/05/2025" },
  { value: "YYYY-MM-DD",   label: "2025-01-05",     example: "2025-01-05" },
];

export function formatDate(date: string | Date | null | undefined, fmt = "MMM D, YYYY"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const day   = d.getDate();
  const dd    = String(day).padStart(2, "0");
  const month = d.getMonth(); // 0-indexed
  const yyyy  = d.getFullYear();
  const mm    = String(month + 1).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mmm   = months[month];
  switch (fmt) {
    case "D MMM YYYY":  return `${day} ${mmm} ${yyyy}`;
    case "DD/MM/YYYY":  return `${dd}/${mm}/${yyyy}`;
    case "MM/DD/YYYY":  return `${mm}/${dd}/${yyyy}`;
    case "YYYY-MM-DD":  return `${yyyy}-${mm}-${dd}`;
    default:            return `${mmm} ${day}, ${yyyy}`; // MMM D, YYYY
  }
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