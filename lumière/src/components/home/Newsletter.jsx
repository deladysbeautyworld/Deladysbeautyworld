import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <div className="mx-4 sm:mx-6 md:mx-10 mb-12 sm:mb-16 bg-(--color-cream-dark) rounded-sm py-10 sm:py-14 px-4 sm:px-6 flex flex-col items-center text-center">
      <h2 className="font-display text-[28px] sm:text-[34px] font-light text-(--color-ink) mb-3">
        Join the glow list
      </h2>
      <p className="text-[13px] text-(--color-muted) leading-[1.7] font-light max-w-sm mb-8">
        Get early access to new launches, skincare tips, and 10% off your first order.
      </p>

      {submitted ? (
        <div className="text-[13px] text-(--color-ink) font-normal tracking-wide">
          You're on the list. Welcome to De Lady's Beauty World.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 h-11 border border-(--color-border) sm:border-r-0 bg-(--color-cream) px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) outline-none rounded-t-sm sm:rounded-l-sm sm:rounded-tr-none focus:border-(--color-ink) transition-colors font-light"
          />
          <button
            type="submit"
            className="h-11 bg-(--color-ink) text-(--color-cream) px-6 text-[11px] tracking-widest uppercase font-normal rounded-b-sm sm:rounded-r-sm sm:rounded-bl-none hover:bg-(--color-ink-soft) transition-colors duration-200 shrink-0"
          >
            Subscribe
          </button>
        </form>
      )}

      <p className="text-[11px] text-(--color-faint) mt-4 font-light">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
