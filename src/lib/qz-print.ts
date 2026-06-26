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

// CP864 Arabic code page mapping (Unicode -> CP864 byte)
const CP864_MAP: Record<number, number> = {
  0x0660: 0x30, 0x0661: 0x31, 0x0662: 0x32, 0x0663: 0x33, 0x0664: 0x34,
  0x0665: 0x35, 0x0666: 0x36, 0x0667: 0x37, 0x0668: 0x38, 0x0669: 0x39,
  0x066A: 0x25,
  0x0621: 0x80, 0x0622: 0x81, 0x0623: 0x82, 0x0624: 0x83, 0x0625: 0x84,
  0x0626: 0x85, 0x0627: 0x86, 0x0628: 0x87, 0x0629: 0x88, 0x062A: 0x89,
  0x062B: 0x8A, 0x062C: 0x8B, 0x062D: 0x8C, 0x062E: 0x8D, 0x062F: 0x8E,
  0x0630: 0x8F, 0x0631: 0x90, 0x0632: 0x91, 0x0633: 0x92, 0x0634: 0x93,
  0x0635: 0x94, 0x0636: 0x95, 0x0637: 0x96, 0x0638: 0x97, 0x0639: 0x98,
  0x063A: 0x99, 0x0640: 0x9A, 0x0641: 0x9B, 0x0642: 0x9C, 0x0643: 0x9D,
  0x0644: 0x9E, 0x0645: 0x9F, 0x0646: 0xA0, 0x0647: 0xA1, 0x0648: 0xA2,
  0x0649: 0xA3, 0x064A: 0xA4,
  0x064B: 0xA5, 0x064C: 0xA6, 0x064D: 0xA7, 0x064E: 0xA8, 0x064F: 0xA9,
  0x0650: 0xAA, 0x0651: 0xAB, 0x0652: 0xAC,
};

function toCP864Bytes(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code < 0x80) {
      out.push(code);
    } else if (CP864_MAP[code] !== undefined) {
      out.push(CP864_MAP[code]);
    } else {
      out.push(0x20); // space for unmapped chars
    }
  }
  return out;
}

function line(char = "-", len = 32): string {
  return char.repeat(len) + LF;
}

function buildReceipt(order: OrderWithItems): string {
  let r = INIT;
  r += ESC + "t" + "\x25"; // Select CP864 Arabic code page (page 37)

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
  const cfg = qz.configs.create(printerName);
  const data = buildReceipt(order);

  const bytes = toCP864Bytes(data);
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");

  await qz.print(cfg, [{ type: "raw", format: "hex", data: hex }]);
}
