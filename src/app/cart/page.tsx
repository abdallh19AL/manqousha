"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Banknote, CreditCard, Globe, MapPin, Navigation,
  Smartphone, Timer, Truck, Wallet,
} from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageDecorations from "@/components/PageDecorations";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { fetchZoneFees } from "@/lib/delivery-zones";
import { useStoreSettings } from "@/lib/store-settings";

const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_RE = /^(07\d{8}|\+9627\d{8})$/;

const AREA_TO_ZONE: Record<string, string> = {
  "تلاع العلي": "K1", "شارع الجاردنز": "K1", "أم السماق": "K1", "شارع المدينة": "K1", "البركة": "K1",
  "الرابية": "K2", "خلدا": "K2", "الروابي": "K2", "ضاحية الرشيد": "K2", "ضاحية الروضة": "K2", "الجندويل": "K2", "المدينة الطبية": "K2", "ضاحية الأمير راشد": "K2", "أم أذينة": "K2", "طلوع نيفين": "K2", "مجمع الأعمال": "K2", "مكة مول": "K2", "سيتي مول": "K2",
  "الشميساني": "K3", "السادس": "K3", "الرابع": "K3", "صويلح": "K3", "دابوق": "K3", "الجبيهة": "K3", "السابع": "K3", "المدينة الرياضية": "K3", "عرجان": "K3", "الكرسي": "K3", "السهل": "K3", "الصويفية": "K3",
  "العبدلي": "K4", "عبدون": "K4", "دير غبار": "K4", "البياضة": "K4", "الرونق": "K4", "الحسين": "K4", "مستشفى إسلامي": "K4", "الكمالية": "K4", "زويتينة": "K4", "أم الأسود": "K4", "جبل عمان": "K4", "دوار الداخلية": "K4", "وادي صقور": "K4",
  "النزهة": "K5", "ضاحية الاستقلال": "K5", "ضاحية الأقصى": "K5", "اللويبدة": "K5", "مستشفى الاستقلال": "K5", "ضاحية الأمير حسن": "K5", "عين الباشا": "K5", "أبو سوس": "K5", "شارع الرينبو": "K5", "رأس العين": "K5", "طبربور": "K5", "صافوط": "K5", "وادي السير": "K5", "فحيص": "K5", "ماحص": "K5", "أم السوس": "K5",
  "الياسمين": "K6", "أبو نصير": "K6", "شفا بدران": "K6", "مرج الحمام": "K6", "أبو علياء": "K6", "إسكان التلفزيون": "K6", "الرحبة الشمالية": "K6", "الرحبة الجنوبية": "K6", "بدر الجديدة": "K6", "وسط البلد": "K6", "الأشرفية": "K6", "حي الصحابة": "K6", "رغدان": "K6", "الهاشمي": "K6", "البقعة": "K6",
  "ناعور": "K7", "الوحدات": "K7", "المقابلين": "K7", "حي النزال": "K7", "الجبل الأخضر": "K7", "جبل النصر": "K7", "عدن": "K7", "عراق الأمير": "K7", "المباني": "K7", "جبل الزهور": "K7", "ضاحية الحاج حسن": "K7", "شارع الحرية": "K7", "المنارة": "K7", "أم النوارة": "K7",
  "الجويدة": "K8", "جاوا": "K8", "علندا": "K8", "صالحية العابد": "K8", "اليادودة": "K8", "القويسمة": "K8", "ماركا الشمالية": "K8", "ماركا الجنوبية": "K8", "خريبة السوق": "K8",
  "الرصيفة": "K9", "سحاب": "K9", "المشيرفة": "K9", "الجبل الشمالي": "K9",
};


type PaymentMethod = "cash" | "electronic";
type ElectronicSub = "apple" | "google" | "card";

const ELECTRONIC_OPTS: { key: ElectronicSub; label: string; Icon: typeof CreditCard; desc: string }[] = [
  { key: "apple",  label: "Apple Pay",    Icon: Smartphone, desc: "iPhone / Mac"      },
  { key: "google", label: "Google Pay",   Icon: Globe,      desc: "Android / Chrome"  },
  { key: "card",   label: "بطاقة بنكية", Icon: CreditCard, desc: "Visa / Mastercard" },
];

/* ── CSS tokens ── */
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

