"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Utensils, Sandwich, Pizza, Cookie, Flame, UtensilsCrossed,
  Star, Croissant, Plus, IceCream, CupSoda, Search, X,
} from "lucide-react";
import Image from "next/image";
import Fuse from "fuse.js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CategorySidebar from "@/components/CategorySidebar";
import { supabase } from "@/lib/supabase";
import { DUMMY_PRODUCTS } from "@/lib/dummy-products";
import { useStoreSettings } from "@/lib/store-settings";
import type { Product, ProductOffer } from "@/types";
import archOliveImg from "../../public/decorations/arch-olive.png";
import arabesqueWheatImg from "../../public/decorations/arabesque-wheat.png";

const C = {
  bg:      "#FBF7F2",
  surface: "#F7F5F2",
  border:  "#EDE8E2",
  primary: "#E8622A",
  gold:    "#C8922A",
  text:    "#1A1208",
  muted:   "#6B5B47",
  faint:   "#9B8B73",
} as const;

function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .trim();
}

type FuseItem = { idx: number; _name: string; _desc: string };

function MobileCatIcon({ cat }: { cat: string }) {
  const cls = "w-3.5 h-3.5";
  switch (cat) {
    case "شاورما":
    case "وجبات شاورما":   return <Sandwich        className={cls} />;
    case "بيتزا":           return <Pizza           className={cls} />;
    case "مناقيش":          return <Cookie          className={cls} />;
    case "مناقيش مميزة":   return <Flame           className={cls} />;
    case "رولات":           return <UtensilsCrossed className={cls} />;
    case "رولات مميزة":    return <Star            className={cls} />;
    case "فطائر":           return <Croissant       className={cls} />;
    case "مقبلات وإضافات": return <Plus            className={cls} />;
    case "حلويات":          return <IceCream        className={cls} />;
    case "مشروبات":         return <CupSoda         className={cls} />;
    default:                 return <Utensils        className={cls} />;
  }
}

const CATEGORY_ORDER: Record<string, number> = {
  "الكل":            0,
  "مناقيش":          1,
  "مناقيش مميزة":    2,
  "بيتزا":           3,
  "رولات":           4,
  "رولات مميزة":     5,
  "شاورما":          6,
  "وجبات شاورما":    7,
};

