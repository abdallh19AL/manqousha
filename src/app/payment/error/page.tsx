"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageDecorations from "@/components/PageDecorations";

const C = {
  primary: "#E8622A",
  gold:    "#C8922A",
  text:    "#1A1208",
  muted:   "#6B5B47",
  surface: "#F7F5F2",
  border:  "#E5E0D8",
} as const;

export default function PaymentErrorPage() {
  return (
    <main className="min-h-screen flex flex-col page-with-decos" style={{ color: C.text }}>
      <PageDecorations />
      <Navbar variant="light" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "#FEE2E2" }}
        >
          <span style={{ fontSize: "2.5rem", color: "#DC2626" }}>✕</span>
        </div>

        <div>
          <h1 className="text-2xl font-black mb-2" style={{ color: "#DC2626" }}>
            فشلت عملية الدفع
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            حدث خطأ في عملية الدفع، يرجى المحاولة مرة أخرى
          </p>
        </div>

        <div
          className="w-full max-w-sm rounded-2xl p-4 text-sm text-right"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
        >
          <p className="font-bold mb-2" style={{ color: C.text }}>ماذا يمكنني أن أفعل؟</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>تحقق من معلومات بطاقتك وحاول مرة أخرى</li>
            <li>جرب طريقة دفع مختلفة</li>
            <li>تواصل مع البنك إذا استمرت المشكلة</li>
          </ul>
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <Link
            href="/cart"
            className="flex-1 text-center font-black py-3 rounded-xl text-sm"
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              color:      "#fff",
              boxShadow:  `0 4px 14px ${C.primary}44`,
            }}
          >
            حاول مرة أخرى
          </Link>
          <Link
            href="/"
            className="flex-1 text-center font-bold py-3 rounded-xl text-sm"
            style={{ border: `1.5px solid ${C.border}`, color: C.muted, background: "transparent" }}
          >
            الرئيسية
          </Link>
        </div>
      </div>

      <Footer variant="light" />
    </main>
  );
}
