"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type DataMode = "demo" | "live";

export async function getDataMode(): Promise<DataMode> {
  const jar = await cookies();
  return (jar.get("data-mode")?.value as DataMode) ?? "live";
}

export async function setDataMode(mode: DataMode) {
  const jar = await cookies();
  jar.set("data-mode", mode, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard", "layout");
}

export async function getCurrency(): Promise<string> {
  const jar = await cookies();
  return jar.get("currency")?.value ?? "NGN";
}

export async function setCurrency(currency: string) {
  const jar = await cookies();
  jar.set("currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard", "layout");
}

export async function getDateFormat(): Promise<string> {
  const jar = await cookies();
  return jar.get("date-format")?.value ?? "MMM D, YYYY";
}

export async function setDateFormat(format: string) {
  const jar = await cookies();
  jar.set("date-format", format, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard", "layout");
}

const DEFAULT_CATEGORIES = ["REPAIRS", "SERVICE_CHARGE", "UTILITIES", "INSURANCE", "MANAGEMENT_FEE", "OTHER"];

export async function getExpenseCategories(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get("expense-categories")?.value;
  if (!raw) return DEFAULT_CATEGORIES;
  try { return JSON.parse(raw); } catch { return DEFAULT_CATEGORIES; }
}

export async function setExpenseCategories(categories: string[]) {
  const jar = await cookies();
  jar.set("expense-categories", JSON.stringify(categories), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard", "layout");
}
