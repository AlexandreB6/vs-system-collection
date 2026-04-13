import { config } from "dotenv";
config({ path: ".env.local" });

import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import path from "path";

const LOCAL_DB = path.join(process.cwd(), "data", "vs-system.db");
const TABLES = ["sets", "cards", "collection", "price_history"];
const BATCH_SIZE = 200;

async function main() {
  const local = new Database(LOCAL_DB, { readonly: true });
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  for (const table of TABLES) {
    const exists = local
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    if (!exists) {
      console.log(`skip ${table} (not in local DB)`);
      continue;
    }

    const rows = local.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
    console.log(`${table}: ${rows.length} rows`);
    if (rows.length === 0) continue;

    await turso.execute(`DELETE FROM ${table}`);

    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(", ");
    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await turso.batch(
        batch.map((r) => ({ sql, args: columns.map((c) => r[c] as never) })),
        "write",
      );
      process.stdout.write(`  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}\r`);
    }
    console.log(`  ${rows.length}/${rows.length} ✓`);
  }

  local.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
