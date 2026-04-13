/**
 * VS System TCG Card Scraper
 *
 * Strategy:
 * 1. Fetch all 4534 cards from store.php API in one request (basic fields)
 * 2. Scrape individual card.php pages for detailed fields (cost, ATK/DEF, team, etc.)
 * 3. Save to SQLite via Drizzle ORM
 *
 * Usage: npx tsx scripts/scrape-cards.ts [--skip-details] [--resume]
 */

import * as cheerio from "cheerio";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// --- Config ---
const DB_PATH = path.join(process.cwd(), "data", "vs-system.db");
const CHECKPOINT_PATH = path.join(process.cwd(), "scripts", "scrape-checkpoint.json");
const DETAIL_DELAY_MS = 600; // ms between detail page requests
const BASE_URL = "http://www.ccgdb.com/vs";

// --- Set mapping (releaseid -> set info) ---
const SETS: Record<string, { code: string; name: string; releaseDate: string | null; setType: string }> = {
  "1":  { code: "MOR", name: "Marvel: Origins", releaseDate: "2004-06-01", setType: "expansion" },
  "2":  { code: "DOR", name: "DC: Origins", releaseDate: "2004-10-01", setType: "expansion" },
  "3":  { code: "MSM", name: "Marvel: Spider-Man Starter Deck", releaseDate: "2004-06-01", setType: "starter" },
  "4":  { code: "DSM", name: "Superman, Man of Steel", releaseDate: "2004-12-01", setType: "expansion" },
  "5":  { code: "MMK", name: "Marvel Knights", releaseDate: "2005-02-01", setType: "expansion" },
  "6":  { code: "DGL", name: "Green Lantern Corp", releaseDate: "2005-04-01", setType: "expansion" },
  "7":  { code: "MAV", name: "The Avengers", releaseDate: "2005-06-01", setType: "expansion" },
  "8":  { code: "MFF", name: "Marvel: Fantastic Four Starter Deck", releaseDate: "2005-06-01", setType: "starter" },
  "9":  { code: "DBM", name: "DC: Batman Starter Deck", releaseDate: "2005-04-01", setType: "starter" },
  "10": { code: "DJL", name: "Justice League of America", releaseDate: "2005-09-01", setType: "expansion" },
  "11": { code: "MXM", name: "X-Men", releaseDate: "2005-11-01", setType: "expansion" },
  "12": { code: "MXS", name: "Marvel: X-Men Starter Deck", releaseDate: "2005-11-01", setType: "starter" },
  "13": { code: "DCR", name: "Infinite Crisis", releaseDate: "2006-03-01", setType: "expansion" },
  "14": { code: "MHG", name: "Heralds of Galactus", releaseDate: "2006-06-01", setType: "expansion" },
  "15": { code: "DLS", name: "Legion of Super Heroes", releaseDate: "2006-09-01", setType: "expansion" },
  "16": { code: "EHB", name: "Hellboy Essential Collection", releaseDate: "2006-11-01", setType: "expansion" },
  "17": { code: "MTU", name: "Marvel Team-Up", releaseDate: "2007-02-01", setType: "expansion" },
  "18": { code: "DWF", name: "World's Finest", releaseDate: "2007-05-01", setType: "expansion" },
  "19": { code: "MVL", name: "Marvel: Legends", releaseDate: "2007-08-01", setType: "expansion" },
  "20": { code: "MAA", name: "Marvel Exclusives: Age of Apocalypse", releaseDate: "2007-05-01", setType: "expansion" },
  "21": { code: "MCG", name: "Marvel: Coming of Galactus", releaseDate: "2007-11-01", setType: "expansion" },
  "22": { code: "DCL", name: "DC: Legends", releaseDate: "2008-01-01", setType: "expansion" },
  "23": { code: "DCX", name: "DC: Exclusives", releaseDate: "2008-01-01", setType: "expansion" },
  "24": { code: "MUN", name: "Marvel: Universe", releaseDate: "2008-06-01", setType: "expansion" },
  "25": { code: "MUL", name: "Marvel: Ultimates", releaseDate: "2008-01-01", setType: "expansion" },
  "26": { code: "MEV", name: "Marvel: Evolution", releaseDate: "2008-11-01", setType: "expansion" },
  "27": { code: "MEQ", name: "Marvel: Equipment", releaseDate: "2009-01-01", setType: "expansion" },
  "28": { code: "MFA", name: "Marvel: Factions", releaseDate: "2009-01-01", setType: "expansion" },
};

