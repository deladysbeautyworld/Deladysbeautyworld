import { Link, useLocation, Navigate } from "react-router-dom";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

const DELIVERY_ESTIMATES = {
  "Lagos":         "1–2 business days",
  "South-West":    "2–3 business days",
  "South-South":   "1–3 business days",
  "South-East":    "2–4 business days",
  "North-Central": "3–5 business days",
  "North-West":    "4–6 business days",
  "North-East":    "4–7 business days",
};

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  // Direct access without order data — redirect to orders history
  if (!order) return <Navigate to="/profile" replace />;

  const deliveryEstimate = DELIVERY_ESTIMATES[order.zone_name] ?? "3–7 business days";
  const whatsappContact = "https://wa.me/2348000000000"; // replace with client's number

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">

        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-8">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="font-display text-[36px] font-light text-(--color-ink) mb-3">
            Order placed!
          </h1>
          <p className="text-[14px] text-(--color-muted) font-light leading-[1.8] max-w-sm mx-auto">
            Thank you, <strong className="font-normal text-(--color-ink)">{order.shipping_name}</strong>. 
            Your order has been received and is being processed.
          </p>
        </div>

        {/* Order details card */}
        <div className="bg-(--color-cream-dark) rounded-sm px-6 py-5 mb-6">

          {/* Order ID */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-(--color-border)">
            <div>
              <p className="text-[10px] tracking-[0.12em] uppercase text-(--color-faint) mb-1 font-normal">
                Order ID
              </p>
              <p className="text-[12px] font-mono text-(--color-ink) font-medium">
                {order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <span className="text-[10px] tracking-[0.08em] uppercase px-3 py-1.5 rounded-sm font-normal bg-amber-50 text-amber-700">
              {order.status}
            </span>
          </div>

          {/* Order summary */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-(--color-muted) font-light">Subtotal</span>
              <span className="text-(--color-ink)">{fmt(order.total - order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-(--color-muted) font-light">Delivery fee</span>
              <span className="text-(--color-ink)">{fmt(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-medium text-(--color-ink) pt-2 border-t border-(--color-border)">
              <span>Total</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="border border-(--color-border) rounded-sm px-6 py-5 mb-6">
          <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-4">
            Delivery details
          </h2>
          <div className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-(--color-muted) font-light">Name</span>
              <span className="text-(--color-ink)">{order.shipping_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-muted) font-light">Address</span>
              <span className="text-(--color-ink) text-right max-w-55">
                {order.shipping_address}, {order.shipping_city}, {order.shipping_state}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--color-muted) font-light">Est. delivery</span>
              <span className="text-(--color-ink)">{deliveryEstimate}</span>
            </div>
            {order.order_note && (
              <div className="flex justify-between">
                <span className="text-(--color-muted) font-light">Note</span>
                <span className="text-(--color-ink) text-right max-w-55 italic font-light">
                  {order.order_note}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={whatsappContact}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-12 bg-[#25D366] text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-[#20b858] transition-colors flex items-center justify-center gap-3 mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
          </svg>
          Chat with us on WhatsApp
        </a>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/profile"
            className="flex-1 h-11 border border-(--color-border) text-(--color-muted) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors flex items-center justify-center"
          >
            View my orders
          </Link>
          <Link
            to="/shop"
            className="flex-1 h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors flex items-center justify-center"
          >
            Continue shopping
          </Link>
        </div>

        {/* Info note */}
        <p className="text-center text-[11px] text-(--color-faint) font-light mt-6 leading-[1.7]">
          A confirmation will be sent to <strong className="font-normal">{order.shipping_email}</strong>.
          For any issues, contact us on WhatsApp.
        </p>
      </div>
    </div>
  );
}