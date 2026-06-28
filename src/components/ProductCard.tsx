"use client";

import { useState, memo } from "react";
import {
  Utensils, Sandwich, Pizza, Cookie, Flame, UtensilsCrossed,
  Star, Croissant, Plus, IceCream, CupSoda,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import ProductModal from "./ProductModal";
import type { Product, ProductOffer } from "@/types";

/* Warm brand-adjacent gradients — orange/gold family, nothing pink */
const CATEGORY_CONFIG: Record<
  string,
  { emoji: string; from: string; to: string; accent: string }
> = {
  "شاورما":           { emoji: "🥙", from: "#FFF0E8", to: "#FFEADD", accent: "#E8622A" },
  "وجبات شاورما":    { emoji: "🍱", from: "#FFF0E8", to: "#FFEADD", accent: "#E8622A" },
  "بيتزا":            { emoji: "🍕", from: "#FFF2EC", to: "#FFE8DF", accent: "#D95820" },
  "مناقيش":           { emoji: "🫓", from: "#FFF6E0", to: "#FFF0CC", accent: "#C8922A" },
  "مناقيش مميزة":    { emoji: "🔥", from: "#FFF0E0", to: "#FFE8D0", accent: "#E8622A" },
  "رولات":            { emoji: "🌯", from: "#FFF5E0", to: "#FFEED0", accent: "#C8A030" },
  "رولات مميزة":     { emoji: "⭐", from: "#FFF8E0", to: "#FFF2CC", accent: "#D4A820" },
  "فطائر":            { emoji: "🥐", from: "#FFF4E0", to: "#FFEDD0", accent: "#C87820" },
  "مقبلات وإضافات":  { emoji: "🍗", from: "#FBF6EF", to: "#F5EDE1", accent: "#A07848" },
  "حلويات":           { emoji: "🍮", from: "#FFF5F0", to: "#FFECE4", accent: "#C87060" },
  "مشروبات":          { emoji: "🧃", from: "#F0FBF4", to: "#E4F7EB", accent: "#40A870" },
};
const DEFAULT_CFG = { emoji: "🍽️", from: "#FAF5EE", to: "#F3EBE0", accent: "#A08060" };

function WatermarkIcon({ cat }: { cat: string }) {
  const cls = "w-24 h-24";
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

function ProductCardComponent({ product, offer }: { product: Product; offer?: ProductOffer }) {
  const addItem  = useCartStore((s) => s.addItem);
  const [showModal, setShowModal] = useState(false);
  const [added,     setAdded]     = useState(false);
  const cfg = CATEGORY_CONFIG[product.category] ?? DEFAULT_CFG;

  const discountRatio = offer?.offer_type === "price_discount" && offer.discount_percent !== null
    ? (100 - offer.discount_percent) / 100
    : 1;
  const calcDiscounted = (p: number) => Math.round(p * discountRatio * 100) / 100;

  const priceLabel = product.sizes
    ? `من ${calcDiscounted(product.sizes[0].price).toFixed(2)}`
    : calcDiscounted(product.price).toFixed(2);

  const handleAdd = (
    p: Product,
    selectedSize?: { label: string; price: number },
    doughType?: { label: string; extra: number },
    addons?: { label: string; extra: number }[],
  ) => {
    if (discountRatio < 1) {
      addItem(
        { ...p, price: calcDiscounted(p.price) },
        selectedSize ? { ...selectedSize, price: calcDiscounted(selectedSize.price) } : undefined,
        doughType,
        addons,
      );
    } else {
      addItem(p, selectedSize, doughType, addons);
    }
    setShowModal(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => product.available && setShowModal(true)}
        onKeyDown={(e) => e.key === "Enter" && product.available && setShowModal(true)}
        className="relative rounded-2xl overflow-hidden flex flex-col select-none group"
        style={{
          background: "#FFFFFF",
          border:     "1.5px solid #EDE8E2",
          cursor:     product.available ? "pointer" : "not-allowed",
          opacity:    product.available ? 1 : 0.5,
          boxShadow:  "0 2px 10px rgba(0,0,0,0.06)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!product.available) return;
          const el = e.currentTarget;
          el.style.transform   = "translateY(-5px)";
          el.style.boxShadow   = `0 20px 48px rgba(0,0,0,0.11), 0 6px 18px ${cfg.accent}28`;
          el.style.borderColor = `${cfg.accent}55`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform   = "translateY(0)";
          el.style.boxShadow   = "0 2px 10px rgba(0,0,0,0.06)";
          el.style.borderColor = "#EDE8E2";
        }}
      >
        {/* ── Thumbnail ── */}
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{
            height:     "152px",
            background: `linear-gradient(150deg, ${cfg.from} 0%, ${cfg.to} 100%)`,
          }}
        >
          {/* Top accent bar */}
          <div
            className="absolute top-0 inset-x-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, ${cfg.accent}EE, ${cfg.accent}88, ${cfg.accent}22)`,
            }}
          />

          {/* Decorative corner circle */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "-28px",
              left:   "-28px",
              width:  "90px",
              height: "90px",
              borderRadius: "50%",
              background: `${cfg.accent}18`,
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top:   "-20px",
              right: "-20px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: `${cfg.accent}10`,
            }}
          />

          {/* Lucide icon watermark — large, rotated, very low opacity */}
          <div
            className="absolute pointer-events-none select-none"
            style={{
              bottom:    "-10px",
              left:      "-10px",
              opacity:   0.07,
              color:     "#1A1208",
              transform: "rotate(-15deg)",
            }}
          >
            <WatermarkIcon cat={product.category} />
          </div>

          {/* Main content: image or emoji */}
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width={300}
              height={152}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0, transition: "opacity 0.3s ease" }}
              onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="relative z-10 select-none"
                style={{
                  fontSize:   "88px",
                  lineHeight: "1",
                  filter:     "drop-shadow(0 4px 14px rgba(0,0,0,0.14))",
                }}
              >
                {product.emoji ?? cfg.emoji}
              </span>
            </div>
          )}

          {/* Offer badge */}
          {offer && (
            <span
              className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-black z-10"
              style={{
                background: offer.offer_type === "price_discount" ? "#EF4444"
                  : offer.offer_type === "free_delivery" ? "#22C55E"
                  : "#C8922A",
                color: "#fff",
                boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
              }}
            >
              {offer.offer_type === "price_discount"
                ? `خصم ${offer.discount_percent}%`
                : offer.offer_type === "free_delivery"
                ? "توصيل مجاني"
                : `${offer.addon_description} مجاناً`}
            </span>
          )}

          {/* Sizes badge — premium white pill */}
          {product.sizes && (
            <span
              className="absolute bottom-2.5 right-2.5 text-xs px-2 py-0.5 rounded-full font-black"
              style={{
                background: "#FFFFFF",
                color:      cfg.accent,
                boxShadow:  "0 1px 6px rgba(0,0,0,0.14)",
              }}
            >
              {product.sizes.length} أحجام
            </span>
          )}

          {/* "Added" flash */}
          {added && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(4px)" }}
            >
              <span style={{ fontSize: "40px" }}>✅</span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-3.5 flex flex-col flex-1">
          <h3 className="font-black text-sm leading-snug mb-1" style={{ color: "#1A1208" }}>
            {product.name}
          </h3>

          {product.description && (
            <p
              className="text-xs leading-relaxed line-clamp-2 mb-2"
              style={{ color: "#9B8B73" }}
            >
              {product.description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
            {/* Price — larger and bolder */}
            <div className="flex items-baseline gap-1 flex-wrap">
              {discountRatio < 1 && !product.sizes && (
                <span className="text-xs line-through" style={{ color: "#9B8B73" }}>
                  {product.price.toFixed(2)}
                </span>
              )}
              <span
                className="font-black text-base leading-none"
                style={{ color: discountRatio < 1 ? "#22C55E" : "#E8622A" }}
              >
                {priceLabel}
              </span>
              <span className="text-xs font-bold" style={{ color: "#9B8B73" }}>
                {" د.أ"}
              </span>
            </div>

            {/* Add button — bigger, confident shadow */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
              style={{
                background: added
                  ? "#22C55E"
                  : "linear-gradient(135deg, #E8622A, #C8922A)",
                color:     "#FFFFFF",
                boxShadow: added
                  ? "0 0 16px #22C55E44"
                  : "0 4px 14px rgba(232,98,42,0.42)",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            >
              {added ? "✓" : "+"}
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            border: "1px solid rgba(200,146,42,0.15)",
            borderRadius: "inherit",
            margin: "6px",
          }}
        />
      </div>

      {showModal && (
        <ProductModal
          product={product}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}

export default memo(ProductCardComponent);
