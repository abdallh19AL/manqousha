"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Banknote, Bell, CheckCircle2, ChevronDown, ChevronUp,
  CreditCard, FileText, ImagePlus, Loader2, Pencil, Phone, Printer,
  PauseCircle, PlayCircle, Search, ShieldOff, Trash2, Utensils, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import PageDecorations from "@/components/PageDecorations";
import { DUMMY_PRODUCTS } from "@/lib/dummy-products";
import type { OrderStatus, OrderWithItems, Product, ComboDealWithSteps, ComboStep, ComboStepOption } from "@/types";

const ADMIN_EMAIL = "marwanalqissi19866@gmail.com";
const POLL_MS     = 15_000;

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

type RealtimeStatus = "connecting" | "connected" | "error" | "disconnected";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; badge: string }
> = {
  pending:   { label: "قيد الانتظار", color: "#EAB308", badge: "bg-yellow-100 text-yellow-800 border-yellow-300"  },
  confirmed: { label: "تم التأكيد",   color: "#3B82F6", badge: "bg-blue-100 text-blue-800 border-blue-300"         },
  preparing: { label: "قيد التحضير", color: "#F97316", badge: "bg-orange-100 text-orange-800 border-orange-300"  },
  ready:     { label: "جاهز",         color: "#22C55E", badge: "bg-green-100 text-green-800 border-green-300"      },
  delivered: { label: "تم التسليم",   color: "#6B7280", badge: "bg-gray-100 text-gray-600 border-gray-300"         },
  cancelled: { label: "ملغي",         color: "#EF4444", badge: "bg-red-100 text-red-700 border-red-300"            },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as OrderStatus[];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:   "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready:     "delivered",
};

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:   "تأكيد الطلب ✓",
  confirmed: "بدء التحضير 🔥",
  preparing: "جاهز للتسليم ✓",
  ready:     "تم التسليم ✓",
};

