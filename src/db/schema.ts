import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const sets = sqliteTable("sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  releaseDate: text("release_date"),
  totalCards: integer("total_cards"),
  setType: text("set_type").default("expansion"),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  setId: integer("set_id").references(() => sets.id),
  cardNumber: text("card_number"),
  name: text("name").notNull(),
  version: text("version"),
  cardType: text("card_type"),
  cost: integer("cost"),
  attack: integer("attack"),
  defense: integer("defense"),
  flight: integer("flight").default(0),
  range: integer("range").default(0),
  team: text("team"),
  rarity: text("rarity"),
  rulesText: text("rules_text"),
  flavorText: text("flavor_text"),
  illustrator: text("illustrator"),
  imageUrl: text("image_url"),
  ccgdbCardId: integer("ccgdb_card_id").unique(),
}, (table) => [
  index("idx_cards_set_id").on(table.setId),
  index("idx_cards_name").on(table.name),
  index("idx_cards_rarity").on(table.rarity),
  index("idx_cards_card_type").on(table.cardType),
]);

export const collection = sqliteTable("collection", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: integer("card_id").references(() => cards.id).notNull().unique(),
  quantityEn: integer("quantity_en").default(0).notNull(),
  quantityFr: integer("quantity_fr").default(0).notNull(),
  quantityEnFoil: integer("quantity_en_foil").default(0).notNull(),
  quantityFrFoil: integer("quantity_fr_foil").default(0).notNull(),
  condition: text("condition"),
  notes: text("notes"),
  updatedAt: text("updated_at"),
}, (table) => [
  uniqueIndex("idx_collection_card_id").on(table.cardId),
]);

export const priceHistory = sqliteTable("price_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  priceLow: real("price_low"),
  priceMid: real("price_mid"),
  priceHigh: real("price_high"),
  source: text("source").default("tcgplayer"),
  scrapedAt: text("scraped_at").notNull(),
}, (table) => [
  index("idx_price_card_date").on(table.cardId, table.scrapedAt),
]);
