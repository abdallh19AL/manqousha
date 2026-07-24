/**
 * Creates 3 new family combo deals (combo_deals + combo_steps + combo_step_options).
 * Pizza-flavor options are pulled live from an existing combo's pizza step so labels/extra_cost
 * match exactly — no manual transcription.
 *
 * Dry run (default):  node new-family-combos.mjs
 * Apply for real:      node new-family-combos.mjs --apply
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

// Source combo/step to copy the pizza flavor list from.
const REFERENCE_COMBO_ID = "d6b34085-9428-4426-bb65-8638ef23ca32"; // عرض 3 بيتزا وسط
const REFERENCE_PIZZA_STEP_TITLE = "اختيار 1 من البيتزا";

const NEW_COMBOS = [
  {
    name: "عرض 3 بيتزا صغير",
    description: "اختر 3 بيتزا حجم صغير بأي نكهة تفضلها",
    price: 5.00,
    is_active: true,
    sort_order: 4,
    pizzaSteps: ["البيتزا الأولى", "البيتزا الثانية", "البيتزا الثالثة"],
  },
  {
    name: "عرض 2 بيتزا وسط + بطاطا ومشروب",
    description: "بيتزا وسط بأي نكهة تختارها + علبتين بطاطا + 2 مشروب غازي",
    price: 8.00,
    is_active: true,
    sort_order: 5,
    pizzaSteps: ["البيتزا الأولى", "البيتزا الثانية"],
  },
  {
    name: "عرض 2 بيتزا كبير + بطاطا ومشروب",
    description: "بيتزا كبيرة بأي نكهة تختارها + علبتين بطاطا + 3 مشروب غازي",
    price: 5.00, // TEMPORARY — owner will update from admin later
    is_active: true,
    sort_order: 6,
    pizzaSteps: ["البيتزا الأولى", "البيتزا الثانية"],
  },
];

function printJSON(label, data) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log(APPLY ? "=== APPLY MODE — will write to the database ===" : "=== DRY RUN — no writes will happen ===");

  // Fetch the reference pizza flavor list live so labels/extra_cost match exactly.
  const { data: refStep, error: refStepErr } = await supabase
    .from("combo_steps")
    .select("id")
    .eq("combo_id", REFERENCE_COMBO_ID)
    .eq("title", REFERENCE_PIZZA_STEP_TITLE)
    .single();
  if (refStepErr || !refStep) {
    console.error("Failed to find reference pizza step:", refStepErr);
    process.exit(1);
  }

  const { data: flavorOptions, error: flavorErr } = await supabase
    .from("combo_step_options")
    .select("label, extra_cost")
    .eq("step_id", refStep.id)
    .order("id");
  if (flavorErr || !flavorOptions || flavorOptions.length === 0) {
    console.error("Failed to fetch reference pizza flavor options:", flavorErr);
    process.exit(1);
  }

  printJSON(`Reference pizza flavor list (${flavorOptions.length} options, copied from "${REFERENCE_PIZZA_STEP_TITLE}")`, flavorOptions);

  for (const combo of NEW_COMBOS) {
    const comboPayload = {
      name: combo.name,
      description: combo.description,
      price: combo.price,
      image_url: null,
      is_active: combo.is_active,
      sort_order: combo.sort_order,
    };

    console.log(`\n--------------------------------------------`);
    console.log(`COMBO: ${combo.name}`);
    printJSON("combo_deals INSERT", comboPayload);

    let comboId = "<pending>";
    if (APPLY) {
      const { data: insertedCombo, error: comboErr } = await supabase
        .from("combo_deals")
        .insert(comboPayload)
        .select("id")
        .single();
      if (comboErr || !insertedCombo) {
        console.error(`  FAILED to insert combo "${combo.name}":`, comboErr);
        continue;
      }
      comboId = insertedCombo.id;
      console.log(`  Inserted combo_deals row: ${comboId}`);
    }

    let stepOrder = 1;
    for (const stepTitle of combo.pizzaSteps) {
      const stepPayload = {
        combo_id: comboId,
        title: stepTitle,
        subtitle: null,
        step_order: stepOrder,
        min_select: 1,
        max_select: 1,
        step_type: "pizza",
      };

      console.log(`\n  combo_steps INSERT (step_order ${stepOrder}):`, JSON.stringify(stepPayload));

      let stepId = "<pending>";
      if (APPLY) {
        const { data: insertedStep, error: stepErr } = await supabase
          .from("combo_steps")
          .insert(stepPayload)
          .select("id")
          .single();
        if (stepErr || !insertedStep) {
          console.error(`    FAILED to insert step "${stepTitle}":`, stepErr);
          continue;
        }
        stepId = insertedStep.id;
      }

      const optionPayloads = flavorOptions.map((o) => ({
        step_id: stepId,
        label: o.label,
        extra_cost: o.extra_cost,
        product_category: null,
      }));

      console.log(`    combo_step_options INSERT (${optionPayloads.length} options):`);
      for (const opt of optionPayloads) {
        console.log(`      ${JSON.stringify(opt)}`);
      }

      if (APPLY) {
        const { error: optErr } = await supabase
          .from("combo_step_options")
          .insert(optionPayloads.map(({ step_id, label, extra_cost, product_category }) => ({ step_id, label, extra_cost, product_category })));
        if (optErr) console.error(`    FAILED to insert options for step "${stepTitle}":`, optErr);
      }

      stepOrder += 1;
    }
  }

  console.log(`\n--------------------------------------------`);
  console.log(APPLY ? "Done — inserts applied." : "Dry run complete. Review the plan above, then re-run with --apply to write these rows.");
}

main().catch((e) => { console.error(e); process.exit(1); });
