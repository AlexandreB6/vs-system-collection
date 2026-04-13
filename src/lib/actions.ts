"use server";

import { db } from "@/db";
import { collection } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type QuantityKind = "en" | "fr" | "en_foil" | "fr_foil";

const FIELD: Record<QuantityKind, "quantityEn" | "quantityFr" | "quantityEnFoil" | "quantityFrFoil"> = {
  en: "quantityEn",
  fr: "quantityFr",
  en_foil: "quantityEnFoil",
  fr_foil: "quantityFrFoil",
};

export async function updateCardQuantity(cardId: number, kind: QuantityKind, quantity: number) {
  const [existing] = await db
    .select()
    .from(collection)
    .where(eq(collection.cardId, cardId))
    .limit(1);

  const field = FIELD[kind];

  if (existing) {
    await db
      .update(collection)
      .set({ [field]: quantity, updatedAt: new Date().toISOString() })
      .where(eq(collection.cardId, cardId));
  } else {
    await db.insert(collection).values({
      cardId,
      quantityEn: kind === "en" ? quantity : 0,
      quantityFr: kind === "fr" ? quantity : 0,
      quantityEnFoil: kind === "en_foil" ? quantity : 0,
      quantityFrFoil: kind === "fr_foil" ? quantity : 0,
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
