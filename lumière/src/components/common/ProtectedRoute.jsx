import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const location = useLocation();

  // Still resolving session — show nothing to avoid flash
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-ink) rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Preserve the page they were trying to reach
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
