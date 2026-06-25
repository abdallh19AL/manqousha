"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { OrderWithItems } from "@/types";

export default function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError(true); return; }
        setOrder(data as OrderWithItems);
      });
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    window.print();
  }, [order]);

  if (error) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial", direction: "rtl" }}>
        لم يتم العثور على الطلب
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial", direction: "rtl" }}>
        جارٍ التحميل...
      </div>
    );
  }

  const shortId      = order.id.slice(-6).toUpperCase();
  const date         = new Date(order.created_at);
  const dateStr      = date.toLocaleDateString("ar-JO", { year: "numeric", month: "long", day: "numeric" });
  const timeStr      = date.toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" });
  const subtotal     = order.total ?? 0;
  const deliveryFee  = Number(order.delivery_fee) || 0;
  const grandTotal   = subtotal + deliveryFee;
  const deliveryDisplay = deliveryFee > 0 ? `${deliveryFee.toFixed(2)} د.أ` : "مجاناً";
  const paymentLabel = (order.payment_method ?? "cash") === "electronic" ? "الدفع: إلكتروني" : "الدفع: نقداً";

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * { visibility: hidden; }
          .receipt-container, .receipt-container * { visibility: visible; }
          .receipt-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 80mm;
          }
        }
        body {
          background: #fff;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div
        className="receipt-container"
        style={{
          width: "80mm",
          padding: "3mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#000",
          background: "#fff",
          direction: "rtl",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: "18px", marginBottom: "4px" }}>
          منقوشة و نار
        </div>

        <Divider />

        <div style={{ fontSize: "12px", fontWeight: "bold" }}>رقم الطلب: #{shortId}</div>
        <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>{dateStr} — {timeStr}</div>

        <Divider />

        <Row label="الهاتف:" value={order.customer_phone} />
        {order.delivery_zone && <Row label="منطقة التوصيل:" value={order.delivery_zone} />}
        <Row label="رسوم التوصيل:" value={deliveryDisplay} />

        <Divider />

        {order.order_items.map((item) => (
          <div
            key={item.id}
            style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", width: "100%" }}
          >
            <span style={{ flex: 1, paddingLeft: "6px", wordBreak: "break-word" }}>{item.product_name}</span>
            <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              {item.quantity} × {item.price.toFixed(2)} د.أ
            </span>
          </div>
        ))}

        <Divider />

        <Row label="المجموع (دون توصيل):" value={`${subtotal.toFixed(2)} د.أ`} />
        <Row label="رسوم التوصيل:" value={deliveryDisplay} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            fontWeight: 900,
            padding: "2px 0",
          }}
        >
          <span>الإجمالي</span>
          <span>{grandTotal.toFixed(2)} د.أ</span>
        </div>

        <Divider />

        <div style={{ fontWeight: "bold", fontSize: "11px", marginTop: "1px" }}>{paymentLabel}</div>
        <div style={{ textAlign: "center", fontSize: "12px", marginTop: "4px" }}>شكراً لزيارتكم 🙏</div>
      </div>
    </>
  );
}

function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px dashed #000",
        margin: "4px 0",
        width: "100%",
      }}
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "1px 0",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <span style={{ color: "#333", whiteSpace: "nowrap" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
