/**
 * Generates SQL for combo steps + options using live pizza product names.
 * Run: npx tsx --env-file=.env.local scripts/generate-combo-sql.ts
 * Then paste the output into the Supabase SQL Editor and run it there.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function esc(s: string) { return s.replace(/'/g, "''"); }

async function main() {
  // Fetch pizza products (public read)
  const { data: pizzas, error: pizzaErr } = await supabase
    .from("products")
    .select("name")
    .eq("category", "بيتزا")
    .order("name");
  if (pizzaErr) { console.error("Failed to fetch pizzas:", pizzaErr); process.exit(1); }

  // Fetch combo deals (public read)
  const { data: combos, error: comboErr } = await supabase
    .from("combo_deals")
    .select("id, name")
    .order("sort_order");
  if (comboErr) { console.error("Failed to fetch combos:", comboErr); process.exit(1); }

  const pizzaNames = (pizzas ?? []).map((p) => p.name as string);
  const comboMap: Record<string, string> = {};
  for (const c of combos ?? []) comboMap[c.name as string] = c.id as string;

  const lines: string[] = [
    "-- Auto-generated combo steps + options",
    "-- Paste into Supabase SQL Editor and run.",
    "",
    "-- Delete existing steps (CASCADE removes options too)",
  ];

  for (const [name, id] of Object.entries(comboMap)) {
    lines.push(`DELETE FROM combo_steps WHERE combo_id = '${id}'; -- ${esc(name)}`);
  }
  lines.push("");

  type StepDef = {
    title: string;
    step_order: number;
    min_select?: number;
    max_select?: number;
    step_type?: string;
    options: Array<{ label: string; extra_cost?: number }>;
  };

  type ComboDef = { name: string; steps: StepDef[] };

  const comboDefs: ComboDef[] = [
    {
      name: "عرض 3 بيتزا وسط",
      steps: [
        { title: "اختيار 1 من البيتزا",  step_order: 1, options: pizzaNames.map((n) => ({ label: n })) },
        { title: "اختيار 2 من البيتزا",  step_order: 2, options: pizzaNames.map((n) => ({ label: n })) },
        { title: "اختيار 3 من البيتزا",  step_order: 3, options: pizzaNames.map((n) => ({ label: n })) },
      ],
    },
    {
      name: "عرض 3 بيتزا كبيرة",
      steps: [
        { title: "اختيار الأول من البيتزا",  step_order: 1, options: pizzaNames.map((n) => ({ label: n })) },
        { title: "اختيار الثاني من البيتزا", step_order: 2, options: pizzaNames.map((n) => ({ label: n })) },
        { title: "اختيار الثالث من البيتزا", step_order: 3, options: pizzaNames.map((n) => ({ label: n })) },
      ],
    },
    {
      name: "العرض الاضخم",
      steps: [
        { title: "اختيار الأول من البيتزا",   step_order: 1, step_type: "pizza",  options: pizzaNames.map((n) => ({ label: n })) },
        { title: "اختيار الثانيك من البيتزا",  step_order: 2, step_type: "pizza",  options: pizzaNames.map((n) => ({ label: n })) },
        { title: "اختيار الثالث من البيتزا",   step_order: 3, step_type: "pizza",  options: pizzaNames.map((n) => ({ label: n })) },
        {
          title: "اختيار اجنحة او قطع دجاج مسحب",
          step_order: 4, step_type: "choice",
          options: [{ label: "ونجز اجنحة دجاج 20" }, { label: "قطع دجاج مسحب 8" }],
        },
        { title: "اختيارك الأول من العجين",  step_order: 5, step_type: "choice", min_select: 0, options: [{ label: "عجين اسمر +0.50 د.أ", extra_cost: 0.5 }] },
        { title: "اختيارك الثاني من العجين", step_order: 6, step_type: "choice", min_select: 0, options: [{ label: "عجين اسمر +0.50 د.أ", extra_cost: 0.5 }] },
        { title: "اختيارك الثالث من العجين", step_order: 7, step_type: "choice", min_select: 0, options: [{ label: "عجين اسمر +0.50 د.أ", extra_cost: 0.5 }] },
      ],
    },
  ];

  for (const comboDef of comboDefs) {
    const comboId = comboMap[comboDef.name];
    if (!comboId) { console.error(`Combo not found in DB: ${comboDef.name}`); continue; }

    lines.push(`-- ── ${esc(comboDef.name)} ─────────────────────────────────────────`);
    for (const step of comboDef.steps) {
      const stepType   = step.step_type ?? "pizza";
      const minSelect  = step.min_select ?? 1;
      const maxSelect  = step.max_select ?? 1;

      // Insert step and capture its ID via a CTE
      const stepVar = `step_${comboId.replace(/-/g, "").slice(0, 8)}_${step.step_order}`;
      lines.push(`WITH ${stepVar} AS (`);
      lines.push(`  INSERT INTO combo_steps (combo_id, title, step_order, min_select, max_select, step_type)`);
      lines.push(`  VALUES ('${comboId}', '${esc(step.title)}', ${step.step_order}, ${minSelect}, ${maxSelect}, '${stepType}')`);
      lines.push(`  RETURNING id`);
      lines.push(`)`);
      lines.push(`INSERT INTO combo_step_options (step_id, label, extra_cost)`);
      const optRows = step.options.map((o) => `  (( SELECT id FROM ${stepVar} ), '${esc(o.label)}', ${o.extra_cost ?? 0})`);
      lines.push(`VALUES`);
      lines.push(optRows.join(",\n") + ";");
      lines.push("");
    }
  }

  lines.push("-- Done.");
  console.log(lines.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