const NEXT_STATUS_STYLE: Partial<Record<OrderStatus, { bg: string; color: string; border: string }>> = {
  pending:   { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
  confirmed: { bg: "#FFEDD5", color: "#9A3412", border: "#FED7AA" },
  preparing: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  ready:     { bg: "#F3F4F6", color: "#374151", border: "#D1D5DB" },
};

const ALL_CATEGORIES = [
  "شاورما", "وجبات شاورما", "بيتزا", "مناقيش", "مناقيش مميزة",
  "رولات", "رولات مميزة", "فطائر", "مقبلات وإضافات", "حلويات", "مشروبات",
];

const INPUT =
  "w-full bg-white border border-gray-200 focus:border-orange-400 rounded-xl px-4 py-2.5 text-stone-900 outline-none transition-colors text-sm";

/* ════════════════════════════════════════════════════════════
   Login / Unauthorized
══════════════════════════════════════════════════════════════ */
function LoginForm() {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnauthorized(false);

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError("بريد إلكتروني أو كلمة مرور خاطئة");
    } else if (data.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setUnauthorized(true);
    }
    setLoading(false);
  };

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.surface }}>
        <div className="w-full max-w-sm text-center">
          <ShieldOff className="w-16 h-16 mb-4 mx-auto text-red-500" />
          <h2 className="text-xl font-black mb-2" style={{ color: "#DC2626" }}>
            غير مصرح لك بالدخول
          </h2>
          <p className="text-sm mb-6" style={{ color: C.faint }}>
            هذا الحساب لا يملك صلاحيات الإدارة
          </p>
          <button
            onClick={() => setUnauthorized(false)}
            className="text-sm underline transition-colors"
            style={{ color: C.primary }}
          >
            حاول بحساب آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.surface }}>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="text-6xl mb-4 inline-block"
            style={{ animationName: "flame-flicker", animationDuration: "2.5s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }}
          >
            🔥
          </div>
          <h1
            className="text-2xl font-black mb-1"
            style={{
              background:           "linear-gradient(135deg, #F5E6C8 0%, #E8622A 55%, #C8922A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip:       "text",
            }}
          >
            لوحة الإدارة
          </h1>
          <p className="text-xs" style={{ color: C.faint }}>منقوشة و نار</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: C.bg, border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: C.muted }}>
              البريد الإلكتروني
            </label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: C.muted }}>
              كلمة المرور
            </label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" className={INPUT} />
          </div>
          {error && (
            <p className="text-sm rounded-xl px-3 py-2" style={{ color: "#DC2626", background: "#FEE2E2", border: "1px solid #FCA5A5" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl transition-all active:scale-95"
            style={{
              background: loading ? C.border : "linear-gradient(135deg, #E8622A, #C8922A)",
              color:      loading ? C.faint  : "#FFFFFF",
              boxShadow:  loading ? "none"   : "0 6px 20px #E8622A33",
              opacity:    loading ? 0.7       : 1,
            }}
          >
            {loading ? "جارٍ الدخول..." : "دخول 🔥"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Store control panel — compact slim bar
══════════════════════════════════════════════════════════════ */
function StoreControlPanel() {
  const [paused,             setPaused]             = useState<boolean | null>(null);
  const [message,            setMessage]            = useState("");
  const [toggling,           setToggling]           = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [saved,              setSaved]              = useState(false);
  const [showMsgEdit,        setShowMsgEdit]        = useState(false);
  const [openingTime,        setOpeningTime]        = useState("10:00");
  const [closingTime,        setClosingTime]        = useState("03:00");
  const [autoCloseEnabled,   setAutoCloseEnabled]   = useState(true);
  const [savingHours,        setSavingHours]        = useState(false);
  const [hoursSaved,         setHoursSaved]         = useState(false);
  const [electronicEnabled,  setElectronicEnabled]  = useState(true);
  const [togglingElectronic, setTogglingElectronic] = useState(false);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("orders_paused, pause_message, opening_time, closing_time, auto_close_enabled, electronic_payment_enabled")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setPaused(Boolean(data.orders_paused));
          setMessage(String(data.pause_message ?? ""));
          setOpeningTime(String(data.opening_time ?? "10:00:00").slice(0, 5));
          setClosingTime(String(data.closing_time ?? "03:00:00").slice(0, 5));
          setAutoCloseEnabled(Boolean(data.auto_close_enabled ?? true));
          setElectronicEnabled(Boolean(data.electronic_payment_enabled ?? true));
        }
      });
  }, []);

  const toggle = async () => {
    if (paused === null || toggling) return;
    setToggling(true);
    const next = !paused;
    const { error } = await supabase
      .from("store_settings")
      .update({ orders_paused: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (!error) setPaused(next);
    setToggling(false);
  };

  const saveMessage = async () => {
    if (saving) return;
    setSaving(true);
    await supabase
      .from("store_settings")
      .update({ pause_message: message, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const saveWorkingHours = async () => {
    setSavingHours(true);
    await supabase.from("store_settings").update({
      opening_time:      openingTime + ":00",
      closing_time:      closingTime + ":00",
      auto_close_enabled: autoCloseEnabled,
    }).eq("id", 1);
    setSavingHours(false);
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2000);
  };

  if (paused === null) return null;

  return (
    <div className="mb-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${paused ? "#EF444430" : "#22C55E28"}` }}>
      {/* Slim status bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ background: paused ? "#FFF0F0" : "#F0FFF4" }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: paused ? "#EF4444" : "#22C55E", boxShadow: paused ? "0 0 6px #EF444466" : "0 0 6px #22C55E66" }}
        />
        <span className="text-sm font-bold flex-1" style={{ color: paused ? "#DC2626" : "#16A34A" }}>
          {paused ? "الطلبات متوقفة مؤقتاً" : "المطعم يستقبل الطلبات"}
        </span>
        <button
          onClick={() => setShowMsgEdit((v) => !v)}
          className="text-xs transition-colors shrink-0"
          style={{ color: C.faint }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
        >
          {showMsgEdit ? "إخفاء" : "تعديل الرسالة"}
        </button>
        <button
          onClick={toggle}
          disabled={toggling}
          className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 shrink-0"
          style={
            paused
              ? { background: "#DCFCE7", border: "1px solid #86EFAC", color: "#16A34A" }
              : { background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#DC2626" }
          }
        >
          {toggling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : paused ? (
            <><PlayCircle className="w-3.5 h-3.5" /><span>استئناف</span></>
          ) : (
            <><PauseCircle className="w-3.5 h-3.5" /><span>إيقاف</span></>
          )}
        </button>
      </div>
      {/* Collapsible message editor */}
      {showMsgEdit && (
        <div className="px-4 py-3 space-y-2" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <label className="block text-xs font-bold" style={{ color: C.muted }}>رسالة الإيقاف للعملاء</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className={`${INPUT} resize-none`}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={saveMessage}
              disabled={saving}
              className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all disabled:opacity-50"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.gold }}
            >
              {saving ? "جارٍ الحفظ..." : "حفظ الرسالة"}
            </button>
            {saved && <span className="text-xs font-bold" style={{ color: "#16A34A" }}>✓ تم الحفظ</span>}
          </div>
        </div>
      )}

      {/* Working hours section */}
      <div className="px-4 py-3" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <p className="text-sm font-black mb-3" style={{ color: C.text }}>
          🕐 أوقات العمل
        </p>

        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs font-bold" style={{ color: C.muted }}>
            تفعيل الإغلاق التلقائي
          </label>
          <button
            onClick={() => setAutoCloseEnabled((v) => !v)}
            dir="ltr"
            className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
            style={{ background: autoCloseEnabled ? "#22C55E" : "#D1D5DB" }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: autoCloseEnabled ? "translateX(18px)" : "translateX(2px)" }}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: C.muted }}>
              وقت الفتح
            </label>
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: C.muted }}>
              وقت الإغلاق
            </label>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }}
              dir="ltr"
            />
          </div>
        </div>

        <button
          onClick={saveWorkingHours}
          disabled={savingHours}
          className="w-full py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{ background: hoursSaved ? "#22C55E" : C.primary, color: "#fff" }}
        >
          {hoursSaved ? "✓ تم الحفظ" : savingHours ? "جاري الحفظ..." : "حفظ أوقات العمل"}
        </button>
      </div>

      {/* Electronic payment toggle */}
      <div className="px-4 py-3 flex items-center justify-between gap-4" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: C.text }}>💳 الدفع الإلكتروني</p>
          <p className="text-xs mt-0.5" style={{ color: C.faint }}>تفعيل أو تعطيل خيار الدفع الإلكتروني للزبائن</p>
        </div>
        <button
          onClick={async () => {
            if (togglingElectronic) return;
            setTogglingElectronic(true);
            const next = !electronicEnabled;
            const { error } = await supabase
              .from("store_settings")
              .update({ electronic_payment_enabled: next })
              .eq("id", 1);
            if (!error) setElectronicEnabled(next);
            setTogglingElectronic(false);
          }}
          disabled={togglingElectronic}
          dir="ltr"
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
          style={{ background: electronicEnabled ? "#22C55E" : "#D1D5DB" }}
        >
          {togglingElectronic
            ? <Loader2 className="w-3 h-3 animate-spin absolute inset-0 m-auto text-white" />
            : <span
                className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                style={{ transform: electronicEnabled ? "translateX(22px)" : "translateX(2px)" }}
              />
          }
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Orders panel
══════════════════════════════════════════════════════════════ */
function OrdersPanel({
  onPendingAckChange,
  onRealtimeStatusChange,
  onStatsChange,
}: {
  onPendingAckChange:     (count: number) => void;
  onRealtimeStatusChange: (s: RealtimeStatus) => void;
  onStatsChange:          (stats: { todayOrders: number; todayRevenue: number; activeOrders: number; avgOrder: number }) => void;
}) {
  const [orders,         setOrders]         = useState<OrderWithItems[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [newIds,         setNewIds]         = useState<Set<string>>(new Set());
  const [filterStatus,   setFilterStatus]   = useState<OrderStatus | "all">("all");
  const [todayOnly,      setTodayOnly]      = useState(true);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [audioUnlocked,  setAudioUnlocked]  = useState(false);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupMsg,     setCleanupMsg]     = useState<string | null>(null);
  const [orderOffersMap, setOrderOffersMap] = useState<Record<string, string[]>>({});

  const knownIds    = useRef<Set<string>>(new Set());
  const loopRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrderOffers = async (order: OrderWithItems) => {
    const productIds = order.order_items.map((i) => i.product_id).filter(Boolean);
    if (productIds.length === 0) return;
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("product_offers")
      .select("product_id, offer_type, discount_percent, addon_description")
      .in("product_id", productIds)
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
    if (data && data.length > 0) {
      const labels = (data as Array<{
        product_id: string;
        offer_type: string;
        discount_percent: number | null;
        addon_description: string | null;
      }>).map((o) => {
        if (o.offer_type === "price_discount") return `خصم ${o.discount_percent}% على منتج`;
        if (o.offer_type === "free_delivery")  return "توصيل مجاني على منتج";
        if (o.offer_type === "free_addon")     return `${o.addon_description} مجاناً`;
        return "";
      }).filter(Boolean);
      setOrderOffersMap((prev) => ({ ...prev, [order.id]: labels }));
    }
  };
  const audioCtxRef = useRef<AudioContext | null>(null);

  const realtimeStatusCb = useRef(onRealtimeStatusChange);
  useEffect(() => { realtimeStatusCb.current = onRealtimeStatusChange; }, [onRealtimeStatusChange]);

  const onStatsChangeCb = useRef(onStatsChange);
  useEffect(() => { onStatsChangeCb.current = onStatsChange; }, [onStatsChange]);

  // Propagate today's stats up to header
  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayList = orders.filter((o) => new Date(o.created_at) >= todayStart);
    const todayRevenue = todayList.reduce(
      (sum, o) => sum + (o.total ?? 0) + (Number(o.delivery_fee) || 0),
      0
    );
    const avgOrder     = todayList.length > 0 ? todayRevenue / todayList.length : 0;
    const activeOrders = orders.filter((o) =>
      o.status === "pending" || o.status === "confirmed" || o.status === "preparing" || o.status === "ready"
    ).length;
    onStatsChangeCb.current({ todayOrders: todayList.length, todayRevenue, activeOrders, avgOrder });
  }, [orders]);

  // ── Audio ──────────────────────────────────────────────────────
  const unlockAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      audioCtxRef.current.resume().then(() => {
        setAudioUnlocked(true);
      }).catch((e) => console.error("[Audio] resume() failed:", e));
    } catch (e) {
      console.error("[Audio] Failed to create AudioContext:", e);
    }
  }, []);

  const playOrderAlarm = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      console.warn("[Audio] Context suspended — needs user gesture to resume.");
      ctx.resume().catch((e) => console.error("[Audio] Resume failed:", e));
      return;
    }
    try {
      // 3 loud beeps: 880 Hz square wave, 200ms on / 100ms gap
      const BEEP_FREQ = 880;
      const BEEP_MS   = 0.20;
      const GAP_MS    = 0.10;
      const GAIN_VAL  = 1.5;
      for (let i = 0; i < 3; i++) {
        const t    = ctx.currentTime + i * (BEEP_MS + GAP_MS);
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type            = "square";
        osc.frequency.value = BEEP_FREQ;
        gain.gain.setValueAtTime(GAIN_VAL, t);
        gain.gain.setValueAtTime(0, t + BEEP_MS);
        osc.start(t);
        osc.stop(t + BEEP_MS);
      }
    } catch (e) {
      console.error("[Audio] playOrderAlarm error:", e);
    }
  }, []);

  const startLoop = useCallback(() => {
    if (loopRef.current !== null) return;
    playOrderAlarm();
    loopRef.current = setInterval(playOrderAlarm, 2500);
  }, [playOrderAlarm]);

  const stopLoop = useCallback(() => {
    if (loopRef.current !== null) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (newIds.size > 0) startLoop();
    else stopLoop();
  }, [newIds.size, startLoop, stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);
  useEffect(() => { onPendingAckChange(newIds.size); }, [newIds.size, onPendingAckChange]);

  // ── New order handler ──────────────────────────────────────────
  const handleNewOrder = useCallback((order: OrderWithItems) => {
    const { id } = order;
    if (knownIds.current.has(id)) return;
    knownIds.current.add(id);
    console.log("[Orders] New order detected:", id, "—", order.customer_name);
    setNewIds((prev) => { const s = new Set(prev); s.add(id); return s; });
    setOrders((prev) => prev.some((o) => o.id === id) ? prev : [order, ...prev]);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔥 طلب جديد!", { body: `طلب من ${order.customer_name}` });
    }
  }, []);

  // ── Fetch orders ───────────────────────────────────────────────
  const fetchOrders = useCallback(async (isInitial: boolean) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) { console.error("[Orders] Fetch error:", error); return; }
    if (!data)  return;
    const list = data as OrderWithItems[];
    if (isInitial) {
      list.forEach((o) => knownIds.current.add(o.id));
      setOrders(list);
      setLoading(false);
      console.log("[Orders] Initial load:", list.length, "orders,", knownIds.current.size, "IDs tracked");
    } else {
      const missed = list.filter((o) => !knownIds.current.has(o.id));
      if (missed.length > 0) {
        missed.forEach(handleNewOrder);
      }
      setOrders(list);
    }
  }, [handleNewOrder]);

  // ── Realtime subscription + polling fallback ───────────────────
  useEffect(() => {
    fetchOrders(true);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    console.log("[Realtime] Setting up channel admin-orders-v2...");
    const channel = supabase
      .channel("admin-orders-v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const newId = payload.new.id as string;
          console.log("[Realtime] INSERT event received, order id:", newId);
          const { data, error } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", newId)
            .single();
          if (error) { console.error("[Realtime] Failed to fetch new order details:", error); return; }
          if (data) handleNewOrder(data as OrderWithItems);
        }
      )
      .subscribe((status, err) => {
        console.log("[Realtime] Channel status:", status, err ?? "");
        if (status === "SUBSCRIBED")                                  realtimeStatusCb.current("connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") { console.error("[Realtime] Connection error — status:", status, err); realtimeStatusCb.current("error"); }
        else if (status === "CLOSED")                                  realtimeStatusCb.current("disconnected");
        else                                                           realtimeStatusCb.current("connecting");
      });
    const pollId = setInterval(() => {
      fetchOrders(false);
    }, POLL_MS);
    return () => {
      console.log("[Realtime] Removing channel on cleanup");
      supabase.removeChannel(channel);
      clearInterval(pollId);
    };
  }, [fetchOrders, handleNewOrder]);

  // ── Acknowledge / status / delete / cleanup ────────────────────
  const acknowledgeOrder = useCallback(async (id: string) => {
    await supabase.from("orders").update({ status: "confirmed" }).eq("id", id);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "confirmed" } : o));
    setNewIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }, []);

  const changeStatus = async (id: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const deleteStaleFromDB = useCallback(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("orders")
      .delete()
      .in("status", ["delivered", "cancelled"])
      .lt("created_at", cutoff)
      .select("id");
    if (error) { console.error("[Cleanup] DB error:", error); return 0; }
    const count = data?.length ?? 0;
    if (count > 0) {
      const deletedIds = new Set(data.map((r) => r.id as string));
      setOrders((prev) => prev.filter((o) => !deletedIds.has(o.id)));
      deletedIds.forEach((id) => knownIds.current.delete(id));
    }
    return count;
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { console.error("[Delete] Failed:", id, error); return; }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setNewIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    knownIds.current.delete(id);
  }, []);

  const runCleanup = useCallback(async () => {
    setCleanupRunning(true);
    try {
      const count = await deleteStaleFromDB();
      setCleanupMsg(count === 0 ? "لا توجد طلبات قديمة للحذف" : `تم حذف ${count} طلب قديم`);
      setTimeout(() => setCleanupMsg(null), 3500);
    } finally {
      setCleanupRunning(false);
    }
  }, [deleteStaleFromDB]);

  // Auto-cleanup on mount + every 60 min
  useEffect(() => {
    deleteStaleFromDB();
    const id = setInterval(() => {
      deleteStaleFromDB();
    }, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [deleteStaleFromDB]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const visibleOrders = todayOnly
    ? orders.filter((o) => new Date(o.created_at) >= todayStart)
    : orders;

  const counts = ALL_STATUSES.reduce(
    (acc, s) => { acc[s] = visibleOrders.filter((o) => o.status === s).length; return acc; },
    {} as Record<OrderStatus, number>
  );

  const filtered = filterStatus === "all" ? visibleOrders : visibleOrders.filter((o) => o.status === filterStatus);

  const formatTime = (iso: string) => {
    const d   = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "أمس";
    return d.toLocaleDateString("ar-JO", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-5xl" style={{ animationName: "flame-flicker", animationDuration: "0.8s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite", display: "inline-block" }}>
          🔥
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: C.primary, animationName: "glow-pulse", animationDuration: "1s", animationDelay: `${i * 0.2}s`, animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }} />
          ))}
        </div>
        <p className="text-xs" style={{ color: C.faint }}>جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {!audioUnlocked ? (
          <button
            onClick={unlockAudio}
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl transition-colors animate-pulse"
            style={{ background: "#FFFBEB", border: `1px solid ${C.gold}66`, color: C.gold }}
          >
            <Bell className="w-3.5 h-3.5" /> تفعيل الصوت — اضغط أولاً
          </button>
        ) : (
          <button
            onClick={playOrderAlarm}
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl transition-colors"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = `${C.gold}44`; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
          >
            <Bell className="w-3.5 h-3.5" /> اختبار التنبيه
          </button>
        )}
        <span className="text-xs" style={{ color: C.faint }}>
          {!audioUnlocked ? "يلزم الضغط مرة واحدة لتفعيل الصوت" : "الصوت مفعّل ✓"}
        </span>
        <span className="hidden sm:inline select-none" style={{ color: C.border }}>|</span>
        <button
          onClick={runCleanup}
          disabled={cleanupRunning}
          className="flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.faint }}
          onMouseEnter={(e) => { if (!cleanupRunning) { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#EF444440"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.borderColor = C.border; }}
        >
          {cleanupRunning
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>جارٍ التنظيف...</span></>
            : <><Trash2 className="w-3.5 h-3.5" /><span>تنظيف الطلبات القديمة</span></>
          }
        </button>
      </div>

      {/* Cleanup toast */}
      {cleanupMsg && (
        <div className="mb-3 rounded-xl px-4 py-2.5 text-xs font-bold" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
          {cleanupMsg}
        </div>
      )}

      {/* ── New orders banner ── */}
      {newIds.size > 0 && (
        <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#FFF7ED", border: `1px solid ${C.primary}55` }}>
          <Bell className="w-4 h-4 shrink-0 animate-bounce" style={{ color: C.primary }} />
          <p className="flex-1 font-bold text-sm" style={{ color: "#9A3412" }}>
            {newIds.size === 1 ? "طلب جديد بانتظار التأكيد" : `${newIds.size} طلبات جديدة بانتظار التأكيد`}
          </p>
          <span className="text-xs font-black px-2.5 py-1 rounded-full animate-pulse" style={{ background: C.primary, color: "#fff" }}>
            {newIds.size}
          </span>
        </div>
      )}

      {/* ── Status filter ── */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {/* Today-only toggle */}
        <button
          onClick={() => setTodayOnly((v) => !v)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all"
          style={todayOnly
            ? { background: C.text, color: "#FFFFFF" }
            : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }}
        >
          اليوم فقط 📅
        </button>
        <button
          onClick={() => setFilterStatus("all")}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all"
          style={filterStatus === "all"
            ? { background: C.primary, color: "#fff" }
            : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }}
        >
          <Utensils className="w-3 h-3" /> الكل <span className="opacity-70">{visibleOrders.length}</span>
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={filterStatus === s
              ? { background: C.primary, color: "#fff" }
              : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_CONFIG[s].color }} />
            {STATUS_CONFIG[s].label}
            {counts[s] > 0 && <span className="opacity-70">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {/* ── Order rows ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: C.faint }}>
          {orders.length === 0 ? "لا توجد طلبات بعد — انتظر صوت النار 🔥" : "لا توجد طلبات بهذه الحالة"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((order) => {
            const isNew         = newIds.has(order.id);
            const cfg           = STATUS_CONFIG[order.status];
            const isExpanded    = expandedId === order.id;
            const isDeletable   = order.status === "delivered" || order.status === "cancelled";
            const ageHours      = (Date.now() - new Date(order.created_at).getTime()) / 3_600_000;
            const hoursLeft     = Math.max(0, Math.ceil(24 - ageHours));
            const showCountdown = isDeletable && ageHours >= 20;
            const grandTotal    = (order.total ?? 0) + (Number(order.delivery_fee) || 0);

            return (
              <div
                key={order.id}
                className="rounded-xl overflow-hidden"
                style={isNew
                  ? { border: `1px solid ${C.primary}`, boxShadow: `0 0 12px ${C.primary}20`, animationName: "glow-pulse", animationDuration: "2.5s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }
                  : { border: `1px solid ${C.border}` }}
              >
                {/* Compact summary row — click to expand */}
                <div
                  className="flex items-center gap-0 cursor-pointer select-none"
                  style={{ background: isNew ? "#FFF5F0" : C.surface, borderRight: `3px solid ${cfg.color}` }}
                  onClick={() => {
                    const id = isExpanded ? null : order.id;
                    setExpandedId(id);
                    if (id && id !== expandedId) {
                      const o = orders.find((x) => x.id === id);
                      if (o) loadOrderOffers(o);
                    }
                  }}
                >
                  <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 min-w-0 overflow-hidden">
                    {/* Order ID */}
                    <span className="font-mono text-xs shrink-0 hidden sm:inline" style={{ color: C.faint }}>
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    {/* NEW badge */}
                    {isNew && (
                      <span className="text-xs font-black px-1.5 py-0.5 rounded-md shrink-0 animate-pulse" style={{ background: `${C.primary}22`, border: `1px solid ${C.primary}55`, color: C.primary }}>
                        جديد
                      </span>
                    )}
                    {/* Customer name */}
                    <span className="font-bold text-sm truncate flex-1" style={{ color: C.text }}>
                      {order.customer_name}
                    </span>
                    {/* Phone */}
                    <span className="text-xs shrink-0 hidden md:inline" style={{ color: C.muted }} dir="ltr">
                      {order.customer_phone}
                    </span>
                    {/* Zone */}
                    {order.delivery_zone && (
                      <span className="text-xs font-bold shrink-0 hidden lg:inline" style={{ color: order.delivery_zone === "K10" ? C.faint : "#F97316" }}>
                        {order.delivery_zone}
                      </span>
                    )}
                    {/* Total */}
                    <span className="font-black text-sm shrink-0" style={{ color: C.primary }}>
                      {grandTotal.toFixed(2)} د.أ
                    </span>
                    {/* Status badge */}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 hidden sm:inline ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {/* Time */}
                    <span className="text-xs shrink-0" style={{ color: C.faint }}>
                      {formatTime(order.created_at)}
                    </span>
                  </div>
                  {/* Expand chevron */}
                  <div className="px-3 py-2.5 shrink-0" style={{ color: C.faint }}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-4 py-3 space-y-3" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
                    {/* Customer info row: call button + zone + map */}
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full transition-colors"
                        style={{ background: `${C.primary}12`, border: `1px solid ${C.primary}33`, color: C.primary }}
                        dir="ltr"
                      >
                        <Phone className="w-3 h-3 shrink-0" />
                        {order.customer_phone}
                      </a>
                      {order.delivery_zone && (
                        <span className="font-bold" style={{ color: "#F97316" }}>
                          {order.delivery_zone}
                        </span>
                      )}
                      {showCountdown && (
                        <span style={{ color: hoursLeft <= 2 ? "#F59E0B" : C.faint }}>
                          {hoursLeft === 0 ? "سيُحذف قريباً" : `سيُحذف خلال ${hoursLeft}س`}
                        </span>
                      )}
                    </div>

                    {/* Delivery address */}
                    {order.customer_address && (
                      <div className="text-xs" style={{ color: C.muted }}>
                        <span className="font-bold" style={{ color: C.faint }}>عنوان التوصيل: </span>
                        {order.customer_address}
                      </div>
                    )}

                    {/* Free delivery badge */}
                    {order.delivery_fee === 0 && (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#166534" }}
                      >
                        <span>🎁</span>
                        <span>
                          {order.notes?.includes("عرض الولاء")
                            ? "توصيل مجاني — عرض الولاء (الطلب الخامس)"
                            : "توصيل مجاني — عرض منتج"}
                        </span>
                      </div>
                    )}

                    {/* Active product offer badges */}
                    {orderOffersMap[order.id]?.map((label, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C" }}
                      >
                        <span>🏷️</span>
                        <span>{label}</span>
                      </div>
                    ))}

                    {/* Notes */}
                    {order.notes && (
                      <div className="flex items-start gap-1.5 text-xs rounded-lg px-2.5 py-2" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
                        <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{order.notes}</span>
                      </div>
                    )}

                    {/* Items table with grand total */}
                    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center px-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ color: C.text }}>
                            {item.product_name}
                            <span style={{ color: C.faint }}> × {item.quantity}</span>
                          </span>
                          <span className="font-bold" style={{ color: C.gold }}>{(item.price * item.quantity).toFixed(2)} د.أ</span>
                        </div>
                      ))}
                      <div className="px-3 py-1.5 space-y-1" style={{ background: C.surface }}>
                        {(Number(order.delivery_fee) || 0) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: C.faint }}>رسوم التوصيل</span>
                            <span style={{ color: C.faint }}>{Number(order.delivery_fee).toFixed(2)} د.أ</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-black pt-1" style={{ borderTop: `1px solid ${C.border}` }}>
                          <span style={{ color: C.text }}>الإجمالي</span>
                          <span style={{ color: C.primary }}>{grandTotal.toFixed(2)} د.أ</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Acknowledge new order */}
                      {isNew && (
                        <button
                          onClick={() => acknowledgeOrder(order.id)}
                          className="flex items-center gap-1.5 font-black text-xs px-3 py-2 rounded-lg transition-all active:scale-95"
                          style={{ background: "#16A34A", color: "#fff", boxShadow: "0 2px 12px #22C55E33" }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> تم استلام الطلب
                          {newIds.size > 1 && (
                            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-black">
                              {newIds.size}
                            </span>
                          )}
                        </button>
                      )}
                      {/* Next-step progression button */}
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => changeStatus(order.id, NEXT_STATUS[order.status]!)}
                          className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-lg border transition-all active:scale-95"
                          style={{
                            background:  NEXT_STATUS_STYLE[order.status]!.bg,
                            color:       NEXT_STATUS_STYLE[order.status]!.color,
                            borderColor: NEXT_STATUS_STYLE[order.status]!.border,
                          }}
                        >
                          {NEXT_STATUS_LABEL[order.status]}
                        </button>
                      )}
                      {/* Payment badge */}
                      {(order.payment_method ?? "cash") === "electronic" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                          <CreditCard className="w-3.5 h-3.5" /> دفع إلكتروني
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200">
                          <Banknote className="w-3.5 h-3.5" /> نقداً
                        </span>
                      )}
                      {/* Status select (full control) */}
                      <select
                        value={order.status}
                        onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)}
                        className="bg-white border border-gray-200 text-stone-900 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-orange-400 transition-colors"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                      {/* Print */}
                      <button
                        onClick={() => window.open(`/receipt/${order.id}`, "_blank")}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.muted; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
                      >
                        <Printer className="w-3.5 h-3.5" /> طباعة
                      </button>
                      {/* Delete */}
                      {isDeletable && (
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: "#FFF5F5", border: "1px solid #FCA5A5", color: "#DC2626" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.borderColor = "#F87171"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.borderColor = "#FCA5A5"; }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Delivery zones panel
══════════════════════════════════════════════════════════════ */
interface ZoneRow {
  zone_code:         string;
  fee:               number;
  is_distance_based: boolean;
}

function DeliveryZonesPanel() {
  const [zones,       setZones]       = useState<ZoneRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editInput,   setEditInput]   = useState("");
  const [savedCode,   setSavedCode]   = useState<string | null>(null);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("delivery_zones")
          .select("zone_code, fee, is_distance_based");
        if (error) console.error("Delivery zones fetch error:", error);
        if (data) {
          const sorted = [...(data as ZoneRow[])].sort((a, b) => {
            const n = (s: string) => parseInt(s.replace("K", ""));
            return n(a.zone_code) - n(b.zone_code);
          });
          setZones(sorted);
        }
      } catch (err) {
        console.error("Delivery zones fetch exception:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEdit = (zone: ZoneRow) => {
    setEditingCode(zone.zone_code);
    setEditInput(zone.fee.toString());
    setSaveError(null);
  };

  const commitEdit = async (zone: ZoneRow) => {
    const next = parseFloat(editInput);
    if (!isNaN(next) && next > 0 && next !== zone.fee) {
      const { error } = await supabase
        .from("delivery_zones")
        .update({ fee: next, updated_at: new Date().toISOString() })
        .eq("zone_code", zone.zone_code);
      if (error) {
        setSaveError("فشل الحفظ — تحقق من صلاحيات المشرف");
      } else {
        setZones((prev) => prev.map((z) => z.zone_code === zone.zone_code ? { ...z, fee: next } : z));
        setSavedCode(zone.zone_code);
        setTimeout(() => setSavedCode(null), 2000);
      }
    }
    setEditingCode(null);
  };

  // Shared fee cell: click-to-edit with saved indicator
  const renderFeeCell = (zone: ZoneRow, unit: string) => {
    const isEditing = editingCode === zone.zone_code;
    const justSaved = savedCode   === zone.zone_code;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            onBlur={() => commitEdit(zone)}
            onKeyDown={(e) => {
              if (e.key === "Enter")  commitEdit(zone);
              if (e.key === "Escape") setEditingCode(null);
            }}
            autoFocus
            dir="ltr"
            className="w-20 bg-white border border-orange-400 text-orange-600 font-black text-sm rounded-lg px-2 py-1 outline-none text-center"
          />
          <span className="text-xs whitespace-nowrap" style={{ color: C.faint }}>{unit}</span>
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-1.5 shrink-0 cursor-pointer group"
        onClick={() => startEdit(zone)}
        title="انقر لتعديل السعر"
      >
        {justSaved && (
          <span className="text-xs font-bold" style={{ color: "#16A34A" }}>✓ تم الحفظ</span>
        )}
        <span className="font-black text-sm transition-opacity group-hover:opacity-70" style={{ color: C.primary }}>
          {zone.fee.toFixed(2)}
        </span>
        <span className="text-xs whitespace-nowrap" style={{ color: C.faint }}>{unit}</span>
      </div>
    );
  };

  const regularZones = zones.filter((z) => z.is_distance_based !== true);
  const k10Zone      = zones.find((z) => z.is_distance_based === true);

  if (loading) {
    return <div className="text-center py-10" style={{ color: C.faint }}>جارٍ التحميل...</div>;
  }

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: C.faint }}>
        اضغط على السعر لتعديله — التغييرات تُطبَّق فوراً على الطلبات الجديدة
      </p>

      {saveError && (
        <div className="mb-4 rounded-xl px-4 py-2.5 text-xs font-bold" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#DC2626" }}>
          {saveError}
        </div>
      )}

      {/* K1–K9 fixed-fee zones */}
      <div className="space-y-1.5 mb-5">
        {regularZones.map((zone) => (
          <div
            key={zone.zone_code}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRight: `3px solid ${C.primary}` }}
          >
            <span
              className="shrink-0 w-10 text-center text-xs font-black px-2 py-1 rounded-lg"
              style={{ background: "#FFF7ED", color: C.gold, border: "1px solid #FED7AA" }}
            >
              {zone.zone_code}
            </span>
            <p className="flex-1 text-sm truncate" style={{ color: C.text }}>
              {zone.zone_code}
            </p>
            {renderFeeCell(zone, "د.أ")}
          </div>
        ))}
      </div>

      {/* K10 — distance-based, shown as a distinct card */}
      {k10Zone && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.gold}55` }}>
          <div className="px-4 py-2" style={{ background: "#FFFBEB", borderBottom: `1px solid ${C.gold}33` }}>
            <span className="text-xs font-black" style={{ color: C.gold }}>K10 — رسوم الكيلومتر</span>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: C.surface, borderRight: `3px solid ${C.gold}` }}
          >
            <span
              className="shrink-0 w-10 text-center text-xs font-black px-2 py-1 rounded-lg"
              style={{ background: "#FFF7ED", color: C.gold, border: "1px solid #FED7AA" }}
            >
              K10
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: C.text }}>
                {k10Zone.zone_code ?? "المناطق خارج النطاق"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: C.faint }}>
                للمناطق خارج K1–K9 · يُحسب السعر بالكيلومتر
              </p>
            </div>
            {renderFeeCell(k10Zone, "د.أ/كم")}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-center" style={{ color: C.faint }}>
        K1–K9 رسوم ثابتة · K10 سعر الكيلومتر (للمناطق خارج النطاق)
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Products panel
══════════════════════════════════════════════════════════════ */
interface SizeRow { label: string; price: string; }

interface ProductEditForm {
  name: string;
  description: string;
  price: string;
  category: string;
  emoji: string;
  image_url: string;
  available: boolean;
  sizes: SizeRow[];
}

const BLANK_PRODUCT_FORM: ProductEditForm = {
  name: "", description: "", price: "", category: ALL_CATEGORIES[0],
  emoji: "", image_url: "", available: true, sizes: [],
};

function ProductsPanel() {
  const [products,        setProducts]        = useState<Product[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [isPreview,       setIsPreview]       = useState(false);
  const [filterCat,       setFilterCat]       = useState("الكل");
  const [editingId,       setEditingId]       = useState<string | "new" | null>(null);
  const [editForm,        setEditForm]        = useState<ProductEditForm>(BLANK_PRODUCT_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving,          setSaving]          = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [imageFile,       setImageFile]       = useState<File | null>(null);
  const [imagePreview,    setImagePreview]    = useState("");
  const [imageError,      setImageError]      = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setProducts(data as Product[]);
      setIsPreview(false);
    } else {
      setProducts(DUMMY_PRODUCTS);
      setIsPreview(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const catCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dbCategories = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = filterCat === "الكل" ? products : products.filter((p) => p.category === filterCat);

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancel = () => {
    setEditingId(null);
    setDeleteConfirmId(null);
    resetImageState();
  };

  const openNew = () => {
    setEditingId("new");
    setEditForm(BLANK_PRODUCT_FORM);
    setDeleteConfirmId(null);
    resetImageState();
  };

  const openEdit = (prod: Product) => {
    setEditingId(prod.id);
    setEditForm({
      name:        prod.name,
      description: prod.description ?? "",
      price:       prod.price.toString(),
      category:    prod.category,
      emoji:       prod.emoji ?? "",
      image_url:   prod.image_url ?? "",
      available:   prod.available,
      sizes:       (prod.sizes ?? []).map((s) => ({ label: s.label, price: s.price.toString() })),
    });
    setDeleteConfirmId(null);
    resetImageState();
  };

  const setField = <K extends keyof ProductEditForm>(k: K, v: ProductEditForm[K]) =>
    setEditForm((prev) => ({ ...prev, [k]: v }));

  const addSize    = () => setEditForm((prev) => ({ ...prev, sizes: [...prev.sizes, { label: "", price: "" }] }));
  const removeSize = (i: number) => setEditForm((prev) => ({ ...prev, sizes: prev.sizes.filter((_, idx) => idx !== i) }));
  const setSize    = (i: number, k: keyof SizeRow, v: string) =>
    setEditForm((prev) => ({ ...prev, sizes: prev.sizes.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setImageError("حجم الصورة يجب أن لا يتجاوز 30 ميغابايت"); e.target.value = ""; return; }
    setImageError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const parsedSizes = editForm.sizes
      .filter((s) => s.label.trim() && !isNaN(parseFloat(s.price)))
      .map((s) => ({ label: s.label.trim(), price: parseFloat(s.price) }));

    const basePayload = {
      name:        editForm.name.trim(),
      description: editForm.description.trim() || null,
      price:       parseFloat(editForm.price),
      category:    editForm.category,
      emoji:       editForm.emoji.trim() || null,
      available:   editForm.available,
      sizes:       parsedSizes.length > 0 ? parsedSizes : null,
    };

    const isNew = editingId === "new";
    let productId: string;

    if (isNew) {
      const { data, error } = await supabase
        .from("products")
        .insert({ ...basePayload, image_url: editForm.image_url.trim() || null })
        .select("id")
        .single();
      if (error || !data) { setSaving(false); return; }
      productId = (data as { id: string }).id;
    } else {
      productId = editingId!;
    }

    // Upload image to product-specific path
    let finalImageUrl: string | null = editForm.image_url.trim() || null;
    if (imageFile) {
      setUploading(true);
      const ext  = imageFile.name.split(".").pop() ?? "jpg";
      const path = `${productId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, imageFile);
      setUploading(false);
      if (uploadErr) {
        setImageError("فشل رفع الصورة، حاول مرة أخرى");
        setSaving(false);
        return;
      }
      finalImageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }

    if (isNew) {
      // Update image_url now that we have the real URL (only if an image was uploaded)
      if (imageFile) {
        await supabase.from("products").update({ image_url: finalImageUrl }).eq("id", productId);
      }
    } else {
      await supabase.from("products").update({ ...basePayload, image_url: finalImageUrl }).eq("id", productId);
    }

    setSaving(false);
    cancel();
    fetchProducts();
  };

  const toggleAvailable = async (prod: Product) => {
    const next = !prod.available;
    await supabase.from("products").update({ available: next }).eq("id", prod.id);
    setProducts((prev) => prev.map((p) => p.id === prod.id ? { ...p, available: next } : p));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
  };

  // Inline edit/add form — rendered below a row or at the top for new
  const renderEditForm = (isNew: boolean) => (
    <form
      onSubmit={handleSave}
      className="px-4 py-4 space-y-4"
      style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}
    >
      {/* Image + emoji */}
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 overflow-hidden"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          {imagePreview || editForm.image_url ? (
            <img src={imagePreview || editForm.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{editForm.emoji || "🍕"}</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = `${C.primary}44`; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {imagePreview || editForm.image_url ? "تغيير الصورة" : "رفع صورة"}
            </button>
            {imagePreview && <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "#DCFCE7", color: "#16A34A" }}>جديدة ✓</span>}
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: C.muted }}>إيموجي (يظهر بدلاً عن الصورة)</label>
            <input
              value={editForm.emoji}
              onChange={(e) => setField("emoji", e.target.value)}
              placeholder="🍕"
              className="w-20 bg-white border border-gray-200 focus:border-orange-400 rounded-lg px-3 py-1.5 text-center text-lg outline-none transition-colors"
            />
          </div>
          {imageError && <p className="text-xs" style={{ color: "#DC2626" }}>{imageError}</p>}
        </div>
      </div>

      {/* Name + Price + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>الاسم *</label>
          <input required value={editForm.name} onChange={(e) => setField("name", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>السعر الأساسي (د.أ) *</label>
          <input required type="number" step="0.01" min="0" value={editForm.price} onChange={(e) => setField("price", e.target.value)} dir="ltr" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs mb-1" style={{ color: C.muted }}>التصنيف *</label>
          <select value={editForm.category} onChange={(e) => setField("category", e.target.value)} className={INPUT}>
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs mb-1" style={{ color: C.muted }}>الوصف</label>
        <textarea value={editForm.description} onChange={(e) => setField("description", e.target.value)} rows={2} className={`${INPUT} resize-none`} />
      </div>

      {/* Sizes */}
      <div>
        <label className="block text-xs mb-2 font-bold" style={{ color: C.muted }}>الأحجام والأسعار</label>
        {editForm.sizes.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {editForm.sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={s.label}
                  onChange={(e) => setSize(i, "label", e.target.value)}
                  placeholder="اسم الحجم"
                  className="flex-1 bg-white border border-gray-200 focus:border-orange-400 rounded-lg px-3 py-1.5 text-sm outline-none transition-colors"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={s.price}
                  onChange={(e) => setSize(i, "price", e.target.value)}
                  placeholder="السعر"
                  dir="ltr"
                  className="w-24 bg-white border border-gray-200 focus:border-orange-400 rounded-lg px-3 py-1.5 text-sm outline-none transition-colors text-center"
                />
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "#DC2626", background: "#FFF5F5" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FFF5F5"; }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addSize}
          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = `${C.primary}44`; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
        >
          + إضافة حجم
        </button>
      </div>

      {/* Available */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={editForm.available} onChange={(e) => setField("available", e.target.checked)} className="accent-orange-500 w-4 h-4" />
        <span className="text-sm" style={{ color: C.text }}>متاح للبيع</span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || uploading}
          className="font-bold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
          style={{ background: C.primary, color: "#fff" }}
        >
          {uploading ? "جارٍ الرفع..." : saving ? "جارٍ الحفظ..." : isNew ? "إضافة المنتج" : "حفظ التعديلات"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="text-sm px-4 py-2 rounded-xl transition-colors"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#EF444440"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
        >
          إلغاء
        </button>
      </div>
    </form>
  );

  return (
    <div>
      {/* Preview warning */}
      {isPreview && (
        <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.gold }} />
          <p className="text-sm leading-relaxed" style={{ color: C.gold }}>
            هذه منتجات تجريبية — أضف منتجاتك الحقيقية من خلال زر <span className="font-bold">منتج جديد</span>.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold" style={{ color: C.muted }}>
          {products.length} منتج
        </span>
        <button
          onClick={editingId === "new" ? cancel : openNew}
          className="flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
          style={editingId === "new"
            ? { background: C.surface, border: `1px solid ${C.border}`, color: C.muted }
            : { background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, color: "#fff", boxShadow: `0 4px 14px ${C.primary}33` }}
        >
          {editingId === "new" ? "إلغاء" : "+ منتج جديد"}
        </button>
      </div>

      {/* "Add new" inline form at the top */}
      {editingId === "new" && (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${C.primary}40` }}>
          <div className="px-4 py-2.5" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
            <span className="text-sm font-black" style={{ color: C.gold }}>منتج جديد</span>
          </div>
          {renderEditForm(true)}
        </div>
      )}

      {/* Category filter */}
      {!loading && products.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {dbCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={filterCat === cat
                ? { background: C.primary, color: "#fff" }
                : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }}
            >
              {cat}
              <span className="mr-1 opacity-70">
                {cat === "الكل" ? products.length : (catCounts[cat] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div className="text-center py-10" style={{ color: C.faint }}>جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10" style={{ color: C.faint }}>
          {products.length === 0 ? "لا توجد منتجات — أضف أول منتج الآن" : "لا توجد منتجات في هذا التصنيف"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${editingId === prod.id ? C.primary : C.border}` }}
            >
              {/* Compact row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  background:  C.surface,
                  borderRight: `3px solid ${prod.available ? "#22C55E" : "#EF444466"}`,
                  opacity:     prod.available ? 1 : 0.5,
                }}
              >
                {/* Thumbnail / emoji */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xl overflow-hidden"
                  style={{ background: C.bg, border: `1px solid ${C.border}` }}
                >
                  {prod.image_url ? (
                    <img src={prod.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{prod.emoji ?? "🍕"}</span>
                  )}
                </div>

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm truncate" style={{ color: C.text }}>{prod.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.faint }}>
                      {prod.category}
                    </span>
                  </div>
                  {prod.sizes && prod.sizes.length > 0 && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>
                      {prod.sizes.map((s) => `${s.label}: ${s.price.toFixed(2)} د.أ`).join(" · ")}
                    </p>
                  )}
                </div>

                {/* Price */}
                <span className="font-black text-sm whitespace-nowrap shrink-0" style={{ color: C.primary }}>
                  {prod.price.toFixed(2)} د.أ
                </span>

                {/* Availability toggle switch */}
                {!isPreview && (
                  <button
                    onClick={() => toggleAvailable(prod)}
                    title={prod.available ? "متاح — انقر للإخفاء" : "مخفي — انقر للإظهار"}
                    dir="ltr"
                    className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                    style={{ background: prod.available ? "#22C55E" : "#D1D5DB" }}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                      style={{ transform: prod.available ? "translateX(18px)" : "translateX(2px)" }}
                    />
                  </button>
                )}

                {/* Edit + Delete icons */}
                {!isPreview && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => editingId === prod.id ? cancel() : openEdit(prod)}
                      title="تعديل"
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: editingId === prod.id ? C.primary : C.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.primary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = editingId === prod.id ? C.primary : C.muted; }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const isOpen = deleteConfirmId === prod.id;
                        setDeleteConfirmId(isOpen ? null : prod.id);
                        if (!isOpen && editingId === prod.id) { setEditingId(null); resetImageState(); }
                      }}
                      title="حذف"
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: deleteConfirmId === prod.id ? "#DC2626" : C.muted }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.color = "#DC2626"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = deleteConfirmId === prod.id ? "#DC2626" : C.muted; }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Inline delete confirm */}
              {deleteConfirmId === prod.id && (
                <div
                  className="px-4 py-3 flex items-center gap-3 flex-wrap"
                  style={{ background: "#FFF5F5", borderTop: "1px solid #FCA5A5" }}
                >
                  <span className="text-sm flex-1" style={{ color: "#DC2626" }}>
                    هل أنت متأكد من حذف <span className="font-bold">{prod.name}</span>؟
                  </span>
                  <button
                    onClick={() => handleDelete(prod.id)}
                    className="text-xs font-black px-4 py-1.5 rounded-lg transition-colors active:scale-95"
                    style={{ background: "#DC2626", color: "#fff" }}
                  >
                    حذف نهائياً
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
                  >
                    إلغاء
                  </button>
                </div>
              )}

              {/* Inline edit form */}
              {editingId === prod.id && renderEditForm(false)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Offers panel
══════════════════════════════════════════════════════════════ */
interface _OfferProduct { id: string; name: string; category: string; price: number; emoji: string | null; }
interface _OfferRow {
  id: string; product_id: string;
  offer_type: "price_discount" | "free_delivery" | "free_addon";
  discount_percent: number | null; addon_description: string | null;
  is_active: boolean; expires_at: string | null;
}
const BLANK_OFFER: { offer_type: "price_discount" | "free_delivery" | "free_addon"; discount_percent: string; addon_description: string; expires_at: string } = {
  offer_type: "price_discount", discount_percent: "", addon_description: "", expires_at: "",
};

function OffersPanel() {
  const [products,      setProducts]      = useState<_OfferProduct[]>([]);
  const [prodLoading,   setProdLoading]   = useState(true);
  const [offerSearch,   setOfferSearch]   = useState("");
  const [openFormId,    setOpenFormId]    = useState<string | null>(null);
  const [form,          setForm]          = useState(BLANK_OFFER);
  const [saving,        setSaving]        = useState(false);
  const [offers,        setOffers]        = useState<_OfferRow[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [togglingId,    setTogglingId]    = useState<string | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [offerTab,      setOfferTab]      = useState<"add" | "list">("list");
  // Note: requires streak_enabled and streak_count columns in store_settings
  const [streakEnabled, setStreakEnabled] = useState(true);
  const [streakCount,   setStreakCount]   = useState(4);
  const [savingStreak,  setSavingStreak]  = useState(false);
  const [streakSaved,   setStreakSaved]   = useState(false);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, category, price, emoji")
      .order("category").order("name");
    if (data) setProducts(data as _OfferProduct[]);
    setProdLoading(false);
  }, []);

  const loadOffers = useCallback(async () => {
    const { data } = await supabase
      .from("product_offers")
      .select("id, product_id, offer_type, discount_percent, addon_description, is_active, expires_at")
      .order("created_at", { ascending: false });
    if (data) setOffers(data as _OfferRow[]);
    setOffersLoading(false);
  }, []);

  useEffect(() => { loadProducts(); loadOffers(); }, [loadProducts, loadOffers]);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("streak_enabled, streak_count")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setStreakEnabled(Boolean((data as Record<string, unknown>).streak_enabled ?? true));
          setStreakCount(Number((data as Record<string, unknown>).streak_count ?? 4));
        }
      });
  }, []);

  const prodMap = useMemo(
    () => products.reduce<Record<string, _OfferProduct>>((acc, p) => { acc[p.id] = p; return acc; }, {}),
    [products],
  );

  const filtered = useMemo(() => {
    const q = offerSearch.trim();
    if (!q) return products;
    return products.filter((p) => p.name.includes(q) || p.category.includes(q));
  }, [products, offerSearch]);

  const grouped = useMemo(() => {
    const acc: Record<string, _OfferProduct[]> = {};
    for (const p of filtered) {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
    }
    return acc;
  }, [filtered]);

  const openForm = (id: string) => { setOpenFormId(id); setForm(BLANK_OFFER); };
  const closeForm = () => setOpenFormId(null);

  const saveOffer = async () => {
    if (!openFormId) return;
    if (form.offer_type === "price_discount" && !form.discount_percent) return;
    if (form.offer_type === "free_addon" && !form.addon_description.trim()) return;
    setSaving(true);
    await supabase.from("product_offers").insert({
      product_id:        openFormId,
      offer_type:        form.offer_type,
      discount_percent:  form.offer_type === "price_discount" ? Number(form.discount_percent) : null,
      addon_description: form.offer_type === "free_addon" ? form.addon_description.trim() : null,
      is_active:         true,
      expires_at:        form.expires_at || null,
    });
    setSaving(false);
    closeForm();
    await loadOffers();
  };

  const toggleOffer = async (offer: _OfferRow) => {
    setTogglingId(offer.id);
    await supabase.from("product_offers").update({ is_active: !offer.is_active }).eq("id", offer.id);
    setTogglingId(null);
    await loadOffers();
  };

  const deleteOffer = async (id: string) => {
    setDeletingId(id);
    await supabase.from("product_offers").delete().eq("id", id);
    setDeletingId(null);
    await loadOffers();
  };

  const isExpired = (exp: string | null) => !!exp && new Date(exp) < new Date();

  const productOfferMap = useMemo(() => {
    const map = new Set<string>();
    for (const o of offers) {
      if (o.is_active && !isExpired(o.expires_at)) {
        map.add(o.product_id);
      }
    }
    return map;
  }, [offers]);

  const saveStreakSettings = async () => {
    setSavingStreak(true);
    await supabase
      .from("store_settings")
      .update({ streak_enabled: streakEnabled, streak_count: streakCount })
      .eq("id", 1);
    setSavingStreak(false);
    setStreakSaved(true);
    setTimeout(() => setStreakSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ── Streak loyalty offer card ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: "#fff" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <span className="text-sm font-black" style={{ color: C.gold }}>🚚 عرض الولاء — التوصيل المجاني</span>
          <button
            onClick={() => setStreakEnabled((v) => !v)}
            dir="ltr"
            className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
            style={{ background: streakEnabled ? "#22C55E" : "#D1D5DB" }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: streakEnabled ? "translateX(18px)" : "translateX(2px)" }}
            />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs" style={{ color: C.muted }}>
            الزبون يحصل على توصيل مجاني في طلبه الخامس خلال 30 يوماً
          </p>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold shrink-0" style={{ color: C.muted }}>
              عدد الطلبات المطلوبة:
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={streakCount}
              onChange={(e) => setStreakCount(Number(e.target.value))}
              dir="ltr"
              className="w-20 px-3 py-1.5 text-sm rounded-lg outline-none text-center font-black"
              style={{ border: `1px solid ${C.border}`, color: C.primary }}
            />
            <span className="text-xs" style={{ color: C.muted }}>طلبات → توصيل مجاني</span>
          </div>
          <button
            onClick={saveStreakSettings}
            disabled={savingStreak}
            className="w-full py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: streakSaved ? "#22C55E" : C.primary, color: "#fff" }}
          >
            {streakSaved ? "✓ تم الحفظ" : savingStreak ? "جاري الحفظ..." : "حفظ إعدادات العرض"}
          </button>
        </div>
      </div>

      {/* Internal tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setOfferTab("list")}
          style={offerTab === "list"
            ? { background: C.primary, color: "#fff" }
            : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }
          }
          className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
        >
          العروض الحالية
        </button>
        <button
          onClick={() => setOfferTab("add")}
          style={offerTab === "add"
            ? { background: C.primary, color: "#fff" }
            : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }
          }
          className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
        >
          + إضافة عرض
        </button>
      </div>

      {/* Product list for adding offers */}
      {offerTab === "add" && (
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: "#FFFFFF" }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="font-black text-base" style={{ color: C.text }}>إضافة عرض لمنتج</h2>
          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.faint }} />
            <input
              value={offerSearch}
              onChange={(e) => setOfferSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full pr-9 pl-3 py-2 text-sm rounded-xl outline-none"
              style={{ border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit", background: C.surface }}
            />
          </div>
        </div>
        {prodLoading ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: C.faint }}>جارٍ التحميل...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: C.faint }}>لا توجد منتجات</div>
        ) : (
          <div>
            {Object.entries(grouped).map(([cat, prods]) => (
              <div key={cat}>
                <div className="px-5 py-2 text-xs font-black" style={{ background: `${C.gold}10`, color: C.gold, borderBottom: `1px solid ${C.border}` }}>
                  {cat}
                </div>
                {prods.map((p) => (
                  <div key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl">{p.emoji ?? "🍽️"}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm truncate" style={{ color: C.text }}>{p.name}</p>
                            {productOfferMap.has(p.id) && (
                              <span
                                className="text-xs font-black px-2 py-0.5 rounded-full"
                                style={{ background: "#DCFCE7", color: "#16A34A" }}
                              >
                                ✓ عرض نشط
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: C.faint }}>{p.price.toFixed(2)} د.أ</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openFormId === p.id ? closeForm() : openForm(p.id)}
                        className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-all"
                        style={{
                          background: openFormId === p.id ? `${C.primary}15` : productOfferMap.has(p.id) ? "#FFF7ED" : C.surface,
                          border: `1.5px solid ${openFormId === p.id ? C.primary : productOfferMap.has(p.id) ? C.primary : C.border}`,
                          color: openFormId === p.id ? C.primary : productOfferMap.has(p.id) ? C.primary : C.muted,
                        }}
                      >
                        {openFormId === p.id ? "إغلاق" : "+ عرض"}
                      </button>
                    </div>
                    {openFormId === p.id && (
                      <div className="px-5 pb-4 pt-2 space-y-3" style={{ background: `${C.primary}05` }}>
                        <div>
                          <label className="text-xs font-bold block mb-1" style={{ color: C.muted }}>نوع العرض</label>
                          <select
                            value={form.offer_type}
                            onChange={(e) => setForm((f) => ({ ...f, offer_type: e.target.value as typeof f.offer_type }))}
                            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                            style={{ border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit", background: "#fff" }}
                          >
                            <option value="price_discount">خصم بالسعر</option>
                            <option value="free_delivery">توصيل مجاني</option>
                            <option value="free_addon">إضافة مجانية</option>
                          </select>
                        </div>
                        {form.offer_type === "price_discount" && (
                          <div>
                            <label className="text-xs font-bold block mb-1" style={{ color: C.muted }}>نسبة الخصم (%)</label>
                            <input
                              type="number" min={1} max={99}
                              value={form.discount_percent}
                              onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                              placeholder="مثال: 20"
                              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                              style={{ border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit", background: "#fff" }}
                            />
                          </div>
                        )}
                        {form.offer_type === "free_addon" && (
                          <div>
                            <label className="text-xs font-bold block mb-1" style={{ color: C.muted }}>وصف الإضافة المجانية</label>
                            <input
                              type="text"
                              value={form.addon_description}
                              onChange={(e) => setForm((f) => ({ ...f, addon_description: e.target.value }))}
                              placeholder="مثال: مشروب"
                              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                              style={{ border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit", background: "#fff" }}
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-bold block mb-1" style={{ color: C.muted }}>تاريخ الانتهاء (اختياري)</label>
                          <input
                            type="datetime-local"
                            value={form.expires_at}
                            onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                            style={{ border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit", background: "#fff" }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveOffer}
                            disabled={saving}
                            className="flex-1 py-2 text-sm font-black rounded-xl"
                            style={{ background: C.primary, color: "#fff", opacity: saving ? 0.6 : 1 }}
                          >
                            {saving ? "جارٍ الحفظ..." : "حفظ العرض"}
                          </button>
                          <button
                            onClick={closeForm}
                            className="px-4 py-2 text-sm font-bold rounded-xl"
                            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Active offers list */}
      {offerTab === "list" && (
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: "#FFFFFF" }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="font-black text-base" style={{ color: C.text }}>العروض الحالية</h2>
        </div>
        {offersLoading ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: C.faint }}>جارٍ التحميل...</div>
        ) : offers.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: C.faint }}>لا توجد عروض بعد</div>
        ) : (
          <div>
            {offers.map((offer) => {
              const prod    = prodMap[offer.product_id];
              const expired = isExpired(offer.expires_at);
              return (
                <div
                  key={offer.id}
                  className="px-5 py-3.5 flex items-center gap-3"
                  style={{ borderBottom: `1px solid ${C.border}`, opacity: expired ? 0.6 : 1 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status dot */}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: expired ? "#EF4444" : offer.is_active ? "#22C55E" : "#D1D5DB",
                        }}
                      />
                      <span className="font-bold text-sm" style={{ color: C.text }}>{prod?.name ?? "منتج"}</span>
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={{
                          background: offer.offer_type === "price_discount" ? "#FEE2E2" : offer.offer_type === "free_delivery" ? "#DCFCE7" : `${C.gold}20`,
                          color: offer.offer_type === "price_discount" ? "#EF4444" : offer.offer_type === "free_delivery" ? "#16A34A" : C.gold,
                        }}
                      >
                        {offer.offer_type === "price_discount"
                          ? `خصم ${offer.discount_percent}%`
                          : offer.offer_type === "free_delivery"
                          ? "توصيل مجاني"
                          : `${offer.addon_description} مجاناً`}
                      </span>
                      {expired && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                          منتهي
                        </span>
                      )}
                    </div>
                    {offer.expires_at && (
                      <p className="text-xs mt-0.5" style={{ color: C.faint }}>
                        ينتهي: {new Date(offer.expires_at).toLocaleDateString("ar-JO")}
                      </p>
                    )}
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleOffer(offer)}
                    disabled={!!togglingId}
                    className="relative w-10 h-5 rounded-full transition-all shrink-0"
                    style={{ background: offer.is_active && !expired ? C.primary : "#D1D5DB", opacity: togglingId === offer.id ? 0.5 : 1 }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ right: offer.is_active && !expired ? "0.125rem" : "auto", left: offer.is_active && !expired ? "auto" : "0.125rem" }}
                    />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteOffer(offer.id)}
                    disabled={!!deletingId}
                    className="shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{ color: C.faint, opacity: deletingId === offer.id ? 0.5 : 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FFF5F5"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Points panel
══════════════════════════════════════════════════════════════ */
interface _UserPointsData {
  user_id:      string;
  points:       number;
  total_earned: number;
}
interface _PointsHistRow {
  id:         string;
  user_id:    string;
  order_id:   string | null;
  points:     number;
  type:       "earned" | "redeemed";
  note:       string | null;
  created_at: string;
}
interface _RedeemableRow {
  id:           string;
  name:         string;
  description:  string | null;
  points_cost:  number;
  image_url:    string | null;
  is_available: boolean;
}
const BLANK_RDEEM = { name: "", description: "", points_cost: "" };

function PointsPanel() {
  const [searchId,      setSearchId]      = useState("");
  const [searching,     setSearching]     = useState(false);
  const [userData,      setUserData]      = useState<_UserPointsData | null>(null);
  const [userHistory,   setUserHistory]   = useState<_PointsHistRow[]>([]);
  const [searchError,   setSearchError]   = useState("");
  const [userInfo,      setUserInfo]      = useState<{ customer_name: string; customer_phone: string } | null>(null);
  const [redeemables,   setRedeemables]   = useState<_RedeemableRow[]>([]);
  const [redeemLoading, setRedeemLoading] = useState<string | null>(null);
  const [redeemMsg,     setRedeemMsg]     = useState<string | null>(null);
  const [prodLoading,   setProdLoading]   = useState(true);
  const [addingProd,    setAddingProd]    = useState(false);
  const [newProd,       setNewProd]       = useState(BLANK_RDEEM);
  const [savingProd,    setSavingProd]    = useState(false);
  const [allProducts,   setAllProducts]   = useState<{ id: string; name: string; category: string; emoji: string | null }[]>([]);

  const loadRedeemables = useCallback(async () => {
    setProdLoading(true);
    const { data } = await supabase
      .from("redeemable_products")
      .select("id, name, description, points_cost, image_url, is_available")
      .order("created_at", { ascending: false });
    if (data) setRedeemables(data as _RedeemableRow[]);
    setProdLoading(false);
  }, []);

  useEffect(() => { loadRedeemables(); }, [loadRedeemables]);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, category, emoji")
      .eq("available", true)
      .order("category")
      .order("name")
      .then(({ data }) => {
        if (data) setAllProducts(data as typeof allProducts);
      });
  }, []);

  const searchUser = async () => {
    const id = searchId.trim();
    if (!id) return;
    setSearching(true);
    setSearchError("");
    setUserData(null);
    setUserHistory([]);
    setUserInfo(null);

    // Step 1: find user_id from customer_code
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("customer_code", id.toUpperCase())
      .single();

    if (!profileData) {
      setSearchError("لم يُعثر على هذا الرمز — تأكد من الرمز المكون من 6 أحرف");
      setSearching(false);
      return;
    }

    const userId = (profileData as { id: string }).id;

    // Step 2: fetch latest order info for name/phone
    const { data: orderData } = await supabase
      .from("orders")
      .select("customer_name, customer_phone")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (orderData) {
      setUserInfo(orderData as { customer_name: string; customer_phone: string });
    }

    // Step 3: fetch points and history using userId
    const [ptRes, histRes] = await Promise.all([
      supabase.from("user_points").select("user_id, points, total_earned").eq("user_id", userId).single(),
      supabase.from("points_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);

    const pt = ptRes.data as _UserPointsData | null;
    if (!pt) {
      setUserData({ user_id: userId, points: 0, total_earned: 0 });
    } else {
      setUserData(pt);
    }
    setUserHistory((histRes.data ?? []) as _PointsHistRow[]);
    setSearching(false);
  };

  const redeemProduct = async (product: _RedeemableRow) => {
    if (!userData) return;
    if (userData.points < product.points_cost) {
      setRedeemMsg("نقاط المستخدم غير كافية");
      setTimeout(() => setRedeemMsg(null), 3000);
      return;
    }
    setRedeemLoading(product.id);
    const [h, p] = await Promise.all([
      supabase.from("points_history").insert({
        user_id: userData.user_id, order_id: null,
        points: product.points_cost, type: "redeemed",
        note: `استبدال: ${product.name}`,
      }),
      supabase.from("user_points")
        .update({ points: userData.points - product.points_cost })
        .eq("user_id", userData.user_id),
    ]);
    if (h.error || p.error) {
      setRedeemMsg("حدث خطأ — حاول مرة أخرى");
    } else {
      setUserData((prev) => prev ? { ...prev, points: prev.points - product.points_cost } : null);
      setRedeemMsg(`تم استبدال "${product.name}" بنجاح`);
    }
    setRedeemLoading(null);
    setTimeout(() => setRedeemMsg(null), 3000);
  };

  const toggleRedeemable = async (prod: _RedeemableRow) => {
    const next = !prod.is_available;
    await supabase.from("redeemable_products").update({ is_available: next }).eq("id", prod.id);
    setRedeemables((prev) => prev.map((p) => p.id === prod.id ? { ...p, is_available: next } : p));
  };

  const deleteRedeemable = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    await supabase.from("redeemable_products").delete().eq("id", id);
    setRedeemables((prev) => prev.filter((p) => p.id !== id));
  };

  const saveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseInt(newProd.points_cost, 10);
    if (!newProd.name.trim() || isNaN(cost) || cost <= 0) return;
    setSavingProd(true);
    const { error } = await supabase.from("redeemable_products").insert({
      name:        newProd.name.trim(),
      description: newProd.description.trim() || null,
      points_cost: cost,
      is_available: true,
    });
    if (!error) { setNewProd(BLANK_RDEEM); setAddingProd(false); loadRedeemables(); }
    setSavingProd(false);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ar-JO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const categoryGroups = useMemo(() => {
    const groups: Record<string, typeof allProducts> = {};
    for (const p of allProducts) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return Object.entries(groups);
  }, [allProducts]);

  return (
    <div className="space-y-6">

      {/* ── A) Search user ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="px-4 py-3" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <span className="text-sm font-black" style={{ color: C.gold }}>البحث عن مستخدم بالرمز</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchUser(); }}
              placeholder="أدخل رمز الزبون (6 أحرف)"
              dir="ltr"
              className={INPUT}
            />
            <button
              onClick={searchUser}
              disabled={searching || !searchId.trim()}
              className="flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50 shrink-0"
              style={{ background: C.primary, color: "#fff" }}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>بحث</span>
            </button>
          </div>

          {searchError && <p className="text-sm" style={{ color: "#DC2626" }}>{searchError}</p>}

          {userData && (
            <div className="space-y-4">
              {userInfo && (
                <div className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                    style={{ background: `${C.primary}20`, color: C.primary }}>
                    {userInfo.customer_name?.charAt(0) ?? "؟"}
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: C.text }}>
                      {userInfo.customer_name}
                    </p>
                    <p className="text-xs" style={{ color: C.muted }} dir="ltr">
                      {userInfo.customer_phone}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <p className="text-2xl font-black" style={{ color: C.primary }}>{userData.points.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.faint }}>النقاط الحالية</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}33` }}>
                  <p className="text-2xl font-black" style={{ color: C.gold }}>{userData.total_earned.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.faint }}>إجمالي المكتسبة</p>
                </div>
              </div>
              {userHistory.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: C.muted }}>آخر 20 عملية</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {userHistory.map((h) => (
                      <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                        <span className={h.type === "earned" ? "font-black text-green-600" : "font-black text-red-500"}>
                          {h.type === "earned" ? "+" : "−"}{h.points}
                        </span>
                        <span className="flex-1 truncate" style={{ color: C.muted }}>{h.note ?? (h.type === "earned" ? "اكتساب نقاط" : "استبدال نقاط")}</span>
                        <span style={{ color: C.faint }}>{fmtDate(h.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── B) Redeem points for searched user ── */}
      {userData && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <div className="px-4 py-3" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
            <span className="text-sm font-black" style={{ color: C.gold }}>استبدال النقاط</span>
          </div>
          <div className="p-4">
            {redeemMsg && (
              <div className="mb-3 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
                {redeemMsg}
              </div>
            )}
            {redeemables.filter((p) => p.is_available).length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: C.faint }}>لا توجد منتجات قابلة للاستبدال حالياً</p>
            ) : (
              <div className="space-y-2">
                {redeemables.filter((p) => p.is_available).map((prod) => (
                  <div key={prod.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: C.text }}>{prod.name}</p>
                      {prod.description && <p className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>{prod.description}</p>}
                    </div>
                    <span className="font-black text-sm shrink-0" style={{ color: C.gold }}>{prod.points_cost.toLocaleString()} نقطة</span>
                    <button
                      onClick={() => redeemProduct(prod)}
                      disabled={!!redeemLoading || userData.points < prod.points_cost}
                      className="shrink-0 font-bold text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 active:scale-95"
                      style={{ background: C.primary, color: "#fff" }}
                    >
                      {redeemLoading === prod.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "استبدال"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── C) Manage redeemable products ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <span className="text-sm font-black" style={{ color: C.gold }}>إدارة المنتجات القابلة للاستبدال</span>
          <button
            onClick={() => setAddingProd((v) => !v)}
            className="font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
            style={addingProd
              ? { background: C.surface, border: `1px solid ${C.border}`, color: C.muted }
              : { background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, color: "#fff" }}
          >
            {addingProd ? "إلغاء" : "+ منتج جديد"}
          </button>
        </div>
        <div className="p-4 space-y-3">
          {addingProd && (
            <form onSubmit={saveNewProduct} className="p-3 rounded-xl space-y-3" style={{ background: C.surface, border: `1px solid ${C.primary}40` }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: C.muted }}>الاسم *</label>
                  <select
                    required
                    value={newProd.name}
                    onChange={(e) => {
                      const selected = allProducts.find((p) => p.name === e.target.value);
                      setNewProd((p) => ({
                        ...p,
                        name: e.target.value,
                        description: selected ? `${selected.emoji ?? "🍽️"} ${selected.category}` : p.description,
                      }));
                    }}
                    className={INPUT}
                  >
                    <option value="">اختر منتجاً...</option>
                    {categoryGroups.map(([category, prods]) => (
                      <optgroup key={category} label={category}>
                        {prods.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.emoji ?? "🍽️"} {p.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: C.muted }}>الكلفة بالنقاط *</label>
                  <input required type="number" min="1" value={newProd.points_cost} onChange={(e) => setNewProd((p) => ({ ...p, points_cost: e.target.value }))} dir="ltr" className={INPUT} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs mb-1" style={{ color: C.muted }}>الوصف</label>
                  <input value={newProd.description} onChange={(e) => setNewProd((p) => ({ ...p, description: e.target.value }))} className={INPUT} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingProd} className="font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-50" style={{ background: C.primary, color: "#fff" }}>
                  {savingProd ? "جارٍ الحفظ..." : "إضافة المنتج"}
                </button>
                <button type="button" onClick={() => setAddingProd(false)} className="font-bold text-sm px-4 py-2 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>إلغاء</button>
              </div>
            </form>
          )}
          {prodLoading ? (
            <p className="text-center py-6 text-sm" style={{ color: C.faint }}>جارٍ التحميل...</p>
          ) : redeemables.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: C.faint }}>لا توجد منتجات — أضف أول منتج</p>
          ) : (
            <div className="space-y-1.5">
              {redeemables.map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRight: `3px solid ${prod.is_available ? C.primary : "#D1D5DB"}` }}>
                  <div className="flex-1 min-w-0" style={{ opacity: prod.is_available ? 1 : 0.5 }}>
                    <p className="font-bold text-sm" style={{ color: C.text }}>{prod.name}</p>
                    {prod.description && <p className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>{prod.description}</p>}
                  </div>
                  <span className="font-black text-sm shrink-0" style={{ color: C.gold }}>{prod.points_cost.toLocaleString()} نقطة</span>
                  <button
                    onClick={() => toggleRedeemable(prod)}
                    title={prod.is_available ? "متاح — انقر للإخفاء" : "مخفي — انقر للإظهار"}
                    dir="ltr"
                    className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                    style={{ background: prod.is_available ? "#22C55E" : "#D1D5DB" }}
                  >
                    <span className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform" style={{ transform: prod.is_available ? "translateX(18px)" : "translateX(2px)" }} />
                  </button>
                  <button
                    onClick={() => deleteRedeemable(prod.id)}
                    className="p-1.5 rounded-lg transition-colors shrink-0"
                    style={{ color: C.faint }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FFF5F5"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Announcements panel
══════════════════════════════════════════════════════════════ */
interface _AnnouncementRow {
  id:         string;
  title:      string;
  message:    string;
  is_active:  boolean;
  created_at: string;
}

function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<_AnnouncementRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [adding,        setAdding]        = useState(false);
  const [newTitle,      setNewTitle]      = useState("");
  const [newMessage,    setNewMessage]    = useState("");
  const [saving,        setSaving]        = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data as _AnnouncementRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (item: _AnnouncementRow) => {
    const next = !item.is_active;
    await supabase.from("announcements").update({ is_active: next }).eq("id", item.id);
    setAnnouncements((prev) => prev.map((a) => a.id === item.id ? { ...a, is_active: next } : a));
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("announcements").insert({
      title: newTitle.trim(), message: newMessage.trim(), is_active: true,
    });
    if (!error) { setNewTitle(""); setNewMessage(""); setAdding(false); load(); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: C.muted }}>{announcements.length} إعلان</span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
          style={adding
            ? { background: C.surface, border: `1px solid ${C.border}`, color: C.muted }
            : { background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, color: "#fff", boxShadow: `0 4px 14px ${C.primary}33` }}
        >
          {adding ? "إلغاء" : "+ إعلان جديد"}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleSave} className="rounded-2xl p-4 space-y-3" style={{ border: `1px solid ${C.primary}40`, background: C.surface }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: C.muted }}>العنوان *</label>
            <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان الإعلان" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: C.muted }}>الرسالة *</label>
            <textarea required value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={3} placeholder="نص الإعلان..." className={`${INPUT} resize-none`} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="font-bold text-sm px-5 py-2 rounded-xl disabled:opacity-50" style={{ background: C.primary, color: "#fff" }}>
              {saving ? "جارٍ النشر..." : "نشر الإعلان"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="font-bold text-sm px-4 py-2 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>إلغاء</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10" style={{ color: C.faint }}>جارٍ التحميل...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-10" style={{ color: C.faint }}>لا توجد إعلانات بعد</div>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${a.is_active ? C.primary + "55" : C.border}`, borderRight: `3px solid ${a.is_active ? C.primary : "#D1D5DB"}` }}
            >
              <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: a.is_active ? `${C.primary}08` : C.surface }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: a.is_active ? C.primary : C.muted }}>{a.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>{a.message}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${a.is_active ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                  {a.is_active ? "نشط" : "مخفي"}
                </span>
                <button
                  onClick={() => toggleActive(a)}
                  title={a.is_active ? "انقر لإخفاء" : "انقر للتفعيل"}
                  dir="ltr"
                  className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                  style={{ background: a.is_active ? "#22C55E" : "#D1D5DB" }}
                >
                  <span className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform" style={{ transform: a.is_active ? "translateX(18px)" : "translateX(2px)" }} />
                </button>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="p-1.5 rounded-lg transition-colors shrink-0"
                  style={{ color: C.faint }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FFF5F5"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Combos Panel
══════════════════════════════════════════════════════════════ */
interface ComboForm  { name: string; description: string; price: string; sort_order: string; is_active: boolean; image_url: string; }
interface StepForm   { title: string; step_order: string; min_select: string; max_select: string; step_type: string; }
interface OptionForm { label: string; extra_cost: string; }

const BLANK_COMBO_FORM:  ComboForm  = { name: "", description: "", price: "", sort_order: "0", is_active: true,  image_url: "" };
const BLANK_STEP_FORM:   StepForm   = { title: "", step_order: "1", min_select: "1", max_select: "1", step_type: "pizza" };
const BLANK_OPTION_FORM: OptionForm = { label: "", extra_cost: "0" };

type ComboLocal = ComboDealWithSteps & { combo_steps: Array<ComboStep & { combo_step_options: ComboStepOption[] }> };

function CombosPanel() {
  const [combos,          setCombos]          = useState<ComboLocal[]>([]);
  const [loading,         setLoading]         = useState(true);

  // Combo-level editing
  const [editingComboId,  setEditingComboId]  = useState<string | "new" | null>(null);
  const [editComboForm,   setEditComboForm]   = useState<ComboForm>(BLANK_COMBO_FORM);
  const [deleteComboId,   setDeleteComboId]   = useState<string | null>(null);
  const [savingCombo,     setSavingCombo]     = useState(false);

  // Image upload
  const [imageFile,       setImageFile]       = useState<File | null>(null);
  const [imagePreview,    setImagePreview]    = useState("");
  const [imageError,      setImageError]      = useState("");
  const [uploading,       setUploading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step-level editing (scoped to the open combo)
  const [editingStepId,   setEditingStepId]   = useState<string | null>(null);  // actual id or null
  const [addingStepFor,   setAddingStepFor]   = useState<string | null>(null);  // comboId
  const [editStepForm,    setEditStepForm]    = useState<StepForm>(BLANK_STEP_FORM);
  const [deleteStepId,    setDeleteStepId]    = useState<string | null>(null);
  const [savingStep,      setSavingStep]      = useState(false);

  // Option-level editing (scoped to the open step)
  const [editingOptionId,  setEditingOptionId]  = useState<string | null>(null);
  const [addingOptionFor,  setAddingOptionFor]  = useState<string | null>(null); // stepId
  const [editOptionForm,   setEditOptionForm]   = useState<OptionForm>(BLANK_OPTION_FORM);
  const [deleteOptionId,   setDeleteOptionId]   = useState<string | null>(null);
  const [savingOption,     setSavingOption]     = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchCombos = useCallback(async () => {
    const { data } = await supabase
      .from("combo_deals")
      .select("*, combo_steps(*, combo_step_options(*))")
      .order("sort_order");
    if (data) {
      setCombos(
        (data as ComboLocal[]).map((c) => ({
          ...c,
          combo_steps: [...c.combo_steps]
            .sort((a, b) => a.step_order - b.step_order)
            .map((s) => ({ ...s, combo_step_options: s.combo_step_options ?? [] })),
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCombos(); }, [fetchCombos]);

  // ── Image helpers ───────────────────────────────────────────
  const resetImage = () => {
    setImageFile(null); setImagePreview(""); setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setImageError("حجم الصورة يجب أن لا يتجاوز 30 ميغابايت"); e.target.value = ""; return; }
    setImageError(""); setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };
  const uploadImage = async (comboId: string): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    const ext  = imageFile.name.split(".").pop() ?? "jpg";
    const path = `combo-${comboId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
    setUploading(false);
    if (error) { setImageError("فشل رفع الصورة"); return null; }
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };

  // ── Combo CRUD ──────────────────────────────────────────────
  const openNewCombo = () => {
    setEditingComboId("new"); setEditComboForm(BLANK_COMBO_FORM);
    setDeleteComboId(null); resetImage();
    setEditingStepId(null); setAddingStepFor(null);
    setEditingOptionId(null); setAddingOptionFor(null);
  };
  const openEditCombo = (c: ComboLocal) => {
    setEditingComboId(c.id);
    setEditComboForm({ name: c.name, description: c.description ?? "", price: c.price.toString(), sort_order: c.sort_order.toString(), is_active: c.is_active, image_url: c.image_url ?? "" });
    setDeleteComboId(null); resetImage();
    setEditingStepId(null); setAddingStepFor(null);
    setEditingOptionId(null); setAddingOptionFor(null);
  };
  const cancelCombo = () => { setEditingComboId(null); setDeleteComboId(null); resetImage(); };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCombo(true);
    const isNew = editingComboId === "new";
    const payload = {
      name:        editComboForm.name.trim(),
      description: editComboForm.description.trim() || null,
      price:       parseFloat(editComboForm.price),
      sort_order:  parseInt(editComboForm.sort_order) || 0,
      is_active:   editComboForm.is_active,
      image_url:   editComboForm.image_url.trim() || null,
    };

    let comboId: string;
    if (isNew) {
      const { data, error } = await supabase.from("combo_deals").insert(payload).select("id").single();
      if (error || !data) { setSavingCombo(false); return; }
      comboId = (data as { id: string }).id;
    } else {
      comboId = editingComboId!;
      await supabase.from("combo_deals").update(payload).eq("id", comboId);
    }

    if (imageFile) {
      const url = await uploadImage(comboId);
      if (url) await supabase.from("combo_deals").update({ image_url: url }).eq("id", comboId);
      else { setSavingCombo(false); return; }
    }

    setSavingCombo(false);
    if (isNew) { cancelCombo(); } else { setEditingComboId(comboId); }
    fetchCombos();
  };

  const toggleComboActive = async (c: ComboLocal) => {
    await supabase.from("combo_deals").update({ is_active: !c.is_active }).eq("id", c.id);
    setCombos((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleDeleteCombo = async (id: string) => {
    await supabase.from("combo_deals").delete().eq("id", id);
    setCombos((prev) => prev.filter((c) => c.id !== id));
    setDeleteComboId(null); if (editingComboId === id) setEditingComboId(null);
  };

  // ── Step CRUD ───────────────────────────────────────────────
  const openEditStep = (s: ComboStep) => {
    setEditingStepId(s.id);
    setEditStepForm({ title: s.title, step_order: s.step_order.toString(), min_select: s.min_select.toString(), max_select: s.max_select.toString(), step_type: s.step_type });
    setAddingStepFor(null);
  };
  const openAddStep = (comboId: string) => { setAddingStepFor(comboId); setEditStepForm(BLANK_STEP_FORM); setEditingStepId(null); };
  const cancelStep  = () => { setEditingStepId(null); setAddingStepFor(null); };

  const handleSaveStep = async (comboId: string, isNew: boolean) => {
    setSavingStep(true);
    const payload = {
      combo_id:   comboId,
      title:      editStepForm.title.trim(),
      step_order: parseInt(editStepForm.step_order) || 1,
      min_select: parseInt(editStepForm.min_select) || 0,
      max_select: parseInt(editStepForm.max_select) || 1,
      step_type:  editStepForm.step_type,
    };
    if (isNew) {
      await supabase.from("combo_steps").insert(payload);
    } else {
      await supabase.from("combo_steps").update(payload).eq("id", editingStepId!);
    }
    setSavingStep(false); cancelStep(); fetchCombos();
  };

  const handleDeleteStep = async (stepId: string) => {
    await supabase.from("combo_steps").delete().eq("id", stepId);
    setDeleteStepId(null); fetchCombos();
  };

  // ── Option CRUD ─────────────────────────────────────────────
  const openEditOption = (o: ComboStepOption) => {
    setEditingOptionId(o.id);
    setEditOptionForm({ label: o.label, extra_cost: o.extra_cost.toString() });
    setAddingOptionFor(null);
  };
  const openAddOption = (stepId: string) => { setAddingOptionFor(stepId); setEditOptionForm(BLANK_OPTION_FORM); setEditingOptionId(null); };
  const cancelOption  = () => { setEditingOptionId(null); setAddingOptionFor(null); };

  const handleSaveOption = async (stepId: string, isNew: boolean) => {
    setSavingOption(true);
    const payload = { step_id: stepId, label: editOptionForm.label.trim(), extra_cost: parseFloat(editOptionForm.extra_cost) || 0 };
    if (isNew) {
      await supabase.from("combo_step_options").insert(payload);
    } else {
      await supabase.from("combo_step_options").update(payload).eq("id", editingOptionId!);
    }
    setSavingOption(false); cancelOption(); fetchCombos();
  };

  const handleDeleteOption = async (optId: string) => {
    await supabase.from("combo_step_options").delete().eq("id", optId);
    setDeleteOptionId(null); fetchCombos();
  };

  // ── Render helpers ──────────────────────────────────────────
  const renderStepForm = (comboId: string, isNew: boolean) => (
    <div className="px-3 py-3 space-y-2" style={{ background: C.bg, border: `1px solid ${C.primary}33`, borderRadius: "0.75rem", margin: "4px 0" }}>
      <p className="text-xs font-black" style={{ color: C.gold }}>{isNew ? "مرحلة جديدة" : "تعديل المرحلة"}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="block text-xs mb-1" style={{ color: C.muted }}>عنوان المرحلة *</label>
          <input value={editStepForm.title} onChange={(e) => setEditStepForm((p) => ({ ...p, title: e.target.value }))} className={INPUT} placeholder="مثال: اختيار البيتزا الأولى" />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>ترتيب</label>
          <input type="number" min="1" value={editStepForm.step_order} onChange={(e) => setEditStepForm((p) => ({ ...p, step_order: e.target.value }))} dir="ltr" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>النوع</label>
          <select value={editStepForm.step_type} onChange={(e) => setEditStepForm((p) => ({ ...p, step_type: e.target.value }))} className={INPUT}>
            <option value="pizza">pizza</option>
            <option value="choice">choice</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>الحد الأدنى</label>
          <input type="number" min="0" value={editStepForm.min_select} onChange={(e) => setEditStepForm((p) => ({ ...p, min_select: e.target.value }))} dir="ltr" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>الحد الأقصى</label>
          <input type="number" min="1" value={editStepForm.max_select} onChange={(e) => setEditStepForm((p) => ({ ...p, max_select: e.target.value }))} dir="ltr" className={INPUT} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleSaveStep(comboId, isNew)}
          disabled={savingStep || !editStepForm.title.trim()}
          className="text-xs font-bold px-4 py-1.5 rounded-lg disabled:opacity-50"
          style={{ background: C.primary, color: "#fff" }}
        >
          {savingStep ? "..." : isNew ? "إضافة" : "حفظ"}
        </button>
        <button onClick={cancelStep} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>إلغاء</button>
      </div>
    </div>
  );

  const renderOptionForm = (stepId: string, isNew: boolean) => (
    <div className="flex items-end gap-2 px-3 py-2" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      <div className="flex-1">
        <label className="block text-xs mb-1" style={{ color: C.muted }}>{isNew ? "اسم الخيار *" : "تعديل الخيار"}</label>
        <input value={editOptionForm.label} onChange={(e) => setEditOptionForm((p) => ({ ...p, label: e.target.value }))} className={INPUT} placeholder="مثال: مارجريتا" />
      </div>
      <div className="w-24">
        <label className="block text-xs mb-1" style={{ color: C.muted }}>سعر إضافي</label>
        <input type="number" step="0.01" min="0" value={editOptionForm.extra_cost} onChange={(e) => setEditOptionForm((p) => ({ ...p, extra_cost: e.target.value }))} dir="ltr" className={INPUT} />
      </div>
      <button
        onClick={() => handleSaveOption(stepId, isNew)}
        disabled={savingOption || !editOptionForm.label.trim()}
        className="text-xs font-bold px-3 py-1.5 rounded-lg mb-0.5 disabled:opacity-50"
        style={{ background: C.primary, color: "#fff" }}
      >
        {savingOption ? "..." : isNew ? "إضافة" : "حفظ"}
      </button>
      <button onClick={cancelOption} className="text-xs px-2 py-1.5 rounded-lg mb-0.5" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>✕</button>
    </div>
  );

  const renderComboEditForm = (isNew: boolean) => (
    <form onSubmit={handleSaveCombo} className="px-4 py-4 space-y-4" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      {/* Image */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {imagePreview || editComboForm.image_url
            ? <img src={imagePreview || editComboForm.image_url} alt="" className="w-full h-full object-cover" />
            : <span>🍕</span>
          }
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = `${C.primary}44`; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {imagePreview || editComboForm.image_url ? "تغيير الصورة" : "رفع صورة"}
            </button>
            {imagePreview && <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "#DCFCE7", color: "#16A34A" }}>جديدة ✓</span>}
          </div>
          {imageError && <p className="text-xs" style={{ color: "#DC2626" }}>{imageError}</p>}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs mb-1" style={{ color: C.muted }}>اسم العرض *</label>
          <input required value={editComboForm.name} onChange={(e) => setEditComboForm((p) => ({ ...p, name: e.target.value }))} className={INPUT} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>السعر (د.أ) *</label>
          <input required type="number" step="0.01" min="0" value={editComboForm.price} onChange={(e) => setEditComboForm((p) => ({ ...p, price: e.target.value }))} dir="ltr" className={INPUT} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: C.muted }}>ترتيب العرض</label>
          <input type="number" min="0" value={editComboForm.sort_order} onChange={(e) => setEditComboForm((p) => ({ ...p, sort_order: e.target.value }))} dir="ltr" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs mb-1" style={{ color: C.muted }}>الوصف</label>
          <textarea value={editComboForm.description} onChange={(e) => setEditComboForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={`${INPUT} resize-none`} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={editComboForm.is_active} onChange={(e) => setEditComboForm((p) => ({ ...p, is_active: e.target.checked }))} className="accent-orange-500 w-4 h-4" />
        <span className="text-sm" style={{ color: C.text }}>نشط (يظهر للعملاء)</span>
      </label>

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={savingCombo || uploading} className="font-bold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50" style={{ background: C.primary, color: "#fff" }}>
          {uploading ? "جارٍ الرفع..." : savingCombo ? "جارٍ الحفظ..." : isNew ? "إضافة العرض" : "حفظ التعديلات"}
        </button>
        <button type="button" onClick={cancelCombo} className="text-sm px-4 py-2 rounded-xl transition-colors" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#EF444440"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
        >
          إلغاء
        </button>
      </div>
    </form>
  );

  const renderStepsSection = (combo: ComboLocal) => (
    <div className="px-4 pb-4" style={{ background: C.bg, borderTop: `1px dashed ${C.border}` }}>
      <p className="text-xs font-black pt-3 pb-2" style={{ color: C.muted }}>المراحل ({combo.combo_steps.length})</p>

      <div className="space-y-2">
        {combo.combo_steps.map((step) => (
          <div key={step.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${editingStepId === step.id ? C.primary + "66" : C.border}` }}>
            {/* Step row */}
            {editingStepId === step.id ? renderStepForm(combo.id, false) : (
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: C.surface }}>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs" style={{ color: C.text }}>{step.title}</span>
                  <span className="mr-2 text-xs" style={{ color: C.faint }}>
                    #{step.step_order} · {step.step_type} · {step.min_select === 0 ? "اختياري" : `min ${step.min_select}`}
                  </span>
                </div>
                <button onClick={() => openEditStep(step)} className="p-1 rounded-lg transition-colors" style={{ color: C.faint }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.background = `${C.primary}12`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {deleteStepId === step.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDeleteStep(step.id)} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "#EF4444", color: "#fff" }}>حذف</button>
                    <button onClick={() => setDeleteStepId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>لا</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteStepId(step.id)} className="p-1 rounded-lg transition-colors" style={{ color: C.faint }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FFF5F5"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Options for this step */}
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {step.combo_step_options.map((opt) => (
                <div key={opt.id}>
                  {editingOptionId === opt.id
                    ? renderOptionForm(step.id, false)
                    : (
                      <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <span className="flex-1 text-xs" style={{ color: C.text }}>{opt.label}</span>
                        {opt.extra_cost > 0 && <span className="text-xs font-bold" style={{ color: C.primary }}>+{opt.extra_cost.toFixed(2)} د.أ</span>}
                        <button onClick={() => openEditOption(opt)} className="p-1 rounded transition-colors" style={{ color: C.faint }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; }}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {deleteOptionId === opt.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeleteOption(opt.id)} className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#EF4444", color: "#fff" }}>حذف</button>
                            <button onClick={() => setDeleteOptionId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>لا</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteOptionId(opt.id)} className="p-1 rounded transition-colors" style={{ color: C.faint }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  }
                </div>
              ))}

              {/* Add option form */}
              {addingOptionFor === step.id
                ? renderOptionForm(step.id, true)
                : (
                  <button
                    onClick={() => openAddOption(step.id)}
                    className="w-full text-xs font-bold px-3 py-1.5 text-right transition-colors"
                    style={{ color: C.faint }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.primary; e.currentTarget.style.background = `${C.primary}08`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}
                  >
                    + إضافة خيار
                  </button>
                )
              }
            </div>
          </div>
        ))}
      </div>

      {/* Add step form */}
      {addingStepFor === combo.id
        ? renderStepForm(combo.id, true)
        : (
          <button
            onClick={() => openAddStep(combo.id)}
            className="mt-2 text-xs font-bold px-3 py-2 rounded-xl w-full text-right transition-colors"
            style={{ background: C.surface, border: `1px dashed ${C.border}`, color: C.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            + إضافة مرحلة جديدة
          </button>
        )
      }
    </div>
  );

  // ── Main render ─────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold" style={{ color: C.muted }}>{combos.length} عرض كومبو</span>
        <button
          onClick={editingComboId === "new" ? cancelCombo : openNewCombo}
          className="flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
          style={editingComboId === "new"
            ? { background: C.surface, border: `1px solid ${C.border}`, color: C.muted }
            : { background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, color: "#fff", boxShadow: `0 4px 14px ${C.primary}33` }}
        >
          {editingComboId === "new" ? "إلغاء" : "+ إضافة كومبو جديد"}
        </button>
      </div>

      {/* New combo form */}
      {editingComboId === "new" && (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${C.primary}40` }}>
          <div className="px-4 py-2.5" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
            <span className="text-sm font-black" style={{ color: C.gold }}>عرض كومبو جديد</span>
          </div>
          {renderComboEditForm(true)}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-10" style={{ color: C.faint }}>جارٍ التحميل...</div>
      ) : combos.length === 0 ? (
        <div className="text-center py-10" style={{ color: C.faint }}>لا توجد عروض — أضف أول عرض كومبو</div>
      ) : (
        <div className="space-y-2">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${editingComboId === combo.id ? C.primary : C.border}` }}
            >
              {/* Compact row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ background: C.surface, borderRight: `3px solid ${combo.is_active ? "#22C55E" : "#EF444466"}` }}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                  {combo.image_url
                    ? <img src={combo.image_url} alt="" className="w-full h-full object-cover" />
                    : <span>🍕</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: C.text }}>{combo.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${C.primary}15`, color: C.primary, border: `1px solid ${C.primary}30` }}>
                      {combo.price.toFixed(2)} د.أ
                    </span>
                    <span className="text-xs" style={{ color: C.faint }}>ترتيب: {combo.sort_order}</span>
                  </div>
                  {combo.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: C.faint }}>{combo.description}</p>
                  )}
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => toggleComboActive(combo)}
                  title={combo.is_active ? "نشط — انقر لإيقاف" : "متوقف — انقر لتفعيل"}
                  dir="ltr"
                  className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                  style={{ background: combo.is_active ? "#22C55E" : "#D1D5DB" }}
                >
                  <span className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform" style={{ transform: combo.is_active ? "translateX(18px)" : "translateX(2px)" }} />
                </button>

                {/* Edit */}
                <button
                  onClick={() => editingComboId === combo.id ? cancelCombo() : openEditCombo(combo)}
                  className="p-1.5 rounded-lg transition-colors shrink-0"
                  style={{ color: editingComboId === combo.id ? C.primary : C.faint, background: editingComboId === combo.id ? `${C.primary}15` : "transparent" }}
                  onMouseEnter={(e) => { if (editingComboId !== combo.id) { e.currentTarget.style.color = C.primary; e.currentTarget.style.background = `${C.primary}12`; } }}
                  onMouseLeave={(e) => { if (editingComboId !== combo.id) { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; } }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                {deleteComboId === combo.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleDeleteCombo(combo.id)} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "#EF4444", color: "#fff" }}>حذف</button>
                    <button onClick={() => setDeleteComboId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>لا</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteComboId(combo.id)}
                    className="p-1.5 rounded-lg transition-colors shrink-0"
                    style={{ color: C.faint }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FFF5F5"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Expanded: edit form + steps */}
              {editingComboId === combo.id && (
                <>
                  {renderComboEditForm(false)}
                  {renderStepsSection(combo)}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Root admin page
══════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [userEmail,       setUserEmail]       = useState<string | null | undefined>(undefined);
  const [tab,             setTab]             = useState<"orders" | "products" | "combos" | "zones" | "offers" | "points" | "announcements">("orders");
  const [pendingAckCount, setPendingAckCount] = useState(0);
  const [realtimeStatus,  setRealtimeStatus]  = useState<RealtimeStatus>("connecting");
  const [todayOrders,     setTodayOrders]     = useState(0);
  const [todayRevenue,    setTodayRevenue]    = useState(0);
  const [activeOrders,    setActiveOrders]    = useState(0);
  const [avgOrder,        setAvgOrder]        = useState(0);

  const handleRealtimeStatus = useCallback((s: RealtimeStatus) => setRealtimeStatus(s), []);
  const handleStatsChange    = useCallback((stats: { todayOrders: number; todayRevenue: number; activeOrders: number; avgOrder: number }) => {
    setTodayOrders(stats.todayOrders);
    setTodayRevenue(stats.todayRevenue);
    setActiveOrders(stats.activeOrders);
    setAvgOrder(stats.avgOrder);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (document.getElementById("qz-script")) return;
    const script = document.createElement("script");
    script.id = "qz-script";
    script.src = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  if (userEmail === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-4xl" style={{ animationName: "flame-flicker", animationDuration: "0.8s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite", display: "inline-block" }}>
          🔥
        </div>
      </div>
    );
  }

  if (!userEmail || userEmail !== ADMIN_EMAIL) return <LoginForm />;

  const rtDot = realtimeStatus === "connected"
    ? { bg: "#22C55E", glow: "#22C55E55" }
    : realtimeStatus === "connecting"
    ? { bg: "#EAB308", glow: "#EAB30855" }
    : { bg: "#EF4444", glow: "#EF444455" };

  const rtLabel =
    realtimeStatus === "connected"   ? "متصل"
    : realtimeStatus === "connecting" ? "يتصل..."
    : realtimeStatus === "error"      ? "خطأ"
    : "غير متصل";

  const TAB_LABELS: Record<"orders" | "products" | "combos" | "zones" | "offers" | "points" | "announcements", string> = {
    orders: "الطلبات", products: "المنتجات", combos: "العروض العائلية", zones: "التوصيل", offers: "العروض", points: "النقاط", announcements: "الإعلانات",
  };

  return (
    <div className="min-h-screen page-with-decos" style={{ color: C.text }}>
      <PageDecorations />
      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-40 px-4"
        style={{ background: "#FFFFFFEC", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Top row: logo | stats | connection + logout */}
          <div className="flex items-center gap-3 py-3">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg" style={{ display: "inline-block", animationName: "flame-flicker", animationDuration: "2.5s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }}>
                🔥
              </span>
              <div className="hidden sm:block">
                <p className="font-black text-xs leading-tight" style={{ color: C.gold }}>لوحة الإدارة</p>
                <p className="text-xs leading-tight" style={{ color: C.faint }}>منقوشة و نار</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: `${C.primary}12`, border: `1px solid ${C.primary}28`, color: C.primary }}
              >
                <span className="font-black">{todayOrders}</span>
                <span className="font-normal opacity-70">طلب اليوم</span>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}28`, color: C.gold }}
              >
                <span className="font-black">{todayRevenue.toFixed(2)}</span>
                <span className="font-normal opacity-70">د.أ اليوم</span>
              </div>
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412" }}
              >
                <span className="font-black">{activeOrders}</span>
                <span className="font-normal opacity-70">قيد التنفيذ</span>
              </div>
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1" }}
              >
                <span className="font-normal opacity-70">متوسط:</span>
                <span className="font-black">{avgOrder.toFixed(2)}</span>
                <span className="font-normal opacity-70">د.أ</span>
              </div>
              {pendingAckCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black animate-pulse"
                  style={{ background: `${C.primary}18`, border: `1px solid ${C.primary}55`, color: C.primary }}
                >
                  <span>{pendingAckCount}</span>
                  <span className="font-normal">جديد</span>
                </div>
              )}
            </div>

            {/* Connection + logout */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5" title={`الاتصال: ${rtLabel}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: rtDot.bg, boxShadow: `0 0 5px ${rtDot.glow}` }} />
                <span className="text-xs hidden sm:inline" style={{ color: C.faint }}>{rtLabel}</span>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: C.faint, border: `1px solid ${C.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#EF444440"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.faint; e.currentTarget.style.borderColor = C.border; }}
              >
                خروج
              </button>
            </div>
          </div>

          {/* Tab bar — underline style */}
          <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}`, marginBottom: "-1px" }}>
            {(["orders", "products", "combos", "zones", "offers", "points", "announcements"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-all"
                style={{
                  color:        tab === t ? C.text : C.faint,
                  borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent",
                  marginBottom: "-1px",
                }}
                onMouseEnter={(e) => { if (tab !== t) e.currentTarget.style.color = C.muted; }}
                onMouseLeave={(e) => { if (tab !== t) e.currentTarget.style.color = C.faint; }}
              >
                {TAB_LABELS[t]}
                {t === "orders" && pendingAckCount > 0 && (
                  <span className="text-xs font-black px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: "#EF4444", color: "#fff" }}>
                    {pendingAckCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-16">
        <StoreControlPanel />

        {tab === "orders" && (
          <OrdersPanel
            onPendingAckChange={setPendingAckCount}
            onRealtimeStatusChange={handleRealtimeStatus}
            onStatsChange={handleStatsChange}
          />
        )}
        {tab === "products"      && <ProductsPanel />}
        {tab === "combos"        && <CombosPanel />}
        {tab === "zones"         && <DeliveryZonesPanel />}
        {tab === "offers"        && <OffersPanel />}
        {tab === "points"        && <PointsPanel />}
        {tab === "announcements" && <AnnouncementsPanel />}
      </div>
    </div>
  );
}
