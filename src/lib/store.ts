"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, selectedSize?: { label: string; price: number }, doughType?: { label: string; extra: number }) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, selectedSize, doughType) => {
        const cartKey = `${product.id}:${selectedSize?.label ?? ""}:${doughType?.label ?? ""}`;
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
              { product, quantity: 1, selectedSize, doughType, cartKey },
            ],
          });
        }
      },

      removeItem: (cartKey) => {
        set({ items: get().items.filter((i) => i.cartKey !== cartKey) });
      },

      updateQuantity: (cartKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartKey);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce(
          (sum, i) =>
            sum + ((i.selectedSize?.price ?? i.product.price) + (i.doughType?.extra ?? 0)) * i.quantity,
          0
        ),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "manqousha-cart",
      version: 3,
      migrate: (_state, version) => {
        if (version < 2) return { items: [] };
        return _state as { items: CartItem[] };
      },
    }
  )
);