export default function CartPage() {
  const {
    items, removeItem, updateQuantity,
    comboItems, removeComboItem, updateComboQuantity,
    clearCart, getTotal,
  } = useCartStore();

  const [form, setForm] = useState({ customer_name: "", customer_phone: "", notes: "" });
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [submitError,     setSubmitError]     = useState("");
  const [selectedArea,    setSelectedArea]    = useState<string | null>(null);
  const selectedZone = selectedArea ? (AREA_TO_ZONE[selectedArea] ?? null) : null;
  const [nameTouched,     setNameTouched]     = useState(false);
  const [phoneTouched,    setPhoneTouched]    = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [paymentMethod,   setPaymentMethod]   = useState<PaymentMethod | null>(null);
  const [electronicSub,   setElectronicSub]   = useState<ElectronicSub | null>(null);
  const [showElecMsg,      setShowElecMsg]      = useState(false);
  const [confirmedTotal,   setConfirmedTotal]   = useState(0);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");
  const [isRestored,       setIsRestored]       = useState(false);
  const [zoneFees,         setZoneFees]         = useState<Record<string, number>>({});
  const [freeDelivery,      setFreeDelivery]      = useState(false);
  const [streakMsg,         setStreakMsg]         = useState<string | null>(null);
  const [freeDeliveryOffer, setFreeDeliveryOffer] = useState(false);

  const saveTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileFetchedRef = useRef(false);

  const { user } = useAuth();
  const [saveProfile, setSaveProfile] = useState(true);
  const { ordersPaused, pauseMessage, outsideHours, openingTime, electronicPaymentEnabled } = useStoreSettings();
  const isStoreClosed = ordersPaused || outsideHours;

  // Reset payment method if electronic gets disabled remotely
  useEffect(() => {
    if (!electronicPaymentEnabled && paymentMethod === "electronic") {
      setPaymentMethod(null);
    }
  }, [electronicPaymentEnabled, paymentMethod]);

  // ── Fetch live delivery zone fees from DB ────────────────────
  useEffect(() => { fetchZoneFees().then(setZoneFees); }, []);

  // ── Restore delivery info from localStorage on mount ─────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("manqousha-delivery-info");
      if (raw) {
        const p = JSON.parse(raw);
        setForm((prev) => ({
          customer_name:  typeof p.customer_name  === "string" ? p.customer_name  : prev.customer_name,
          customer_phone: typeof p.customer_phone === "string" ? p.customer_phone : prev.customer_phone,
          notes:          typeof p.notes          === "string" ? p.notes          : prev.notes,
        }));
        if (p.paymentMethod === "cash" || p.paymentMethod === "electronic") {
          setPaymentMethod(p.paymentMethod as PaymentMethod);
        }
        if (typeof p.selectedArea === "string") setSelectedArea(p.selectedArea);
      }
    } catch { /* ignore corrupted data */ }
    setIsRestored(true);
  }, []);

  // ── Pre-fill form from profile for logged-in users ────────────
  useEffect(() => {
    if (!isRestored || !user || profileFetchedRef.current) return;
    profileFetchedRef.current = true;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()
      .then(({ data: p }) => {
        if (!p) return;
        const d = p as Record<string, unknown>;
        setForm((prev) => ({
          customer_name:  prev.customer_name  || String(d.full_name  ?? ""),
          customer_phone: prev.customer_phone || String(d.phone      ?? ""),
          notes:          prev.notes,
        }));
      });
  }, [isRestored, user]);

  // ── Streak check: free delivery after 4 completed orders ─────
  useEffect(() => {
    if (!user) {
      setFreeDelivery(false);
      return;
    }
    if (!isRestored) return;
    (async () => {
      const { data } = await supabase
        .from("order_streaks")
        .select("order_count, streak_start, free_delivery_used")
        .eq("user_id", user.id)
        .limit(1);
      const row = data?.[0] as {
        order_count: number;
        streak_start: string;
        free_delivery_used: boolean;
      } | undefined;
      if (!row) return;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isActive = new Date(row.streak_start) >= thirtyDaysAgo;
      const count = isActive ? row.order_count : 0;
      if (count >= 4 && !row.free_delivery_used) {
        setFreeDelivery(true);
        setStreakMsg(`أكملت ${count} طلبات خلال 30 يوم`);
      } else {
        setFreeDelivery(false);
        setStreakMsg(null);
      }
    })();
  }, [user, isRestored]);

  // ── Check product offers for free_delivery ───────────────────
  useEffect(() => {
    if (items.length === 0) { setFreeDeliveryOffer(false); return; }
    const ids = items.map((i) => i.product.id);
    const now = new Date().toISOString();
    (async () => {
      const { data } = await supabase
        .from("product_offers")
        .select("product_id")
        .eq("offer_type", "free_delivery")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .in("product_id", ids)
        .limit(1);
      setFreeDeliveryOffer((data?.length ?? 0) > 0);
    })();
  }, [items]);

  // ── Persist delivery info to localStorage (debounced 400 ms) ──
  useEffect(() => {
    if (!isRestored) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem("manqousha-delivery-info", JSON.stringify({
          customer_name:  form.customer_name,
          customer_phone: form.customer_phone,
          notes:          form.notes,
          paymentMethod,
          selectedArea,
        }));
      } catch { /* storage quota exceeded */ }
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [form, paymentMethod, selectedArea, isRestored]);

  // ── Delivery calculation ──────────────────────────────────────
  const subtotal    = getTotal();
  const selectedFee = selectedZone ? (zoneFees[selectedZone] ?? 0) : 0;
  const effectiveDeliveryFee = (freeDelivery || freeDeliveryOffer) ? 0 : selectedFee;
  const grandTotal = subtotal + effectiveDeliveryFee;

  // ── Validation ────────────────────────────────────────────────
  const nameError     = form.customer_name.trim().length < 3
    ? "الاسم يجب أن يكون 3 أحرف على الأقل" : null;
  const phoneError    = !PHONE_RE.test(form.customer_phone.trim())
    ? "رقم غير صحيح — مثال: 0791234567" : null;
  const zoneSelectionError = !selectedZone ? "يرجى اختيار منطقة التوصيل" : null;
  const isFormValid   = !nameError && !phoneError && !zoneSelectionError && paymentMethod !== null;

  const showNameError          = (nameTouched  || submitAttempted) && !!nameError;
  const showPhoneError         = (phoneTouched || submitAttempted) && !!phoneError;
  const showZoneSelectionError = submitAttempted && !!zoneSelectionError;
  const showPaymentError       = submitAttempted && !paymentMethod;

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!isFormValid || (items.length === 0 && comboItems.length === 0) || isStoreClosed) return;
    setLoading(true);
    setSubmitError("");
    try {
      // For electronic: get PaymentURL BEFORE creating any order in the DB
      let paymentUrl: string | null = null;
      const preOrderId = paymentMethod === "electronic" ? crypto.randomUUID() : null;
      if (paymentMethod === "electronic") {
        const payRes = await fetch("/api/payment/initiate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            orderId:       preOrderId,
            amount:        grandTotal,
            customerName:  form.customer_name.trim(),
            customerPhone: form.customer_phone.trim(),
          }),
        });
        const payData = await payRes.json() as { paymentUrl?: string; error?: string };
        if (!payRes.ok || !payData.paymentUrl) {
          throw new Error(payData.error ?? "فشل تهيئة الدفع الإلكتروني");
        }
        paymentUrl = payData.paymentUrl;
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          ...(preOrderId && { id: preOrderId }),
          customer_name:    form.customer_name.trim(),
          customer_phone:   form.customer_phone.trim(),
          customer_address: selectedArea ?? "",
          notes:            freeDelivery
            ? `${form.notes.trim() ? form.notes.trim() + " | " : ""}🎁 توصيل مجاني - عرض الولاء (الطلب الخامس)`
            : form.notes.trim() || null,
          total:            subtotal,
          status:           "pending",
          payment_method:   paymentMethod ?? "cash",
          ...(user && { user_id: user.id }),
          delivery_fee:  effectiveDeliveryFee,
          delivery_zone: selectedZone,
        })
        .select()
        .single();

      if (orderErr) {
        console.error("[cart] order insert failed:", orderErr);
        throw orderErr;
      }

      const regularRows = items.map((i) => {
          const addonsExtra = (i.addons ?? []).reduce((s, a) => s + a.extra, 0);
          const unitPrice = (i.selectedSize?.price ?? i.product.price) + (i.doughType?.extra ?? 0) + addonsExtra;
          let productName = i.selectedSize
            ? `${i.product.name} (${i.selectedSize.label})` : i.product.name;
          if (i.doughType) {
            productName += ` - ${i.doughType.label}`;
            if (i.doughType.extra > 0) productName += ` +${i.doughType.extra.toFixed(2)} د.أ`;
          }
          if (i.addons && i.addons.length > 0) {
            productName += ` | ${i.addons.map((a) => `${a.label} +${a.extra.toFixed(2)} د.أ`).join(", ")}`;
          }
          return { order_id: order.id, product_id: UUID_RE.test(i.product.id) ? i.product.id : null, product_name: productName, quantity: i.quantity, price: unitPrice };
        });
      const comboRows = comboItems.map((c) => {
          const extrasTotal = c.selections.reduce((s, sel) => s + sel.extraCost, 0);
          const selStr = c.selections
            .map((s) => `${s.stepTitle}: ${s.chosen}${s.extraCost > 0 ? ` +${s.extraCost.toFixed(2)} د.أ` : ""}`)
            .join(" | ");
          return { order_id: order.id, product_id: null, product_name: selStr ? `${c.comboName} | ${selStr}` : c.comboName, quantity: c.quantity, price: c.basePrice + extrasTotal };
        });
      const { error: itemsErr } = await supabase.from("order_items").insert([...regularRows, ...comboRows]);

      if (itemsErr) {
        console.error("[cart] order_items insert failed:", itemsErr);
        throw itemsErr;
      }
      if (paymentMethod === "electronic" && paymentUrl) {
        clearCart();
        try { localStorage.removeItem("manqousha-delivery-info"); } catch { /* ignore */ }
        window.location.href = paymentUrl;
        return;
      }

      setConfirmedTotal(grandTotal);
      setConfirmedOrderId(order.id);
      try { localStorage.removeItem("manqousha-delivery-info"); } catch { /* ignore */ }
      if (user && saveProfile) {
        try {
          await supabase.from("profiles").upsert({
            id:        user.id,
            full_name: form.customer_name.trim(),
            phone:     form.customer_phone.trim(),
          }, { onConflict: "id" });
        } catch { /* non-critical */ }
      }
      if (user) {
        addPointsForOrder(user.id, order.id, subtotal).catch(console.error);
        updateOrderStreak(user.id, freeDelivery).catch(console.error);
      }
      clearCart();
      setSuccess(true);
    } catch (err) {
      const supaErr = err as { message?: string; code?: string; details?: string };
      console.error("[cart] submission error:", {
        message: supaErr?.message,
        code:    supaErr?.code,
        details: supaErr?.details,
        raw:     err,
      });
      setSubmitError(
        `حدث خطأ أثناء إرسال الطلب — ${supaErr?.message ?? "يرجى المحاولة مرة أخرى"}`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Success ─────────────────────────────────────────────────── */
  if (success) {
    return (
      <main className="min-h-screen flex flex-col page-with-decos" style={{ color: C.text }}>
        <PageDecorations />
        <Navbar variant="light" />
        <div
          className="flex-1 flex flex-col items-center justify-center px-4 pt-14 pb-24 md:pb-10"
          style={{
            animationName:           "fade-slide-up",
            animationDuration:       "0.5s",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            animationFillMode:       "both",
          }}
        >
          <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 text-center">

            {/* Success circle icon */}
            <div
              className="w-[100px] h-[100px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:              "linear-gradient(135deg, #4ADE80, #22C55E)",
                boxShadow:               "0 0 40px #4ADE8033",
                animationName:           "scale-in",
                animationDuration:       "0.4s",
                animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                animationDelay:          "0.15s",
                animationFillMode:       "both",
              }}
            >
              <span style={{ fontSize: "3rem", lineHeight: 1, color: "#fff" }}>✓</span>
            </div>

            {/* Title + subtitle */}
            <div>
              <h1
                className="text-3xl md:text-4xl font-black mb-3"
                style={{
                  background:           `linear-gradient(135deg, ${C.primary} 0%, ${C.gold} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor:  "transparent",
                  backgroundClip:       "text",
                  lineHeight:           "1.3",
                }}
              >
                تم استلام طلبك!
              </h1>
              <p className="text-base leading-relaxed" style={{ color: C.muted }}>
                شكراً لثقتك! سنتواصل معك قريباً لتأكيد الطلب وموعد التوصيل.
              </p>
            </div>

            {/* Order details card */}
            <div
              className="w-full rounded-2xl p-6 space-y-4"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: C.muted }}>رقم طلبك</span>
                <span className="font-bold text-sm font-mono tracking-wider" style={{ color: C.text }}>
                  #{confirmedOrderId.slice(-6).toUpperCase() || "------"}
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                <span className="flex items-center gap-1.5 text-sm" style={{ color: C.muted }}>
                  <Timer className="w-4 h-4" /> الوقت المتوقع
                </span>
                <span className="font-bold text-sm" style={{ color: C.text }}>30-45 دقيقة</span>
              </div>
              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                <span className="flex items-center gap-1.5 text-sm" style={{ color: C.muted }}>
                  <Wallet className="w-4 h-4" /> المجموع
                </span>
                <span className="font-black text-base" style={{ color: C.primary }}>
                  {confirmedTotal.toFixed(2)} د.أ
                </span>
              </div>
            </div>

            {/* Primary: live tracking */}
            <Link
              href={`/track/${confirmedOrderId}`}
              className="w-full flex items-center justify-center gap-2 font-black py-4 rounded-xl text-sm text-white"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                boxShadow:  `0 6px 24px ${C.primary}44`,
              }}
            >
              <Navigation className="w-4 h-4" />
              تتبّع طلبك مباشرة
            </Link>

            {/* Secondary */}
            <div className="flex gap-3 w-full">
              <Link
                href="/"
                className="flex-1 text-center font-bold py-3 rounded-xl text-sm"
                style={{ background: C.primary, color: "#FFFFFF", boxShadow: `0 4px 14px ${C.primary}44` }}
              >
                اطلب مرة ثانية 🔥
              </Link>
              <Link
                href="/"
                className="flex-1 text-center font-bold py-3 rounded-xl text-sm transition-all"
                style={{ border: `1.5px solid ${C.border}`, color: C.muted, background: "transparent" }}
              >
                العودة للرئيسية
              </Link>
            </div>

          </div>
        </div>
        <Footer variant="light" />
      </main>
    );
  }

  /* ── Empty ───────────────────────────────────────────────────── */
  if (items.length === 0 && comboItems.length === 0) {
    return (
      <main className="min-h-screen flex flex-col page-with-decos" style={{ color: C.text }}>
        <PageDecorations />
        <Navbar variant="light" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-14 pb-24 md:pb-0 gap-4">
          <span className="text-6xl select-none">🛒</span>
          <div>
            <p className="font-black text-lg" style={{ color: C.text }}>السلة فارغة</p>
            <p className="text-sm mt-1 font-medium" style={{ color: C.faint }}>
              أضف شيئاً من القائمة وارجع هنا
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl text-sm font-black"
            style={{ background: C.primary, color: "#FFF", boxShadow: `0 4px 16px ${C.primary}55` }}
          >
            تصفح القائمة
          </Link>
        </div>
        <Footer variant="light" />
      </main>
    );
  }

  /* ── Cart ────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen page-with-decos" style={{ color: C.text }}>
      <PageDecorations />
<div style={{ position: "relative" }}>
      <Navbar variant="light" />

      <div className="pt-14 md:pt-16 pb-24 md:pb-10 px-4 max-w-2xl mx-auto">
        <h1
          className="text-3xl font-black py-8 md:py-10"
          style={{ color: C.gold }}
        >
          سلة الطلبات
        </h1>

        {/* ══ Items card ══ */}
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          {items.map((item) => {
            const addonsExtra = (item.addons ?? []).reduce((s, a) => s + a.extra, 0);
            const unitPrice = (item.selectedSize?.price ?? item.product.price) + (item.doughType?.extra ?? 0) + addonsExtra;
            return (
              <div
                key={item.cartKey}
                className="flex items-center gap-3 py-3"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-snug truncate" style={{ color: C.text }}>
                    {item.product.name}
                  </p>
                  {item.selectedSize && (
                    <p className="text-xs mt-0.5" style={{ color: C.faint }}>
                      {item.selectedSize.label}
                    </p>
                  )}
                  {item.doughType && (
                    <p className="text-xs mt-0.5" style={{ color: C.faint }}>
                      {item.doughType.label}{item.doughType.extra > 0 ? ` +${item.doughType.extra.toFixed(2)} د.أ` : ""}
                    </p>
                  )}
                  {item.addons && item.addons.map((addon) => (
                    <p key={addon.label} className="text-xs mt-0.5" style={{ color: C.faint }}>
                      {addon.label} +{addon.extra.toFixed(2)} د.أ
                    </p>
                  ))}
                  <p className="font-bold text-xs mt-0.5" style={{ color: C.gold }}>
                    {unitPrice.toFixed(2)} د.أ
                  </p>
                </div>

                {/* Qty */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all text-lg leading-none"
                    style={{ background: "#FFF0EE", color: "#E84040", border: "1px solid #E8404033" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFE0DC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FFF0EE")}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-black text-sm" style={{ color: C.text }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all text-lg leading-none"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, color: "#fff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    +
                  </button>
                </div>

                <span className="w-14 text-left font-black text-sm" style={{ color: C.text }}>
                  {(unitPrice * item.quantity).toFixed(2)}
                </span>

                <button
                  onClick={() => removeItem(item.cartKey)}
                  className="transition-colors p-1 text-lg leading-none"
                  style={{ color: C.faint }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E84040")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Combo items */}
          {comboItems.map((combo) => {
            const comboTotal = combo.basePrice + combo.selections.reduce((s, sel) => s + sel.extraCost, 0);
            return (
              <div
                key={combo.cartKey}
                className="flex items-start gap-3 py-3"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "#FFF4EF", color: C.primary }}
                    >
                      كومبو
                    </span>
                    <p className="font-bold text-sm leading-snug" style={{ color: C.text }}>
                      {combo.comboName}
                    </p>
                  </div>
                  {combo.selections.map((sel, idx) => (
                    <p key={idx} className="text-xs mt-0.5" style={{ color: C.faint }}>
                      {sel.stepTitle}: {sel.chosen}{sel.extraCost > 0 ? ` +${sel.extraCost.toFixed(2)} د.أ` : ""}
                    </p>
                  ))}
                  <p className="font-bold text-xs mt-1" style={{ color: C.gold }}>
                    {comboTotal.toFixed(2)} د.أ
                  </p>
                </div>

                {/* Qty */}
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => updateComboQuantity(combo.cartKey, combo.quantity - 1)}
                    className="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all text-lg leading-none"
                    style={{ background: "#FFF0EE", color: "#E84040", border: "1px solid #E8404033" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFE0DC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FFF0EE")}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-black text-sm" style={{ color: C.text }}>
                    {combo.quantity}
                  </span>
                  <button
                    onClick={() => updateComboQuantity(combo.cartKey, combo.quantity + 1)}
                    className="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all text-lg leading-none"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, color: "#fff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    +
                  </button>
                </div>

                <span className="w-14 text-left font-black text-sm mt-1" style={{ color: C.text }}>
                  {(comboTotal * combo.quantity).toFixed(2)}
                </span>

                <button
                  onClick={() => removeComboItem(combo.cartKey)}
                  className="transition-colors p-1 text-lg leading-none mt-1"
                  style={{ color: C.faint }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E84040")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Subtotal row */}
          <div
            className="flex justify-between items-center pt-4 mt-1"
            style={{ borderTop: `1px solid ${C.primary}22` }}
          >
            <span className="font-bold text-sm" style={{ color: C.muted }}>
              المجموع الفرعي
            </span>
            <span className="text-xl font-black" style={{ color: C.primary }}>
              {subtotal.toFixed(2)} <span className="text-sm font-bold">د.أ</span>
            </span>
          </div>
        </div>

        {/* ══ Delivery form ══ */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl overflow-hidden"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          {/* Form header */}
          <div
            className="px-5 py-4 flex items-center gap-2"
            style={{
              background:   `linear-gradient(135deg, ${C.primary}0D, ${C.gold}08)`,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <Truck className="w-4 h-4" style={{ color: C.primary }} />
            <h2 className="text-base font-black" style={{ color: C.text }}>
              معلومات التوصيل
            </h2>
          </div>

          <div className="p-5 space-y-5">

            {/* Name */}
            <Field
              label="الاسم الكريم"
              required
              valid={!nameError && nameTouched}
              error={showNameError ? nameError : null}
            >
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                onBlur={() => setNameTouched(true)}
                placeholder="اسمك الكريم"
                style={inputStyle(showNameError, !nameError && nameTouched)}
              />
            </Field>

            {/* Phone */}
            <Field
              label="رقم الهاتف"
              required
              valid={!phoneError && phoneTouched}
              error={showPhoneError ? phoneError : null}
            >
              <input
                type="tel"
                value={form.customer_phone}
                onChange={(e) => {
                  setForm({ ...form, customer_phone: e.target.value });
                  if (!phoneTouched) setPhoneTouched(true);
                }}
                onBlur={() => setPhoneTouched(true)}
                placeholder="07X XXX XXXX"
                dir="ltr"
                style={inputStyle(showPhoneError, !phoneError && phoneTouched)}
              />
            </Field>

            {/* Zone selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: C.muted }}>
                اختر منطقة التوصيل
                <span style={{ color: C.primary }}>*</span>
                {selectedZone && <span style={{ color: "#22C55E" }}>✓</span>}
              </label>
              <select
                value={selectedArea ?? ""}
                onChange={(e) => {
                  setSelectedArea(e.target.value || null);
                }}
                style={{
                  ...inputStyle(!!showZoneSelectionError, !!selectedZone),
                  appearance: "none",
                  cursor: "pointer",
                }}
                dir="rtl"
              >
                <option value="">-- اختر حيك أو منطقتك --</option>
                <optgroup label="── 2.00 د.أ ──">
                  <option value="تلاع العلي">تلاع العلي</option>
                  <option value="شارع الجاردنز">شارع الجاردنز</option>
                  <option value="أم السماق">أم السماق</option>
                  <option value="شارع المدينة">شارع المدينة</option>
                  <option value="البركة">البركة</option>
                </optgroup>
                <optgroup label="── 2.50 د.أ ──">
                  <option value="الرابية">الرابية</option>
                  <option value="خلدا">خلدا</option>
                  <option value="الروابي">الروابي</option>
                  <option value="ضاحية الرشيد">ضاحية الرشيد</option>
                  <option value="ضاحية الروضة">ضاحية الروضة</option>
                  <option value="الجندويل">الجندويل</option>
                  <option value="المدينة الطبية">المدينة الطبية</option>
                  <option value="ضاحية الأمير راشد">ضاحية الأمير راشد</option>
                  <option value="أم أذينة">أم أذينة</option>
                  <option value="طلوع نيفين">طلوع نيفين</option>
                  <option value="مجمع الأعمال">مجمع الأعمال</option>
                  <option value="مكة مول">مكة مول</option>
                  <option value="سيتي مول">سيتي مول</option>
                </optgroup>
                <optgroup label="── 3.00 د.أ ──">
                  <option value="صويلح">صويلح</option>
                  <option value="الشميساني">الشميساني</option>
                  <option value="دابوق">دابوق</option>
                  <option value="الجبيهة">الجبيهة</option>
                  <option value="الصويفية">الصويفية</option>
                  <option value="الرابع">الرابع</option>
                  <option value="السادس">السادس</option>
                  <option value="السابع">السابع</option>
                  <option value="المدينة الرياضية">المدينة الرياضية</option>
                  <option value="عرجان">عرجان</option>
                  <option value="الكرسي">الكرسي</option>
                  <option value="السهل">السهل</option>
                </optgroup>
                <optgroup label="── 3.50 د.أ ──">
                  <option value="العبدلي">العبدلي</option>
                  <option value="عبدون">عبدون</option>
                  <option value="دير غبار">دير غبار</option>
                  <option value="البياضة">البياضة</option>
                  <option value="الرونق">الرونق</option>
                  <option value="الحسين">الحسين</option>
                  <option value="مستشفى إسلامي">مستشفى إسلامي</option>
                  <option value="الكمالية">الكمالية</option>
                  <option value="زويتينة">زويتينة</option>
                  <option value="أم الأسود">أم الأسود</option>
                  <option value="جبل عمان">جبل عمان</option>
                  <option value="دوار الداخلية">دوار الداخلية</option>
                  <option value="وادي صقور">وادي صقور</option>
                </optgroup>
                <optgroup label="── 4.00 د.أ ──">
                  <option value="النزهة">النزهة</option>
                  <option value="ضاحية الاستقلال">ضاحية الاستقلال</option>
                  <option value="ضاحية الأقصى">ضاحية الأقصى</option>
                  <option value="اللويبدة">اللويبدة</option>
                  <option value="مستشفى الاستقلال">مستشفى الاستقلال</option>
                  <option value="ضاحية الأمير حسن">ضاحية الأمير حسن</option>
                  <option value="عين الباشا">عين الباشا</option>
                  <option value="أبو سوس">أبو سوس</option>
                  <option value="شارع الرينبو">شارع الرينبو</option>
                  <option value="رأس العين">رأس العين</option>
                  <option value="طبربور">طبربور</option>
                  <option value="صافوط">صافوط</option>
                  <option value="وادي السير">وادي السير</option>
                  <option value="فحيص">فحيص</option>
                  <option value="ماحص">ماحص</option>
                  <option value="أم السوس">أم السوس</option>
                </optgroup>
                <optgroup label="── 5.00 د.أ ──">
                  <option value="الياسمين">الياسمين</option>
                  <option value="أبو نصير">أبو نصير</option>
                  <option value="شفا بدران">شفا بدران</option>
                  <option value="مرج الحمام">مرج الحمام</option>
                  <option value="أبو علياء">أبو علياء</option>
                  <option value="إسكان التلفزيون">إسكان التلفزيون</option>
                  <option value="الرحبة الشمالية">الرحبة الشمالية</option>
                  <option value="الرحبة الجنوبية">الرحبة الجنوبية</option>
                  <option value="بدر الجديدة">بدر الجديدة</option>
                  <option value="وسط البلد">وسط البلد</option>
                  <option value="الأشرفية">الأشرفية</option>
                  <option value="حي الصحابة">حي الصحابة</option>
                  <option value="رغدان">رغدان</option>
                  <option value="الهاشمي">الهاشمي</option>
                  <option value="البقعة">البقعة</option>
                </optgroup>
                <optgroup label="── 6.00 د.أ ──">
                  <option value="ناعور">ناعور</option>
                  <option value="الوحدات">الوحدات</option>
                  <option value="المقابلين">المقابلين</option>
                  <option value="حي النزال">حي النزال</option>
                  <option value="الجبل الأخضر">الجبل الأخضر</option>
                  <option value="جبل النصر">جبل النصر</option>
                  <option value="عدن">عدن</option>
                  <option value="عراق الأمير">عراق الأمير</option>
                  <option value="المباني">المباني</option>
                  <option value="جبل الزهور">جبل الزهور</option>
                  <option value="ضاحية الحاج حسن">ضاحية الحاج حسن</option>
                  <option value="شارع الحرية">شارع الحرية</option>
                  <option value="المنارة">المنارة</option>
                  <option value="أم النوارة">أم النوارة</option>
                </optgroup>
                <optgroup label="── 7.00 د.أ ──">
                  <option value="الجويدة">الجويدة</option>
                  <option value="جاوا">جاوا</option>
                  <option value="علندا">علندا</option>
                  <option value="صالحية العابد">صالحية العابد</option>
                  <option value="اليادودة">اليادودة</option>
                  <option value="القويسمة">القويسمة</option>
                  <option value="ماركا الشمالية">ماركا الشمالية</option>
                  <option value="ماركا الجنوبية">ماركا الجنوبية</option>
                  <option value="خريبة السوق">خريبة السوق</option>
                </optgroup>
                <optgroup label="── 9.00 د.أ ──">
                  <option value="الرصيفة">الرصيفة</option>
                  <option value="سحاب">سحاب</option>
                  <option value="المشيرفة">المشيرفة</option>
                  <option value="الجبل الشمالي">الجبل الشمالي</option>
                </optgroup>
              </select>
              {showZoneSelectionError && (
                <p className="text-xs mt-1.5" style={{ color: "#E84040" }}>{zoneSelectionError}</p>
              )}
            </div>

            {/* Notes */}
            <Field label="ملاحظات" required={false} valid={false} error={null}>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أي طلبات خاصة..."
                rows={3}
                style={{ ...inputStyle(false, false), resize: "none" }}
              />
            </Field>

            {/* Save profile (logged-in users only) */}
            {user && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveProfile}
                  onChange={(e) => setSaveProfile(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 cursor-pointer"
                />
                <span className="text-sm" style={{ color: C.muted }}>
                  حفظ معلوماتي لطلباتي القادمة
                </span>
              </label>
            )}

            {/* ══ Payment method ══ */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-black mb-3"
                style={{ color: C.gold }}
              >
                <Wallet className="w-4 h-4" />
                <span>اختر طريقة الدفع</span>
                <span style={{ color: C.primary }}>*</span>
                {paymentMethod === "cash" && <span style={{ color: "#22C55E" }}>✓</span>}
              </label>

              <div className={`grid gap-3 ${electronicPaymentEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all text-center"
                  style={
                    paymentMethod === "cash"
                      ? {
                          background: `linear-gradient(135deg, ${C.primary}0D, ${C.gold}08)`,
                          border:     `2px solid ${C.primary}`,
                          boxShadow:  `0 6px 20px ${C.primary}18`,
                        }
                      : {
                          background: C.bg,
                          border:     `1px solid ${C.border}`,
                        }
                  }
                >
                  <Banknote className="w-10 h-10" style={{ color: "#22C55E" }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: paymentMethod === "cash" ? C.primary : C.text }}>
                      الدفع عند الاستلام
                    </p>
                    <p className="text-xs mt-1" style={{ color: C.faint }}>ادفع نقداً عند وصول الطلب</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "#DCFCE7", color: "#166534" }}
                  >
                    ✓ متاح حالياً
                  </span>
                </button>

                {/* Electronic Payment — only rendered when enabled from admin */}
                {electronicPaymentEnabled && <button
                  type="button"
                  onClick={() => { setPaymentMethod("electronic"); setElectronicSub(null); setShowElecMsg(false); }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all text-center"
                  style={
                    paymentMethod === "electronic"
                      ? {
                          background: `linear-gradient(135deg, ${C.primary}0D, ${C.gold}08)`,
                          border:     `2px solid ${C.primary}`,
                          boxShadow:  `0 6px 20px ${C.primary}18`,
                        }
                      : {
                          background: C.bg,
                          border:     `1px solid ${C.border}`,
                        }
                  }
                >
                  <CreditCard className="w-10 h-10" style={{ color: C.gold }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: paymentMethod === "electronic" ? C.primary : C.text }}>
                      الدفع الإلكتروني
                    </p>
                    <p className="text-xs mt-1" style={{ color: C.faint }}>Apple Pay, Google Pay, Visa, Mastercard</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "#DCFCE7", color: "#166534" }}
                  >
                    ✓ متاح
                  </span>
                </button>}
              </div>

              {paymentMethod === "electronic" && (
                <div className="mt-3 rounded-xl px-4 py-3" style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}33` }}>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                    سيتم تحويلك إلى صفحة الدفع الآمنة — تدعم Visa وMastercard وApple Pay وGoogle Pay
                  </p>
                </div>
              )}

              {showPaymentError && (
                <p className="text-xs mt-1.5" style={{ color: "#E84040" }}>
                  يرجى اختيار طريقة الدفع
                </p>
              )}
            </div>

            {/* ══ Delivery summary (shown after map pin confirmed) ══ */}
            {selectedZone !== null && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${C.primary}28` }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center gap-2.5"
                  style={{
                    background:   `linear-gradient(135deg, ${C.primary}0A, ${C.gold}06)`,
                    borderBottom: `1px solid ${C.primary}22`,
                  }}
                >
                  <MapPin className="w-4 h-4" style={{ color: C.primary }} />
                  <span className="font-black text-sm" style={{ color: C.primary }}>
                    تفاصيل التوصيل
                  </span>
                  <span
                    className="mr-auto text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${C.primary}18`, color: C.primary }}
                  >
                    {selectedZone ?? ""}
                  </span>
                </div>

                {/* Rows */}
                <div
                  className="px-4 py-3.5 space-y-3"
                  style={{ background: `${C.primary}05` }}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: C.muted }}>المجموع الفرعي</span>
                    <span className="font-bold" style={{ color: C.text }}>
                      {subtotal.toFixed(2)} د.أ
                    </span>
                  </div>

                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span style={{ color: C.muted }}>رسوم التوصيل</span>
                      <p className="text-xs mt-0.5" style={{ color: C.faint }}>
                        {selectedZone ? `📍 ${selectedZone}` : null}
                      </p>
                    </div>
                    <span className="font-bold" style={{ color: (freeDelivery || freeDeliveryOffer) ? "#22C55E" : C.gold }}>
                      {(freeDelivery || freeDeliveryOffer) ? "مجاني" : `+ ${effectiveDeliveryFee.toFixed(2)} د.أ`}
                    </span>
                  </div>

                  <div
                    className="flex justify-between items-center pt-3"
                    style={{ borderTop: `1px solid ${C.primary}22` }}
                  >
                    <span className="font-black" style={{ color: C.text }}>الإجمالي الكلي</span>
                    <span className="text-xl font-black" style={{ color: C.primary }}>
                      {grandTotal.toFixed(2)} د.أ
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Free delivery banner (streak or offer) */}
            {(freeDelivery || freeDeliveryOffer) && (
              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: "#DCFCE7", border: "2px solid #22C55E" }}
              >
                <span className="text-xl shrink-0">🎉</span>
                <div className="flex-1">
                  <p className="font-black text-sm" style={{ color: "#166534" }}>
                    التوصيل مجاني!
                  </p>
                  {freeDelivery && streakMsg && (
                    <p className="text-xs mt-0.5" style={{ color: "#166534", opacity: 0.8 }}>
                      {streakMsg}
                    </p>
                  )}
                  {freeDeliveryOffer && (
                    <p className="text-xs mt-0.5" style={{ color: "#166534", opacity: 0.8 }}>
                      أحد منتجاتك يشمل عرض توصيل مجاني
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pause / outside-hours banner */}
            {isStoreClosed && (
              <div
                className="rounded-xl p-4"
                style={{ background: "#FFF4EE", border: `1px solid ${C.primary}44` }}
              >
                <p className="font-black text-sm mb-1" style={{ color: C.primary }}>
                  {outsideHours && !ordersPaused ? "🕐 المطعم مغلق حالياً" : "⏸️ الطلبات متوقفة مؤقتاً"}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                  {outsideHours && !ordersPaused
                    ? `المطعم مغلق حالياً — يفتح الساعة ${openingTime}`
                    : pauseMessage}
                </p>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div
                className="rounded-xl p-3 text-sm"
                style={{ background: "#FFF0F0", border: "1px solid #E8404033", color: "#C52020" }}
              >
                {submitError}
              </div>
            )}


            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || isStoreClosed || (submitAttempted && !isFormValid)}
              className="w-full font-black py-4 rounded-xl text-lg transition-all active:scale-95"
              style={
                loading
                  ? { background: C.border, color: C.faint, cursor: "wait" }
                  : isStoreClosed
                  ? { background: C.border, color: C.faint, cursor: "not-allowed" }
                  : isFormValid || !submitAttempted
                  ? {
                      background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                      color:      "#FFFFFF",
                      boxShadow:  `0 8px 28px ${C.primary}44`,
                    }
                  : { background: C.border, color: C.faint, cursor: "not-allowed" }
              }
            >
              {loading
                ? paymentMethod === "electronic" ? "جارٍ التحويل للدفع..." : "جارٍ الإرسال..."
                : isStoreClosed
                ? (outsideHours && !ordersPaused ? "المطعم مغلق حالياً 🕐" : "الطلبات متوقفة مؤقتاً ⏸️")
                : `تأكيد الطلب — ${grandTotal.toFixed(2)} د.أ 🔥`}
            </button>

          </div>
        </form>
      </div>
      <Footer variant="light" />
      </div>
    </main>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────── */
