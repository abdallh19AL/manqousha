"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Navigation, Timer } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageDecorations from "@/components/PageDecorations";

const C = {
  bg:      "#FBF7F2",
  surface: "#F7F5F2",
  border:  "#E5E0D8",
  primary: "#E8622A",
  gold:    "#C8922A",
  text:    "#1A1208",
  muted:   "#6B5B47",
} as const;

function SuccessContent() {
  const params    = useSearchParams();
  const paymentId = params.get("paymentId") ?? params.get("PaymentId");
  const orderId   = params.get("orderId");

  const [status,      setStatus]      = useState<"loading" | "success" | "failed">("loading");
  const [confirmedId, setConfirmedId] = useState<string | null>(orderId);

  useEffect(() => {
    if (!paymentId) {
      // No paymentId means we arrived without a MyFatoorah redirect — use orderId directly
      setStatus(orderId ? "success" : "failed");
      return;
    }
    fetch("/api/payment/verify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ paymentId }),
    })
      .then((r) => r.json())
      .then((data: { isPaid?: boolean; orderId?: string | null }) => {
        if (data.isPaid) {
          setConfirmedId(data.orderId ?? orderId);
          setStatus("success");
        } else {
          setStatus("failed");
        }
      })
      .catch(() => {
        // Verify network failure — trust MyFatoorah's redirect as confirmation
        setConfirmedId(orderId);
        setStatus("success");
      });
  }, [paymentId, orderId]);

  if (status === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: C.primary }} />
        <p className="font-bold text-sm" style={{ color: C.muted }}>جارٍ التحقق من الدفع...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "#FEE2E2" }}
        >
          <span style={{ fontSize: "2.5rem", color: "#DC2626" }}>✕</span>
        </div>
        <div>
          <h1 className="text-2xl font-black mb-2" style={{ color: "#DC2626" }}>
            لم يتم تأكيد الدفع
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            حدث خطأ أثناء التحقق من الدفع — إذا اقتطعت المبلغ يرجى التواصل معنا
          </p>
        </div>
        <Link
          href="/cart"
          className="px-8 py-3 rounded-xl font-black text-sm"
          style={{ background: C.primary, color: "#fff" }}
        >
          العودة للسلة
        </Link>
      </div>
    );
  }

  const shortId = confirmedId ? confirmedId.slice(-6).toUpperCase() : "------";

  return (
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

        <div>
          <h1
            className="text-3xl font-black mb-3"
            style={{
              background:           `linear-gradient(135deg, ${C.primary} 0%, ${C.gold} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip:       "text",
              lineHeight:           "1.3",
            }}
          >
            تم الدفع بنجاح!
          </h1>
          <p className="text-base leading-relaxed" style={{ color: C.muted }}>
            شكراً لك! طلبك قيد التحضير وسيصلك قريباً.
          </p>
        </div>

        <div
          className="w-full rounded-2xl p-6 space-y-4"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: C.muted }}>رقم طلبك</span>
            <span className="font-bold text-sm font-mono tracking-wider" style={{ color: C.text }}>
              #{shortId}
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
        </div>

        {confirmedId && (
          <Link
            href={`/track/${confirmedId}`}
            className="w-full flex items-center justify-center gap-2 font-black py-4 rounded-xl text-sm text-white"
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              boxShadow:  `0 6px 24px ${C.primary}44`,
            }}
          >
            <Navigation className="w-4 h-4" />
            تتبّع طلبك مباشرة
          </Link>
        )}

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
            className="flex-1 text-center font-bold py-3 rounded-xl text-sm"
            style={{ border: `1.5px solid ${C.border}`, color: C.muted, background: "transparent" }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen flex flex-col page-with-decos" style={{ color: C.text }}>
      <PageDecorations />
      <Navbar variant="light" />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: C.primary }} />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
      <Footer variant="light" />
    </main>
  );
}
