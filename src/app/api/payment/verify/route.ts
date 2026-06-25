import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { paymentId } = (await req.json()) as { paymentId: string };

    const apiKey = process.env.MYFATOORAH_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "بوابة الدفع غير مهيأة" }, { status: 500 });
    }

    const mfRes = await fetch("https://api.myfatoorah.com/v2/GetPaymentStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ Key: paymentId, KeyType: "PaymentId" }),
    });

    const mfData = (await mfRes.json()) as {
      IsSuccess: boolean;
      Data?: { InvoiceStatus?: string; CustomerReference?: string };
    };

    if (!mfRes.ok || !mfData.IsSuccess) {
      return NextResponse.json({ error: "فشل التحقق من الدفع" }, { status: 502 });
    }

    const isPaid  = mfData.Data?.InvoiceStatus === "Paid";
    const orderId = mfData.Data?.CustomerReference ?? null;

    // Best-effort: store payment confirmation in order notes (requires service role key)
    if (isPaid && orderId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        await admin
          .from("orders")
          .update({ payment_method: "electronic" })
          .eq("id", orderId);
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ isPaid, orderId });
  } catch (err) {
    console.error("[payment/verify] error:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
