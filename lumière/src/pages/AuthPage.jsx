import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import logo from "../assets/logo.jpg";

export default function AuthPage({ adminOnly = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuthStore();

  // Determine mode based on path: /login or /signup
  const mode = !adminOnly && location.pathname === "/signup" ? "signup" : "login";

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn({ email: form.email, password: form.password });
        const returnPath = location.state?.from?.pathname;
        const destination = adminOnly
          ? returnPath?.startsWith("/admin") ? returnPath : "/admin/orders"
          : returnPath || "/";
        navigate(destination, { replace: true });
      } else {
        await signUp({ email: form.email, password: form.password, fullName: form.fullName });
        setSuccess(true);
      }
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
      const returnPath = location.state?.from?.pathname;
      const redirectTo = adminOnly
        ? `${window.location.origin}${returnPath?.startsWith("/admin") ? returnPath : "/admin/orders"}`
        : undefined;
      await signInWithGoogle(redirectTo);
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-[80vh] items-center justify-center bg-(--color-surface) px-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-(--color-pink-pale) rounded-full blur-3xl opacity-60 animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-(--color-pink-light) rounded-full blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="relative z-10 text-center max-w-sm animate-fadeInUp">
          <div className="w-12 h-12 bg-(--color-success-soft) rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="font-display text-[28px] font-light text-(--color-ink) mb-3">Check your email</h2>
          <p className="text-[13px] text-(--color-muted) font-light leading-[1.7] mb-8">
            We sent a confirmation link to <strong className="font-normal text-(--color-ink)">{form.email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" className="text-[11px] tracking-widest uppercase text-(--color-ink) font-normal hover:underline underline-offset-2">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  const switchMode = (nextMode) => {
    navigate(nextMode === "login" ? "/login" : "/signup", { replace: false });
  };

  return (
    <div className="min-h-screen bg-[#f4f0f2]">
      <div className="grid min-h-screen lg:grid-cols-[1.12fr_0.88fr]">
        <section className="relative isolate overflow-hidden bg-[#1a1738]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,13,34,0.72)_0%,rgba(16,13,34,0.38)_38%,rgba(16,13,34,0.12)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.17),transparent_30%)]" />

          <div className="relative z-10 flex h-full items-end px-6 pb-8 pt-12 sm:px-10 sm:pb-10 lg:px-12 lg:pb-12">
            <div className="text-white">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-[0.26em] uppercase text-white/80 backdrop-blur-sm">
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/60 text-[8px]">✦</span>
                Members' Club
              </div>
              <h2 className="max-w-[14ch] font-display text-[2.2rem] leading-[0.95] text-white sm:text-[2.8rem] lg:text-[3.3rem]">
                Your signature beauty,
                <br />
                always within reach.
              </h2>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#f6f2f4] px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-[470px]">
            <div className="mb-5 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#d9bfd1] bg-[#fdf7fa] shadow-[0_8px_20px_rgba(23,19,50,0.08)]">
                <img src={logo} alt="De Lady's Beauty World logo" className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="mb-3 text-center">
              <p className="font-display text-[1.9rem] italic leading-none text-[#1b1836] sm:text-[2.3rem]">
                De Lady's Beauty World
              </p>
            </div>

            <h1 className="text-center font-display text-[2.8rem] leading-[0.95] text-[#1b1836] sm:text-[3.2rem]">
              {adminOnly ? "Admin access," : mode === "login" ? "Welcome back," : "Create an account,"}
              <span className="block">{adminOnly ? "welcome back." : "beautiful."}</span>
            </h1>

            <p className="mt-2 text-center text-[13px] text-[#71657a]">
              {adminOnly
                ? "Sign in to manage De Lady's Beauty World orders."
                : mode === "login"
                  ? "Sign in to continue your beauty ritual."
                  : "Join De Lady's Beauty World and start your skincare journey."}
            </p>

            {!adminOnly && (
              <div className="mt-6 grid grid-cols-2 rounded-[16px] border border-[#e8dfe4] bg-[#f1edf0] p-1 shadow-[0_10px_30px_rgba(39,27,55,0.04)]">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-[12px] px-3 py-2 text-[12px] font-medium tracking-[0.12em] uppercase transition-all ${
                  mode === "login"
                    ? "bg-white text-[#1b1836] shadow-[0_2px_12px_rgba(23,19,50,0.08)]"
                    : "text-[#786b7e]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-[12px] px-3 py-2 text-[12px] font-medium tracking-[0.12em] uppercase transition-all ${
                  mode === "signup"
                    ? "bg-white text-[#1b1836] shadow-[0_2px_12px_rgba(23,19,50,0.08)]"
                    : "text-[#786b7e]"
                }`}
              >
                Create account
              </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="mb-2 block text-[11px] font-medium tracking-[0.18em] uppercase text-[#7d6f7f]">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="h-12 w-full rounded-[12px] border border-[#e3d7df] bg-[#fffdfd] px-4 text-[13px] text-[#1d1a2f] placeholder:text-[#ae9ca8] outline-none transition focus:border-[#d90078]"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[11px] font-medium tracking-[0.18em] uppercase text-[#7d6f7f]">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-[12px] border border-[#e3d7df] bg-[#fffdfd] px-4 text-[13px] text-[#1d1a2f] placeholder:text-[#ae9ca8] outline-none transition focus:border-[#d90078]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#7d6f7f]">
                    Password
                  </label>
                  {mode === "login" && (
                    <Link to="/forgot-password" className="text-[11px] text-[#7d6f7f] transition hover:text-[#1b1836]">
                      Forgot password?
                    </Link>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder={mode === "signup" ? "Min. 6 characters" : "Password"}
                    className="h-12 w-full rounded-[12px] border border-[#e3d7df] bg-[#fffdfd] px-4 pr-12 text-[13px] text-[#1d1a2f] placeholder:text-[#ae9ca8] outline-none transition focus:border-[#d90078]"
                  />
                  <button
                    type="button"
                    aria-label="Show password"
                    onPointerDown={() => setShowPassword(true)}
                    onPointerUp={() => setShowPassword(false)}
                    onPointerLeave={() => setShowPassword(false)}
                    onPointerCancel={() => setShowPassword(false)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#5b4e63] transition hover:text-[#1b1836]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              {error && <p className="text-[12px] text-[#c7345a]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="relative mt-2 flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-[#d90078] text-[12px] font-medium tracking-[0.12em] uppercase text-white transition hover:bg-[#c00068] disabled:opacity-70"
              >
                {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                <span>{mode === "login" ? "Sign in" : "Create account"}</span>
              </button>
            </form>

            <div className="mt-7 flex items-center gap-4 text-[#7d6f7f]">
              <div className="h-px flex-1 bg-[#e4d9df]" />
              <span className="text-[11px] tracking-[0.22em] uppercase">or</span>
              <div className="h-px flex-1 bg-[#e4d9df]" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-[12px] border border-[#e5d9e0] bg-[#fffdfd] text-[13px] font-medium text-[#1b1836] shadow-[0_6px_18px_rgba(25,18,31,0.03)] transition hover:border-[#ceb7c7] disabled:opacity-70"
            >
              {googleLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#cab8c8] border-t-[#1b1836]" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <p className="mt-5 text-center text-[11px] text-[#7d6f7f]">
              By continuing you agree to our <Link to="/terms" className="text-[#1b1836] hover:underline">terms</Link> and <Link to="/privacy" className="text-[#1b1836] hover:underline">privacy policy</Link>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
