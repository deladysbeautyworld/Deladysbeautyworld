import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * /forgot-password — collects the user's email and fires a Supabase
 * password-reset email. Always shows the same neutral "check your inbox"
 * state regardless of whether the email exists (prevents account probing).
 */
export default function ForgotPassword() {
  const resetPasswordForEmail = useAuthStore((s) => s.resetPasswordForEmail);

  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      await resetPasswordForEmail({ email });
      setSubmitted(true);
    } catch (err) {
      // Generic message — we don't want to leak which emails are registered.
      setSubmitted(true);
      console.error("resetPasswordForEmail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-(--color-success-soft) rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-3">
            Check your inbox
          </h1>
          <p className="text-[13px] text-(--color-muted) font-light leading-[1.7] mb-8">
            If an account exists for <strong className="font-normal text-(--color-ink)">{email}</strong>, we've sent a password-reset link. It expires in 1 hour.
          </p>
          <p className="text-[12px] text-(--color-faint) font-light mb-10">
            Didn't get it? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-(--color-ink) underline underline-offset-2"
            >
              try again
            </button>
            .
          </p>
          <Link
            to="/login"
            className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors border-b border-(--color-border) pb-0.5"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-6">
            De Lady's Beauty World
          </Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">
            Forgot your password?
          </h1>
          <p className="text-[13px] text-(--color-muted) font-light">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-(--color-cream) outline-none focus:border-(--color-ink) transition-colors font-light"
            />
          </div>

          {error && (
            <p className="text-[12px] text-(--color-error) font-light">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Send reset link
          </button>
        </form>

        {/* Back to login */}
        <p className="text-center text-[13px] text-(--color-muted) font-light mt-8">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="text-(--color-ink) font-normal hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