function Field({
  label, required, valid, error, children,
}: {
  label: string; required: boolean; valid: boolean;
  error: string | null; children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="flex items-center gap-1.5 text-xs font-bold mb-1.5"
        style={{ color: "#6B5B47" }}
      >
        {label}
        {required && <span style={{ color: "#E8622A" }}>*</span>}
        {valid && <span style={{ color: "#22C55E" }}>✓</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1.5" style={{ color: "#E84040" }}>{error}</p>
      )}
    </div>
  );
}

/* ── Input style helper ──────────────────────────────────────────── */
function inputStyle(hasError: boolean, isValid: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    width:        "100%",
    background:   "#FFFFFF",
    borderRadius: "12px",
    padding:      "12px 16px",
    color:        "#1A1208",
    fontSize:     "14px",
    outline:      "none",
    transition:   "border-color 0.15s",
    fontFamily:   "inherit",
  };
  if (hasError) return { ...base, border: "1px solid #E84040" };
  if (isValid)  return { ...base, border: "1px solid #22C55E" };
  return { ...base, border: "1px solid #E5E0D8" };
}

/* ── Points helpers (module-level, non-critical) ─────────────────── */
interface _UserPointsRow { points: number; total_earned: number; }
interface _StreakRow { order_count: number; streak_start: string; free_delivery_used: boolean; }

