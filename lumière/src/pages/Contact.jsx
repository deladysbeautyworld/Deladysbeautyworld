import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEOMeta from "../utils/seo";

export default function Contact() {
  const [searchParams] = useSearchParams();
  const returnOrderId = searchParams.get("topic") === "return" ? searchParams.get("order") : "";
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: returnOrderId ? `I would like help with a return for order ${returnOrderId}. Product(s): \nReason: ` : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your message.");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-3">Thanks — we received your message</h1>
          <p className="text-[13px] text-(--color-muted) font-light mb-8">We'll get back to you at the email address you provided.</p>
          <Link to="/" className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink)">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <SEOMeta
        title="Contact De Lady's Beauty World"
        description="Contact De Lady's Beauty World in Abuja for help choosing authentic skincare, makeup, haircare, and beauty products in Nigeria."
        canonical="https://deladysbeautyworld.com/contact"
      />
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">
            {returnOrderId ? "Request return assistance" : "Contact us"}
          </h1>
          <p className="text-[13px] text-(--color-muted) font-light">Have a question or need help? Send us a message and we'll respond within 1–2 business days.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div aria-hidden="true" className="hidden">
            <label htmlFor="contact-website">Leave this field empty</label>
            <input
              id="contact-website"
              name="website"
              value={form.website ?? ""}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="contact-name" className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5">Your name</label>
            <input id="contact-name" name="name" value={form.name} onChange={handleChange} required className="w-full h-11 border border-(--color-border) rounded-sm px-4" />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="contact-email" className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5">Email</label>
            <input id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} required className="w-full h-11 border border-(--color-border) rounded-sm px-4" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="contact-message" className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5">Message</label>
            <textarea id="contact-message" name="message" value={form.message} onChange={handleChange} required maxLength={5000} rows={6} className="w-full border border-(--color-border) rounded-sm px-4 py-3" />
          </div>

          {error && <p role="alert" className="md:col-span-2 text-[12px] text-red-600">{error}</p>}
          <div className="md:col-span-2 flex items-center justify-start">
            <button type="submit" disabled={loading} className="h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase rounded-sm px-6 disabled:opacity-60">{loading ? "Sending…" : "Send message"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
