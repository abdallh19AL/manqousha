/**
 * Seed combo steps and options for the 3 pizza deals.
 * Run: npx tsx --env-file=.env.local scripts/seed-combos.ts
 * (Node 20+) or: set env vars manually before running.
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function main() {
  // 1. Fetch all pizza products
  const { data: pizzas, error: pizzaErr } = await supabase
    .from("products")
    .select("name")
    .eq("category", "بيتزا")
    .order("name");

  if (pizzaErr) { console.error("Failed to fetch pizza products:", pizzaErr); process.exit(1); }
  const pizzaOptions = (pizzas ?? []).map((p) => ({ label: p.name, extra_cost: 0, product_category: "بيتزا" }));
  console.log(`Found ${pizzaOptions.length} pizza products.`);

  // 2. Fetch combo deals
  const { data: combos, error: comboErr } = await supabase
    .from("combo_deals")
    .select("id, name")
    .order("sort_order");

  if (comboErr) { console.error("Failed to fetch combos:", comboErr); process.exit(1); }

  const comboMap: Record<string, string> = {};
  for (const c of combos ?? []) comboMap[c.name] = c.id;

  // Helper: insert steps + options for a combo, replacing any existing ones
  async function seedSteps(
    comboName: string,
    steps: Array<{
      title: string;
      subtitle?: string;
      step_order: number;
      min_select?: number;
      max_select?: number;
      step_type?: string;
      options: Array<{ label: string; extra_cost?: number; product_category?: string }>;
    }>,
  ) {
    const comboId = comboMap[comboName];
    if (!comboId) { console.warn(`Combo not found: ${comboName}`); return; }

    // Delete existing steps (cascade deletes options)
    const { error: delErr } = await supabase
      .from("combo_steps")
      .delete()
      .eq("combo_id", comboId);
    if (delErr) { console.error(`Delete steps failed for ${comboName}:`, delErr); return; }

    for (const step of steps) {
      const { data: stepRow, error: stepErr } = await supabase
        .from("combo_steps")
        .insert({
          combo_id:   comboId,
          title:      step.title,
          subtitle:   step.subtitle ?? null,
          step_order: step.step_order,
          min_select: step.min_select ?? 1,
          max_select: step.max_select ?? 1,
          step_type:  step.step_type ?? "pizza",
        })
        .select("id")
        .single();

      if (stepErr || !stepRow) { console.error(`Insert step failed: ${step.title}`, stepErr); continue; }

      const optRows = step.options.map((o) => ({
        step_id:          stepRow.id,
        label:            o.label,
        extra_cost:       o.extra_cost ?? 0,
        product_category: o.product_category ?? null,
      }));

      const { error: optErr } = await supabase.from("combo_step_options").insert(optRows);
      if (optErr) { console.error(`Insert options failed for step ${step.title}:`, optErr); }
      else console.log(`  ✓ ${step.title} (${optRows.length} options)`);
    }
  }

  // ── عرض 3 بيتزا وسط ─────────────────────────────────────────────────────
  console.log("\nSeeding: عرض 3 بيتزا وسط");
  await seedSteps("عرض 3 بيتزا وسط", [
    { title: "اختيار 1 من البيتزا",  step_order: 1, options: pizzaOptions },
    { title: "اختيار 2 من البيتزا",  step_order: 2, options: pizzaOptions },
    { title: "اختيار 3 من البيتزا",  step_order: 3, options: pizzaOptions },
  ]);

  // ── عرض 3 بيتزا كبيرة ───────────────────────────────────────────────────
  console.log("\nSeeding: عرض 3 بيتزا كبيرة");
  await seedSteps("عرض 3 بيتزا كبيرة", [
    { title: "اختيار الأول من البيتزا",  step_order: 1, options: pizzaOptions },
    { title: "اختيار الثاني من البيتزا", step_order: 2, options: pizzaOptions },
    { title: "اختيار الثالث من البيتزا", step_order: 3, options: pizzaOptions },
  ]);

  // ── العرض الاضخم ────────────────────────────────────────────────────────
  console.log("\nSeeding: العرض الاضخم");
  await seedSteps("العرض الاضخم", [
    { title: "اختيار الأول من البيتزا",  step_order: 1, step_type: "pizza",  options: pizzaOptions },
    { title: "اختيار الثانيك من البيتزا", step_order: 2, step_type: "pizza", options: pizzaOptions },
    { title: "اختيار الثالث من البيتزا", step_order: 3, step_type: "pizza",  options: pizzaOptions },
    {
      title: "اختيار اجنحة او قطع دجاج مسحب",
      step_order: 4,
      step_type: "choice",
      options: [
        { label: "ونجز اجنحة دجاج 20",  extra_cost: 0 },
        { label: "قطع دجاج مسحب 8",     extra_cost: 0 },
      ],
    },
    {
      title: "اختيارك الأول من العجين",
      step_order: 5,
      step_type: "choice",
      min_select: 0,
      options: [{ label: "عجين اسمر +0.50 د.أ", extra_cost: 0.5 }],
    },
    {
      title: "اختيارك الثاني من العجين",
      step_order: 6,
      step_type: "choice",
      min_select: 0,
      options: [{ label: "عجين اسمر +0.50 د.أ", extra_cost: 0.5 }],
    },
    {
      title: "اختيارك الثالث من العجين",
      step_order: 7,
      step_type: "choice",
      min_select: 0,
      options: [{ label: "عجين اسمر +0.50 د.أ", extra_cost: 0.5 }],
    },
  ]);

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
