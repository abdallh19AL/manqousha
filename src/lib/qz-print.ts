import type { OrderWithItems } from "@/types";

const STORE_NAME = "منقوشة و نار";

// ESC/POS command bytes
const ESC = "\x1B";
const GS = "\x1D";
const INIT = ESC + "@";
const ALIGN_CENTER = ESC + "a" + "\x01";
const ALIGN_RIGHT = ESC + "a" + "\x02";
const ALIGN_LEFT = ESC + "a" + "\x00";
const BOLD_ON = ESC + "E" + "\x01";
const BOLD_OFF = ESC + "E" + "\x00";
const DOUBLE_ON = GS + "!" + "\x11";
const DOUBLE_OFF = GS + "!" + "\x00";
const CUT = GS + "V" + "\x42" + "\x00";
const LF = "\x0A";

declare global {
  interface Window { qz: any; }
}

let connectPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  const qz = window.qz;
  if (!qz) throw new Error("QZ Tray غير محمّل");
  if (qz.websocket.isActive()) return;
  if (!connectPromise) {
    connectPromise = qz.websocket.connect().catch((e: unknown) => {
      connectPromise = null;
      throw e;
    });
  }
  await connectPromise;
}

function line(char = "-", len = 32): string {
  return char.repeat(len) + LF;
}

function buildReceipt(order: OrderWithItems): string {
  let r = INIT;

  // Header
  r += ALIGN_CENTER + BOLD_ON + DOUBLE_ON;
  r += STORE_NAME + LF;
  r += DOUBLE_OFF + BOLD_OFF;
  r += LF;

  // Order number + date
  r += ALIGN_CENTER;
  r += "طلب #" + order.id.slice(-6).toUpperCase() + LF;
  const d = new Date(order.created_at);
  r += d.toLocaleString("ar-JO", { dateStyle: "short", timeStyle: "short" }) + LF;
  r += line("=");

  // Customer info
  r += ALIGN_RIGHT;
  r += BOLD_ON + "الزبون: " + BOLD_OFF + order.customer_name + LF;
  r += BOLD_ON + "الهاتف: " + BOLD_OFF + order.customer_phone + LF;
  if (order.delivery_zone) {
    r += BOLD_ON + "المنطقة: " + BOLD_OFF + order.delivery_zone + LF;
  }
  if (order.customer_address) {
    r += BOLD_ON + "العنوان: " + BOLD_OFF + order.customer_address + LF;
  }
  r += line("=");

  // Items
  r += ALIGN_RIGHT + BOLD_ON + "الطلبات:" + BOLD_OFF + LF;
  for (const item of order.order_items) {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    r += item.quantity + " × " + item.product_name + LF;
    r += ALIGN_LEFT + itemTotal + " د.أ" + LF;
    r += ALIGN_RIGHT;
  }
  r += line("=");

  // Totals
  const deliveryFee = order.delivery_fee ?? 0;
  const subtotal = order.total;
  const grandTotal = subtotal + deliveryFee;
  r += ALIGN_RIGHT;
  r += "المجموع الفرعي: " + subtotal.toFixed(2) + " د.أ" + LF;
  r += "رسوم التوصيل: " + deliveryFee.toFixed(2) + " د.أ" + LF;
  r += BOLD_ON + DOUBLE_ON;
  r += "الإجمالي: " + grandTotal.toFixed(2) + " د.أ" + LF;
  r += DOUBLE_OFF + BOLD_OFF;
  r += line("=");

  // Payment method
  const payMethod = order.payment_method === "electronic" ? "دفع إلكتروني" : "نقدي عند الاستلام";
  r += ALIGN_CENTER + "طريقة الدفع: " + payMethod + LF;

  // Notes
  if (order.notes) {
    r += line("-");
    r += ALIGN_RIGHT + BOLD_ON + "ملاحظات: " + BOLD_OFF + order.notes + LF;
  }

  // Footer
  r += LF;
  r += ALIGN_CENTER + "شكراً لطلبكم" + LF;
  r += LF + LF + LF;
  r += CUT;

  return r;
}

export async function printReceipt(order: OrderWithItems): Promise<void> {
  await ensureConnected();
  const qz = window.qz;
  const printerName = await qz.printers.getDefault();
  const cfg = qz.configs.create(printerName, { encoding: "CP864" });
  const data = buildReceipt(order);
  await qz.print(cfg, [{ type: "raw", format: "plain", data }]);
}
