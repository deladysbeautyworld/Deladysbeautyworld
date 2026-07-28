import { Link } from "react-router-dom";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

/**
 * Catch-all for unknown /admin routes. Keeps the admin chrome so the
 * dead sidebar links don't fall through to the public 404 / ComingSoon.
 */
export default function AdminNotFound() {
  return (
    <div className="px-6 md:px-10 py-16 max-w-2xl">
      <AdminPageHeader
        title="Page not found"
        subtitle="The admin page you're looking for doesn't exist yet."
      />
      <Link
        to="/admin"
        className="text-[11px] tracking-widest uppercase text-(--color-pink) hover:text-(--color-ink) transition-colors"
      >
        ← Back to overview
      </Link>
    </div>
  );
}
