import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, ADMIN_ROLES } from "../stores/authStore";

/**
 * Role guard for /admin/* routes.
 *
 * Relies on `authStore.role`, which is populated by authStore.init() and
 * refreshed on every auth state change. The first render after login may
 * briefly show the loading spinner while the role is being fetched.
 *
 * - Not logged in → /login (preserving the intended destination).
 * - Logged in but role is not in ADMIN_ROLES → / (home).
 * - Otherwise renders the children.
 */
export default function AdminRoute({ children }) {
  const user    = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const role    = useAuthStore((s) => s.role);
  const location = useLocation();

  // 1. Session still resolving, OR user signed in but role fetch in flight.
  if (loading || (user && role === null)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-ink) rounded-full animate-spin" />
      </div>
    );
  }

  // 2. No user at all.
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 3. Signed in but not in the admin role set.
  if (!ADMIN_ROLES.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
