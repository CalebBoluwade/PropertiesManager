"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { propertyPhotos as photos } from "@/db/schema";

const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file

export async function uploadPhotos(propertyId: string, formData: FormData) {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  if (files.length > MAX_FILES) throw new Error(`Maximum ${MAX_FILES} photos allowed.`);

  for (const file of files) {
    if (file.size > MAX_BYTES) throw new Error(`"${file.name}" exceeds the 5 MB limit.`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

    await db.insert(photos).values({
      propertyId,
      url: base64,
      caption: file.name,
    });
  }

  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function deletePhoto(propertyId: string, photoId: string) {
  await db.delete(photos).where(eq(photos.id, photoId));
  revalidatePath(`/dashboard/properties/${propertyId}`);
}