// --- Types ---
interface StoreCard {
  id: string;
  card_number: string;
  name: string;
  version: string | null;
  type: string;
  concealed: string | null;
  rulestext: string;
  rarity: string;
  releaseid: string;
}

interface CardDetail {
  cost: number | null;
  attack: number | null;
  defense: number | null;
  flight: number;
  range: number;
  team: string | null;
  flavorText: string | null;
  illustrator: string | null;
}

interface Checkpoint {
  detailsScraped: number[];
  lastId: number;
}

// --- Helpers ---
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function expandRarity(code: string): string {
  const map: Record<string, string> = {
    "C": "Common",
    "U": "Uncommon",
    "R": "Rare",
  };
  return map[code] || code;
}

function parseAtkDef(raw: string): { attack: number | null; defense: number | null } {
  const match = raw.trim().match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    return { attack: parseInt(match[1]), defense: parseInt(match[2]) };
  }
  return { attack: null, defense: null };
}

function parseCardDetail(html: string): CardDetail {
  const $ = cheerio.load(html);
  const detail: CardDetail = {
    cost: null,
    attack: null,
    defense: null,
    flight: 0,
    range: 0,
    team: null,
    flavorText: null,
    illustrator: null,
  };

  // Parse the table rows in cardinfo
  $("#cardinfo table tr").each((_, tr) => {
    const label = $(tr).find("td").first().text().trim().replace(/\s*:\s*$/, "");
    const value = $(tr).find("td").last().text().trim();

    switch (label) {
      case "Cost":
        detail.cost = parseInt(value) || null;
        break;
      case "ATK/DEF": {
        const { attack, defense } = parseAtkDef(value);
        detail.attack = attack;
        detail.defense = defense;
        break;
      }
      case "Affiliation":
        detail.team = value || null;
        break;
      case "Abilities": {
        const abilities = value.toLowerCase();
        detail.flight = abilities.includes("flight") ? 1 : 0;
        detail.range = abilities.includes("range") ? 1 : 0;
        break;
      }
      case "Flavor Text":
        detail.flavorText = value.replace(/^[""]|[""]$/g, "").trim() || null;
        break;
      case "Illustrator":
        detail.illustrator = value || null;
        break;
    }
  });

  return detail;
}

