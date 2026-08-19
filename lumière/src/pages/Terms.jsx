import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Terms of service</h1>
          <p className="text-[13px] text-(--color-muted) font-light">Please read these terms carefully before using our site or placing an order.</p>
        </div>

        <div className="grid gap-6">
          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Acceptance of terms</h2>
            <p className="text-[13px] text-(--color-muted)">By using our website you agree to these Terms of Service.</p>
          </section>

          <section className="p-4 border border-(--color-border) rounded-sm">
            <h2 className="font-medium mb-2">Orders and payments</h2>
            <p className="text-[13px] text-(--color-muted)">All orders are subject to availability and confirmation of the order price.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
