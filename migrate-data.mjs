/**
 * Migrates DATA (not schema) from the OLD Supabase project to the NEW one.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL          — OLD project
 *   SUPABASE_SERVICE_ROLE_KEY         — OLD project
 *   NEW_SUPABASE_URL                  — NEW project
 *   NEW_SUPABASE_SERVICE_ROLE_KEY     — NEW project
 *
 * Usage:
 *   node migrate-data.mjs            (dry run — counts only, no writes)
 *   node migrate-data.mjs --apply    (actually migrates data)
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env.local") });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NEW_SUPABASE_URL,
  NEW_SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
}
requireEnv("NEXT_PUBLIC_SUPABASE_URL", NEXT_PUBLIC_SUPABASE_URL);
requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
requireEnv("NEW_SUPABASE_URL", NEW_SUPABASE_URL);
requireEnv("NEW_SUPABASE_SERVICE_ROLE_KEY", NEW_SUPABASE_SERVICE_ROLE_KEY);

const oldClient = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const newClient = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Tables in FK-dependency order (parents before children) — used for --apply.
// `conflict` is the upsert conflict target (primary/unique key on that table).
const MIGRATION_ORDER = [
  { table: "products", conflict: "id" },
  { table: "profiles", conflict: "id" },
  { table: "delivery_zones", conflict: "zone_code" },
  { table: "combo_deals", conflict: "id" },
  { table: "combo_steps", conflict: "id" },
  { table: "combo_step_options", conflict: "id" },
  { table: "product_offers", conflict: "id" },
  { table: "orders", conflict: "id" },
  { table: "order_items", conflict: "id" },
];

// Found via grep of src/ for .from("...") calls — these are read/written by the
// app but do NOT appear in any file under supabase/migrations/. They are
// counted in the dry run for visibility but are NOT migrated by --apply,
// since we don't know they exist (or their schema) on the NEW project yet.
const UNSCHEMAED_TABLES = [
  "store_settings", // actually IS in migrations (011) but not in the user's apply list
  "product_offers", // no CREATE TABLE anywhere — schema unknown
  "redeemable_products",
  "user_points",
  "points_history",
  "announcements",
  "order_streaks",
];
// product_offers is already in MIGRATION_ORDER per the requested apply order;
// don't double-list it as "extra".
const DRY_RUN_EXTRA_TABLES = UNSCHEMAED_TABLES.filter(
  (t) => !MIGRATION_ORDER.some((m) => m.table === t)
);

const BATCH_SIZE = 500;
const APPLY = process.argv.includes("--apply");

async function countRows(client, table) {
  const { count, error, status, statusText } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    return { error: error.message || `HTTP ${status} ${statusText}` };
  }
  return { count };
}

async function countAuthUsers(client) {
  let total = 0;
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) return { error: error.message || "request failed" };
    total += data.users.length;
    if (data.users.length < perPage) break;
    page++;
  }
  return { count: total };
}

function printRow(label, oldResult, newResult) {
  const oldStr = oldResult.error ? `ERROR: ${oldResult.error}` : String(oldResult.count);
  const newStr = !newResult
    ? ""
    : newResult.error
    ? `ERROR: ${newResult.error}`
    : String(newResult.count);
  console.log(label.padEnd(24), oldStr.padEnd(28), newStr);
}

async function dryRun() {
  console.log(`\nDRY RUN`);
  console.log(`OLD: ${new URL(NEXT_PUBLIC_SUPABASE_URL).hostname}`);
  console.log(`NEW: ${new URL(NEW_SUPABASE_URL).hostname}\n`);

  console.log("Table".padEnd(24), "OLD row count".padEnd(28), "NEW row count / status");
  console.log("-".repeat(75));

  console.log("-- tables in the apply plan --");
  for (const { table } of MIGRATION_ORDER) {
    const [oldR, newR] = await Promise.all([
      countRows(oldClient, table),
      countRows(newClient, table),
    ]);
    printRow(table, oldR, newR);
  }

  console.log("\n-- found in app code, NOT in any migration file / not in apply plan --");
  for (const table of DRY_RUN_EXTRA_TABLES) {
    const [oldR, newR] = await Promise.all([
      countRows(oldClient, table),
      countRows(newClient, table),
    ]);
    printRow(table, oldR, newR);
  }

  console.log("\n-- auth.users (profiles.id and orders.user_id both FK to this) --");
  const [oldUsers, newUsers] = await Promise.all([
    countAuthUsers(oldClient),
    countAuthUsers(newClient),
  ]);
  printRow("auth.users", oldUsers, newUsers);

  console.log(
    "\n============================================================\n" +
      "IMPORTANT FINDINGS\n" +
      "============================================================\n" +
      "1. Six tables the app uses have NO migration file at all:\n" +
      "   product_offers, redeemable_products, user_points, points_history,\n" +
      "   announcements, order_streaks.\n" +
      "   Any 'NEW row count' above showing an error for these means the\n" +
      "   table does not exist yet on the new project — its schema must be\n" +
      "   recreated (pulled from the old project's dashboard) before that\n" +
      "   table's data can be migrated. This script will NOT create tables.\n\n" +
      "2. profiles.id and orders.user_id are foreign keys to auth.users(id).\n" +
      "   If NEW's auth.users doesn't already contain the same UIDs as OLD,\n" +
      "   those specific rows will fail their FK constraint during --apply.\n" +
      "   The script logs and skips failed rows rather than stopping — it\n" +
      "   will NOT crash, but affected profiles/orders won't attach until\n" +
      "   Auth users are migrated separately (a different process from this\n" +
      "   data script — e.g. via the Admin API).\n\n" +
      "3. combined-schema.sql seeded combo_deals with 3 rows using freshly\n" +
      "   generated UUIDs. Those seed ids won't match OLD's real combo_deals\n" +
      "   ids, so upserting by 'id' will NOT replace them — you'll end up\n" +
      "   with 3 duplicate placeholder combos alongside the real migrated\n" +
      "   ones. Consider clearing combo_deals (cascades to combo_steps /\n" +
      "   combo_step_options) on NEW before running --apply.\n" +
      "============================================================\n"
  );

  console.log("Re-run with --apply once you've reviewed the above.");
}

async function migrateTable({ table, conflict }) {
  console.log(`\n[${table}] reading from OLD...`);
  const { data, error } = await oldClient.from(table).select("*");
  if (error) {
    console.error(`[${table}] FAILED to read from OLD: ${error.message}`);
    return;
  }

  const total = data.length;
  console.log(`[${table}] ${total} row(s) to migrate`);
  if (total === 0) return;

  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const { error: batchError } = await newClient
      .from(table)
      .upsert(batch, { onConflict: conflict });

    if (!batchError) {
      migrated += batch.length;
    } else {
      // Batch failed — retry row by row so one bad row doesn't sink the rest.
      for (const row of batch) {
        const { error: rowError } = await newClient
          .from(table)
          .upsert(row, { onConflict: conflict });
        if (rowError) {
          failed++;
          console.error(
            `[${table}] row failed (id=${row.id ?? row[conflict] ?? "?"}): ${rowError.message}`
          );
        } else {
          migrated++;
        }
      }
    }

    console.log(`[${table}] progress: ${Math.min(i + BATCH_SIZE, total)}/${total}`);
  }

  console.log(`[${table}] done — migrated ${migrated}, failed ${failed}`);
}

async function apply() {
  console.log(`\nAPPLY — migrating data OLD -> NEW\n`);
  for (const entry of MIGRATION_ORDER) {
    await migrateTable(entry);
  }
  console.log("\nAll tables processed.");
}

if (APPLY) {
  await apply();
} else {
  await dryRun();
}
