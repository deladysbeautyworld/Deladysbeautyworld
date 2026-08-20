import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../utils/supabase";
import { useCartStore } from "./cartStore";

/**
 * Roles that are allowed to access the admin panel.
 * Centralised so NavBar, AdminRoute, and future admin-only UI agree.
 */
export const ADMIN_ROLES = ["admin", "developer", "staff"];

/** Convenience selector — true when the current user can access /admin. */
export const selectIsAdmin = (s) => ADMIN_ROLES.includes(s.role);

// In-flight role fetches, keyed by user id. Prevents the duplicate
// network round-trip that happens when init() + onAuthStateChange both
// fire for the same user on a hard refresh.
const _inflight = new Map();

/**
 * Look up the role for a user id and write it to the store.
 *
 * Roles live on auth.users.app_metadata.role (set via the Supabase dashboard
 * or admin API — never on user_metadata, which the end user can edit).
 *
 * If we've already started resolving this user's role, the second caller
 * just awaits the existing promise instead of recomputing.
 */
function fetchRole(userId) {
  if (_inflight.has(userId)) return _inflight.get(userId);

  const promise = (async () => {
    // Refresh the session so we read app_metadata from a verified source
    // rather than a possibly-stale cached user object.
    const { data: { user }, error } = await supabase.auth.getUser();

    // Fail closed — unknown / unauthenticated = no admin powers.
    const role =
      error || !user || user.id !== userId
        ? null
        : (user.app_metadata?.role ?? null);

    useAuthStore.setState({ role });
    return role;
  })().finally(() => {
    _inflight.delete(userId);
  });

  _inflight.set(userId, promise);
  return promise;
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: true,
      role: null,

      // Call once at app root — listens for auth state changes
      init: async () => {
        const callbackCode = new URLSearchParams(window.location.search).get("code");
        if (callbackCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(callbackCode);
          if (error) {
            window.history.replaceState({}, document.title, window.location.pathname);
            throw error;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        const user = session?.user ?? null;
        set({ session, user, loading: false });

        if (user) {
          // If the persisted state already has the role for THIS user,
          // use it immediately and revalidate in the background.
          const cached = useAuthStore.getState().role;
          if (cached && useAuthStore.getState()._roleUserId === user.id) {
            // role already in store from a previous session for the same user
          } else {
            // No cache (or different user) — fetch now.
            fetchRole(user.id).then(() => {
              useAuthStore.setState({ _roleUserId: user.id });
            });
          }
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          const newUser = session?.user ?? null;
          set({ session, user: newUser });

          if (newUser) {
            const cached = useAuthStore.getState().role;
            if (cached && useAuthStore.getState()._roleUserId === newUser.id) {
              // Same user — cached role still valid; refresh in background.
              fetchRole(newUser.id);
            } else {
              fetchRole(newUser.id).then(() => {
                useAuthStore.setState({ _roleUserId: newUser.id });
              });
            }
          } else {
            set({ role: null, _roleUserId: null });
          }
        });
      },

      signUp: async ({ email, password, fullName }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        return data;
      },

      signIn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data;
      },

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
      },

      signOut: async () => {
        await supabase.auth.signOut();
        useCartStore.getState().clearCart();
        set({ user: null, session: null, role: null, _roleUserId: null });
      },

      // Update the current user's profile row (full_name, phone).
      // Returns the updated profile row.
      updateProfile: async ({ fullName, phone }) => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not signed in.");

        const patch = {};
        if (fullName !== undefined) patch.full_name = fullName;
        if (phone !== undefined) patch.phone = phone;

        const { data, error } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },

      // Change the auth email. Supabase sends a confirmation link to the
      // new address; the change only takes effect after the user clicks it.
      // The current password is required to prove the caller owns the account.
      updateEmail: async ({ newEmail, currentPassword }) => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not signed in.");

        // Re-authenticate first. Supabase will reject sensitive updates
        // without a fresh session.
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInErr) {
          throw new Error("Current password is incorrect.");
        }

        const { error } = await supabase.auth.updateUser(
          { email: newEmail },
          { emailRedirectTo: `${window.location.origin}/admin/profile` }
        );
        if (error) throw error;
      },

      // Change the auth password. Requires the current password.
      updatePassword: async ({ currentPassword, newPassword }) => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("Not signed in.");

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInErr) {
          throw new Error("Current password is incorrect.");
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
      },

      // Send a password-reset email. The user gets a link that redirects to
      // /reset-password, where Supabase establishes a recovery session and
      // we let them choose a new password.
      resetPasswordForEmail: async ({ email }) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      },
    }),
    {
      name: "deladys-auth",
      storage: createJSONStorage(() => localStorage),
      // Persist role + the user id it belongs to. Don't persist the full
      // session (JWT) — that needs server validation and changes every refresh.
      partialize: (state) => ({
        role: state.role,
        _roleUserId: state._roleUserId,
      }),
    }
  )
);
