import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Privacy policy</h1>
          <p className="text-[13px] text-(--color-muted) font-light">This policy explains how we collect and use your personal information.</p>
        </div>

        <div className="grid gap-6">
          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Information we collect</h2>
            <p className="text-[13px] text-(--color-muted)">We collect account details, order history, and any information you provide when contacting support.</p>
          </section>

          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">How we use data</h2>
            <p className="text-[13px] text-(--color-muted)">To process orders, improve our service, and send transactional emails. We do not sell your personal data.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
