/**
 * Runs supabase/migrations/001_initial_schema.sql against the remote project
 * using the Supabase Management API.
 *
 * Requires SUPABASE_ACCESS_TOKEN in .env.local
 * (generate at: https://supabase.com/dashboard/account/tokens)
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (Node 20 supports --env-file flag, but this keeps compat)
const envRaw = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envRaw
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((p) => p.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join("=")])
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}
if (!ACCESS_TOKEN) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN in .env.local\n" +
      "Generate one at: https://supabase.com/dashboard/account/tokens"
  );
  process.exit(1);
}

// Extract project ref from URL  e.g. https://abcdef.supabase.co -> abcdef
const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];

const sql = readFileSync(
  join(__dirname, "../supabase/migrations/001_initial_schema.sql"),
  "utf-8"
);

console.log(`Running migration on project: ${projectRef} ...`);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  }
);

if (!res.ok) {
  const body = await res.text();
  console.error(`Migration failed (HTTP ${res.status}):`, body);
  process.exit(1);
}

console.log("Migration applied successfully.");
