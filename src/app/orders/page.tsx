"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Package, RotateCcw, ShoppingCart, Star } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import type { OrderStatus, OrderWithItems, PointsHistoryItem, Product, RedeemableProduct } from "@/types";

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

const STATUS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "قيد الانتظار", color: "#E8622A", bg: "#FFF4EE" },
  confirmed: { label: "تم التأكيد",   color: "#1D4ED8", bg: "#DBEAFE" },
  preparing: { label: "قيد التحضير", color: "#C2410C", bg: "#FFF0E8" },
  ready:     { label: "جاهز",         color: "#22C55E", bg: "#DCFCE7" },
  delivered: { label: "تم التسليم",   color: "#166534", bg: "#EFFFEF" },
  cancelled: { label: "ملغي",         color: "#B91C1C", bg: "#FFF0F0" },
};

interface _PointsRow { points: number; total_earned: number; }

function OrdersPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);

  const [activeTab,     setActiveTab]     = useState<"orders" | "points">("orders");
  const [orders,        setOrders]        = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [userPoints,    setUserPoints]    = useState<_PointsRow | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([]);
  const [redeemables,   setRedeemables]   = useState<RedeemableProduct[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsLoaded,  setPointsLoaded]  = useState(false);
  const [customerCode,  setCustomerCode]  = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/orders");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("customer_code")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setCustomerCode((data as { customer_code: string } | null)?.customer_code ?? null);
      });
  }, [user]);

  useEffect(() => {
    if (searchParams.get("tab") === "points") {
      setActiveTab("points");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderWithItems[]) ?? []);
        setOrdersLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== "points" || pointsLoaded) return;
    setPointsLoading(true);
    Promise.all([
      supabase.from("user_points").select("points, total_earned").eq("user_id", user.id).limit(1),
      supabase.from("points_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("redeemable_products").select("*").eq("is_available", true).order("points_cost"),
    ]).then(([pt, hist, rdm]) => {
      setUserPoints((pt.data?.[0] as _PointsRow | undefined) ?? null);
      setPointsHistory((hist.data ?? []) as PointsHistoryItem[]);
      setRedeemables((rdm.data ?? []) as RedeemableProduct[]);
      setPointsLoaded(true);
      setPointsLoading(false);
    });
  }, [user, activeTab, pointsLoaded]);

  const reorder = (order: OrderWithItems) => {
    order.order_items.forEach((item) => {
      const fakeProduct: Product = {
        id:          item.product_id ?? `reorder-${item.id}`,
        name:        item.product_name,
        description: null,
        price:       item.price,
        image_url:   null,
        category:    "",
        available:   true,
        created_at:  order.created_at,
      };
      for (let i = 0; i < item.quantity; i++) {
        addItem(fakeProduct);
      }
    });
    router.push("/cart");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ar-JO", {
      year: "numeric", month: "long", day: "numeric",
    });

  /* ── Auth loading ── */
  if (authLoading) {
    return (
      <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: C.bg }}>
        <Navbar variant="light" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-14 pb-24 md:pb-0">
          <span className="text-5xl select-none">📦</span>
          <p className="text-sm font-bold" style={{ color: C.faint }}>جارٍ التحميل...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  /* ── Tab layout ── */
  return (
    <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: C.bg, color: C.text }}>
      <Navbar variant="light" />

      <div className="flex-1 pt-14 md:pt-16 pb-24 md:pb-10 px-4 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-black pt-8 pb-5 md:pt-10 md:pb-6" style={{ color: C.gold }}>
          حسابي
        </h1>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {(["orders", "points"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-black transition-all"
              style={
                activeTab === t
                  ? { background: C.primary, color: "#fff", boxShadow: `0 3px 10px ${C.primary}44` }
                  : { color: C.faint }
              }
            >
              {t === "orders" ? (
                <><Package className="w-4 h-4" /> طلباتي</>
              ) : (
                <><Star className="w-4 h-4" /> نقاطي</>
              )}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {activeTab === "orders" && (
          ordersLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <span className="text-5xl select-none">📦</span>
              <p className="text-sm font-bold" style={{ color: C.faint }}>جارٍ تحميل طلباتك...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
              <span className="text-6xl select-none">📦</span>
              <div>
                <p className="font-black text-lg" style={{ color: C.text }}>لا توجد طلبات سابقة</p>
                <p className="text-sm mt-1 font-medium" style={{ color: C.faint }}>اطلب أول وجبتك وستظهر هنا</p>
              </div>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl text-sm font-black"
                style={{ background: C.primary, color: "#FFF", boxShadow: `0 4px 16px ${C.primary}55` }}
              >
                تصفح القائمة
              </Link>
            </div>
          ) : (
            <>
              {/* Reorder invitation banner */}
              <div className="relative mb-6 rounded-2xl p-px overflow-hidden">
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width:  "200%",
                    height: "200%",
                    top:    "-50%",
                    left:   "-50%",
                    background: "conic-gradient(from 0deg, transparent 20%, #E8622A 45%, #C8922A 58%, transparent 78%)",
                    animationName:           "rotating-border-glow",
                    animationDuration:       "6s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                  }}
                />
                <div
                  className="relative rounded-2xl px-5 py-4 flex items-center gap-4"
                  style={{ background: C.surface }}
                >
                  <div className="text-2xl select-none shrink-0">🔥</div>
                  <div>
                    <p className="font-black text-sm leading-snug" style={{ color: C.text }}>
                      اشتقت لنكهتك المفضلة؟
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                      اطلب نفس طلبك السابق بضغطة واحدة
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {orders.map((order) => {
                  const cfg     = STATUS[order.status] ?? STATUS.pending;
                  const orderNo = order.id.slice(-6).toUpperCase();

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}
                    >
                      {/* Header */}
                      <div
                        className="px-5 py-3.5 flex items-center justify-between gap-3"
                        style={{
                          background:   `linear-gradient(135deg, ${C.primary}0A, ${C.gold}06)`,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm font-mono" style={{ color: C.text }}>
                            #{orderNo}
                          </span>
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ color: cfg.color, background: cfg.bg }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: C.faint }}>
                          {formatDate(order.created_at)}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="px-5 py-4 space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span style={{ color: C.text }}>
                              <span className="font-bold" style={{ color: C.muted }}>×{item.quantity} </span>
                              {item.product_name}
                            </span>
                            <span className="font-bold" style={{ color: C.gold }}>
                              {(item.price * item.quantity).toFixed(2)} د.أ
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div
                        className="px-5 py-3.5 flex items-center justify-between gap-3"
                        style={{ borderTop: `1px solid ${C.border}` }}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-sm" style={{ color: C.muted }}>الإجمالي:</span>
                          <span className="font-black text-base" style={{ color: C.primary }}>
                            {" "}{(order.total ?? 0).toFixed(2)} د.أ
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status !== "delivered" && order.status !== "cancelled" && (
                            <Link
                              href={`/track/${order.id}`}
                              className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                              style={{
                                background:  `${C.gold}12`,
                                border:      `1px solid ${C.gold}33`,
                                color:       C.gold,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background  = `${C.gold}22`;
                                e.currentTarget.style.borderColor = `${C.gold}66`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background  = `${C.gold}12`;
                                e.currentTarget.style.borderColor = `${C.gold}33`;
                              }}
                            >
                              <MapPin className="w-3 h-3" />
                              تتبع
                            </Link>
                          )}
                          <button
                            onClick={() => reorder(order)}
                            className="flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-xl transition-all"
                            style={{
                              background:  `${C.primary}10`,
                              border:      `1px solid ${C.primary}33`,
                              color:       C.primary,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background  = `${C.primary}1E`;
                              e.currentTarget.style.borderColor = `${C.primary}66`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background  = `${C.primary}10`;
                              e.currentTarget.style.borderColor = `${C.primary}33`;
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            اطلب نفس الطلب
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all"
                  style={{
                    background:  `${C.gold}0A`,
                    border:      `1px solid ${C.gold}33`,
                    color:       C.gold,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background  = `${C.gold}18`;
                    e.currentTarget.style.borderColor = `${C.gold}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background  = `${C.gold}0A`;
                    e.currentTarget.style.borderColor = `${C.gold}33`;
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  طلب جديد
                </Link>
              </div>
            </>
          )
        )}

        {/* Points tab */}
        {activeTab === "points" && (
          pointsLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <span className="text-5xl select-none">⭐</span>
              <p className="text-sm font-bold" style={{ color: C.faint }}>جارٍ تحميل نقاطك...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* User ID */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  marginBottom: "16px",
                }}
              >
                <p className="text-xs font-bold mb-2" style={{ color: C.muted }}>
                  رمزك الشخصي — أعطه للمسؤول لاستبدال نقاطك
                </p>
                <div className="flex items-center gap-2">
                  <p
                    dir="ltr"
                    className="font-mono font-black flex-1 truncate"
                    style={{ color: C.primary, fontSize: "28px", textAlign: "center" }}
                  >
                    {customerCode ?? "جاري التحميل..."}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(customerCode ?? "");
                      alert("تم النسخ!");
                    }}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: C.primary, color: "#fff" }}
                  >
                    نسخ
                  </button>
                </div>
              </div>

              {/* Balance card */}
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: `linear-gradient(135deg, ${C.primary}12, ${C.gold}0A)`, border: `1.5px solid ${C.gold}33` }}
              >
                <p className="text-sm font-bold mb-1" style={{ color: C.muted }}>رصيد نقاطك</p>
                <div
                  className="text-5xl font-black my-3"
                  style={{
                    background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {userPoints?.points ?? 0}
                </div>
                <p className="text-xs" style={{ color: C.faint }}>
                  إجمالي ما اكتسبته: {userPoints?.total_earned ?? 0} نقطة
                </p>
                <p className="text-xs mt-2 font-bold" style={{ color: C.muted }}>
                  كل 5 د.أ = 100 نقطة — تُستبدل عند المطعم
                </p>
              </div>

              {/* Redeemable products */}
              {redeemables.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${C.border}`, background: "#fff" }}
                >
                  <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}`, background: `${C.gold}08` }}>
                    <p className="font-black text-sm" style={{ color: C.gold }}>المكافآت القابلة للاستبدال</p>
                    <p className="text-xs mt-0.5" style={{ color: C.faint }}>اطلبها من الموظف عند الزيارة</p>
                  </div>
                  <div className="divide-y" style={{ borderColor: C.border }}>
                    {redeemables.map((r) => (
                      <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: C.text }}>{r.name}</p>
                          {r.description && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>{r.description}</p>
                          )}
                        </div>
                        <span
                          className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl"
                          style={{ background: `${C.gold}15`, color: C.gold, border: `1px solid ${C.gold}33` }}
                        >
                          {r.points_cost} نقطة
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Points history */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${C.border}`, background: "#fff" }}
              >
                <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <p className="font-black text-sm" style={{ color: C.text }}>سجل النقاط</p>
                </div>
                {pointsHistory.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm" style={{ color: C.faint }}>
                    لا توجد معاملات بعد — اطلب وجبتك لتبدأ
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: C.border }}>
                    {pointsHistory.map((h) => (
                      <div key={h.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: C.text }}>
                            {h.note ?? (h.type === "earned" ? "نقاط مكتسبة" : "نقاط مستبدلة")}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: C.faint }}>
                            {new Date(h.created_at).toLocaleDateString("ar-JO", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <span
                          className="shrink-0 font-black text-sm"
                          style={{ color: h.type === "earned" ? "#22C55E" : "#EF4444" }}
                        >
                          {h.type === "earned" ? "+" : "-"}{h.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <Footer variant="light" />
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: "#FBF7F2" }}>
          <Navbar variant="light" />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-14 pb-24 md:pb-0">
            <span className="text-5xl select-none">📦</span>
            <p className="text-sm font-bold" style={{ color: "#9B8B73" }}>جارٍ التحميل...</p>
          </div>
        </main>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
