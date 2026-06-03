import { Link } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";

function CartItem({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex items-start gap-5 py-6 border-b border-(--color-border)">
      {/* Image */}
      <Link to={`/product/${item.id}`} className="shrink-0">
        <div className="w-20 h-24 bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-8 h-12 bg-(--color-stone) rounded-[16px_16px_2px_2px] opacity-40" />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] tracking-widest uppercase text-(--color-faint) mb-1 font-normal">
          {item.category}
        </p>
        <Link
          to={`/product/${item.id}`}
          className="text-[15px] font-normal text-(--color-ink) hover:underline underline-offset-2 block mb-3"
        >
          {item.name}
        </Link>

        {/* Quantity */}
        <div className="flex items-center border border-(--color-border) rounded-sm h-9 w-fit">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-9 h-full flex items-center justify-center text-(--color-muted) hover:text-(--color-ink) transition-colors"
            aria-label="Decrease"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span className="w-9 text-center text-[13px] text-(--color-ink)">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-9 h-full flex items-center justify-center text-(--color-muted) hover:text-(--color-ink) transition-colors"
            aria-label="Increase"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Price + remove */}
      <div className="flex flex-col items-end gap-3 shrink-0">
        <p className="text-[15px] font-medium text-(--color-ink)">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
        <button
          onClick={() => removeItem(item.id)}
          className="text-[11px] tracking-wide text-(--color-faint) hover:text-(--color-ink) transition-colors underline underline-offset-2"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal);

  const shipping = subtotal >= 60 ? 0 : 8;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 bg-(--color-cream-mid) rounded-full flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--color-faint)">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h2 className="font-display text-[28px] font-light text-(--color-ink) mb-3">
          Your cart is empty
        </h2>
        <p className="text-[13px] text-(--color-muted) font-light mb-8">
          Add some products to get started.
        </p>
        <Link
          to="/shop"
          className="bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase px-8 h-11 flex items-center rounded-sm hover:bg-(--color-ink-soft) transition-colors"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-display text-[36px] font-light text-(--color-ink)">
          Your cart
        </h1>
        <button
          onClick={clearCart}
          className="text-[11px] text-(--color-faint) hover:text-(--color-ink) transition-colors underline underline-offset-2"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12">

        {/* Items */}
        <div>
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="border border-(--color-border) rounded-sm p-6 sticky top-24">
            <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-6">
              Order summary
            </h2>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between text-[13px] text-(--color-muted) font-light">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-(--color-muted) font-light">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-[11px] text-(--color-faint) font-light">
                  Add ${(60 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </div>

            <div className="border-t border-(--color-border) pt-4 mb-6">
              <div className="flex justify-between text-[15px] font-medium text-(--color-ink)">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors flex items-center justify-center"
            >
              Proceed to checkout
            </Link>

            <Link
              to="/shop"
              className="w-full h-11 mt-3 border border-(--color-border) text-(--color-muted) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:border-(--color-ink) hover:text-(--color-ink) transition-colors flex items-center justify-center"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}