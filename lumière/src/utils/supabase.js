import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

/* ------------------------------------------------------------------ *
 *  Password-recovery links
 *
 *  A reset email link signs the user in with a temporary "recovery"
 *  session (`#access_token=…&type=recovery` in the URL). If Supabase
 *  can't use our `redirectTo` (e.g. it isn't in the dashboard's Redirect
 *  URLs list) it falls back to the Site URL, so the user lands on the
 *  home page already signed in and never sees the reset form.
 *
 *  This runs before the client is created — i.e. before Supabase reads
 *  and strips the hash — and moves any recovery link to /reset-password,
 *  whatever page it arrived on. It also remembers (for this tab) that the
 *  session came from a recovery link, so the reset page only lets someone
 *  set a password without the old one when they really used the email.
 * ------------------------------------------------------------------ */
const RECOVERY_FLAG = "auth.passwordRecovery";
export const RESET_PASSWORD_PATH = "/reset-password";

function routeRecoveryLinks() {
  if (typeof window === "undefined") return;
  const { hash, pathname, search } = window.location;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("type") !== "recovery") return;

  markPasswordRecovery();
  if (pathname !== RESET_PASSWORD_PATH) {
    window.history.replaceState(window.history.state, "", `${RESET_PASSWORD_PATH}${search}${hash}`);
  }
}

export function markPasswordRecovery() {
  try {
    window.sessionStorage.setItem(RECOVERY_FLAG, "1");
  } catch {
    /* storage blocked — the PASSWORD_RECOVERY event still covers this tab */
  }
}

export function isPasswordRecovery() {
  try {
    return window.sessionStorage.getItem(RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

export function clearPasswordRecovery() {
  try {
    window.sessionStorage.removeItem(RECOVERY_FLAG);
  } catch {
    /* nothing to clear */
  }
}

routeRecoveryLinks();

export const supabase = createClient(supabaseUrl, supabaseKey);
