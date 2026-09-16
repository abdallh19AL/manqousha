import type { ProductOffer } from "@/types";

/** Ratio to multiply a price by for a given offer (1 = no discount). */
export function getDiscountRatio(offer?: ProductOffer): number {
  return offer?.offer_type === "price_discount" && offer.discount_percent !== null
    ? (100 - offer.discount_percent) / 100
    : 1;
}

export function applyDiscount(price: number, ratio: number): number {
  return Math.round(price * ratio * 100) / 100;
}
