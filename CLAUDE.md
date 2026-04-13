# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx drizzle-kit push # Push schema changes to SQLite
npx tsx scripts/scrape-cards.ts              # Full scrape (~45min)
npx tsx scripts/scrape-cards.ts --skip-details  # Basic data only (~5s)
npx tsx scripts/scrape-cards.ts --resume        # Resume interrupted detail scrape
```

## Architecture

VS System TCG (original 2004-2009) collection manager: Next.js 16 App Router + SQLite (Drizzle ORM) + Tailwind CSS 4.

### Data flow

```
ccgdb.com → scripts/scrape-cards.ts → SQLite (data/vs-system.db)
                                          ↓
                              src/lib/queries.ts (reads, raw SQL via db.all)
                              src/lib/actions.ts (mutations, "use server")
                                          ↓
                              src/app/**/page.tsx (async server components)
                                          ↓
                              src/components/**  (client components where interactive)
```

### Database (4 tables in `src/db/schema.ts`)

- **sets** — 28 sets keyed by `code` (e.g. "MOR", "DGL")
- **cards** — ~4534 cards with stats, rules text, image URLs. `ccgdb_card_id` is unique.
- **collection** — one row per card tracking `quantity_en`, `quantity_fr` (EN/FR copies), `condition`, `notes`. Unique on `card_id`.
- **price_history** — price snapshots per card (not yet implemented).

DB connection in `src/db/index.ts` uses better-sqlite3 with WAL mode. Path: `data/vs-system.db`.

### Critical: Drizzle ORM subquery bug

**Do NOT use Drizzle's `sql` template literals for correlated subqueries in `.select()`.** They silently return wrong results (e.g. returning the first collection row's value for ALL cards instead of correlating per-card). All read queries in `queries.ts` use raw SQL via `db.all(sql\`...\`)` with explicit `LEFT JOIN` instead. Only use Drizzle's query builder for simple selects/inserts/updates without subqueries.

### Key patterns

- All page routes use `export const dynamic = "force-dynamic"` (no static generation).
- `params` and `searchParams` are Promises (Next.js 15+ breaking change) — must `await` them.
- Mutations use Server Actions with `revalidatePath("/", "layout")` for full cache invalidation.
- `QuantitySelector` is the main client component — tracks EN/FR quantities separately with `useState` + `useTransition`.
- Card images are remote from `img.ccgdb.com` (configured in `next.config.ts` remotePatterns), not stored locally.

### Scraper (`scripts/scrape-cards.ts`)

Two-phase approach:
1. Fetches all cards in one POST to `ccgdb.com/vs/store.php` (returns JSON with basic fields)
2. Scrapes individual `card.php?cardid={id}` pages with Cheerio for details (cost, ATK/DEF, team, illustrator, flavor text) — 600ms delay between requests, checkpoints every 100 cards to `scripts/scrape-checkpoint.json`.

Set metadata (codes, names, dates) is hardcoded in the scraper's `SETS` map since ccgdb has no sets endpoint.
