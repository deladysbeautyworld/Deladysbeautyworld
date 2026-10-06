import { create } from "zustand";
import { supabase } from "../utils/supabase";
import { useCartStore } from "./cartStore";

/**
 * Roles that are allowed to access the admin panel.
 * Centralised so NavBar, AdminRoute, and future admin-only UI agree.
 */
export const ADMIN_ROLES = ["admin", "developer", "staff"];

/** Convenience selector — true when the current user can access /admin. */
export const selectIsAdmin = (s) => ADMIN_ROLES.includes(s.role);

/**
 * Resolve the trusted role claim for a user and write it to the store.
 *
 * Roles live on auth.users.app_metadata.role (set via the Supabase dashboard
 * or admin API — never on user_metadata, which the end user can edit).
 */
function setRoleFromUser(user) {
  const role =
    typeof user.app_metadata?.role === "string" ? user.app_metadata.role : "";
  useAuthStore.setState({ role });
}

export const useAuthStore = create(
  (set) => ({
    user: null,
    session: null,
    loading: true,
    role: null,

    // Call once at app root — listens for auth state changes
    init: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        set({ session, user, loading: false });

        if (user) {
          setRoleFromUser(user);
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          const newUser = session?.user ?? null;
          set({ session, user: newUser });

          if (newUser) {
            setRoleFromUser(newUser);
          } else {
            set({ role: null });
          }
        });
      } catch {
        set({
          session: null,
          user: null,
          loading: false,
          role: null,
        });
      }
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

    signInWithGoogle: async (redirectTo) => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectTo || `${window.location.origin}/`,
          },
        });
        if (error) throw error;
      },

    signOut: async () => {
        await supabase.auth.signOut();
        useCartStore.getState().clearCart();
        set({ user: null, session: null, role: null });
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
    })
);
