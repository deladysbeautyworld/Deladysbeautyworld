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
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="h-11 flex-1 rounded-t-sm border border-white bg-white px-4 p-3 text-[13px] font-light text-(--color-ink) outline-none placeholder:text-(--color-muted) transition-colors focus:border-(--color-navy) sm:rounded-l-sm sm:rounded-tr-none sm:border-r-0"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-b-sm bg-(--color-navy) px-6 text-[11px] font-normal uppercase tracking-widest text-white transition-colors duration-200 hover:bg-(--color-ink-soft) sm:rounded-bl-none sm:rounded-r-sm"
          >
            Subscribe
          </button>
        </form>
      )}

      <p className="mt-4 text-[11px] font-light text-white/75">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
