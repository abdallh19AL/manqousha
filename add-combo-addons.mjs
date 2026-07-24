/**
 * Appends optional add-on steps (wings, boneless, sauces, salad, fries+drink)
 * to all 3 combo_deals rows.
 *
 * Dry run (default):  node add-combo-addons.mjs
 * Apply for real:      node add-combo-addons.mjs --apply
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const APPLY = process.argv.includes("--apply");

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TARGET_COMBO_IDS = [
  "d6b34085-9428-4426-bb65-8638ef23ca32", // عرض 3 بيتزا وسط
  "bd52830c-7eee-46c1-8782-28660f71aff7", // عرض 3 بيتزا كبيرة
  "9cb9fde7-bdf2-4be8-afed-891a4c419946", // العرض الاضخم
];

// Each entry: step fields + its options. All optional (min_select: 0), single-select (max_select: 1).
const ADDON_STEPS = [
  {
    title: "إضافة: 20 حبة ونجز",
    options: [{ label: "20 حبة ونجز", extra_cost: 2.00 }],
  },
  {
    title: "صوص الونجز",
    options: [
      { label: "هاني ماستر", extra_cost: 0 },
      { label: "باربكيو", extra_cost: 0 },
      { label: "بافلو", extra_cost: 0 },
    ],
  },
  {
    title: "إضافة: 8 بونلس جاج مسحب",
    options: [{ label: "8 بونلس جاج مسحب", extra_cost: 2.00 }],
  },
  {
    title: "صوص البونلس",
    options: [
      { label: "هاني ماستر", extra_cost: 0 },
      { label: "باربكيو", extra_cost: 0 },
      { label: "بافلو", extra_cost: 0 },
    ],
  },
  {
    title: "صحن سلطة",
    options: [{ label: "صحن سلطة", extra_cost: 1.50 }],
  },
  {
    title: "علبتين بطاطا + لتر مشروب",
    options: [{ label: "علبتين بطاطا + لتر مشروب غازي", extra_cost: 2.00 }],
  },
];

async function main() {
  console.log(APPLY ? "=== APPLY MODE — will write to the database ===" : "=== DRY RUN — no writes will happen ===");
  console.log();

  for (const comboId of TARGET_COMBO_IDS) {
    const { data: combo, error: comboErr } = await supabase
      .from("combo_deals")
      .select("id, name")
      .eq("id", comboId)
      .single();
    if (comboErr || !combo) { console.error(`Combo not found: ${comboId}`, comboErr); continue; }

    const { data: existingSteps, error: stepsErr } = await supabase
      .from("combo_steps")
      .select("step_order")
      .eq("combo_id", comboId);
    if (stepsErr) { console.error(`Failed to fetch steps for ${combo.name}:`, stepsErr); continue; }

    const currentMax = existingSteps.length ? Math.max(...existingSteps.map((s) => s.step_order)) : 0;

    console.log(`--- ${combo.name} (${comboId}) ---`);
    console.log(`Current step count: ${existingSteps.length}, current max step_order: ${currentMax}`);
    console.log();

    let nextOrder = currentMax + 1;
    for (const step of ADDON_STEPS) {
      const stepPayload = {
        combo_id: comboId,
        title: step.title,
        subtitle: null,
        step_order: nextOrder,
        min_select: 0,
        max_select: 1,
        step_type: "choice",
      };

      console.log(`  combo_steps INSERT (step_order ${nextOrder}):`, JSON.stringify(stepPayload));

      let stepId = "<pending>";
      if (APPLY) {
        const { data: inserted, error: insErr } = await supabase
          .from("combo_steps")
          .insert(stepPayload)
          .select("id")
          .single();
        if (insErr || !inserted) { console.error(`    FAILED to insert step "${step.title}":`, insErr); continue; }
        stepId = inserted.id;
      }

      const optionPayloads = step.options.map((o) => ({
        step_id: stepId,
        label: o.label,
        extra_cost: o.extra_cost,
        product_category: null,
      }));
      for (const opt of optionPayloads) {
        console.log(`    combo_step_options INSERT:`, JSON.stringify(opt));
      }

      if (APPLY) {
        const { error: optErr } = await supabase
          .from("combo_step_options")
          .insert(optionPayloads.map(({ step_id, label, extra_cost, product_category }) => ({ step_id, label, extra_cost, product_category })));
        if (optErr) console.error(`    FAILED to insert options for step "${step.title}":`, optErr);
      }

      nextOrder += 1;
    }
    console.log();
  }

  console.log(APPLY ? "Done — inserts applied." : "Dry run complete. Re-run with --apply to write these rows.");
}

main().catch((e) => { console.error(e); process.exit(1); });
