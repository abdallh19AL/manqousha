"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/types";

interface DoughOption { label: string; extra: number; }

const DOUGH_OPTIONS: Record<string, DoughOption[]> = {
  "مناقيش":         [{ label: "عجينة عادية", extra: 0 }, { label: "عجينة سمراء", extra: 0.25 }],
  "مناقيش مميزة":  [{ label: "عجينة عادية", extra: 0 }, { label: "عجينة سمراء", extra: 0.25 }],
  "بيتزا":          [{ label: "عجينة عادية", extra: 0 }, { label: "عجينة سمراء", extra: 0.5  }],
};

interface Props {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, selectedSize?: { label: string; price: number }, doughType?: DoughOption) => void;
}

export default function ProductModal({ product, onClose, onAdd }: Props) {
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.[0] ?? undefined
  );

  const doughOptions = DOUGH_OPTIONS[product.category] ?? null;
  const [selectedDoughType, setSelectedDoughType] = useState<DoughOption | undefined>(
    doughOptions?.[0]
  );

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  const effectivePrice = (selectedSize?.price ?? product.price) + (selectedDoughType?.extra ?? 0);

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />

      {/* Card — bottom sheet on mobile, centered on desktop */}
      <div
        className="relative rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[88vh] overflow-y-auto shadow-2xl animate-in"
        style={{ background: "#FFFFFF", border: "1px solid #E5E0D8" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm"
          style={{ background: "#F7F5F2", color: "#6B5B47" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E0D8"; e.currentTarget.style.color = "#1A1208"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#F7F5F2"; e.currentTarget.style.color = "#6B5B47"; }}
          aria-label="إغلاق"
        >
          ✕
        </button>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E5E0D8" }} />
        </div>

        <div className="px-5 pb-6 pt-4">
          {/* Category badge */}
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "#F7F5F2", color: "#E8622A", border: "1px solid #E5E0D8" }}
          >
            {product.category}
          </span>

          {/* Name */}
          <h2 className="text-2xl font-black leading-snug mb-2" style={{ color: "#1A1208" }}>
            {product.name}
          </h2>

          {/* Description / ingredients */}
          {product.description && (
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#6B5B47" }}>
              {product.description}
            </p>
          )}

          {/* Size selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#9B8B73" }}>
                اختر الحجم
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const active = selectedSize?.label === size.label;
                  return (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size)}
                      className="flex flex-col items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={
                        active
                          ? {
                              background: "#E8622A",
                              color:      "#FFFFFF",
                              boxShadow:  "0 4px 14px rgba(232,98,42,0.35)",
                              transform:  "scale(1.05)",
                            }
                          : {
                              background: "#F7F5F2",
                              color:      "#1A1208",
                              border:     "1px solid #E5E0D8",
                            }
                      }
                    >
                      <span>{size.label}</span>
                      <span
                        className="text-xs font-normal mt-0.5"
                        style={{ color: active ? "rgba(255,255,255,0.85)" : "#9B8B73" }}
                      >
                        {size.price.toFixed(2)} د.أ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dough type selector */}
          {doughOptions && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#9B8B73" }}>
                نوع العجينة
              </p>
              <div className="flex flex-wrap gap-2">
                {doughOptions.map((opt) => {
                  const active = selectedDoughType?.label === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedDoughType(opt)}
                      className="flex flex-col items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={
                        active
                          ? {
                              background: "#E8622A",
                              color:      "#FFFFFF",
                              boxShadow:  "0 4px 14px rgba(232,98,42,0.35)",
                              transform:  "scale(1.05)",
                            }
                          : {
                              background: "#F7F5F2",
                              color:      "#1A1208",
                              border:     "1px solid #E5E0D8",
                            }
                      }
                    >
                      <span>{opt.label}</span>
                      {opt.extra > 0 && (
                        <span
                          className="text-xs font-normal mt-0.5"
                          style={{ color: active ? "rgba(255,255,255,0.85)" : "#9B8B73" }}
                        >
                          +{opt.extra.toFixed(2)} د.أ
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price + Add */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1">
              <p className="text-xs mb-0.5" style={{ color: "#9B8B73" }}>السعر</p>
              <p className="text-2xl font-black" style={{ color: "#E8622A" }}>
                {effectivePrice.toFixed(2)}&nbsp;د.أ
              </p>
            </div>
            <button
              onClick={() => onAdd(product, selectedSize, doughOptions ? selectedDoughType : undefined)}
              disabled={!product.available}
              className="flex-1 font-black py-3.5 rounded-xl text-base transition-all active:scale-95"
              style={
                product.available
                  ? {
                      background: "linear-gradient(135deg, #E8622A, #C8922A)",
                      color:      "#FFFFFF",
                      boxShadow:  "0 4px 16px rgba(232,98,42,0.44)",
                    }
                  : {
                      background: "#E5E0D8",
                      color:      "#9B8B73",
                      cursor:     "not-allowed",
                    }
              }
            >
              {product.available ? "أضف للسلة 🛒" : "غير متاح"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
