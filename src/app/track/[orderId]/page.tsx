"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, ChefHat, ClipboardList, Clock, Flame,
  MapPin, Package, Truck, XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import type { OrderWithItems } from "@/types";

type LuIcon = typeof Clock;

/* ── C tokens — must precede STEPS/COPY which reference fire/gold ── */
const C = {
  bg:      "#FBF7F2",
  surface: "#F7F5F2",
  border:  "#E5E0D8",
  text:    "#1A1208",
  muted:   "#6B5B47",
  faint:   "#9B8B73",
  fire:    "#E8622A",
  gold:    "#C8922A",
} as const;

/* ── Steps config — icons + per-step active animation ── */
const STEPS: Array<{ Icon: LuIcon; label: string; animKey: string; animDuration: string }> = [
  { Icon: Clock,        label: "تم الاستلام",   animKey: "icon-breathe", animDuration: "2s"   },
  { Icon: ChefHat,      label: "قيد التحضير",   animKey: "icon-bounce",  animDuration: "1.1s" },
  { Icon: Package,      label: "جاهز للتوصيل",  animKey: "icon-breathe", animDuration: "2s"   },
  { Icon: CheckCircle2, label: "تم التسليم",    animKey: "icon-breathe", animDuration: "2s"   },
];

const TO_STEP: Record<string, number> = {
  pending:   0,
  confirmed: 0,
  preparing: 1,
  ready:     2,
  delivered: 3,
};

/* ── Hero icon + copy per status ── */
const COPY: Record<string, {
  msg:     string;
  Icon:    LuIcon;
  color:   string;
  animKey: string | undefined;
  animDur: string;
}> = {
  pending:   { msg: "وصلنا طلبك! جارٍ المراجعة قبل البدء",      Icon: ClipboardList, color: "#6B5B47", animKey: undefined,        animDur: "2s"   },
  confirmed: { msg: "تأكّد الطلب، جاهزين نبدأ التحضير",          Icon: CheckCircle2,  color: "#22C55E", animKey: undefined,        animDur: "2s"   },
  preparing: { msg: "جارٍ التحضير بحب وعلى أصولها",              Icon: Flame,          color: "#E8622A", animKey: "flame-flicker", animDur: "2s"   },
  ready:     { msg: "جاهز! السائق في الطريق إليك",               Icon: Package,        color: "#C8922A", animKey: "icon-breathe",  animDur: "2s"   },
  delivered: { msg: "وصل الطلب، تقبّل شهيتك ونشوفك قريب!",      Icon: Truck,          color: "#22C55E", animKey: undefined,        animDur: "2s"   },
  cancelled: { msg: "تم إلغاء الطلب. تواصل معنا لأي استفسار",   Icon: XCircle,        color: "#E84040", animKey: undefined,        animDur: "2s"   },
};

