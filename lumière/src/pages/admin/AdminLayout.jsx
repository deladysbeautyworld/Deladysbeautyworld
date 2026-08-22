import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import logo from "../../assets/logo_1.png";

/**
 * Shell for all /admin/* pages. Branded sidebar + main content area.
 *
 * Mobile: sidebar collapses to a top bar with a hamburger that slides the
 * nav in from the left.
 *
 * The route wrapping this in App.jsx is already inside <AdminRoute>, so we
 * know the user is authenticated and has role in ADMIN_ROLES.
 */
const NAV = [
  { to: "/admin",               label: "Overview",       end: true  },
  { to: "/admin/orders",        label: "Orders",         end: false },
  { to: "/admin/products",      label: "Products",       end: false },
  { to: "/admin/categories",    label: "Categories",     end: false },
  { to: "/admin/promo-codes",   label: "Promo codes",    end: false },
  { to: "/admin/delivery-zones", label: "Delivery zones", end: false },
  { to: "/admin/customers",     label: "Customers",      end: false },
  { to: "/admin/journal",       label: "Journal",        end: false },
  { to: "/admin/profile",       label: "Profile",        end: false },
];

export default function AdminLayout() {
  const user    = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-(--color-cream)">

      {/* ---- Sidebar ---- */}
      <aside
        className={[
          "fixed md:sticky md:top-16 inset-y-0 left-0 z-40 w-64 shrink-0",
          "bg-(--color-cream) border-r border-(--color-border)",
          "flex flex-col transition-transform duration-200",
          // Mobile: hidden off-screen unless opened. Desktop: always visible.
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Brand block */}
        <div className="px-6 py-7 border-b border-(--color-border) flex items-center gap-3">
          <img
            src={logo}
            alt="De Lady's Beauty World"
            className="w-11 h-11 rounded-full object-cover border border-(--color-border)"
          />
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.18em] uppercase text-(--color-pink) font-medium">
              Admin
            </p>
            <p className="font-display text-[20px] font-light italic text-(--color-ink) truncate">
              Dashboard
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  "block px-6 py-3 text-[12px] tracking-[0.08em] uppercase font-normal transition-colors duration-150",
                  isActive
                    ? "text-(--color-pink) border-l-2 border-(--color-pink) bg-(--color-pink-pale)"
                    : "text-(--color-muted) border-l-2 border-transparent hover:text-(--color-ink) hover:bg-(--color-cream-dark)",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User chip */}
        <div className="px-6 py-5 border-t border-(--color-border)">
          <p className="text-[12px] text-(--color-ink) font-medium truncate">
            {user?.user_metadata?.full_name || "Admin"}
          </p>
          <p className="text-[11px] text-(--color-faint) font-light truncate mb-3">
            {user?.email}
          </p>
          <Link
            to="/admin/profile"
            className="block text-[10px] tracking-[0.14em] uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors mb-3"
          >
            Profile settings
          </Link>
          <button
            onClick={signOut}
            className="text-[10px] tracking-[0.14em] uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ---- Page content ---- */}
      <div className="flex-1 min-w-0">

        {/* Mobile top bar — only visible below md */}
        <div className="md:hidden sticky top-14 sm:top-16 z-20 bg-(--color-cream) border-b border-(--color-border) px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
            className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-(--color-muted)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            Menu
          </button>
          <p className="font-display italic text-[16px] text-(--color-ink)">Admin</p>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
