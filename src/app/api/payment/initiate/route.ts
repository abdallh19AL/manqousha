import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orderId, amount, customerName, customerPhone } = (await req.json()) as {
      orderId: string;
      amount: number;
      customerName: string;
      customerPhone: string;
    };

    const apiKey = process.env.MYFATOORAH_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "بوابة الدفع غير مهيأة" }, { status: 500 });
    }

    const mfRes = await fetch("https://api.myfatoorah.com/v2/SendPayment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        NotificationOption:  "LNK",
        InvoiceValue:        amount,
        CallBackUrl:         `https://manqoushanar.com/payment/success?orderId=${orderId}`,
        ErrorUrl:            `https://manqoushanar.com/payment/error?orderId=${orderId}`,
        Language:            "AR",
        CustomerName:        customerName,
        CustomerMobile:      customerPhone,
        DisplayCurrencyIso:  "JOD",
        MobileCountryCode:   "+962",
        CustomerEmail:       "customer@manqoushanar.com",
        CustomerReference:   orderId,
      }),
    });

    const mfData = (await mfRes.json()) as {
      IsSuccess: boolean;
      Message?: string;
      Data?: { PaymentURL?: string };
    };

    if (!mfRes.ok || !mfData.IsSuccess) {
      console.error("[MyFatoorah] SendPayment failed:", mfData);
      return NextResponse.json(
        { error: mfData.Message ?? "فشل تهيئة الدفع" },
        { status: 502 }
      );
    }

    const paymentUrl = mfData.Data?.PaymentURL;
    if (!paymentUrl) {
      return NextResponse.json({ error: "لم يتم استلام رابط الدفع" }, { status: 502 });
    }

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[payment/initiate] error:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
