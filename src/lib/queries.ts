import { db } from "@/db";
import { sets, cards, collection } from "@/db/schema";
import { eq, sql, and, asc } from "drizzle-orm";

// --- Sets ---
export async function getAllSets() {
  const rows = await db.all(sql`
    SELECT s.id, s.code, s.name, s.release_date as releaseDate, s.total_cards as totalCards, s.set_type as setType,
      COALESCE((
        SELECT COUNT(*) FROM collection c
        INNER JOIN cards cd ON c.card_id = cd.id
        WHERE cd.set_id = s.id AND (c.quantity_en + c.quantity_fr) > 0
      ), 0) as ownedCount
    FROM sets s
    ORDER BY s.release_date ASC
  `) as Array<{
    id: number; code: string; name: string; releaseDate: string | null;
    totalCards: number | null; setType: string | null; ownedCount: number;
  }>;
  return rows;
}

export async function getSetByCode(code: string) {
  const [set] = await db.select().from(sets).where(eq(sets.code, code)).limit(1);
  return set;
}

// --- Cards ---
export async function getCardsBySet(setId: number) {
  const rows = await db.all(sql`
    SELECT cd.id, cd.card_number as cardNumber, cd.name, cd.version, cd.card_type as cardType,
      cd.cost, cd.attack, cd.defense, cd.flight, cd.range, cd.team, cd.rarity, cd.image_url as imageUrl,
      COALESCE(c.quantity_en, 0) as quantityEn,
      COALESCE(c.quantity_fr, 0) as quantityFr
    FROM cards cd
    LEFT JOIN collection c ON c.card_id = cd.id
    WHERE cd.set_id = ${setId}
    ORDER BY cd.card_number ASC
  `) as Array<{
    id: number; cardNumber: string; name: string; version: string | null; cardType: string | null;
    cost: number | null; attack: number | null; defense: number | null; flight: number | null;
    range: number | null; team: string | null; rarity: string | null; imageUrl: string | null;
    quantityEn: number; quantityFr: number;
  }>;
  return rows;
}

export async function getCardById(cardId: number) {
  const rows = await db.all(sql`
    SELECT cd.id, cd.card_number as cardNumber, cd.name, cd.version, cd.card_type as cardType,
      cd.cost, cd.attack, cd.defense, cd.flight, cd.range, cd.team, cd.rarity,
      cd.rules_text as rulesText, cd.flavor_text as flavorText, cd.illustrator,
      cd.image_url as imageUrl, cd.set_id as setId
    FROM cards cd
    WHERE cd.id = ${cardId}
    LIMIT 1
  `) as Array<{
    id: number; cardNumber: string; name: string; version: string | null; cardType: string | null;
    cost: number | null; attack: number | null; defense: number | null; flight: number | null;
    range: number | null; team: string | null; rarity: string | null; rulesText: string | null;
    flavorText: string | null; illustrator: string | null; imageUrl: string | null; setId: number | null;
  }>;
  return rows[0] ?? null;
}

