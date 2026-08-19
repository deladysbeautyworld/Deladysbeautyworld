import { Link } from "react-router-dom";

const FAQ_ITEMS = [
  { q: "How long does shipping take?", a: "Standard shipping within Nigeria typically takes 3–7 business days." },
  { q: "Do you ship internationally?", a: "Currently we ship within Nigeria only. Subscribe to our newsletter for updates." },
  { q: "How do I return an item?", a: "Open a returns request through your order page or contact support via the Contact page." },
  { q: "How can I track my order?", a: "After purchase you'll receive a tracking link by email once your parcel ships." },
];

export default function FAQ() {
  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Help & FAQ</h1>
          <p className="text-[13px] text-(--color-muted) font-light">Frequently asked questions about orders, shipping, returns and accounts.</p>
        </div>

        <div className="grid gap-6">
          {FAQ_ITEMS.map((it) => (
            <details key={it.q} className="p-4 border border-(--color-border) rounded-sm">
              <summary className="font-medium text-(--color-ink) cursor-pointer">{it.q}</summary>
              <p className="text-[13px] text-(--color-muted) mt-3">{it.a}</p>
            </details>
          ))}

          <div className="mt-6">
            <p className="text-[13px] text-(--color-muted)">Still need help? <Link to="/contact" className="text-(--color-ink) underline">Contact us</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
