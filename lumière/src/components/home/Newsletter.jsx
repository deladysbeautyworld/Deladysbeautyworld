import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not subscribe right now.");
      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(err.message || "Could not subscribe right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-4 mb-12 flex flex-col items-center rounded-[1.25rem] bg-(--color-pink) px-4 py-10 text-center text-white sm:mx-6 sm:mb-16 sm:px-6 sm:py-14 md:mx-10">
      <h2 className="mb-3 font-display text-[28px] font-light text-white sm:text-[34px]">
        Join the glow list
      </h2>
      <p className="mb-8 max-w-sm text-[13px] font-light leading-[1.7] text-white/85">
        Get early access to new launches, skincare tips, and 10% off your first order.
      </p>

      {submitted ? (
        <div className="text-[13px] font-normal tracking-wide text-white">
          You're on the list. Welcome to De Lady's Beauty World.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <label htmlFor="newsletter-email" className="sr-only">Your email address</label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="h-11 w-full rounded-sm border border-white bg-white px-4 p-3 text-[13px] font-light text-(--color-ink) outline-none placeholder:text-(--color-muted) transition-colors focus:border-(--color-navy)"
          />
          <label className="mt-3 flex items-start gap-2 text-left text-[11px] leading-[1.6] text-white/85">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
              className="mt-0.5 accent-(--color-navy)"
            />
            <span>I agree to receive beauty news and offers. I can unsubscribe anytime.</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 h-11 w-full rounded-sm bg-(--color-navy) px-6 text-[11px] font-normal uppercase tracking-widest text-white transition-colors duration-200 hover:bg-(--color-ink-soft) disabled:opacity-60"
          >
            {loading ? "Subscribing…" : "Subscribe"}
          </button>
          {error && <p role="alert" className="mt-3 text-left text-[12px] text-white">{error}</p>}
        </form>
      )}

      <p className="mt-4 text-[11px] font-light text-white/75">
        Your email is used only for updates. See our <a className="underline" href="/privacy">privacy notice</a>.
      </p>
    </div>
  );
}
