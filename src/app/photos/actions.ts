"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { propertyPhotos as photos, expenses } from "@/db/schema";

const MAX_FILES = 10;
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (covers videos)
const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB for images only

export async function uploadPhotos(propertyId: string, formData: FormData) {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;
  if (files.length > MAX_FILES) throw new Error(`Maximum ${MAX_FILES} files allowed.`);

  for (const file of files) {
    const isImage = file.type.startsWith("image/");
    const limit = isImage ? PHOTO_MAX_BYTES : MAX_BYTES;
    if (file.size > limit) throw new Error(`"${file.name}" exceeds the ${isImage ? "5 MB" : "50 MB"} limit.`);

    const base64 = `data:${file.type || "application/octet-stream"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    await db.insert(photos).values({ propertyId, url: base64, caption: file.name });
  }

  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function deletePhoto(propertyId: string, photoId: string) {
  await db.delete(photos).where(eq(photos.id, photoId));
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function uploadExpenseReceipt(expenseId: string, file: File) {
  if (file.size > MAX_BYTES) throw new Error(`File exceeds the 50 MB limit.`);
  const base64 = `data:${file.type || "application/octet-stream"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  await db.update(expenses).set({ receiptUrl: base64 }).where(eq(expenses.id, expenseId));
  revalidatePath("/dashboard/expenses");
}
