"use server";

import { db } from "@/db";
import { collection } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCardQuantity(cardId: number, lang: "en" | "fr", quantity: number) {
  const [existing] = await db
    .select()
    .from(collection)
    .where(eq(collection.cardId, cardId))
    .limit(1);

  const field = lang === "en" ? "quantityEn" : "quantityFr";

  if (existing) {
    await db
      .update(collection)
      .set({ [field]: quantity, updatedAt: new Date().toISOString() })
      .where(eq(collection.cardId, cardId));
  } else {
    await db.insert(collection).values({
      cardId,
      quantityEn: lang === "en" ? quantity : 0,
      quantityFr: lang === "fr" ? quantity : 0,
      updatedAt: new Date().toISOString(),
    });
  }

  revalidatePath("/", "layout");
}

export async function updateCardCondition(cardId: number, condition: string) {
  const [existing] = await db
    .select()
    .from(collection)
    .where(eq(collection.cardId, cardId))
    .limit(1);

  if (existing) {
    await db
      .update(collection)
      .set({ condition, updatedAt: new Date().toISOString() })
      .where(eq(collection.cardId, cardId));
  }
}

export async function updateCardNotes(cardId: number, notes: string) {
  const [existing] = await db
    .select()
    .from(collection)
    .where(eq(collection.cardId, cardId))
    .limit(1);

  if (existing) {
    await db
      .update(collection)
      .set({ notes, updatedAt: new Date().toISOString() })
      .where(eq(collection.cardId, cardId));
  }
}
