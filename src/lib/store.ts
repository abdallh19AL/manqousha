"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ComboCartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  comboItems: ComboCartItem[];
  addItem: (product: Product, selectedSize?: { label: string; price: number }, doughType?: { label: string; extra: number }, addons?: { label: string; extra: number }[]) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  addComboItem: (item: ComboCartItem) => void;
  removeComboItem: (cartKey: string) => void;
  updateComboQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      comboItems: [],

      addItem: (product, selectedSize, doughType, addons) => {
        const addonsKey = (addons ?? []).map((a) => a.label).sort().join(",");
        const cartKey = `${product.id}:${selectedSize?.label ?? ""}:${doughType?.label ?? ""}:${addonsKey}`;
        const existing = get().items.find((i) => i.cartKey === cartKey);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { product, quantity: 1, selectedSize, doughType, addons: addons?.length ? addons : undefined, cartKey },
            ],
          });
        }
      },

      removeItem: (cartKey) => {
        set({ items: get().items.filter((i) => i.cartKey !== cartKey) });
      },

      updateQuantity: (cartKey, quantity) => {
        if (quantity <= 0) { get().removeItem(cartKey); return; }
        set({ items: get().items.map((i) => i.cartKey === cartKey ? { ...i, quantity } : i) });
      },

      addComboItem: (item) => {
        const existing = get().comboItems.find((c) => c.cartKey === item.cartKey);
        if (existing) {
          set({
            comboItems: get().comboItems.map((c) =>
              c.cartKey === item.cartKey ? { ...c, quantity: c.quantity + 1 } : c
            ),
          });
        } else {
          set({ comboItems: [...get().comboItems, item] });
        }
      },

      removeComboItem: (cartKey) => {
        set({ comboItems: get().comboItems.filter((c) => c.cartKey !== cartKey) });
      },

      updateComboQuantity: (cartKey, quantity) => {
        if (quantity <= 0) { get().removeComboItem(cartKey); return; }
        set({ comboItems: get().comboItems.map((c) => c.cartKey === cartKey ? { ...c, quantity } : c) });
      },

      clearCart: () => set({ items: [], comboItems: [] }),

      getTotal: () => {
        const itemsTotal = get().items.reduce((sum, i) => {
          const addonsExtra = (i.addons ?? []).reduce((s, a) => s + a.extra, 0);
          return sum + ((i.selectedSize?.price ?? i.product.price) + (i.doughType?.extra ?? 0) + addonsExtra) * i.quantity;
        }, 0);
        const combosTotal = get().comboItems.reduce((sum, c) => {
          const extrasTotal = c.selections.reduce((s, sel) => s + sel.extraCost, 0);
          return sum + (c.basePrice + extrasTotal) * c.quantity;
        }, 0);
        return itemsTotal + combosTotal;
      },

      getItemCount: () => {
        const itemsCount  = get().items.reduce((sum, i) => sum + i.quantity, 0);
        const combosCount = get().comboItems.reduce((sum, c) => sum + c.quantity, 0);
        return itemsCount + combosCount;
      },
    }),
    {
      name: "manqousha-cart",
      version: 4,
      migrate: (_state, version) => {
        if (version < 2) return { items: [], comboItems: [] };
        return { ...(_state as { items: CartItem[] }), comboItems: (_state as { comboItems?: ComboCartItem[] }).comboItems ?? [] };
      },
    }
  )
);
