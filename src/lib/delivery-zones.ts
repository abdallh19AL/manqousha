/**
 * Delivery zone table and reverse-geocode matching.
 *
 * Zone system: K1–K9 are fixed-fee zones (matching by Arabic neighbourhood name).
 * K10 is the fallback: 0.40 JD × distance_km, used when no zone matches.
 *
 * Live fees are stored in the `delivery_zones` DB table and fetched via
 * fetchZoneFees(). The constants below are used as fallbacks when the DB
 * is unavailable.
 */

import { supabase } from "@/lib/supabase";

export const K10_RATE_PER_KM = 0.40; // JD per km — hardcoded fallback

// Fallback fees mirror the DB seed values so the app works without a DB round-trip.
const FALLBACK_FEES: Readonly<Record<string, number>> = {
  K1: 2.00, K2: 2.50, K3: 3.00, K4: 3.50, K5: 4.00,
  K6: 5.00, K7: 6.00, K8: 7.00, K9: 9.00, K10: 0.40,
};

/**
 * Fetches the current delivery fees from the database.
 * Returns a map of { zoneCode → fee } where K10's fee is the per-km rate.
 * Falls back to FALLBACK_FEES on any error.
 */
export async function fetchZoneFees(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("zone_code, fee");
    if (error || !data) return { ...FALLBACK_FEES };
    const result: Record<string, number> = { ...FALLBACK_FEES };
    for (const row of data as { zone_code: string; fee: number }[]) {
      result[row.zone_code] = Number(row.fee);
    }
    return result;
  } catch {
    return { ...FALLBACK_FEES };
  }
}

export interface DeliveryZone {
  code:  string;
  fee:   number;
  areas: string[];
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    code: "K1", fee: 2.00,
    areas: ["البركة", "أم السماق", "تلاع العلي", "شارع الجاردنز", "شارع المدينة"],
  },
  {
    code: "K2", fee: 2.50,
    areas: [
      "الجندويل", "المدينة الطبية", "ضاحية الأمير راشد", "الرابية",
      "ضاحية الروضة", "ضاحية الرشيد", "الروابي", "خلدا",
      "مجمع الأعمال", "مكة مول", "سيتي مول", "أم أذينة", "طلوع نيفين",
    ],
  },
  {
    code: "K3", fee: 3.00,
    areas: [
      "السادس", "الرابع", "الشميساني", "صويلح", "دابوق",
      "الجبيهة", "الكرسي", "عرجان", "المدينة الرياضية",
      "السهل", "السابع", "الصويفية",
    ],
  },
  {
    code: "K4", fee: 3.50,
    areas: [
      "الرونق", "البيادر", "دوار الداخلية", "العبدلي", "وادي صقرة",
      "مستشفى الإسلامي", "دير غبار", "عبدون", "الحسين",
      "جبل عمان", "أم الأسود", "زويتنة", "الكمالية",
    ],
  },
  {
    code: "K5", fee: 4.00,
    areas: [
      "حي المنصور", "ضاحية الأقصى", "ضاحية الاستقلال", "النزهة",
      "عين الباشا", "ضاحية الأمير حسن", "مستشفى الاستقلال", "اللويبدة",
      "طبربور", "راس العين", "شارع الرينبو", "أبو السوس",
      "أم السوس", "محاص", "فحيص", "وادي السير", "صافوط",
    ],
  },
  {
    code: "K6", fee: 5.00,
    areas: [
      "الياسمين", "أبو نصير", "شفا بدران", "مرج الحمام",
      "إسكان التلفزيون", "أبو علياء", "البقعة", "الهاشمي",
      "وسط البلد", "بدر الجديدة", "الربحية الشمالية", "الربحية الجنوبية",
      "الأشرفية", "حي الصحابة", "رغدان",
    ],
  },
  {
    code: "K7", fee: 6.00,
    areas: [
      "جبل النصر", "عدن", "حي نزال", "جبل الأخضر", "المقابلين",
      "جبل الزهور", "البنيات", "عراق الأمير", "ضاحية الحاج حسن",
      "شارع الحرية", "المنارة", "أم النواره", "الوحدات", "ناعور",
    ],
  },
  {
    code: "K8", fee: 7.00,
    areas: [
      "أبو علندا", "جاوا", "الجويدة", "خربية السوق",
      "ماركا الشمالية", "ماركا الجنوبية", "القويسمة", "اليادودة", "صالحية العابد",
    ],
  },
  {
    code: "K9", fee: 9.00,
    areas: ["الجبل الشمالي", "الرصيفة", "سحاب", "المشيرفة"],
  },
];

