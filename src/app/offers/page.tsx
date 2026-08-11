"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ComboCard, ComboModal } from "@/components/ComboDisplay";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useCartStore } from "@/lib/store";
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

interface _OfferWithProduct {
  id: string;
  offer_type: "price_discount" | "free_delivery" | "free_addon" | "simple";
  discount_percent: number | null;
  addon_description: string | null;
  description: string | null;
  name: string | null;
  price: number | null;
  image_url: string | null;
  expires_at: string | null;
  products: {
    id: string;
    name: string;
    category: string;
    price: number;
    emoji: string | null;
    image_url: string | null;
  } | null;
}

export default function OffersPage() {
  const [offers,  setOffers]  = useState<_OfferWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [userStreak,   setUserStreak]   = useState<number>(0);
  const [streakLoaded, setStreakLoaded] = useState(false);
  const [streakOfferEnabled, setStreakOfferEnabled] = useState(true);
  const [bundleCombos, setBundleCombos] = useState<ComboDealWithSteps[]>([]);
  const [activeCombo,  setActiveCombo]  = useState<ComboDealWithSteps | null>(null);
  const addSimpleOfferItem = useCartStore((s) => s.addSimpleOfferItem);

  useEffect(() => {
    if (!user) { setStreakLoaded(true); return; }
    supabase
      .from("order_streaks")
      .select("order_count, streak_start")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as { order_count: number; streak_start: string };
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const count = new Date(d.streak_start) >= thirtyDaysAgo ? d.order_count : 0;
          setUserStreak(count);
        }
        setStreakLoaded(true);
      });
  }, [user]);

  useEffect(() => {
    (async () => {
      const now = new Date().toISOString();
      const [{ data }, { data: settingsData }, { data: comboData, error: comboError }] = await Promise.all([
        supabase
          .from("product_offers")
          .select("id, offer_type, discount_percent, addon_description, description, name, price, image_url, expires_at, products(id, name, category, price, emoji, image_url)")
          .eq("is_active", true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("store_settings")
          .select("streak_enabled")
          .eq("id", 1)
          .single(),
        supabase
          .from("combo_deals")
          .select("*, combo_steps(*, combo_step_options(*))")
          .eq("is_active", true)
          .eq("show_on_offers", true)
          .order("sort_order"),
      ]);
      const raw = (data as _OfferWithProduct[] | null) ?? [];
      const seen = new globalThis.Map<string, _OfferWithProduct>();
      const simpleOffers: _OfferWithProduct[] = [];
      for (const offer of raw) {
        if (offer.offer_type === "simple") { simpleOffers.push(offer); continue; }
        const pid = offer.products?.id;
        if (pid && !seen.has(pid)) seen.set(pid, offer);
      }
      setOffers([...simpleOffers, ...Array.from(seen.values())]);
      if (settingsData) {
        setStreakOfferEnabled(Boolean((settingsData as Record<string, unknown>).streak_enabled ?? true));
      }
      if (comboError) console.error("Failed to fetch bundle combos:", comboError);
      if (comboData) {
        setBundleCombos(
          (comboData as ComboDealWithSteps[]).map((combo) => ({
            ...combo,
            combo_steps: combo.combo_steps
              .sort((a, b) => a.step_order - b.step_order)
              .map((step) => ({
                ...step,
                combo_step_options: step.combo_step_options ?? [],
              })),
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const badgeStyle = (type: _OfferWithProduct["offer_type"]) =>
    type === "price_discount"
      ? { bg: "#EF4444", color: "#fff" }
      : type === "free_delivery"
      ? { bg: "#22C55E", color: "#fff" }
      : { bg: C.gold, color: "#fff" };

  const badgeLabel = (offer: _OfferWithProduct) =>
    offer.offer_type === "price_discount"
      ? `خصم ${offer.discount_percent}%`
      : offer.offer_type === "free_delivery"
      ? "توصيل مجاني"
      : `${offer.addon_description} مجاناً`;

  const discountedPrice = (price: number, offer: _OfferWithProduct) =>
    offer.offer_type === "price_discount" && offer.discount_percent !== null
      ? Math.round(price * (100 - offer.discount_percent) / 100 * 100) / 100
      : null;

  return (
    <main className="min-h-screen flex flex-col pb-24 md:pb-0" style={{ background: C.bg, color: C.text }}>
      <Navbar variant="light" />

      <div className="flex-1 pt-20 md:pt-24 pb-10 px-4 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="font-black mb-2"
            style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}
          >
            <span style={{ color: C.text }}>العروض و الوجبات </span>
            <span
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              والتخفيضات
            </span>
          </h1>
          <p className="text-sm font-bold" style={{ color: C.muted }}>
            أفضل الأسعار وعروض حصرية يومياً
          </p>
          <div
            className="mx-auto mt-3 rounded-full"
            style={{ width: "48px", height: "3px", background: `linear-gradient(90deg, ${C.primary}, ${C.gold})` }}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden animate-pulse"
                style={{ border: `1.5px solid ${C.border}` }}
              >
                <div className="h-36" style={{ background: "#F5F0EB" }} />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 rounded-full w-3/4" style={{ background: "#EDE8E2" }} />
                  <div className="h-2.5 rounded-full w-1/2" style={{ background: "#F0EBE6" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
          {bundleCombos.length > 0 && (
            <div className="mb-8">
              <h2 className="font-black text-lg mb-4" style={{ color: C.text }}>
                عروض الحزم
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundleCombos.map((combo) => (
                  <ComboCard
                    key={combo.id}
                    combo={combo}
                    onSelect={() => setActiveCombo(combo)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Static streak loyalty offer card */}
            {streakOfferEnabled && (
              <div
                className="col-span-full rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${C.primary}`, background: "#FFF8F5" }}
              >
                <div
                  className="px-4 py-2"
                  style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.gold})` }}
                >
                  <span className="text-xs font-black text-white">🔥 عرض الولاء</span>
                </div>
                <div className="p-4 text-center">
                  <div className="text-4xl mb-2">🚚</div>
                  <h3 className="font-black text-lg mb-1" style={{ color: C.text }}>
                    توصيل مجاني للطلب الخامس
                  </h3>
                  <p className="text-sm mb-3" style={{ color: C.muted }}>
                    أكمل 4 طلبات خلال 30 يوماً واحصل على توصيل مجاني في طلبك الخامس تلقائياً
                  </p>
                  {!user && streakLoaded ? (
                    <div className="text-center py-4">
                      <p className="text-sm font-bold mb-3" style={{ color: C.muted }}>
                        سجل دخولك للاستفادة من هذا العرض وتتبع تقدمك
                      </p>
                      <a
                        href="/login"
                        className="inline-block font-black px-6 py-2.5 rounded-xl text-sm"
                        style={{ background: C.primary, color: "#fff" }}
                      >
                        تسجيل الدخول
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center gap-2 flex-wrap">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                            style={{
                              background: userStreak >= n ? "#22C55E" : C.primary,
                              color: "#fff",
                              opacity: userStreak >= n ? 1 : 0.4,
                            }}
                          >
                            {userStreak >= n ? "✓" : n}
                          </div>
                        ))}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2"
                          style={{ borderColor: C.primary, color: C.primary, background: "#fff" }}
                        >
                          🎁
                        </div>
                      </div>

                      {user && streakLoaded && (
                        <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: `${C.primary}12` }}>
                          {userStreak >= 4 ? (
                            <p className="text-sm font-black" style={{ color: "#22C55E" }}>
                              🎉 طلبك القادم فيه توصيل مجاني!
                            </p>
                          ) : (
                            <p className="text-sm font-bold" style={{ color: C.primary }}>
                              باقي لك {4 - userStreak} طلب{4 - userStreak === 1 ? "" : "ات"} للتوصيل المجاني
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {offers.length > 0 ? offers.map((offer) => {
              if (offer.offer_type === "simple") {
                return (
                  <div
                    key={offer.id}
                    className="relative rounded-2xl overflow-hidden flex flex-col select-none"
                    style={{ background: "#fff", border: `1.5px solid ${C.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="relative flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ height: "144px", background: `linear-gradient(150deg, #FFF6E0, #FFF0CC)` }}
                    >
                      {offer.image_url ? (
                        <img src={offer.image_url} alt={offer.name ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontSize: "72px", lineHeight: "1", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}>🎁</span>
                      )}
                      <span
                        className="absolute top-2 left-2 text-xs font-black px-2 py-0.5 rounded-full z-10"
                        style={{ background: C.gold, color: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }}
                      >
                        عرض خاص
                      </span>
                    </div>
                    <div className="p-3.5 flex flex-col flex-1">
                      <h3 className="font-black text-sm leading-snug mb-1" style={{ color: C.text }}>
                        {offer.name}
                      </h3>
                      {offer.description && (
                        <p className="text-xs mb-2 leading-relaxed" style={{ color: C.muted }}>{offer.description}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="font-black text-base leading-none" style={{ color: C.primary }}>
                            {(offer.price ?? 0).toFixed(2)}
                          </span>
                          <span className="text-xs font-bold" style={{ color: C.faint }}>د.أ</span>
                        </div>
                        <button
                          onClick={() => addSimpleOfferItem({
                            offerId:   offer.id,
                            offerName: offer.name ?? "عرض خاص",
                            price:     offer.price ?? 0,
                            quantity:  1,
                            cartKey:   `simple:${offer.id}`,
                          })}
                          className="text-xs font-black px-2.5 py-1 rounded-xl shrink-0 transition-colors"
                          style={{ background: `${C.primary}12`, color: C.primary }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = `${C.primary}12`; e.currentTarget.style.color = C.primary; }}
                        >
                          أضف للسلة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              const prod = offer.products;
              if (!prod) return null;
              const badge    = badgeStyle(offer.offer_type);
              const label    = badgeLabel(offer);
              const newPrice = discountedPrice(prod.price, offer);
              return (
                <Link
                  key={offer.id}
                  href={`/?category=${encodeURIComponent(prod.category)}`}
                  className="group relative rounded-2xl overflow-hidden flex flex-col select-none"
                  style={{
                    background: "#fff",
                    border:     `1.5px solid ${C.border}`,
                    boxShadow:  "0 2px 10px rgba(0,0,0,0.06)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    cursor:     "pointer",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform  = "translateY(-5px)";
                    e.currentTarget.style.boxShadow  = `0 20px 48px rgba(0,0,0,0.11), 0 6px 18px ${C.primary}28`;
                    e.currentTarget.style.borderColor = `${C.primary}55`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform  = "translateY(0)";
                    e.currentTarget.style.boxShadow  = "0 2px 10px rgba(0,0,0,0.06)";
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ height: "144px", background: `linear-gradient(150deg, #FFF6E0, #FFF0CC)` }}
                  >
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontSize: "72px", lineHeight: "1", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}>
                        {prod.emoji ?? "🍽️"}
                      </span>
                    )}
                    {/* Offer badge */}
                    <span
                      className="absolute top-2 left-2 text-xs font-black px-2 py-0.5 rounded-full z-10"
                      style={{ background: badge.bg, color: badge.color, boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }}
                    >
                      {label}
                    </span>
                    {offer.expires_at && (
                      <span
                        className="absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.92)", color: C.muted, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                      >
                        ينتهي {new Date(offer.expires_at).toLocaleDateString("ar-JO", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <h3 className="font-black text-sm leading-snug mb-1" style={{ color: C.text }}>
                      {prod.name}
                    </h3>
                    <p className="text-xs mb-2" style={{ color: C.faint }}>{prod.category}</p>
                    {offer.description && (
                      <p className="text-xs mb-2 leading-relaxed" style={{ color: C.muted }}>{offer.description}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1 flex-wrap">
                        {newPrice !== null && (
                          <span className="text-xs line-through" style={{ color: C.faint }}>
                            {prod.price.toFixed(2)}
                          </span>
                        )}
                        <span
                          className="font-black text-base leading-none"
                          style={{ color: newPrice !== null ? "#22C55E" : C.primary }}
                        >
                          {newPrice !== null ? newPrice.toFixed(2) : prod.price.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold" style={{ color: C.faint }}>د.أ</span>
                      </div>
                      <span
                        className="text-xs font-black px-2.5 py-1 rounded-xl shrink-0"
                        style={{ background: `${C.primary}12`, color: C.primary }}
                      >
                        اطلب الآن
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <div className="col-span-full text-center py-8">
                <p className="text-sm font-bold" style={{ color: C.faint }}>لا توجد عروض إضافية حالياً</p>
              </div>
            )}
          </div>
          </>
        )}
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