export default function TrackPage() {
  const params  = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const [order,    setOrder]    = useState<OrderWithItems | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setOrder(data as OrderWithItems);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(`track-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) =>
            prev ? { ...prev, ...(payload.new as Partial<OrderWithItems>) } : prev
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  /* ── Loading ── */
  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: C.bg, color: C.text }}>
        <Navbar variant="light" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-20">
          <Flame
            size={48}
            color={C.fire}
            style={{
              display:                 "block",
              animationName:           "flame-flicker",
              animationDuration:       "0.8s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
            }}
          />
          <p className="text-sm font-medium" style={{ color: C.faint }}>جارٍ تحميل طلبك...</p>
        </div>
      </main>
    );
  }

  /* ── Not found ── */
  if (notFound || !order) {
    return (
      <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: C.bg, color: C.text }}>
        <Navbar variant="light" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-20 gap-5">
          <span className="text-6xl select-none">📦</span>
          <div>
            <p className="font-black text-lg" style={{ color: C.text }}>الطلب غير موجود</p>
            <p className="text-sm mt-1 font-medium" style={{ color: C.faint }}>تأكّد من رابط التتبع أو تواصل معنا</p>
          </div>
          <Link
            href="/"
            className="font-black px-6 py-2.5 rounded-xl text-sm text-white"
            style={{ background: `linear-gradient(135deg, ${C.fire}, ${C.gold})`, boxShadow: `0 4px 16px ${C.fire}44` }}
          >
            العودة للرئيسية
          </Link>
        </div>
        <Footer variant="light" />
      </main>
    );
  }

  const isCancelled = order.status === "cancelled";
  const activeStep  = TO_STEP[order.status] ?? 0;
  const copy        = COPY[order.status] ?? COPY.pending;
  const CopyIcon    = copy.Icon;
  const orderNo     = order.id.slice(-6).toUpperCase();

  return (
    <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: C.bg, color: C.text }}>
      <Navbar variant="light" />

      <div className="flex-1 pt-20 md:pt-24 pb-24 md:pb-10 px-4 max-w-lg mx-auto w-full">

        {/* ── Status hero ── */}
        {isCancelled ? (
          <div className="text-center pt-8 pb-8">
            <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#E84040" }} />
            <h1 className="text-2xl font-black mb-2" style={{ color: "#E84040" }}>تم إلغاء الطلب</h1>
            <p className="text-sm" style={{ color: C.muted }}>{copy.msg}</p>
          </div>
        ) : (
          <div className="text-center pt-8 pb-6">
            {/* Lucide status icon — animated when relevant */}
            <div className="flex justify-center mb-4">
              <CopyIcon
                size={52}
                color={copy.color}
                style={
                  copy.animKey
                    ? {
                        animationName:           copy.animKey,
                        animationDuration:       copy.animDur,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                        display:                 "block",
                      }
                    : { display: "block" }
                }
              />
            </div>
            <h1
              className="text-2xl font-black mb-2 leading-[1.3] pb-1"
              style={{
                background:           `linear-gradient(135deg, ${C.fire} 0%, ${C.gold} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
              }}
            >
              تتبّع طلبك
            </h1>
            <p className="text-sm font-medium mb-1" style={{ color: C.muted }}>{copy.msg}</p>
            <p className="text-xs font-mono" style={{ color: C.faint }}>#{orderNo}</p>
          </div>
        )}

        {/* ── Live indicator ── */}
        {!isCancelled && (
          <div className="flex items-center justify-center gap-2 mb-6 text-xs" style={{ color: C.faint }}>
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{
                background:              C.fire,
                animationName:           "glow-pulse",
                animationDuration:       "1.5s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
              }}
            />
            يتحدّث تلقائياً دون إعادة تحميل
          </div>
        )}

        {/* ── Progress stepper ── */}
        {!isCancelled && (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            {/* Icon + connector row */}
            <div className="flex items-center mb-3">
              {STEPS.map((step, i) => {
                const StepIcon = step.Icon;
                const isDone   = i < activeStep;
                const isActive = i === activeStep;

                return (
                  <Fragment key={i}>
                    {/* Step node */}
                    <div className="flex-shrink-0 relative">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center relative"
                        style={{
                          background: isDone
                            ? `linear-gradient(135deg, ${C.fire}, ${C.gold})`
                            : isActive
                            ? C.bg
                            : C.surface,
                          border: isDone
                            ? "2px solid transparent"
                            : isActive
                            ? `2px solid ${C.fire}`
                            : `2px solid ${C.border}`,
                          boxShadow:  isActive ? `0 0 18px ${C.fire}33` : "none",
                          transition: "all 0.5s ease",
                        }}
                      >
                        {/* Expanding pulse ring behind the active icon */}
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background:              `${C.fire}14`,
                              animationName:           "pulse-ring",
                              animationDuration:       "2s",
                              animationTimingFunction: "ease-out",
                              animationIterationCount: "infinite",
                            }}
                          />
                        )}

                        {isDone ? (
                          /* Completed: static white CheckCircle2 */
                          <CheckCircle2 size={18} color="#fff" />
                        ) : (
                          /* Active: icon with its own motion animation
                             Future: same icon, dimmed, no animation       */
                          <StepIcon
                            size={18}
                            color={isActive ? C.fire : C.faint}
                            style={
                              isActive
                                ? {
                                    animationName:           step.animKey,
                                    animationDuration:       step.animDuration,
                                    animationTimingFunction: "ease-in-out",
                                    animationIterationCount: "infinite",
                                    display:                 "block",
                                  }
                                : { display: "block" }
                            }
                          />
                        )}
                      </div>
                    </div>

                    {/* Connector between steps */}
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 h-0.5"
                        style={{
                          background:   activeStep > i ? C.fire : C.border,
                          transition:   "background 0.5s ease",
                          marginInline: "4px",
                        }}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>

            {/* Label row — grid aligned with icons above */}
            <div className="grid grid-cols-4">
              {STEPS.map((step, i) => {
                const isDone   = i < activeStep;
                const isActive = i === activeStep;
                return (
                  <p
                    key={i}
                    className="text-center font-bold leading-tight px-0.5"
                    style={{
                      fontSize:   "10px",
                      color:      isDone ? C.gold : isActive ? C.text : C.faint,
                      transition: "color 0.5s ease",
                    }}
                  >
                    {step.label}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Order details card ── */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <h3 className="font-black text-sm" style={{ color: C.gold }}>تفاصيل الطلب</h3>

          {/* Order number */}
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: C.faint }}>رقم الطلب</span>
            <span className="font-black font-mono" style={{ color: C.text }}>#{orderNo}</span>
          </div>

          {/* Time */}
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: C.faint }}>وقت الطلب</span>
            <span style={{ color: C.muted }}>
              {new Date(order.created_at).toLocaleString("ar-JO", {
                hour:   "2-digit",
                minute: "2-digit",
                month:  "short",
                day:    "numeric",
              })}
            </span>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}` }} />

          {/* Items */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <span style={{ color: C.muted }}>
                    {item.product_name}
                    <span style={{ color: C.faint }}> × {item.quantity}</span>
                  </span>
                  <span style={{ color: C.text }}>{(item.price * item.quantity).toFixed(2)} د.أ</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: `1px solid ${C.border}` }} />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-black text-sm" style={{ color: C.text }}>المجموع</span>
            <span className="font-black text-sm" style={{ color: C.fire }}>{(order.total ?? 0).toFixed(2)} د.أ</span>
          </div>

          {/* Delivery fee */}
          {order.delivery_fee != null && order.delivery_fee > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: C.faint }}>رسوم التوصيل</span>
              <span style={{ color: C.muted }}>{order.delivery_fee.toFixed(2)} د.أ</span>
            </div>
          )}

          {/* Payment method */}
          {order.payment_method && (
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: C.faint }}>طريقة الدفع</span>
              <span style={{ color: C.muted }}>
                {order.payment_method === "cash"
                  ? "نقداً عند الاستلام"
                  : order.payment_method === "electronic"
                  ? "دفع إلكتروني"
                  : order.payment_method}
              </span>
            </div>
          )}

          {/* Address */}
          {order.customer_address && (
            <p className="text-xs leading-relaxed" style={{ color: C.faint }}>
              <span style={{ color: C.muted }}>العنوان: </span>
              {order.customer_address}
            </p>
          )}

          {/* Map link */}
          {order.latitude && order.longitude && (
            <a
              href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
              style={{ color: C.fire }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF7340")}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.fire)}
            >
              <MapPin size={12} />
              عرض موقع التوصيل
            </a>
          )}
        </div>

        {/* ── Back link ── */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-bold transition-colors"
            style={{ color: C.faint }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
          >
            ← العودة للرئيسية
          </Link>
        </div>
      </div>

      <Footer variant="light" />
    </main>
  );
}
