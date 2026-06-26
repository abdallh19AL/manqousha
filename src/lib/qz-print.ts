import type { OrderWithItems } from "@/types";

declare global {
  interface Window { qz: any; }
}

let connectPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  const qz = window.qz;
  if (!qz) throw new Error("QZ Tray غير محمّل");

  // Set up unsigned certificate (local trusted mode)
  qz.security.setCertificatePromise((resolve: (v: string) => void) => resolve(""));
  qz.security.setSignaturePromise(() => (resolve: (v: string) => void) => resolve(""));

  if (qz.websocket.isActive()) return;
  if (!connectPromise) {
    connectPromise = qz.websocket.connect().catch((e: unknown) => {
      connectPromise = null;
      throw e;
    });
  }
  await connectPromise;
}

export async function printReceipt(order: OrderWithItems): Promise<void> {
  await ensureConnected();
  const qz = window.qz;
  const printerName = await qz.printers.getDefault();

  const d = new Date(order.created_at);
  const dateStr = d.toLocaleString("ar-JO", { dateStyle: "short", timeStyle: "short" });
  const orderNum = order.id.slice(-6).toUpperCase();
  const deliveryFee = order.delivery_fee ?? 0;
  const subtotal = order.total;
  const grandTotal = subtotal + deliveryFee;
  const payMethod = order.payment_method === "electronic" ? "دفع إلكتروني" : "نقدي عند الاستلام";

  const itemsHtml = order.order_items.map((item) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    return `<tr>
      <td style="text-align:right;padding:2px 0;">${item.quantity} × ${item.product_name}</td>
      <td style="text-align:left;padding:2px 0;white-space:nowrap;">${itemTotal} د.أ</td>
    </tr>`;
  }).join("");

  const html = `
    <div style="width:280px;font-family:'Cairo','Tahoma',sans-serif;direction:rtl;color:#000;padding:8px;">
      <div style="text-align:center;font-size:22px;font-weight:bold;margin-bottom:8px;">منقوشة و نار</div>
      <div style="text-align:center;font-size:13px;">طلب #${orderNum}</div>
      <div style="text-align:center;font-size:12px;margin-bottom:6px;">${dateStr}</div>
      <div style="border-top:2px dashed #000;margin:6px 0;"></div>
      <div style="font-size:13px;line-height:1.6;">
        <div><b>الزبون:</b> ${order.customer_name}</div>
        <div><b>الهاتف:</b> ${order.customer_phone}</div>
        ${order.delivery_zone ? `<div><b>المنطقة:</b> ${order.delivery_zone}</div>` : ""}
        ${order.customer_address ? `<div><b>العنوان:</b> ${order.customer_address}</div>` : ""}
      </div>
      <div style="border-top:2px dashed #000;margin:6px 0;"></div>
      <div style="font-size:13px;font-weight:bold;margin-bottom:4px;">الطلبات:</div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">${itemsHtml}</table>
      <div style="border-top:2px dashed #000;margin:6px 0;"></div>
      <div style="font-size:13px;line-height:1.7;">
        <div style="display:flex;justify-content:space-between;"><span>المجموع الفرعي:</span><span>${subtotal.toFixed(2)} د.أ</span></div>
        <div style="display:flex;justify-content:space-between;"><span>رسوم التوصيل:</span><span>${deliveryFee.toFixed(2)} د.أ</span></div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;margin-top:4px;"><span>الإجمالي:</span><span>${grandTotal.toFixed(2)} د.أ</span></div>
      </div>
      <div style="border-top:2px dashed #000;margin:6px 0;"></div>
      <div style="text-align:center;font-size:13px;">طريقة الدفع: ${payMethod}</div>
      ${order.notes ? `<div style="font-size:13px;margin-top:4px;"><b>ملاحظات:</b> ${order.notes}</div>` : ""}
      <div style="text-align:center;font-size:14px;margin-top:10px;">شكراً لطلبكم</div>
    </div>
  `;

  const cfg = qz.configs.create(printerName, { rasterize: true, scaleContent: true });
  await qz.print(cfg, [{ type: "html", format: "plain", data: html }]);
}