// ── Arabic normalisation (mirrors menu-search logic) ─────────────
function normalizeAr(text: string): string {
  return text
    .replace(/[ً-ٰٟ]/g, "") // strip tashkeel / diacritics
    .replace(/[أإآ]/g, "ا")                // alef variants → bare alef
    .replace(/ة/g, "ه")                    // taa marbuta → haa
    .replace(/ى/g, "ي")                    // alef maqsura → yaa
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Returns a score in [0,1]: 1 = exact, 0 = no match.
// Uses containment with a minimum-length guard to avoid false positives
// from short common words.
function matchScore(candidate: string, areaName: string): number {
  const c = normalizeAr(candidate);
  const a = normalizeAr(areaName);
  if (!c || !a) return 0;
  if (c === a) return 1;
  // candidate fully contains the area name (e.g. "شارع الجاردنز" contains "الجاردنز")
  if (c.includes(a) && a.length >= 3)
    return a.length / Math.max(c.length, a.length);
  // area name fully contains the candidate (e.g. "ضاحية الأمير راشد" contains "الأمير راشد")
  // require candidate ≥ 5 chars to avoid matching common short words
  if (a.includes(c) && c.length >= 5)
    return c.length / Math.max(c.length, a.length);
  return 0;
}

export interface ZoneMatch {
  zoneCode:    string;
  fee:         number;
  matchedArea: string; // the area name from our list that triggered the match
}

/**
 * Given the `address` object from a Nominatim reverse-geocode response
 * (already extracted from `data.address`), returns the best matching delivery
 * zone, or null if no zone area matches (caller should fall back to K10).
 */
export function matchZoneFromGeocode(
  geocodeAddress: Record<string, string>
): ZoneMatch | null {
  // Fields most likely to contain the neighbourhood name in Amman
  const candidates = [
    geocodeAddress.suburb,
    geocodeAddress.neighbourhood,
    geocodeAddress.quarter,
    geocodeAddress.city_district,
    geocodeAddress.town,
    geocodeAddress.village,
    geocodeAddress.road,
  ].filter(Boolean) as string[];

  let best: ZoneMatch | null = null;
  let bestScore = 0;

  for (const zone of DELIVERY_ZONES) {
    for (const candidate of candidates) {
      for (const area of zone.areas) {
        const score = matchScore(candidate, area);
        if (score > bestScore) {
          bestScore = score;
          best = { zoneCode: zone.code, fee: zone.fee, matchedArea: area };
        }
      }
    }
  }

  return best;
}

// ── Manual area-name → zone lookup ───────────────────────────────
const AREA_NAME_MAP: Record<string, string> = {
  // K1
  "الدوار السابع": "K1", "سابع": "K1", "المدينة الرياضية": "K1",
  "الرابية": "K1", "العبدلي": "K1", "وسط البلد": "K1",
  // K2
  "الجبيهة": "K2", "الجامعة الأردنية": "K2", "تلاع العلي": "K2",
  "المنصور": "K2", "الشميساني": "K2",
  // K3
  "الصويفية": "K3", "دابوق": "K3", "الرونق": "K3",
  "عبدون": "K3", "بيادر وادي السير": "K3",
  // K4
  "وادي السير": "K4", "أم السماق": "K4", "الكمالية": "K4",
  // K5
  "الزرقاء": "K5",
  // K6
  "الرصيفة": "K6",
  // K7
  "ناعور": "K7", "ماركا": "K7", "الجويدة": "K7",
  // K8
  "السلط": "K8",
  // K9
  "الفحيص": "K9", "بدر الجديدة": "K9", "خريبة السوق": "K9",
};

export function getZoneByAreaName(input: string): string | null {
  const normalized = input.trim().replace(/\s+/g, " ");
  if (AREA_NAME_MAP[normalized]) return AREA_NAME_MAP[normalized];
  const key = Object.keys(AREA_NAME_MAP).find((k) =>
    normalized.includes(k) || k.includes(normalized)
  );
  return key ? AREA_NAME_MAP[key] : null;
}

/**
 * Calls the Nominatim reverse-geocoding API and returns the `address` object,
 * or null on network/timeout failure.
 *
 * Nominatim usage policy: max 1 req/s, must include User-Agent.
 * This is called at most once per customer GPS share, so rate limits are fine.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<Record<string, string> | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lng}&format=json&accept-language=ar&zoom=16`;

    const res = await fetch(url, {
      headers: { "User-Agent": "ManqoushaWNar/1.0" },
      signal:  AbortSignal.timeout(8_000),
    });

    if (!res.ok) return null;
    const data = await res.json() as { address?: Record<string, string> };
    return data?.address ?? null;
  } catch {
    return null;
  }
}
