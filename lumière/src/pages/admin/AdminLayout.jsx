import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { pingSupabase } from "../../lib/admin.js";
import { pingPosApi } from "../../lib/products.js";
import logo from "../../assets/logo_1.png";
import "./admin.css";
import {
  IconBox, IconChevronLeft, IconChevronRight, IconClose, IconExternal, IconGrid,
  IconHome, IconLogout, IconMegaphone, IconMenu, IconOrders, IconPen, IconSearch,
  IconTicket, IconTruck, IconUser, IconUsers,
} from "./components/icons.jsx";

/**
 * Shell for all /admin/* pages: navy sidebar grouped by job-to-be-done,
 * a sticky top bar with breadcrumb, quick-jump search (⌘K / Ctrl+K) and
 * live status for the two data sources (Supabase store DB + POS API).
 *
 * Desktop sidebar can be collapsed to an icon rail (remembered per browser).
 * Mobile gets a slide-in drawer.
 */
const NAV_GROUPS = [
  {
    label: "Sell",
    items: [
      { to: "/admin", label: "Overview", icon: IconHome, end: true, hint: "Store snapshot" },
      { to: "/admin/orders", label: "Orders", icon: IconOrders, hint: "Fulfil and track orders" },
      { to: "/admin/customers", label: "Customers", icon: IconUsers, hint: "Accounts and order history" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: IconBox, hint: "Inventory from the POS" },
      { to: "/admin/categories", label: "Categories", icon: IconGrid, hint: "Storefront groupings" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/promo-codes", label: "Promo codes", icon: IconTicket, hint: "Discounts at checkout" },
      { to: "/admin/announcements", label: "Announcements", icon: IconMegaphone, hint: "Site-wide banner" },
      { to: "/admin/journal", label: "Journal", icon: IconPen, hint: "Blog posts" },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/admin/delivery-zones", label: "Delivery zones", icon: IconTruck, hint: "Shipping fees by state" },
      { to: "/admin/profile", label: "Profile", icon: IconUser, hint: "Your admin account" },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
const COLLAPSE_KEY = "admin.sidebar.collapsed";

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function useDataSourceHealth() {
  const [health, setHealth] = useState({
    db: { state: "checking" },
    pos: { state: "checking" },
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = (key, fn) =>
      fn()
        .then((ms) => !cancelled && setHealth((h) => ({ ...h, [key]: { state: "ok", ms } })))
        .catch((error) =>
          !cancelled && setHealth((h) => ({ ...h, [key]: { state: "down", error: error?.message } }))
        );
    run("db", pingSupabase);
    run("pos", pingPosApi);
    // Re-check every 5 minutes while the console is open.
    const timer = setTimeout(() => setNonce((n) => n + 1), 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nonce]);

  const recheck = useCallback(() => {
    setHealth({ db: { state: "checking" }, pos: { state: "checking" } });
    setNonce((n) => n + 1);
  }, []);

  return [health, recheck];
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [health, recheck] = useDataSourceHealth();

  const name = user?.user_metadata?.full_name || "Admin";
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const current = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/admin";
    return (
      ALL_ITEMS.find((i) => (i.end ? path === i.to : path === i.to || path.startsWith(`${i.to}/`))) ??
      null
    );
  }, [location.pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* storage unavailable — preference just won't persist */
    }
  }, [collapsed]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="admin-shell flex">
      {/* ---------- Sidebar ---------- */}
      <aside
        className={[
          "admin-sidebar fixed lg:sticky top-0 inset-y-0 left-0 z-50 h-screen shrink-0",
          "flex flex-col transition-[width,transform] duration-200 ease-out",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 h-16 px-4 shrink-0">
          <img
            src={logo}
            alt=""
            className="w-10 h-10 rounded-full object-cover bg-white p-0.5 ring-2 ring-white/10 shrink-0"
          />
          <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="font-display text-[17px] text-white leading-tight truncate">De Lady's</p>
            <p className="text-[10.5px] tracking-[0.16em] uppercase text-(--color-pink-light)">
              Admin console
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <IconClose />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className={`admin-nav-group ${collapsed ? "lg:invisible lg:h-px lg:my-3" : ""}`}>
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      title={collapsed ? label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={`admin-nav-link ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                    >
                      <Icon size={19} />
                      <span className={collapsed ? "lg:sr-only" : ""}>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Data sources */}
        <div className={`px-4 py-3 border-t border-white/10 ${collapsed ? "lg:px-0 lg:flex lg:flex-col lg:items-center" : ""}`}>
          <p className={`text-[10.5px] tracking-[0.14em] uppercase text-white/40 mb-2 ${collapsed ? "lg:hidden" : ""}`}>
            Data sources
          </p>
          <DataSourceRow label="Store database" sub="Supabase" status={health.db} collapsed={collapsed} />
          <DataSourceRow label="POS inventory" sub="Railway API" status={health.pos} collapsed={collapsed} />
          <button
            type="button"
            onClick={recheck}
            className={`mt-1 text-[11px] text-white/50 hover:text-white ${collapsed ? "lg:hidden" : ""}`}
          >
            Re-check
          </button>
        </div>

        {/* Account */}
        <div className="p-3 border-t border-white/10">
          <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? "lg:justify-center lg:p-1" : ""}`}>
            <span className="w-9 h-9 rounded-full bg-(--color-pink) text-white text-[13px] font-medium flex items-center justify-center shrink-0">
              {initials || "A"}
            </span>
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="text-[13px] text-white truncate">{name}</p>
              <p className="text-[11.5px] text-white/50 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className={`p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 ${collapsed ? "lg:hidden" : ""}`}
            >
              <IconLogout size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-(--color-navy)/40 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ---------- Main column ---------- */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="admin-topbar sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-(--color-ink) hover:bg-white"
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:inline-flex p-2 -ml-2 rounded-lg text-(--color-muted) hover:text-(--color-ink) hover:bg-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>

          <nav aria-label="Breadcrumb" className="min-w-0 flex items-center gap-2 text-[13px]">
            <Link to="/admin" className="text-(--color-faint) hover:text-(--color-ink) hidden sm:inline">
              Admin
            </Link>
            {current && (
              <>
                <span className="text-(--color-border) hidden sm:inline">/</span>
                <span className="text-(--color-faint) hidden md:inline">{current.group}</span>
                <span className="text-(--color-border) hidden md:inline">/</span>
                <span className="text-(--color-ink) font-medium truncate">{current.label}</span>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="admin-search-trigger sm:w-64"
              aria-label="Search pages"
            >
              <IconSearch size={16} />
              <span className="hidden sm:inline flex-1 text-left">Jump to…</span>
              <kbd className="admin-kbd hidden sm:inline">{isMac ? "⌘" : "Ctrl"} K</kbd>
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn--ghost hidden md:inline-flex"
            >
              View store <IconExternal size={15} />
            </a>
          </div>
        </header>

        <main className="flex-1 min-w-0" key={location.pathname}>
          <div className="admin-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}

function DataSourceRow({ label, sub, status, collapsed }) {
  const text =
    status.state === "ok"
      ? `Connected · ${status.ms}ms`
      : status.state === "down"
        ? "Unreachable"
        : "Checking…";
  return (
    <div
      className={`flex items-center gap-2.5 py-1 ${collapsed ? "lg:justify-center" : ""}`}
      title={`${label} (${sub}): ${status.state === "down" ? status.error || "Unreachable" : text}`}
    >
      <span className={`admin-status-dot admin-status-dot--${status.state}`} />
      <div className={`min-w-0 flex-1 leading-tight ${collapsed ? "lg:hidden" : ""}`}>
        <p className="text-[12px] text-white/85 truncate">{label}</p>
        <p className={`text-[10.5px] truncate ${status.state === "down" ? "text-(--color-pink-light)" : "text-white/40"}`}>
          {sub} · {text}
        </p>
      </div>
    </div>
  );
}

function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ITEMS;
    return ALL_ITEMS.filter((i) =>
      [i.label, i.hint, i.group].some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  useEffect(() => inputRef.current?.focus(), []);

  const go = (item) => {
    if (!item) return;
    navigate(item.to);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") onClose();
    else if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") go(results[index]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Jump to page">
      <div className="absolute inset-0 bg-(--color-navy)/40 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative w-full max-w-lg admin-card overflow-hidden admin-fade-in" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-(--color-border)">
          <IconSearch size={18} className="text-(--color-faint)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Search pages…"
            className="flex-1 h-full bg-transparent text-[15px] text-(--color-ink) placeholder-(--color-faint) border-0 focus:shadow-none"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <kbd className="admin-kbd">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-(--color-muted)">No pages match “{query}”.</li>
          )}
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.to} role="option" aria-selected={i === index}>
                <button
                  type="button"
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${i === index ? "bg-(--color-pink-pale)" : ""}`}
                >
                  <span className={`admin-icon-chip ${i === index ? "" : "admin-icon-chip--navy"}`}>
                    <Icon size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] text-(--color-ink)">{item.label}</span>
                    <span className="block text-[12px] text-(--color-faint) truncate">{item.hint}</span>
                  </span>
                  <span className="text-[11px] text-(--color-faint)">{item.group}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
