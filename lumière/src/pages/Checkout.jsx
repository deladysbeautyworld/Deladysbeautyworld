import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import { getDeliveryFee } from "../lib/products";
import { supabase } from "../utils/supabase";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

const PAYSTACK_SCRIPT_ID = "paystack-inline-js";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const DELIVERY_ESTIMATES = {
  "Lagos":         "1–2 business days",
  "South-West":    "2–3 business days",
  "South-South":   "1–3 business days",
  "South-East":    "2–4 business days",
  "North-Central": "3–5 business days",
  "North-West":    "4–6 business days",
  "North-East":    "4–7 business days",
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
        {label} {required && <span className="text-(--color-pink)">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-[var(--color-faint)] bg-white outline-none focus:border-(--color-pink) transition-colors font-light";

export default function Checkout() {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const items     = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal  = useCartStore((s) => s.subtotal());

  const [form, setForm] = useState({
    fullName: user?.user_metadata?.full_name ?? "",
    email:    user?.email ?? "",
    phone:    "",
    address:  "",
    city:     "",
    state:    "",
    note:     "",
    whatsapp: "",
  });

  const [sameWhatsApp, setSameWhatsApp]   = useState(true);
  const [deliveryFee, setDeliveryFee]     = useState(null);
  const [deliveryZone, setDeliveryZone]   = useState(null);
  const [promoCode, setPromoCode]         = useState("");
  const [promoData, setPromoData]         = useState(null);
  const [promoError, setPromoError]       = useState(null);
  const [promoLoading, setPromoLoading]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const loadPaystack = () =>
    new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve(window.PaystackPop);
        return;
      }

      const existing = document.getElementById(PAYSTACK_SCRIPT_ID);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.PaystackPop), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = PAYSTACK_SCRIPT_ID;
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve(window.PaystackPop);
      script.onerror = reject;
      document.body.appendChild(script);
    });

  const verifyPayment = async (reference) => {
    const response = await fetch("/api/verify-paystack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Payment verification failed.");
    }
    return data;
  };

  // Recalculate delivery fee when state changes
  // Setting state synchronously is necessary to preserve form state synchronization
  useEffect(() => {
    if (!form.state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeliveryFee(null);
      setDeliveryZone(null);
      return;
    }
    getDeliveryFee(form.state).then((result) => {
      if (result) {
        setDeliveryFee(Number(result.fee));
        setDeliveryZone(result.zone_name);
      } else {
        setDeliveryFee(null);
        setDeliveryZone(null);
      }
    });
  }, [form.state]);

  // Derived totals
  const discount = promoData
    ? promoData.type === "percent"
      ? Math.round(subtotal * (promoData.value / 100))
      : Math.min(Number(promoData.value), subtotal)
    : 0;

  const total = subtotal - discount + (deliveryFee ?? 0);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Validate promo code
  const handlePromoApply = async () => {
    if (!promoCode.trim()) return;
    setPromoError(null);
    setPromoLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.trim().toUpperCase())
        .eq("active", true)
        .single();

      if (error || !data) {
        setPromoError("Invalid promo code.");
        setPromoData(null);
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError("This promo code has expired.");
        setPromoData(null);
        return;
      }
      if (data.max_uses !== null && data.uses >= data.max_uses) {
        setPromoError("This promo code has reached its usage limit.");
        setPromoData(null);
        return;
      }
      if (subtotal < Number(data.min_order)) {
        setPromoError(`Minimum order of ${fmt(data.min_order)} required for this code.`);
        setPromoData(null);
        return;
      }
      setPromoData(data);
    } catch {
      setPromoError("Could not validate promo code. Try again.");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoData(null);
    setPromoCode("");
    setPromoError(null);
  };

  const isFormValid = () =>
    form.fullName && form.email && form.phone &&
    form.address && form.city && form.state &&
    (sameWhatsApp || form.whatsapp);

  // Show confirmation modal
  const handleReviewOrder = () => {
    if (!isFormValid()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (deliveryFee === null) {
      setError("Could not calculate delivery fee for your state.");
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handlePlaceOrder = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Paystack public key is not configured.");
      }

      const whatsappNumber = sameWhatsApp ? form.phone : form.whatsapp;
      const PaystackPop = await loadPaystack();
      const handler = PaystackPop.setup({
        key: publicKey,
        email: form.email,
        amount: Math.round(total * 100),
        currency: "NGN",
        ref: `DLBW-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: form.fullName },
            { display_name: "Phone", variable_name: "phone", value: form.phone },
          ],
        },
        callback: async (response) => {
          try {
            await verifyPayment(response.reference);
            const { data: order, error: finalizeError } = await supabase.rpc("finalize_order", {
              payload: {
                payment_reference: response.reference,
                promo_code_id: promoData?.id ?? null,
                shipping: {
                  name: form.fullName,
                  email: form.email,
                  phone: form.phone,
                  address: form.address,
                  city: form.city,
                  state: form.state,
                  whatsapp_number: whatsappNumber,
                  note: form.note || null,
                },
                delivery_fee: deliveryFee,
                total,
                items: items.map((item) => ({
                  product_id: item.id,
                  variant_id: item.variantId ?? null,
                  quantity: item.quantity,
                  unit_price: item.price,
                })),
              },
            });

            if (finalizeError) throw finalizeError;
            clearCart();
            navigate("/order-confirmation", { state: { order } });
          } catch (err) {
            setError(err.message || "Payment succeeded, but order finalization failed. Please contact support with your Paystack reference.");
            setShowConfirm(false);
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          setError("Payment was cancelled. Your cart is still intact.");
          setShowConfirm(false);
          setLoading(false);
        },
      });

      handler.openIframe();
    } catch (err) {
      setError(err.message);
      setShowConfirm(false);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
        <div>
          <p className="font-display text-[24px] font-light text-(--color-ink) mb-4">
            Your cart is empty
          </p>
          <Link to="/shop" className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) underline underline-offset-2 transition-colors">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-12 max-w-5xl mx-auto">

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-sm p-8 w-full max-w-md shadow-xl">
            <h3 className="font-display text-[24px] font-light text-(--color-ink) mb-1">
              Confirm your order
            </h3>
            <p className="text-[12px] text-(--color-faint) font-light mb-6">
              Please review before placing
            </p>

            <div className="flex flex-col gap-2 mb-5 text-[13px]">
              <div className="flex justify-between text-(--color-muted) font-light">
                <span>Delivering to</span>
                <span className="text-(--color-ink) font-normal text-right max-w-45">
                  {form.city}, {form.state}
                </span>
              </div>
              <div className="flex justify-between text-(--color-muted) font-light">
                <span>Subtotal</span>
                <span className="text-(--color-ink)">{fmt(subtotal)}</span>
              </div>
              {promoData && (
                <div className="flex justify-between text-green-600 font-light">
                  <span>Discount</span>
                  <span>− {fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-(--color-muted) font-light">
                <span>Delivery ({deliveryZone})</span>
                <span className="text-(--color-ink)">{fmt(deliveryFee)}</span>
              </div>
              <div className="border-t border-(--color-border) pt-2 flex justify-between font-medium text-(--color-ink) text-[15px]">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            {deliveryZone && (
              <p className="text-[11px] text-(--color-faint) font-light mb-6">
                Est. delivery: {DELIVERY_ESTIMATES[deliveryZone] ?? "3–7 business days"}
              </p>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full h-11 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "Placing order..." : "Confirm & place order"}
            </button>

            <button
              onClick={() => setShowConfirm(false)}
              className="w-full h-10 text-[11px] tracking-widest uppercase text-(--color-faint) hover:text-(--color-ink) transition-colors"
            >
              Go back and edit
            </button>
          </div>
        </div>
      )}

      <h1 className="font-display text-[36px] font-light text-(--color-ink) mb-10">
        Checkout
      </h1>

      {/* Guest prompt */}
      {!user && (
        <div className="mb-8 p-4 bg-(--color-cream-dark) border border-(--color-border) rounded-sm flex items-center justify-between gap-4">
          <p className="text-[13px] text-(--color-muted) font-light">
            Have an account? Sign in to track your orders easily.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: "/checkout" } }}
            className="text-[11px] tracking-widest uppercase text-(--color-pink) hover:text-(--color-navy) transition-colors font-normal shrink-0"
          >
            Sign in
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-12">

        {/* Left — form */}
        <div className="flex flex-col gap-10">

          {/* Shipping info */}
          <div>
            <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-5">
              Shipping information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" required>
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" className={inputClass} />
              </Field>
              <Field label="Email address" required>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
              </Field>
              <Field label="Phone number" required>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="080XXXXXXXX" className={inputClass} />
              </Field>
              <Field label="State" required>
                <select name="state" value={form.state} onChange={handleChange} className={inputClass}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="City" required>
                <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Warri" className={inputClass} />
              </Field>
              <Field label="Delivery address" required>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Street address" className={inputClass} />
              </Field>
            </div>

            {/* Delivery fee feedback */}
            {form.state && (
              <div className={`mt-4 px-4 py-3 rounded-sm text-[12px] font-light flex items-center gap-2 ${
                deliveryFee !== null
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                {deliveryFee !== null ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>
                      Delivery to <strong>{deliveryZone}</strong> — {fmt(deliveryFee)} · Est. {DELIVERY_ESTIMATES[deliveryZone] ?? "3–7 business days"}
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Delivery fee unavailable for this state. Contact us on WhatsApp.
                  </>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp number */}
          <div>
            <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-5">
              WhatsApp number
            </h2>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={sameWhatsApp}
                onChange={(e) => setSameWhatsApp(e.target.checked)}
                className="w-4 h-4 accent-(--color-pink)"
              />
              <span className="text-[13px] text-(--color-muted) font-light">
                My WhatsApp number is the same as my phone number
              </span>
            </label>

            {!sameWhatsApp && (
              <Field label="WhatsApp number" required>
                <input
                  name="whatsapp"
                  type="tel"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="080XXXXXXXX"
                  className={inputClass}
                />
              </Field>
            )}

            <p className="text-[11px] text-(--color-faint) font-light mt-2">
              We'll send your order updates and delivery info to this number.
            </p>
          </div>

          {/* Order note */}
          <div>
            <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-5">
              Delivery note <span className="text-(--color-faint) normal-case tracking-normal font-light">(optional)</span>
            </h2>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="e.g. Call me when you're close, leave at the gate, landmark near my house..."
              rows={3}
              className="w-full border border-(--color-border) rounded-sm px-4 py-3 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light resize-none"
            />
          </div>

          {/* Promo code */}
          <div>
            <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-5">
              Promo code
            </h2>

            {promoData ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-4 py-3">
                <div>
                  <p className="text-[12px] font-medium text-green-700">{promoData.code} applied</p>
                  <p className="text-[11px] text-green-600 font-light">
                    {promoData.type === "percent"
                      ? `${promoData.value}% off`
                      : `${fmt(promoData.value)} off`}
                    {" "}— you save {fmt(discount)}
                  </p>
                </div>
                <button
                  onClick={removePromo}
                  className="text-[11px] text-green-600 hover:text-red-500 transition-colors underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePromoApply()}
                  placeholder="Enter promo code"
                  className={`${inputClass} flex-1`}
                />
                <button
                  onClick={handlePromoApply}
                  disabled={promoLoading || !promoCode.trim()}
                  className="h-11 px-5 border border-(--color-border) text-(--color-ink) text-[11px] tracking-widest uppercase rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-50 shrink-0"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
            )}

            {promoError && (
              <p className="text-[12px] text-red-500 font-light mt-2">{promoError}</p>
            )}
          </div>

          {error && (
            <p className="text-[12px] text-red-500 font-light">{error}</p>
          )}
        </div>

        {/* Right — order summary */}
        <div>
          <div className="border border-(--color-border) rounded-sm p-6 sticky top-24">
            <h2 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-5">
              Order summary
            </h2>

            {/* Items */}
            <div className="flex flex-col gap-3 mb-5">
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId ?? "base"}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-4 h-7 bg-(--color-stone) rounded-[8px_8px_2px_2px] opacity-40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-normal text-(--color-ink) truncate">{item.name}</p>
                    {item.variantName && (
                      <p className="text-[10px] text-(--color-faint) font-light">{item.variantName}</p>
                    )}
                    <p className="text-[11px] text-(--color-faint) font-light">Qty {item.quantity}</p>
                  </div>
                  <p className="text-[13px] font-medium text-(--color-ink) shrink-0">
                    {fmt(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-(--color-border) pt-4 flex flex-col gap-2.5 mb-5">
              <div className="flex justify-between text-[13px] text-(--color-muted) font-light">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-(--color-muted) font-light">
                <span>Delivery fee</span>
                <span>
                  {form.state
                    ? deliveryFee !== null ? fmt(deliveryFee) : "—"
                    : "Select state"}
                </span>
              </div>
              {promoData && (
                <div className="flex justify-between text-[13px] text-green-600 font-light">
                  <span>Discount ({promoData.code})</span>
                  <span>− {fmt(discount)}</span>
                </div>
              )}
              <div className="border-t border-(--color-border) pt-3 flex justify-between text-[15px] font-medium text-(--color-ink)">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleReviewOrder}
              disabled={!isFormValid() || deliveryFee === null}
              className="w-full h-11 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Review order
            </button>

            <Link
              to="/cart"
              className="w-full h-10 mt-3 flex items-center justify-center text-[11px] tracking-widest uppercase text-(--color-faint) hover:text-(--color-pink) transition-colors"
            >
              ← Back to cart
            </Link>

            {/* Trust signals */}
            <div className="mt-5 pt-5 border-t border-(--color-border) flex flex-col gap-2">
              {[
                "Secure payments powered by Paystack",
                "Nationwide delivery across Nigeria",
                "WhatsApp order updates",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