export async function searchCards(query: string, filters?: {
  setId?: number;
  cardType?: string;
  rarity?: string;
  team?: string;
}) {
  const conditions: string[] = ["1=1"];
  if (query) {
    const escaped = query.replace(/'/g, "''");
    conditions.push(`(cd.name LIKE '%${escaped}%' OR cd.version LIKE '%${escaped}%' OR cd.rules_text LIKE '%${escaped}%')`);
  }
  if (filters?.setId) conditions.push(`cd.set_id = ${filters.setId}`);
  if (filters?.cardType) conditions.push(`cd.card_type = '${filters.cardType.replace(/'/g, "''")}'`);
  if (filters?.rarity) conditions.push(`cd.rarity = '${filters.rarity.replace(/'/g, "''")}'`);
  if (filters?.team) conditions.push(`cd.team = '${filters.team.replace(/'/g, "''")}'`);

  const whereClause = conditions.join(" AND ");

  const rows = await db.all(sql.raw(`
    SELECT cd.id, cd.card_number as cardNumber, cd.name, cd.version, cd.card_type as cardType,
      cd.cost, cd.attack, cd.defense, cd.rarity, cd.team, cd.image_url as imageUrl, cd.set_id as setId,
      COALESCE(c.quantity_en, 0) as quantityEn,
      COALESCE(c.quantity_fr, 0) as quantityFr
    FROM cards cd
    LEFT JOIN collection c ON c.card_id = cd.id
    WHERE ${whereClause}
    ORDER BY cd.name ASC
    LIMIT 100
  `)) as Array<{
    id: number; cardNumber: string; name: string; version: string | null; cardType: string | null;
    cost: number | null; attack: number | null; defense: number | null; rarity: string | null;
    team: string | null; imageUrl: string | null; setId: number | null;
    quantityEn: number; quantityFr: number;
  }>;
  return rows;
}

// --- Collection ---
export async function getCollectionCards() {
  const rows = await db.all(sql`
    SELECT cd.id, cd.card_number as cardNumber, cd.name, cd.version, cd.card_type as cardType,
      cd.cost, cd.attack, cd.defense, cd.rarity, cd.team, cd.image_url as imageUrl, cd.set_id as setId,
      c.quantity_en as quantityEn, c.quantity_fr as quantityFr, c.condition, c.notes
    FROM collection c
    INNER JOIN cards cd ON c.card_id = cd.id
    WHERE (c.quantity_en + c.quantity_fr) > 0
    ORDER BY cd.name ASC
  `) as Array<{
    id: number; cardNumber: string; name: string; version: string | null; cardType: string | null;
    cost: number | null; attack: number | null; defense: number | null; rarity: string | null;
    team: string | null; imageUrl: string | null; setId: number | null;
    quantityEn: number; quantityFr: number; condition: string | null; notes: string | null;
  }>;
  return rows;
}

export async function getMissingCards(setId: number) {
  const rows = await db.all(sql`
    SELECT cd.id, cd.card_number as cardNumber, cd.name, cd.version, cd.card_type as cardType,
      cd.cost, cd.attack, cd.defense, cd.rarity, cd.team, cd.image_url as imageUrl
    FROM cards cd
    LEFT JOIN collection c ON c.card_id = cd.id
    WHERE cd.set_id = ${setId}
      AND COALESCE(c.quantity_en, 0) + COALESCE(c.quantity_fr, 0) = 0
    ORDER BY cd.card_number ASC
  `) as Array<{
    id: number; cardNumber: string; name: string; version: string | null; cardType: string | null;
    cost: number | null; attack: number | null; defense: number | null; rarity: string | null;
    team: string | null; imageUrl: string | null;
  }>;
  return rows;
}

export async function getCollectionQuantities(cardId: number) {
  const rows = await db.all(sql`
    SELECT quantity_en as en, quantity_fr as fr
    FROM collection WHERE card_id = ${cardId} LIMIT 1
  `) as Array<{ en: number; fr: number }>;
  return rows[0] ?? { en: 0, fr: 0 };
}

// --- Stats ---
export async function getCollectionStats() {
  const rows = await db.all(sql`
    SELECT
      (SELECT COUNT(*) FROM cards) as totalCards,
      (SELECT COUNT(*) FROM collection WHERE (quantity_en + quantity_fr) > 0) as ownedCards,
      COALESCE((SELECT SUM(quantity_en + quantity_fr) FROM collection WHERE (quantity_en + quantity_fr) > 0), 0) as totalQuantity
  `) as Array<{ totalCards: number; ownedCards: number; totalQuantity: number }>;
  return rows[0];
}

// --- Filter options ---
export async function getDistinctTeams() {
  const rows = await db.all(sql`
    SELECT DISTINCT team FROM cards WHERE team IS NOT NULL AND team != '' ORDER BY team ASC
  `) as Array<{ team: string }>;
  return rows.map(r => r.team);
}

export async function getDistinctCardTypes() {
  const rows = await db.all(sql`
    SELECT DISTINCT card_type FROM cards WHERE card_type IS NOT NULL ORDER BY card_type ASC
  `) as Array<{ card_type: string }>;
  return rows.map(r => r.card_type);
}

export async function getDistinctRarities() {
  const rows = await db.all(sql`
    SELECT DISTINCT rarity FROM cards WHERE rarity IS NOT NULL ORDER BY rarity ASC
  `) as Array<{ rarity: string }>;
  return rows.map(r => r.rarity);
}
