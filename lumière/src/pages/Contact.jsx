import { useState } from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
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
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Contact us</h1>
          <p className="text-[13px] text-(--color-muted) font-light">Have a question or need help? Send us a message and we'll respond within 1–2 business days.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5">Your name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full h-11 border border-(--color-border) rounded-sm px-4" />
          </div>

          <div className="md:col-span-1">
            <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full h-11 border border-(--color-border) rounded-sm px-4" />
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5">Message</label>
            <textarea name="message" value={form.message} onChange={handleChange} required rows={6} className="w-full border border-(--color-border) rounded-sm px-4 py-3" />
          </div>

          <div className="md:col-span-2 flex items-center justify-start">
            <button type="submit" className="h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase rounded-sm px-6">Send message</button>
          </div>
        </form>
      </div>
    </div>
  );
}
