import { Link } from "react-router-dom";
import SEOMeta from "../utils/seo";

export default function Shipping() {
  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <SEOMeta
        title="Shipping Information"
        description="Learn about De Lady's Beauty World's standard and express delivery options across Abuja and Nigeria."
        canonical="https://deladysbeautyworld.com/shipping"
      />
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Shipping information</h1>
          <p className="text-[13px] text-(--color-muted) font-light">We deliver across Nigeria. Below are our shipping options and estimated delivery windows.</p>
        </div>

        <div className="grid gap-6">
          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Standard shipping</h2>
            <p className="text-[13px] text-(--color-muted)">3–7 business days. Rates are calculated at checkout based on location and weight.</p>
          </section>

          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Express shipping</h2>
            <p className="text-[13px] text-(--color-muted)">1–2 business days for selected cities. Prices and availability shown at checkout.</p>
          </section>

          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Tracking</h2>
            <p className="text-[13px] text-(--color-muted)">Once your order ships we'll send a tracking link to your email. You can also view tracking from your order page.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
