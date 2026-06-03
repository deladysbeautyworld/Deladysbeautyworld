import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, name, price, image_url, category, quantity }]

      // Add product — increments qty if already in cart
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.id === product.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                category: product.categories?.name ?? null,
                quantity,
              },
            ],
          });
        }
      },

      // Remove a product entirely
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      // Set exact quantity — removes if 0
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
        } else {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
          });
        }
      },

      // Wipe the cart (after successful checkout)
      clearCart: () => set({ items: [] }),

      // Derived values
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: "lumiere-cart", // localStorage key
    }
  )
);