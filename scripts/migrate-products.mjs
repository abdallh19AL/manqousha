#!/usr/bin/env node
/**
 * scripts/migrate-products.mjs
 *
 * 1. Runs migration 008 (adds `sizes` JSONB + `emoji` TEXT to products table)
 * 2. Inserts all menu products into Supabase via the Management API
 * 3. Prints the final row count to verify
 *
 * Usage: node scripts/migrate-products.mjs
 * Requires SUPABASE_ACCESS_TOKEN in .env.local
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────
const envRaw = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envRaw
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
    .filter(([k]) => k)
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}
if (!ACCESS_TOKEN || ACCESS_TOKEN === "your_personal_access_token") {
  console.error("✗ Missing or placeholder SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
console.log(`Project: ${projectRef}\n`);

// ── Management API helper ────────────────────────────────────────
async function runSQL(label, sql) {
  process.stdout.write(`→ ${label}... `);
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
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.log("✗");
    console.error(`Failed (HTTP ${res.status}):`, JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log("✓");
  return body;
}

// ── Size helpers (mirror of src/lib/dummy-products.ts) ───────────
const sw = (p) => [
  { label: "ساندويش", price: p[0] },
  { label: "عادي",    price: p[1] },
  { label: "سوبر",    price: p[2] },
  { label: "دبل",     price: p[3] },
  { label: "تربل",    price: p[4] },
];
const pz = (p) => [
  { label: "صغير", price: p[0] },
  { label: "وسط",  price: p[1] },
  { label: "كبير", price: p[2] },
];
const mn = (p) => [{ label: "عادي", price: p[0] }, { label: "كبير", price: p[1] }];
const wj = (p) => [{ label: "كلاسيك", price: p[0] }, { label: "ميكس",  price: p[1] }];
const wk = (p) => [{ label: "وسط",   price: p[0] }, { label: "كبير", price: p[1] }];

// ── Product data ─────────────────────────────────────────────────
const PRODUCTS = [
  // شاورما ─────────────────────────────────────────────────────────
  { name: "شاورما دجاج كلاسيك",                price: 1.25, category: "شاورما", emoji: "🥙",  sizes: sw([1.25, 2.60, 3.20, 3.85, 5.00]) },
  { name: "شاورما دجاج مع الكريمة والجبنة",    price: 1.50, category: "شاورما", emoji: "🥙",  sizes: sw([1.50, 3.00, 3.50, 4.00, 5.30]) },
  { name: "شاورما دجاج مع دبس الرمان والجبنة", price: 1.50, category: "شاورما", emoji: "🥙",  sizes: sw([1.50, 3.00, 3.50, 4.00, 5.30]) },
  { name: "شاورما دجاج بافيلو",                 price: 1.50, category: "شاورما", emoji: "🌶️", sizes: sw([1.50, 3.00, 3.50, 4.00, 5.30]) },
  { name: "شاورما دجاج مدخن",                   price: 1.50, category: "شاورما", emoji: "🥙",  sizes: sw([1.50, 3.00, 3.50, 4.00, 5.30]) },

  // وجبات شاورما ───────────────────────────────────────────────────
  { name: "وجبة الشاورما العائلية", price: 14.00, category: "وجبات شاورما", emoji: "🍱",
    desc: "56 قطعة شاورما، 2 صحن بطاطا كبير، 2 لتر بيبسي، مخلل وصوصات", sizes: wj([14.00, 15.00]) },
  { name: "وجبة الشاورما الشبابية", price:  9.00, category: "وجبات شاورما", emoji: "🍱",
    desc: "35 قطعة شاورما، 1 صحن بطاطا كبير، 1 لتر بيبسي، مخلل وصوصات", sizes: wj([ 9.00, 10.00]) },

  // بيتزا ──────────────────────────────────────────────────────────
  { name: "مارجريتا",             price: 2.00, category: "بيتزا", emoji: "🍕",
    desc: "جبنة موزاريلا + صلصة",                                                sizes: pz([2.00, 2.60, 4.00]) },
  { name: "خضار",                 price: 2.25, category: "بيتزا", emoji: "🥗",
    desc: "فليفلة حلوة + فطر + زيتون + جبنة موزاريلا + صلصة",                   sizes: pz([2.25, 3.20, 4.50]) },
  { name: "ببروني",               price: 2.50, category: "بيتزا", emoji: "🍖",
    desc: "ببروني + جبنة موزاريلا + صلصة",                                        sizes: pz([2.50, 3.50, 4.50]) },
  { name: "تيركي",                price: 2.50, category: "بيتزا", emoji: "🦃",
    desc: "تيركي + جبنة موزاريلا + صلصة",                                         sizes: pz([2.50, 3.50, 4.50]) },
  { name: "فونجي",                price: 2.50, category: "بيتزا", emoji: "🍄",
    desc: "فطر طازج + جبنة موزاريلا + صلصة",                                      sizes: pz([2.50, 3.20, 4.50]) },
  { name: "خضار إيطالية",         price: 2.50, category: "بيتزا", emoji: "🫑",
    desc: "كوسا + باذنجان + فطر + فليفلة + زيتون + طماطم كرزية + موزاريلا",     sizes: pz([2.50, 3.50, 4.50]) },
  { name: "هوت دوغ",              price: 2.50, category: "بيتزا", emoji: "🌭",
    desc: "زيتون + هوت دوغ + جبنة موزاريلا + صلصة",                              sizes: pz([2.50, 3.50, 4.50]) },
  { name: "بيتزا الفصول الأربعة", price: 3.00, category: "بيتزا", emoji: "🍀",
    desc: "صوص البيتزا + موزاريلا + شيدر + حلوم",                                 sizes: pz([3.00, 4.00, 5.00]) },
  { name: "دجاج مع خضار",         price: 3.00, category: "بيتزا", emoji: "🍗",
    desc: "دجاج + خضار + جبنة موزاريلا + صلصة",                                   sizes: pz([3.00, 4.50, 5.50]) },
  { name: "دجاج باربيكيو",         price: 3.00, category: "بيتزا", emoji: "🍗",
    desc: "دجاج + صلصة باربيكيو + جبنة موزاريلا",                                 sizes: pz([3.00, 4.50, 5.50]) },
  { name: "سوبريم",               price: 3.00, category: "بيتزا", emoji: "👑",
    desc: "ببروني + موزاريلا + صلصة + هوت دوغ + لحمة + خضار",                    sizes: pz([3.00, 4.50, 5.50]) },
  { name: "دجاج ألفريدو",          price: 3.00, category: "بيتزا", emoji: "🍗",
    desc: "دجاج + صلصة ألفريدو + فطر",                                            sizes: pz([3.00, 4.50, 5.50]) },
  { name: "بيتزا الزنجر",         price: 3.00, category: "بيتزا", emoji: "🌶️",
    desc: "زنجر + صوص + فليفلة خضرة + موزاريلا + زيتون",                         sizes: pz([3.00, 4.50, 5.50]) },
  { name: "بيتزا منقوشة ونار",    price: 3.00, category: "بيتزا", emoji: "🔥",
    desc: "شاورما + صوص + موزاريلا",                                               sizes: pz([3.00, 4.50, 5.50]) },
  { name: "بيتزا لحمة",           price: 3.00, category: "بيتزا", emoji: "🥩",
    desc: "صوص + لحمة + خضار",                                                    sizes: pz([3.00, 4.50, 5.50]) },

  // مناقيش ─────────────────────────────────────────────────────────
  { name: "زعتر",                   price: 0.75, category: "مناقيش", emoji: "🌿", sizes: mn([0.75, 1.00]) },
  { name: "زعتر مع خضار",           price: 1.00, category: "مناقيش", emoji: "🌿" },
  { name: "زعتر مع جبنة وخضار",    price: 1.25, category: "مناقيش", emoji: "🌿" },
  { name: "جبنة بيضاء",             price: 1.15, category: "مناقيش", emoji: "🧀", sizes: mn([1.15, 2.35]) },
  { name: "جبنة بيضاء مع خضار",    price: 1.15, category: "مناقيش", emoji: "🧀" },
  { name: "جبنة حلوم",              price: 1.15, category: "مناقيش", emoji: "🧀", sizes: mn([1.15, 2.35]) },
  { name: "جبنة حلوم مع خضار",     price: 1.25, category: "مناقيش", emoji: "🧀" },
  { name: "لبنة مع زعتر",           price: 1.15, category: "مناقيش", emoji: "🫙", sizes: mn([1.15, 2.35]) },
  { name: "لبنة مع خضار",           price: 1.15, category: "مناقيش", emoji: "🫙" },
  { name: "لبنة مع زعتر وخضار",    price: 1.25, category: "مناقيش", emoji: "🫙", sizes: mn([1.25, 2.35]) },
  { name: "مكس أجبان",              price: 1.25, category: "مناقيش", emoji: "🧀", sizes: mn([1.25, 2.35]) },
  { name: "أجبان الفصول الأربعة",  price: 1.35, category: "مناقيش", emoji: "🧀", sizes: mn([1.35, 3.20]) },
  { name: "جبنة كشكوان",            price: 1.15, category: "مناقيش", emoji: "🧀", sizes: mn([1.15, 2.35]) },
  { name: "جبنة صفراء",             price: 1.15, category: "مناقيش", emoji: "🧀", sizes: mn([1.15, 2.35]) },
  { name: "كشكوان مع تيركي",        price: 1.25, category: "مناقيش", emoji: "🦃", sizes: mn([1.25, 2.95]) },
  { name: "كشكوان مع سلامي",        price: 1.25, category: "مناقيش", emoji: "🍖", sizes: mn([1.25, 2.95]) },
  { name: "كشكوان مع هوت دوغ",     price: 1.25, category: "مناقيش", emoji: "🌭", sizes: mn([1.25, 2.95]) },
  { name: "كشكوان مع سجق",          price: 1.25, category: "مناقيش", emoji: "🌭", sizes: mn([1.25, 2.95]) },
  { name: "كشكوان مع بسطرمة",       price: 1.25, category: "مناقيش", emoji: "🥩", sizes: mn([1.25, 2.95]) },
  { name: "بيض سادة",               price: 1.00, category: "مناقيش", emoji: "🍳" },
  { name: "بيض مع جبنة",            price: 1.25, category: "مناقيش", emoji: "🍳" },
  { name: "بيض مع هوت دوغ",         price: 1.25, category: "مناقيش", emoji: "🍳" },
  { name: "بيض مع سجق",             price: 1.25, category: "مناقيش", emoji: "🍳" },
  { name: "بيض مع بسطرمة",          price: 1.25, category: "مناقيش", emoji: "🍳" },
  { name: "بيض مع سلامي",           price: 1.25, category: "مناقيش", emoji: "🍳" },
  { name: "بيض مع تيركي",           price: 1.25, category: "مناقيش", emoji: "🍳" },
  { name: "زعتر مع جبنة",           price: 1.15, category: "مناقيش", emoji: "🌿", sizes: mn([1.15, 1.85]) },

  // مناقيش مميزة ───────────────────────────────────────────────────
  { name: "محمرة مع جبنة",            price: 1.00, category: "مناقيش مميزة", emoji: "🌶️", sizes: mn([1.00, 2.50]) },
  { name: "شيش طاووق",                price: 1.35, category: "مناقيش مميزة", emoji: "🍢",  sizes: mn([1.35, 2.50]) },
  { name: "شيش مدخن",                 price: 1.35, category: "مناقيش مميزة", emoji: "🍢",  sizes: mn([1.35, 2.50]) },
  { name: "دجاج باربيكيو",             price: 1.35, category: "مناقيش مميزة", emoji: "🍗",  sizes: mn([1.35, 2.50]) },
  { name: "دجاج باربيكيو مدخن",       price: 1.35, category: "مناقيش مميزة", emoji: "🍗",  sizes: mn([1.35, 2.50]) },
  { name: "تشيز ستيك",                price: 1.35, category: "مناقيش مميزة", emoji: "🥩",  sizes: mn([1.35, 2.50]) },
  { name: "لحمة بلدي بعجين",          price: 1.35, category: "مناقيش مميزة", emoji: "🥩",  sizes: mn([1.35, 2.50]) },
  { name: "عش البلبل",                price: 1.35, category: "مناقيش مميزة", emoji: "🪺",  sizes: mn([1.35, 2.50]) },
  { name: "لحمة بلدي بعجين مع جبنة", price: 1.50, category: "مناقيش مميزة", emoji: "🥩",  sizes: mn([1.50, 2.50]) },

  // رولات ──────────────────────────────────────────────────────────
  { name: "زعتر مع خضار رول",        price: 1.25, category: "رولات", emoji: "🌿" },
  { name: "زعتر مع جبنة وخضار رول",  price: 1.50, category: "رولات", emoji: "🌿" },
  { name: "جبنة بيضاء مع خضار رول",  price: 1.75, category: "رولات", emoji: "🧀" },
  { name: "لبنة مع خضار رول",         price: 1.75, category: "رولات", emoji: "🫙" },
  { name: "لبنة مع زعتر وخضار رول",  price: 1.75, category: "رولات", emoji: "🫙" },
  { name: "تيركي رول",                price: 2.00, category: "رولات", emoji: "🦃" },
  { name: "سلامي رول",                price: 2.00, category: "رولات", emoji: "🍖" },
  { name: "هوت دوغ رول",              price: 2.00, category: "رولات", emoji: "🌭" },
  { name: "جبنة حلوم رول",            price: 2.00, category: "رولات", emoji: "🧀" },
  { name: "بطاطا مقلية رول",          price: 1.75, category: "رولات", emoji: "🥔" },

  // رولات مميزة ────────────────────────────────────────────────────
  { name: "فاهيتا دجاج رول",         price: 2.30, category: "رولات مميزة", emoji: "🍗" },
  { name: "شيش طاووق رول",           price: 2.30, category: "رولات مميزة", emoji: "🍢" },
  { name: "شيش طاووق مدخن رول",      price: 2.30, category: "رولات مميزة", emoji: "🍢" },
  { name: "دجاج باربيكيو رول",        price: 2.30, category: "رولات مميزة", emoji: "🍗" },
  { name: "دجاج باربيكيو مدخن رول",  price: 2.30, category: "رولات مميزة", emoji: "🍗" },
  { name: "زنجر رول",                 price: 2.30, category: "رولات مميزة", emoji: "🌶️" },
  { name: "دجاج مسحب رول",            price: 2.30, category: "رولات مميزة", emoji: "🍗" },
  { name: "تشيز ستيك رول",            price: 2.30, category: "رولات مميزة", emoji: "🥩" },
  { name: "ألفريدو رول",              price: 2.30, category: "رولات مميزة", emoji: "🍗" },
  { name: "منقوشة ونار رول",          price: 2.30, category: "رولات مميزة", emoji: "🔥" },

  // فطائر ──────────────────────────────────────────────────────────
  { name: "بطاطا",                       price: 1.00, category: "فطائر", emoji: "🥔" },
  { name: "بطاطا مع جبنة",               price: 1.20, category: "فطائر", emoji: "🥔" },
  { name: "بطاطا مع سبانخ",              price: 1.20, category: "فطائر", emoji: "🥔" },
  { name: "سبانخ مع جبنة",               price: 1.40, category: "فطائر", emoji: "🌿" },
  { name: "جبنة بيضاء مع زعتر أخضر",   price: 1.50, category: "فطائر", emoji: "🧀" },
  { name: "فاهيتا دجاج",                 price: 2.50, category: "فطائر", emoji: "🍗" },
  { name: "فطيرة زنجر",                  price: 2.50, category: "فطائر", emoji: "🌶️" },
  { name: "فطيرة ألفريدو",               price: 2.50, category: "فطائر", emoji: "🍗" },
  { name: "فطيرة دجاج مع جبنة سائلة",   price: 2.50, category: "فطائر", emoji: "🍗" },
  { name: "فطيرة دجاج باربيكيو",         price: 2.50, category: "فطائر", emoji: "🍗" },
  { name: "فطيرة زنجر مع الكريمة",      price: 2.75, category: "فطائر", emoji: "🌶️" },
  { name: "فطيرة دجاج بالكاري والجبنة", price: 2.75, category: "فطائر", emoji: "🍛" },

  // مقبلات وإضافات ─────────────────────────────────────────────────
  { name: "10 أجنحة دجاج WINGS",      price: 5.50, category: "مقبلات وإضافات", emoji: "🍗",
    desc: "باربيكيو / بافيلو / chili & sweet / honey mustard" },
  { name: "8 قطع دجاج مسحب BONELESS", price: 5.50, category: "مقبلات وإضافات", emoji: "🍗",
    desc: "باربيكيو / بافيلو / chili & sweet / honey mustard" },
  { name: "صحن سلطة",   price: 1.50, category: "مقبلات وإضافات", emoji: "🥗" },
  { name: "صحن بطاطا",  price: 1.00, category: "مقبلات وإضافات", emoji: "🍟", sizes: wk([1.00, 2.00]) },
  { name: "إضافة خضار", price: 0.25, category: "مقبلات وإضافات", emoji: "🥗", sizes: wk([0.25, 0.50]) },
  { name: "إضافة جبنة", price: 0.25, category: "مقبلات وإضافات", emoji: "🧀", sizes: wk([0.25, 0.50]) },
  { name: "إضافة لحوم", price: 0.25, category: "مقبلات وإضافات", emoji: "🥩", sizes: wk([0.25, 0.50]) },

  // حلويات ─────────────────────────────────────────────────────────
  { name: "ميني نيوتيلا",               price: 0.75, category: "حلويات", emoji: "🍫" },
  { name: "لوتس ميني",                  price: 0.75, category: "حلويات", emoji: "🍪" },
  { name: "عسل بالقشطة ميني",           price: 0.85, category: "حلويات", emoji: "🍯" },
  { name: "فطيرة اللوتس مع القشطة",    price: 1.50, category: "حلويات", emoji: "🍪" },
  { name: "فطيرة العسل مع القشطة",     price: 1.50, category: "حلويات", emoji: "🍯" },
  { name: "فطيرة نيوتيلا",              price: 1.50, category: "حلويات", emoji: "🍫" },
  { name: "فطيرة اللوتس",               price: 1.50, category: "حلويات", emoji: "🍪" },

  // مشروبات ────────────────────────────────────────────────────────
  { name: "مشروبات غازية", price: 0.35, category: "مشروبات", emoji: "🥤" },
  { name: "عصائر",         price: 0.50, category: "مشروبات", emoji: "🧃" },
  { name: "شاي مثلج",      price: 0.50, category: "مشروبات", emoji: "🍵" },
  { name: "لبن شنينة",     price: 0.50, category: "مشروبات", emoji: "🥛" },
  { name: "مياه معدنية",   price: 0.30, category: "مشروبات", emoji: "💧" },
];

// ── SQL literal helper ────────────────────────────────────────────
function lit(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  // Escape single quotes by doubling them (standard SQL)
  return "'" + String(v).replace(/'/g, "''") + "'";
}

// ── Step 1: Apply schema migration ───────────────────────────────
const migrationSQL = readFileSync(
  join(__dirname, "../supabase/migrations/008_add_sizes_emoji.sql"),
  "utf-8"
);
await runSQL("Migration 008 — add sizes + emoji columns", migrationSQL);

// ── Step 2: Build and run INSERT ──────────────────────────────────
console.log(`\nBuilding INSERT for ${PRODUCTS.length} products...`);

const rows = PRODUCTS.map((prod) => {
  const sizesLit = prod.sizes
    ? lit(JSON.stringify(prod.sizes)) + "::jsonb"
    : "NULL";
  return (
    `(${lit(prod.name)}, ${lit(prod.desc ?? null)}, ` +
    `${prod.price}, NULL, ${lit(prod.category)}, TRUE, ` +
    `${lit(prod.emoji ?? null)}, ${sizesLit})`
  );
});

const insertSQL =
  "INSERT INTO products (name, description, price, image_url, category, available, emoji, sizes)\n" +
  "VALUES\n" +
  rows.join(",\n") +
  "\nON CONFLICT (name, category) DO NOTHING;";

await runSQL(`Insert ${PRODUCTS.length} products`, insertSQL);

// ── Step 3: Verify ────────────────────────────────────────────────
console.log("");
const countResult = await runSQL("COUNT products", "SELECT COUNT(*)::int AS total FROM products;");

// The Management API returns an array of row objects
const total =
  Array.isArray(countResult)
    ? (countResult[0]?.total ?? countResult[0]?.count)
    : (countResult?.rows?.[0]?.total ?? countResult?.rows?.[0]?.count ?? "?");

console.log(`\n✅  Products in database: ${total}`);
if (Number(total) === PRODUCTS.length) {
  console.log(`    All ${PRODUCTS.length} products migrated successfully.`);
} else if (Number(total) > 0) {
  console.log(`    Note: inserted ${total} rows (script has ${PRODUCTS.length} — duplicates were skipped via ON CONFLICT).`);
} else {
  console.log("    ⚠  Count came back as 0 or unknown — check the Supabase dashboard.");
}
