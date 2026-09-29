import { Link } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

function CartItem({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex items-start gap-3 sm:gap-5 py-6 border-b border-(--color-border)">

      {/* Image */}
      <Link to={`/product/${item.id}`} className="shrink-0">
        <div className="w-16 h-20 sm:w-20 sm:h-24 bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center">
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
          className="text-[15px] font-normal text-(--color-ink) hover:underline underline-offset-2 block mb-1"
        >
          {item.name}
        </Link>

        {item.variantName && (
          <p className="text-[11px] text-(--color-faint) font-light mb-3">{item.variantName}</p>
        )}

        {/* Quantity */}
        <div className="flex items-center border border-(--color-border) rounded-sm h-9 w-fit mt-3">
          <button
            onClick={() => updateQuantity(item.id, item.variantId ?? null, item.quantity - 1)}
            className="w-9 h-full flex items-center justify-center text-(--color-muted) hover:text-(--color-ink) transition-colors"
            aria-label="Decrease"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span className="w-9 text-center text-[13px] text-(--color-ink)">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.variantId ?? null, item.quantity + 1)}
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
        <p className="text-[13px] sm:text-[15px] font-medium text-(--color-ink)">
          {fmt(item.price * item.quantity)}
        </p>
        <button
          onClick={() => removeItem(item.id, item.variantId ?? null)}
          className="text-[11px] tracking-wide text-(--color-faint) hover:text-(--color-pink) transition-colors underline underline-offset-2"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function Cart() {
  const items     = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal  = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 bg-(--color-cream-mid) rounded-full flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--color-faint)">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
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
          className="bg-(--color-pink) text-white text-[11px] tracking-widest uppercase px-8 h-11 flex items-center rounded-sm hover:bg-(--color-navy) transition-colors"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-10 py-10 sm:py-12 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8 sm:mb-10">
        <h1 className="font-display text-[30px] sm:text-[36px] font-light text-(--color-ink)">
          Your cart
        </h1>
        <button
          onClick={clearCart}
          className="text-[11px] text-(--color-faint) hover:text-(--color-pink) transition-colors underline underline-offset-2"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12">

        {/* Items */}
        <div>
          {items.map((item) => (
            <CartItem key={`${item.id}-${item.variantId ?? "base"}`} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="border border-(--color-border) rounded-sm p-4 sm:p-6 sticky top-24">
            <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-6">
              Order summary
            </h2>

            {/* Line items */}
            <div className="flex flex-col gap-3 mb-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId ?? "base"}`} className="flex justify-between text-[12px] text-(--color-muted) font-light">
                  <span className="truncate max-w-40">
                    {item.name}{item.variantName ? ` · ${item.variantName}` : ""} × {item.quantity}
                  </span>
                  <span className="shrink-0 ml-2">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="border-t border-(--color-border) pt-4 mb-2">
              <div className="flex justify-between text-[15px] font-medium text-(--color-ink)">
                <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                <span>{fmt(subtotal)}</span>
              </div>
            </div>

            <p className="text-[11px] text-(--color-faint) font-light mb-6">
              Delivery fee and discounts are calculated at checkout.
            </p>

            {/* CTAs */}
            <Link
              to="/checkout"
              className="w-full h-11 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors flex items-center justify-center mb-3"
            >
              Proceed to checkout
            </Link>

            <Link
              to="/shop"
              className="w-full h-11 border border-(--color-border) text-(--color-muted) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors flex items-center justify-center"
            >
              Continue shopping
            </Link>

            {/* Trust signals */}
            <div className="mt-6 pt-5 border-t border-(--color-border) flex flex-col gap-2.5">
              {[
                "Secure payment via KoraPay",
                "Nationwide delivery across Nigeria",
                "WhatsApp support available",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[11px] text-(--color-muted) font-light">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}