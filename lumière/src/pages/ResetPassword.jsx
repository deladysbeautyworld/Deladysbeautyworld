import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

/**
 * /reset-password — the destination of the recovery email link.
 *
 * Flow:
 *  1. Supabase redirects here with `#access_token=...&type=recovery` in the URL.
 *  2. The client picks up the hash and signs the user in temporarily so we can
 *     verify the recovery session.
 *  3. The user types + confirms a new password, we call updateUser({ password }).
 *  4. Supabase signs them in for real; we redirect to /profile.
 *
 * If the link is invalid or expired, we render a "link expired" state with
 * a button back to /forgot-password.
 */
export default function ResetPassword() {
  const navigate = useNavigate();

  // 'verifying' while we figure out the auth state from the URL hash,
  // 'ready' when the user can set a new password,
  // 'invalid' when the link has expired or is missing,
  // 'success' after the password has been updated.
  const [phase, setPhase] = useState("verifying");
  const [error, setError] = useState(null);

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving]             = useState(false);

  // Watch for the recovery session coming in via the URL hash.
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // getSession() triggers Supabase to parse the hash and persist the
      // recovery session. Then we can check the result.
      const { data, error: sessionErr } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionErr) {
        setError(sessionErr.message);
        setPhase("invalid");
        return;
      }

      // Two ways to know we're in recovery mode:
      //  (a) getSession() ran while the URL hash contained type=recovery
      //  (b) onAuthStateChange fired with PASSWORD_RECOVERY
      // Either way, if we have no user the link is broken.
      if (!data.session?.user) {
        setPhase("invalid");
        return;
      }

      setPhase("ready");
    }

    resolve();

    // Also listen for the PASSWORD_RECOVERY event in case it arrives after
    // the initial getSession() call.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        setPhase("ready");
      }
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      });
      if (updateErr) throw updateErr;

      // After updateUser, the user is signed in for real. Move on.
      setPhase("success");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ----- States ----- */

  if (phase === "verifying") {
    return (
      <Center>
        <Spinner />
        <p className="text-[13px] text-(--color-muted) font-light mt-4">
          Verifying your reset link…
        </p>
      </Center>
    );
  }

  if (phase === "invalid") {
    return (
      <Center>
        <IconBadge>!</IconBadge>
        <h1 className="font-display text-[26px] font-light text-(--color-ink) mb-2">
          Link expired
        </h1>
        <p className="text-[13px] text-(--color-muted) font-light leading-[1.7] max-w-sm mb-8">
          This password-reset link is invalid or has expired. Reset links are valid for 1 hour.
        </p>
        <Link
          to="/forgot-password"
          className="h-11 px-6 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors flex items-center justify-center"
        >
          Request a new link
        </Link>
      </Center>
    );
  }

  if (phase === "success") {
    return (
      <Center>
        <SuccessBadge />
        <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">
          Password updated
        </h1>
        <p className="text-[13px] text-(--color-muted) font-light">
          Taking you to your account…
        </p>
      </Center>
    );
  }

  /* phase === 'ready' */
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-6">
            De Lady's Beauty World
          </Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">
            Choose a new password
          </h1>
          <p className="text-[13px] text-(--color-muted) font-light">
            Must be at least 6 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
              New password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 6 characters"
                className="w-full h-11 border border-(--color-border) rounded-sm px-4 pr-12 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-(--color-cream) outline-none focus:border-(--color-ink) transition-colors font-light"
              />
              <button
                type="button"
                aria-label="Hold to show password"
                onPointerDown={() => setShowPassword(true)}
                onPointerUp={() => setShowPassword(false)}
                onPointerLeave={() => setShowPassword(false)}
                onPointerCancel={() => setShowPassword(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-(--color-ink) flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
              Confirm new password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Repeat new password"
              className="w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-(--color-cream) outline-none focus:border-(--color-ink) transition-colors font-light"
            />
          </div>

          {error && (
            <p className="text-[12px] text-(--color-error) font-light">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}

/* ----- small presentational helpers ----- */

function Center({ children }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-(--color-border) border-t-(--color-ink) rounded-full animate-spin" />
  );
}

function IconBadge({ children }) {
  return (
    <div className="w-12 h-12 bg-(--color-cream-dark) rounded-full flex items-center justify-center mx-auto mb-6">
      <span className="font-display text-[22px] font-light text-(--color-muted)">{children}</span>
    </div>
  );
}

function SuccessBadge() {
  return (
    <div className="w-12 h-12 bg-(--color-success-soft) rounded-full flex items-center justify-center mx-auto mb-6">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
}
