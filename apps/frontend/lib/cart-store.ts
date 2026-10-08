import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: clampQuantity(i.quantity + quantity, i.stock) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: clampQuantity(quantity, item.stock) }],
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.variantId === variantId ? { ...i, quantity: clampQuantity(quantity, i.stock) } : i
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "logilab-cart" }
  )
);

function clampQuantity(quantity: number, stock: number) {
  const max = stock > 0 ? stock : quantity;
  return Math.max(1, Math.min(quantity, max));
}

export function selectTotalQuantity(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function selectTotalPrice(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
