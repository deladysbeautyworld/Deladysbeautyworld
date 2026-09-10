import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const { signIn, signInWithGoogle } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Redirect handled by Supabase OAuth callback
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center bg-(--color-surface) px-6 py-16 overflow-hidden">
      {/* Visual Interest: Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-(--color-pink-pale) rounded-full blur-3xl opacity-60 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-(--color-pink-light) rounded-full blur-3xl opacity-40 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-(--color-cream-mid) rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000" />

      <div className="relative z-10 w-full max-w-sm rounded-[1.25rem] border border-(--color-border) bg-white p-6 shadow-lg sm:p-10 animate-fadeInUp hover:scale-[1.01] transition-transform duration-300">

        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-6">
            De Lady's Beauty World
          </Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">
            Welcome back
          </h1>
          <p className="text-[13px] text-(--color-muted) font-light">
            Sign in to your account
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full h-11 flex items-center justify-center gap-3 border border-(--color-border) rounded-sm text-[13px] text-(--color-ink) font-normal hover:border-(--color-ink) transition-colors duration-200 mb-6 disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-(--color-border) border-t-(--color-ink) rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-(--color-border)" />
          <span className="text-[11px] tracking-[0.08em] uppercase text-(--color-faint)">or</span>
          <div className="flex-1 h-px bg-(--color-border)" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-(--color-cream) outline-none focus:border-(--color-ink) transition-colors font-light"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] tracking-widest uppercase text-(--color-faint) font-normal">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-(--color-faint) hover:text-(--color-ink) transition-colors underline underline-offset-2"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Password"
              className="w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-(--color-cream) outline-none focus:border-(--color-ink) transition-colors font-light"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-(--color-error) font-light">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden h-11 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-medium rounded-full hover:bg-[#f20b8e] transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Sign in
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-[13px] text-(--color-muted) font-light mt-8">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-(--color-ink) font-normal hover:underline underline-offset-2"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
