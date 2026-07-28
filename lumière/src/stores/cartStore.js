import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add product to cart — respects stock limit
      addItem: (product, quantity = 1, variant = null) => {
        const effectiveStock = variant ? variant.stock : product.stock;
        if (effectiveStock <= 0) return;

        const items = get().items;
        const variantId = variant?.id ?? null;
        const existing = items.find(
          (i) => i.id === product.id && i.variantId === variantId
        );

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id && i.variantId === variantId
                ? { ...i, quantity: Math.min(i.quantity + quantity, effectiveStock) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                id:          product.id,
                name:        product.name,
                price:       variant?.price ?? product.price,
                image_url:   product.image_url ?? null,
                category:    product.categories?.name ?? null,
                variantId,
                variantName: variant?.name ?? null,
                quantity:    Math.min(quantity, effectiveStock),
              },
            ],
          });
        }
      },

      // Remove item by product id + variantId
      removeItem: (id, variantId = null) => {
        set({
          items: get().items.filter(
            (i) => !(i.id === id && i.variantId === variantId)
          ),
        });
      },

      // Update quantity — signature: (id, variantId, quantity)
      // Removes item if quantity reaches 0
      updateQuantity: (id, variantId = null, quantity) => {
        if (quantity <= 0) {
          set({
            items: get().items.filter(
              (i) => !(i.id === id && i.variantId === variantId)
            ),
          });
        } else {
          set({
            items: get().items.map((i) =>
              i.id === id && i.variantId === variantId
                ? { ...i, quantity }
                : i
            ),
          });
        }
      },

      // Wipe cart after successful checkout
      clearCart: () => set({ items: [] }),

      // Total item count — call as s.totalItems()
      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      // Subtotal in NGN — call as s.subtotal()
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "deladys-cart",
    }
  )
);