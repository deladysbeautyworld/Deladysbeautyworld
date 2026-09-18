import { Link } from "react-router-dom";
import SEOMeta from "../utils/seo";

export default function Returns() {
  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <SEOMeta
        title="Returns & Exchanges"
        description="Review De Lady's Beauty World's returns and exchanges policy for authentic skincare, makeup, haircare, and beauty orders."
        canonical="https://deladysbeautyworld.com/returns"
      />
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Returns & exchanges</h1>
          <p className="text-[13px] text-(--color-muted) font-light">We want you to be happy with your purchase. If you need to return an item, here's how it works.</p>
        </div>

        <div className="grid gap-6">
          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Eligibility</h2>
            <p className="text-[13px] text-(--color-muted)">Returns accepted within 14 days of delivery for unused, unopened products. Some items (e.g., hygiene-sensitive) are final sale.</p>
          </section>

          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">How to start a return</h2>
            <ol className="list-decimal pl-5 text-[13px] text-(--color-muted)">
              <li>Visit your orders page and select the order.</li>
              <li>Choose the item and reason for return.</li>
              <li>Drop the parcel at the specified courier or schedule a pickup.</li>
            </ol>
          </section>

          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Need help?</h2>
            <p className="text-[13px] text-(--color-muted)">If you have any issues, <Link to="/contact" className="text-(--color-ink) underline">contact our support team</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