function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf-8"));
  }
  return { detailsScraped: [], lastId: 0 };
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const skipDetails = args.includes("--skip-details");
  const resume = args.includes("--resume");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Step 1: Insert sets
  console.log("📦 Inserting sets...");
  const insertSet = db.prepare(`
    INSERT OR IGNORE INTO sets (code, name, release_date, total_cards, set_type)
    VALUES (?, ?, ?, 0, ?)
  `);

  const setIdMap: Record<string, number> = {};
  for (const [releaseId, set] of Object.entries(SETS)) {
    insertSet.run(set.code, set.name, set.releaseDate, set.setType);
    const row = db.prepare("SELECT id FROM sets WHERE code = ?").get(set.code) as { id: number };
    setIdMap[releaseId] = row.id;
  }
  console.log(`  ✓ ${Object.keys(SETS).length} sets inserted`);

  // Step 2: Fetch all cards from store.php
  console.log("\n📥 Fetching all cards from store.php API...");
  const response = await fetch(`${BASE_URL}/store.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "start=0&limit=5000",
  });
  const data = await response.json() as { results: number; rows: StoreCard[] };
  console.log(`  ✓ ${data.rows.length} cards fetched (total: ${data.results})`);

  // Step 3: Insert basic card data
  console.log("\n💾 Inserting cards into database...");
  const insertCard = db.prepare(`
    INSERT OR REPLACE INTO cards (
      ccgdb_card_id, set_id, card_number, name, version, card_type,
      rarity, rules_text, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((cards: StoreCard[]) => {
    for (const card of cards) {
      const setId = setIdMap[card.releaseid] || null;
      const imageUrl = `http://img.ccgdb.com/vs/cards/${card.releaseid}/${card.card_number}.jpg`;
      insertCard.run(
        parseInt(card.id),
        setId,
        card.card_number,
        card.name,
        card.version || null,
        card.type,
        expandRarity(card.rarity),
        card.rulestext || null,
        imageUrl
      );
    }
  });
  insertMany(data.rows);
  console.log(`  ✓ ${data.rows.length} cards inserted`);

  // Update set total_cards counts
  db.prepare(`
    UPDATE sets SET total_cards = (SELECT COUNT(*) FROM cards WHERE cards.set_id = sets.id)
  `).run();
  console.log("  ✓ Set card counts updated");

  if (skipDetails) {
    console.log("\n⏭  Skipping detail scraping (--skip-details)");
    db.close();
    return;
  }

  // Step 4: Scrape detail pages for extra fields
  console.log("\n🔍 Scraping card detail pages for ATK/DEF, cost, team, etc...");
  const allCards = db.prepare("SELECT id, ccgdb_card_id FROM cards ORDER BY ccgdb_card_id").all() as { id: number; ccgdb_card_id: number }[];

  const checkpoint = resume ? loadCheckpoint() : { detailsScraped: [], lastId: 0 };
  const scrapedSet = new Set(checkpoint.detailsScraped);

  const updateDetail = db.prepare(`
    UPDATE cards SET
      cost = ?, attack = ?, defense = ?, flight = ?, range = ?,
      team = ?, flavor_text = ?, illustrator = ?
    WHERE id = ?
  `);

  let scraped = scrapedSet.size;
  const total = allCards.length;
  const startTime = Date.now();

  for (const card of allCards) {
    if (scrapedSet.has(card.ccgdb_card_id)) continue;

    try {
      const res = await fetch(`${BASE_URL}/card.php?cardid=${card.ccgdb_card_id}`);
      const html = await res.text();
      const detail = parseCardDetail(html);

      updateDetail.run(
        detail.cost, detail.attack, detail.defense, detail.flight, detail.range,
        detail.team, detail.flavorText, detail.illustrator,
        card.id
      );

      scraped++;
      scrapedSet.add(card.ccgdb_card_id);

      if (scraped % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = scraped / elapsed;
        const remaining = (total - scraped) / rate;
        console.log(`  [${scraped}/${total}] ~${Math.round(remaining / 60)}min remaining`);
        saveCheckpoint({ detailsScraped: [...scrapedSet], lastId: card.ccgdb_card_id });
      }
    } catch (err) {
      console.error(`  ✗ Error scraping card ${card.ccgdb_card_id}:`, err);
      // Save checkpoint and continue
      saveCheckpoint({ detailsScraped: [...scrapedSet], lastId: card.ccgdb_card_id });
    }

    await sleep(DETAIL_DELAY_MS);
  }

  // Final checkpoint
  saveCheckpoint({ detailsScraped: [...scrapedSet], lastId: allCards[allCards.length - 1].ccgdb_card_id });

  console.log(`\n✅ Done! ${scraped} cards scraped with details.`);

  // Print summary
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(cost) as with_cost,
      COUNT(attack) as with_attack,
      COUNT(team) as with_team,
      COUNT(illustrator) as with_illustrator
    FROM cards
  `).get() as Record<string, number>;
  console.log("\n📊 Database stats:");
  console.log(`  Total cards: ${stats.total}`);
  console.log(`  With cost: ${stats.with_cost}`);
  console.log(`  With ATK/DEF: ${stats.with_attack}`);
  console.log(`  With team: ${stats.with_team}`);
  console.log(`  With illustrator: ${stats.with_illustrator}`);

  db.close();
}

main().catch(console.error);