export default function HomePage() {
  const [products,        setProducts]        = useState<Product[]>([]);
  const [categories,      setCategories]      = useState<string[]>(["الكل"]);
  const [active,          setActive]          = useState("الكل");
  const [loading,         setLoading]         = useState(true);
  const [searchRaw,       setSearchRaw]       = useState("");
  const [query,           setQuery]           = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [announcement,   setAnnouncement]   = useState<{ id: string; title: string; message: string } | null>(null);
  const [annDismissed,   setAnnDismissed]   = useState(false);
  const [bannerPhase,    setBannerPhase]    = useState<"hidden" | "ball" | "explode" | "banner">("hidden");
  const [offersMap,      setOffersMap]      = useState<Map<string, ProductOffer>>(new Map());

  const { ordersPaused, pauseMessage, loading: settingsLoading } = useStoreSettings();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });
      const list =
        !error && data && data.length > 0
          ? (data as Product[])
          : DUMMY_PRODUCTS.filter((p) => p.available);
      setProducts(list);
      setCategories(["الكل", ...Array.from(new Set(list.map((p) => p.category)))]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchRaw.trim()), 200);
    return () => clearTimeout(t);
  }, [searchRaw]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, message")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const ann = data?.[0] as { id: string; title: string; message: string } | undefined;
      if (ann) {
        setAnnouncement(ann);
        setTimeout(() => setBannerPhase("ball"), 500);
        setTimeout(() => setBannerPhase("explode"), 1500);
        setTimeout(() => setBannerPhase("banner"), 2500);
      }
    })();
  }, []);

  const dismissAnnouncement = () => {
    setAnnDismissed(true);
  };

  useEffect(() => {
    (async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("product_offers")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
      if (data) {
        const map = new Map<string, ProductOffer>();
        for (const row of data as ProductOffer[]) {
          map.set(row.product_id, row);
        }
        setOffersMap(map);
      }
    })();
  }, []);

  const fuseList = useMemo<FuseItem[]>(
    () =>
      products.map((p, idx) => ({
        idx,
        _name: normalizeArabic(p.name),
        _desc: normalizeArabic(p.description ?? ""),
      })),
    [products],
  );

  const fuse = useMemo(
    () =>
      new Fuse<FuseItem>(fuseList, {
        keys:           [{ name: "_name", weight: 2 }, { name: "_desc", weight: 1 }],
        threshold:          0.4,
        minMatchCharLength: 2,
        includeScore:       true,
      }),
    [fuseList],
  );

  const filtered = useMemo<Product[]>(() => {
    if (!query) {
      return active === "الكل" ? products : products.filter((p) => p.category === active);
    }
    return fuse
      .search(normalizeArabic(query))
      .map((r) => products[r.item.idx])
      .filter((p): p is Product => p !== undefined);
  }, [query, active, products, fuse]);

  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) => {
      const orderA = CATEGORY_ORDER[a] ?? 99;
      const orderB = CATEGORY_ORDER[b] ?? 99;
      return orderA - orderB;
    }),
    [categories],
  );

  const countFor = (cat: string) =>
    cat === "الكل" ? products.length : products.filter((p) => p.category === cat).length;

  const clearSearch = () => { setSearchRaw(""); setQuery(""); };

  return (
    <main className="min-h-screen flex flex-col relative overflow-x-hidden pb-24 md:pb-0" style={{ background: C.bg, color: C.text }}>

      {/* ── Background image decorations ── */}
      {/* arch-olive — right edge, top-anchored, bleeds slightly off screen */}
      <Image
        src={archOliveImg}
        alt=""
        priority
        className="absolute pointer-events-none select-none"
        style={{
          top: "64px",
          right: "-60px",
          height: "clamp(280px, 48vw, 580px)",
          width: "auto",
          maxWidth: "none",
          opacity: 0.9,
          WebkitMaskImage: "radial-gradient(ellipse 60% 75% at 65% 50%, black 45%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 60% 75% at 65% 50%, black 45%, transparent 100%)",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
        width={archOliveImg.width}
        height={archOliveImg.height}
      />
      {/* arabesque-wheat — left edge, all screens */}
      <Image
        src={arabesqueWheatImg}
        alt=""
        className="absolute pointer-events-none select-none"
        style={{
          top: "240px",
          left: "-20px",
          height: "clamp(220px, 35vw, 480px)",
          width: "auto",
          maxWidth: "none",
          opacity: 0.45,
          WebkitMaskImage: "radial-gradient(ellipse 60% 70% at center, black 40%, transparent 95%)",
          maskImage: "radial-gradient(ellipse 60% 70% at center, black 40%, transparent 95%)",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
        width={arabesqueWheatImg.width}
        height={arabesqueWheatImg.height}
      />

      <Navbar variant="light" />

      {/* Announcements banner */}
      {announcement && !annDismissed && bannerPhase !== "hidden" && (
        <>
          {/* Ball phase */}
          {(bannerPhase === "ball" || bannerPhase === "explode") && (
            <div style={{
              position: "fixed",
              top: "68px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                width: bannerPhase === "explode" ? "200px" : "20px",
                height: bannerPhase === "explode" ? "200px" : "20px",
                opacity: bannerPhase === "explode" ? 0 : 1,
                borderRadius: "50%",
                background: bannerPhase === "explode"
                  ? "radial-gradient(circle, #E8622A, #C8922A, #1A1208)"
                  : "#E8622A",
                transition: "all 1s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
                boxShadow: bannerPhase === "explode"
                  ? "0 0 60px 30px #E8622A88"
                  : "0 0 8px 2px #E8622A88",
              }} />
            </div>
          )}

          {/* Banner phase */}
          {bannerPhase === "banner" && (
            <div style={{
              position: "fixed",
              top: "56px",
              left: 0,
              right: 0,
              zIndex: 40,
              overflow: "hidden",
              height: "64px",
              animation: "fadeInBanner 0.5s ease forwards",
            }}>
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, #1A1208, #E8622A, #C8922A, #E8622A, #1A1208)",
                backgroundSize: "300% 100%",
                animation: "bannerWave 8s ease infinite",
              }} />

              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  bottom: `${4 + (i % 3) * 8}px`,
                  left: `${5 + i * 12}%`,
                  width: i % 2 === 0 ? "5px" : "3px",
                  height: i % 2 === 0 ? "5px" : "3px",
                  borderRadius: "50%",
                  background: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FF6B00" : "#C8922A",
                  animation: `floatUp ${1.5 + (i % 3) * 0.5}s ease-in-out ${i * 0.2}s infinite alternate`,
                  opacity: 0.8,
                }} />
              ))}

              <div style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "0 48px",
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{
                    fontWeight: 900,
                    fontSize: "16px",
                    margin: 0,
                    background: "linear-gradient(90deg, #FFFFFF, #FFD700, #FFFFFF, #FFD700, #FFFFFF)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "textGradient 3s linear infinite, textWave 3s ease-in-out infinite",
                  }}>
                    {announcement.title}
                  </p>
                  <p style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.85)",
                    margin: "2px 0 0 0",
                  }}>
                    {announcement.message}
                  </p>
                </div>
              </div>

              <button
                onClick={dismissAnnouncement}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.7)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  zIndex: 2,
                }}
              >
                <X className="w-4 h-4" />
              </button>

              <style>{`
                @keyframes bannerWave {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes floatUp {
                  from { transform: translateY(0px) scale(1); opacity: 0.8; }
                  to { transform: translateY(-12px) scale(0.6); opacity: 0; }
                }
                @keyframes textGradient {
                  0% { background-position: 0% center; }
                  100% { background-position: 200% center; }
                }
                @keyframes textWave {
                  0%, 100% { transform: translateY(0px); }
                  25% { transform: translateY(-2px); }
                  75% { transform: translateY(2px); }
                }
                @keyframes fadeInBanner {
                  from { opacity: 0; transform: scaleY(0); }
                  to { opacity: 1; transform: scaleY(1); }
                }
              `}</style>
            </div>
          )}

          {bannerPhase === "banner" && (
            <div style={{ height: "64px" }} />
          )}
        </>
      )}

      {/* Pause banner */}
      {!settingsLoading && ordersPaused && !bannerDismissed && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: "#FFF4EE", borderBottom: `2px solid ${C.primary}44` }}
        >
          <p className="flex-1 text-sm font-black" style={{ color: C.primary }}>
            {pauseMessage}
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            style={{ color: C.faint }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Compact brand header ── */}
      <div className="pt-16 md:pt-20 pb-6 px-4 text-center relative">
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: "0",
            height: "180px",
            background: "radial-gradient(ellipse 70% 100% at 50% 0%, #E8622A09 0%, transparent 100%)",
          }}
        />
        <div className="mb-3 flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wide"
            style={{ background: C.primary, color: "#FFFFFF", boxShadow: `0 4px 18px ${C.primary}44` }}
          >
            🔥 طازج كل يوم — بتحس بالفرق من أول لقمة
          </span>
        </div>
        <h1
          className="font-black"
          style={{ fontSize: "clamp(2.2rem, 8vw, 3.8rem)", lineHeight: "1.1" }}
        >
          <span style={{ color: C.text }}>منقوشة </span>
          <span
            style={{
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.gold} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            و نار
          </span>
        </h1>
        <div
          className="mx-auto mt-3 mb-3 rounded-full"
          style={{ width: "48px", height: "3px", background: `linear-gradient(90deg, ${C.primary}, ${C.gold})` }}
        />
        <p className="text-sm font-bold" style={{ color: C.muted }}>
          اطلب وتذوق ما لا تتوقعه
        </p>
      </div>

      {/* ── Sticky: pill search bar + mobile category tabs ── */}
      <div
        className="sticky top-14 md:top-16 z-20"
        style={{ background: "transparent" }}
      >
        {/* Pill search */}
        <div className="max-w-6xl mx-auto px-4 pt-3 pb-3">
          <div
            className="relative flex items-center overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: `1.5px solid ${searchRaw ? C.primary + "88" : C.border}`,
              borderRadius: "9999px",
              boxShadow: searchRaw
                ? `0 0 0 3px ${C.primary}14, 0 2px 12px rgba(0,0,0,0.10), inset 0 1px 3px rgba(0,0,0,0.04)`
                : "0 2px 12px rgba(0,0,0,0.10), inset 0 1px 3px rgba(0,0,0,0.04)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <Search
              className="absolute right-4 w-4 h-4 pointer-events-none"
              style={{ color: C.primary }}
            />
            <input
              type="text"
              value={searchRaw}
              onChange={(e) => setSearchRaw(e.target.value)}
              placeholder="ابحث عن طبقك المفضل..."
              className="w-full bg-transparent py-3 pr-11 pl-11 text-sm outline-none font-bold"
              style={{ color: C.text, fontFamily: "inherit" }}
            />
            {searchRaw && (
              <button
                onClick={clearSearch}
                className="absolute left-4 transition-colors"
                style={{ color: C.faint }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile category tabs (desktop uses sidebar) */}
        {!query && (
          <div className="lg:hidden max-w-6xl mx-auto px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {sortedCategories.map((cat) => {
                const isActiveCat = active === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs flex-shrink-0 select-none transition-all"
                    style={
                      isActiveCat
                        ? { background: C.primary, color: "#FFF", boxShadow: `0 4px 14px ${C.primary}40` }
                        : { background: "#FFF", color: C.muted, border: `1.5px solid ${C.border}` }
                    }
                  >
                    <MobileCatIcon cat={cat} />
                    <span>{cat}</span>
                    <span
                      className="text-xs px-1 py-0.5 rounded-full"
                      style={
                        isActiveCat
                          ? { background: "#FFFFFF33", color: "#FFF", fontWeight: 900 }
                          : { background: C.surface, color: C.faint, fontWeight: 700 }
                      }
                    >
                      {countFor(cat)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search result count */}
        {query && (
          <div className="max-w-6xl mx-auto px-4 pb-3">
            <p className="text-sm font-bold" style={{ color: C.faint }}>
              <span style={{ color: C.primary, fontWeight: 900 }}>{filtered.length}</span>
              {" نتيجة لـ "}
              <span style={{ color: C.muted }}>&ldquo;{query}&rdquo;</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Content: sidebar + grid ── */}
      <div className="flex-1 pt-6 pb-24 md:pb-10 px-4 max-w-6xl mx-auto w-full">
        {loading ? (
          <LoadingGrid />
        ) : (
          <div className="lg:flex lg:gap-7 lg:items-start">
            {/* Desktop sidebar (hidden on mobile — categories shown in sticky bar above) */}
            <CategorySidebar
              categories={sortedCategories}
              active={active}
              onSelect={(cat) => { setActive(cat); clearSearch(); }}
              countFor={countFor}
            />

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              {query && filtered.length === 0 ? (
                <EmptySearch query={query} clearSearch={clearSearch} />
              ) : !query && filtered.length === 0 ? (
                <div className="text-center py-24" style={{ color: C.faint }}>
                  لا توجد منتجات في هذا التصنيف
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} offer={offersMap.get(product.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Closing WOW Section ── */}
      <section
        style={{
          background: "linear-gradient(180deg, #FBF7F2 0%, #EBE0CF 100%)",
          padding: "100px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Watermark */}
        <img src="/decorations/wheat-stalks.png" alt=""
          style={{
            position: "absolute",
            bottom: "-20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "400px",
            opacity: 0.04,
            pointerEvents: "none",
          }}
        />

        {/* Gold particles */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: i % 3 === 0 ? "6px" : "4px",
                height: i % 3 === 0 ? "6px" : "4px",
                borderRadius: "50%",
                background: "#C8922A",
                left: `${8 + i * 8}%`,
                top: `${20 + (i % 4) * 20}%`,
                opacity: 0.3,
                animation: `floatDot ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* Main text */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              color: "#6B5B47",
              fontSize: "clamp(14px, 2vw, 18px)",
              letterSpacing: "4px",
              marginBottom: "24px",
              opacity: 0,
              animation: "fadeSlideUp 0.8s ease forwards 0.3s",
              fontWeight: 400,
            }}
          >
            منقوشة و نار
          </p>

          <h2
            style={{
              color: "#1A1208",
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: "16px",
              opacity: 0,
              animation: "fadeSlideUp 0.8s ease forwards 0.7s",
            }}
          >
            كل لقمة حكاية
          </h2>

          <h2
            style={{
              color: "#C8922A",
              fontSize: "clamp(32px, 5vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: "48px",
              opacity: 0,
              animation: "fadeSlideUp 0.8s ease forwards 1.1s",
            }}
          >
            من أيدينا — لقلبك
          </h2>

          {/* Gold divider line */}
          <div
            style={{
              height: "2px",
              background: "linear-gradient(90deg, transparent, #C8922A, transparent)",
              maxWidth: "400px",
              margin: "0 auto 48px",
              opacity: 0,
              animation: "expandLine 1s ease forwards 1.5s",
              transform: "scaleX(0)",
            }}
          />

          {/* CTA Button */}
          <a
            href="#top"
            style={{
              display: "inline-block",
              background: "#E8622A",
              color: "#FBF7F2",
              padding: "16px 48px",
              borderRadius: "50px",
              fontSize: "18px",
              fontWeight: 700,
              textDecoration: "none",
              opacity: 0,
              animation: "fadeSlideUp 0.8s ease forwards 1.9s",
              cursor: "pointer",
            }}
          >
            اطلب الآن 🔥
          </a>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes expandLine {
            from { opacity: 0; transform: scaleX(0); }
            to   { opacity: 1; transform: scaleX(1); }
          }
          @keyframes floatDot {
            from { opacity: 0.2; transform: translateY(0px); }
            to   { opacity: 0.8; transform: translateY(-20px); }
          }
        `}</style>
      </section>

      <Footer variant="light" />
    </main>
  );
}

function LoadingGrid() {
  return (
    <div className="lg:flex lg:gap-7">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-48 shrink-0 gap-1.5 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl" style={{ background: "#F5F0EB" }} />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden animate-pulse"
            style={{ border: "1.5px solid #EDE8E2" }}
          >
            <div className="h-[152px]" style={{ background: "#F5F0EB" }} />
            <div className="p-3.5 space-y-2.5">
              <div className="h-3 rounded-full w-3/4" style={{ background: "#EDE8E2" }} />
              <div className="h-2.5 rounded-full w-1/2" style={{ background: "#F0EBE6" }} />
              <div className="h-5 rounded-full w-1/3 mt-3" style={{ background: "#EDE8E2" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptySearch({ query, clearSearch }: { query: string; clearSearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <span className="text-6xl select-none">🔍</span>
      <div>
        <p className="font-black text-lg" style={{ color: C.text }}>
          ما لقيناش &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm mt-1 font-medium" style={{ color: C.faint }}>
          جرّب كلمة ثانية أو تصفح الأقسام
        </p>
      </div>
      <button
        onClick={clearSearch}
        className="px-6 py-2.5 rounded-xl text-sm font-black"
        style={{ background: C.primary, color: "#FFF", boxShadow: `0 4px 16px ${C.primary}55` }}
      >
        عرض كل المنتجات
      </button>
    </div>
  );
}
