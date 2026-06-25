import type { OrderWithItems } from "@/types";

export function printOrderReceipt(order: OrderWithItems): void {
  const shortId = order.id.slice(-6).toUpperCase();
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("ar-JO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("ar-JO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = order.total ?? 0;
  const deliveryFee = Number(order.delivery_fee) || 0;
  const grandTotal = subtotal + deliveryFee;

  const paymentLabel =
    (order.payment_method ?? "cash") === "electronic"
      ? "الدفع: إلكتروني"
      : "الدفع: نقداً";

  const itemsHtml = order.order_items
    .map(
      (item) =>
        `<div class="item-row">` +
        `<span class="item-name">${item.product_name}</span>` +
        `<span class="item-qty">${item.quantity} × ${item.price.toFixed(2)} د.أ</span>` +
        `</div>`
    )
    .join("");

  const deliveryDisplay = deliveryFee > 0 ? `${deliveryFee.toFixed(2)} د.أ` : "مجاناً";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>فاتورة #${shortId}</title>
<style>
  @page { size: 98mm 148mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 80mm;
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #000;
    background: #fff;
    direction: rtl;
    padding: 4mm 3mm;
  }
  .restaurant-name {
    font-size: 20px;
    font-weight: 900;
    text-align: center;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
  .divider {
    border: none;
    border-top: 1px dashed #000;
    margin: 5px 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 1.5px 0;
  }
  .label { color: #333; }
  .order-id { font-size: 13px; font-weight: bold; }
  .meta { color: #444; margin-top: 2px; }
  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 2px 0;
  }
  .item-name { flex: 1; padding-left: 8px; }
  .item-qty { white-space: nowrap; }
  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    font-weight: 900;
    padding: 3px 0;
  }
  .payment { font-weight: bold; font-size: 12px; margin-top: 1px; }
  .footer { text-align: center; font-size: 13px; margin-top: 5px; }
</style>
</head>
<body>
  <div class="restaurant-name">منقوشة و نار</div>
  <hr class="divider" />
  <div class="order-id">رقم الطلب: #${shortId}</div>
  <div class="meta">${dateStr} — ${timeStr}</div>
  <hr class="divider" />
  <div class="row">
    <span class="label">الهاتف:</span>
    <span>${order.customer_phone}</span>
  </div>
  ${order.delivery_zone ? `<div class="row"><span class="label">منطقة التوصيل:</span><span>${order.delivery_zone}</span></div>` : ""}
  <div class="row">
    <span class="label">رسوم التوصيل:</span>
    <span>${deliveryDisplay}</span>
  </div>
  <hr class="divider" />
  ${itemsHtml}
  <hr class="divider" />
  <div class="row">
    <span>المجموع (دون توصيل)</span>
    <span>${subtotal.toFixed(2)} د.أ</span>
  </div>
  <div class="row">
    <span>رسوم التوصيل</span>
    <span>${deliveryDisplay}</span>
  </div>
  <div class="total-row">
    <span>الإجمالي</span>
    <span>${grandTotal.toFixed(2)} د.أ</span>
  </div>
  <hr class="divider" />
  <div class="payment">${paymentLabel}</div>
  <div class="footer">شكراً لزيارتكم 🙏</div>
  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

  const popup = window.open(
    "",
    "_blank",
    "width=98,height=148,toolbar=0,menubar=0,location=0,status=0"
  );
  if (!popup) {
    alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة");
    return;
  }
  popup.document.write(html);
  popup.document.close();
}
