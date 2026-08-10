"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageDecorations from "@/components/PageDecorations";
import { ComboCard, ComboModal } from "@/components/ComboDisplay";
import { supabase } from "@/lib/supabase";
import type { ComboDealWithSteps } from "@/types";

const C = {
  bg:      "#FBF7F2",
  surface: "#F7F5F2",
  border:  "#E5E0D8",
  primary: "#E8622A",
  gold:    "#C8922A",
  text:    "#1A1208",
  muted:   "#6B5B47",
  faint:   "#9B8B73",
} as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FamilyOffersPage() {
  const [combos,      setCombos]      = useState<ComboDealWithSteps[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeCombo, setActiveCombo] = useState<ComboDealWithSteps | null>(null);

  useEffect(() => {
    supabase
      .from("combo_deals")
      .select(`
        *,
        combo_steps (
          *,
          combo_step_options (*)
        )
      `)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) { console.error("Failed to fetch family offers:", error); }
        else if (data) {
          const sorted = (data as ComboDealWithSteps[]).map((combo) => ({
            ...combo,
            combo_steps: combo.combo_steps
              .sort((a, b) => a.step_order - b.step_order)
              .map((step) => ({
                ...step,
                combo_step_options: step.combo_step_options ?? [],
              })),
          }));
          setCombos(sorted);
        }
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen flex flex-col page-with-decos" style={{ background: C.bg, color: C.text }}>
      <PageDecorations />
      <Navbar variant="light" />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-24 pb-28 md:pb-12">
        {/* Header */}
        <div className="mb-8">
          <span
            className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-3"
            style={{ background: "#FFF4EF", color: C.primary, border: `1px solid ${C.primary}33` }}
          >
            🍕 عروض البيتزا
          </span>
          <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>
           العروض العائلية
          </h1>
          <p className="text-sm" style={{ color: C.muted }}>
            اختر عرضك المفضل وخصص بيتزاتك
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${C.primary} transparent transparent transparent` }}
            />
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍕</p>
            <p className="font-bold text-base" style={{ color: C.muted }}>
              لا توجد عروض متاحة حالياً
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.map((combo) => (
              <ComboCard
                key={combo.id}
                combo={combo}
                onSelect={() => setActiveCombo(combo)}
              />
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm font-bold"
            style={{ color: C.faint }}
          >
            ← تصفح القائمة الكاملة
          </Link>
        </div>
      </div>

      <Footer variant="light" />

      {activeCombo && (
        <ComboModal
          combo={activeCombo}
          onClose={() => setActiveCombo(null)}
        />
      )}
    </main>
  );
}
