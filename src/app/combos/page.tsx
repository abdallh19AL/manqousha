"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageDecorations from "@/components/PageDecorations";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import type { ComboDealWithSteps, ComboStep, ComboCartItem } from "@/types";

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

// ── Combo Modal ──────────────────────────────────────────────────────────────

function ComboModal({
  combo,
  onClose,
}: {
  combo: ComboDealWithSteps;
  onClose: () => void;
}) {
  const addComboItem = useCartStore((s) => s.addComboItem);
  const [mounted, setMounted] = useState(false);

  // selections: stepId → { label, extraCost }
  const [selections, setSelections] = useState<Record<string, { label: string; extraCost: number } | null>>({});

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  const sortedSteps = [...combo.combo_steps].sort((a, b) => a.step_order - b.step_order);

  const requiredSteps = sortedSteps.filter((s) => s.min_select > 0);
  const allRequiredFilled = requiredSteps.every((s) => selections[s.id] != null);

  const extrasTotal = Object.values(selections)
    .filter(Boolean)
    .reduce((sum, sel) => sum + (sel?.extraCost ?? 0), 0);
  const totalPrice = combo.price + extrasTotal;

  const select = (step: ComboStep, label: string, extraCost: number) => {
    setSelections((prev) => {
      const current = prev[step.id];
      // Toggle off if same option clicked again (only for optional steps)
      if (current?.label === label && step.min_select === 0) {
        return { ...prev, [step.id]: null };
      }
      return { ...prev, [step.id]: { label, extraCost } };
    });
  };

  const handleAdd = () => {
    const selList = sortedSteps
      .filter((s) => selections[s.id] != null)
      .map((s) => ({
        stepId:    s.id,
        stepTitle: s.title,
        chosen:    selections[s.id]!.label,
        extraCost: selections[s.id]!.extraCost,
      }));

    const keyParts = selList.map((s) => `${s.stepId}=${s.chosen}`).join("|");
    const cartKey = `combo:${combo.id}:${keyParts}`;

    const item: ComboCartItem = {
      comboId:   combo.id,
      comboName: combo.name,
      basePrice: combo.price,
      selections: selList,
      quantity:  1,
      cartKey,
    };

    addComboItem(item);
    onClose();
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />
      <div
        className="relative rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ background: "#FFFFFF", border: `1px solid ${C.border}` }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors"
          style={{ background: C.surface, color: C.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.border; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
          aria-label="إغلاق"
        >
          ✕
        </button>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: C.border }} />
        </div>

        <div className="px-5 pb-6 pt-4">
          {/* Header */}
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "#FFF4EF", color: C.primary, border: `1px solid ${C.primary}33` }}
          >
            🍕 عرض كومبو
          </span>
          <h2 className="text-2xl font-black mb-1" style={{ color: C.text }}>
            {combo.name}
          </h2>
          {combo.description && (
            <p className="text-sm mb-5" style={{ color: C.muted }}>
              {combo.description}
            </p>
          )}

          {/* Steps */}
          <div className="space-y-6 mb-6">
            {sortedSteps.map((step) => {
              const isOptional = step.min_select === 0;
              const chosen = selections[step.id];
              return (
                <div key={step.id}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <p className="text-sm font-black" style={{ color: C.text }}>
                      {step.title}
                    </p>
                    {isOptional && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: C.surface, color: C.faint, border: `1px solid ${C.border}` }}
                      >
                        اختياري
                      </span>
                    )}
                    {!isOptional && !chosen && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "#FFF4EF", color: C.primary, border: `1px solid ${C.primary}33` }}
                      >
                        مطلوب
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step.combo_step_options.map((opt) => {
                      const active = chosen?.label === opt.label;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => select(step, opt.label, opt.extra_cost)}
                          className="flex flex-col items-center px-3 py-2 rounded-xl font-bold text-sm transition-all"
                          style={
                            active
                              ? {
                                  background: C.primary,
                                  color:      "#FFFFFF",
                                  boxShadow:  `0 4px 14px ${C.primary}55`,
                                  transform:  "scale(1.04)",
                                }
                              : {
                                  background: C.surface,
                                  color:      C.text,
                                  border:     `1px solid ${C.border}`,
                                }
                          }
                        >
                          <span className="leading-snug">{opt.label}</span>
                          {opt.extra_cost > 0 && (
                            <span
                              className="text-xs font-normal mt-0.5"
                              style={{ color: active ? "rgba(255,255,255,0.85)" : C.faint }}
                            >
                              +{opt.extra_cost.toFixed(2)} د.أ
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price + CTA */}
          <div
            className="flex items-center gap-4 pt-4"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <div className="flex-1">
              <p className="text-xs mb-0.5" style={{ color: C.faint }}>السعر الإجمالي</p>
              <p className="text-2xl font-black" style={{ color: C.primary }}>
                {totalPrice.toFixed(2)}&nbsp;د.أ
              </p>
            </div>
            <button
              onClick={handleAdd}
              disabled={!allRequiredFilled}
              className="flex-1 font-black py-3.5 rounded-xl text-base transition-all active:scale-95"
              style={
                allRequiredFilled
                  ? {
                      background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                      color:      "#FFFFFF",
                      boxShadow:  `0 4px 16px ${C.primary}44`,
                    }
                  : {
                      background: C.border,
                      color:      C.faint,
                      cursor:     "not-allowed",
                    }
              }
            >
              أضف للسلة 🛒
            </button>
          </div>
          {!allRequiredFilled && (
            <p className="text-xs text-center mt-2" style={{ color: C.faint }}>
              أكمل جميع الاختيارات المطلوبة
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Combo Card ───────────────────────────────────────────────────────────────

function ComboCard({
  combo,
  onSelect,
}: {
  combo: ComboDealWithSteps;
  onSelect: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
      style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      {/* Image / placeholder */}
      <div
        className="h-36 flex items-center justify-center text-5xl select-none"
        style={{ background: `linear-gradient(135deg, #FFF4EF, #FFF8F2)` }}
      >
        🍕
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-black text-base leading-snug" style={{ color: C.text }}>
            {combo.name}
          </h3>
          {combo.description && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>
              {combo.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <span className="text-xl font-black" style={{ color: C.primary }}>
            {combo.price.toFixed(2)}&nbsp;
            <span className="text-sm font-bold">د.أ</span>
          </span>
          <button
            onClick={onSelect}
            className="px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              color:      "#FFFFFF",
              boxShadow:  `0 4px 12px ${C.primary}33`,
            }}
          >
            اختر العرض
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CombosPage() {
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
        if (error) { console.error("Failed to fetch combos:", error); }
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
            عروض الكومبو
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
