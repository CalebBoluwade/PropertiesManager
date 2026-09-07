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