async function addPointsForOrder(userId: string, orderId: string, total: number): Promise<void> {
  const points = Math.floor(total / 5) * 100;
  if (points <= 0) return;
  await supabase.from("points_history").insert({
    user_id:  userId,
    order_id: orderId,
    points,
    type:     "earned",
    note:     `طلب #${orderId.slice(-6).toUpperCase()}`,
  });
  const { data } = await supabase
    .from("user_points")
    .select("points, total_earned")
    .eq("user_id", userId)
    .limit(1);
  const row = data?.[0] as _UserPointsRow | undefined;
  if (row) {
    await supabase
      .from("user_points")
      .update({ points: row.points + points, total_earned: row.total_earned + points })
      .eq("user_id", userId);
  } else {
    await supabase.from("user_points").insert({ user_id: userId, points, total_earned: points });
  }
}

async function updateOrderStreak(userId: string, wasFreeDel: boolean): Promise<void> {
  const { data } = await supabase
    .from("order_streaks")
    .select("order_count, streak_start, free_delivery_used")
    .eq("user_id", userId)
    .limit(1);
  const row = data?.[0] as _StreakRow | undefined;
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (!row || new Date(row.streak_start) < thirtyDaysAgo) {
    await supabase.from("order_streaks").upsert(
      { user_id: userId, order_count: 1, streak_start: now, free_delivery_used: false },
      { onConflict: "user_id" }
    );
  } else if (wasFreeDel) {
    await supabase
      .from("order_streaks")
      .update({ order_count: 0, free_delivery_used: true })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("order_streaks")
      .update({ order_count: row.order_count + 1, free_delivery_used: false })
      .eq("user_id", userId);
  }
}
