import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import { useCartStore } from "../../stores/cartStore";
import { useAuthStore, ADMIN_ROLES } from "../../stores/authStore";
import { searchProducts } from "../../lib/products";
import logo from "../../assets/logo.jpg";

const NAV_LINKS = [
  { label: "Shop",        to: "/shop" },
  { label: "Routines",    to: "/routines" },
  { label: "Journal",     to: "/journal" },
  { label: "About",       to: "/about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const accountRef = useRef(null);
  const { openFavorites, count: wishlistCount } = useFavorites();
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const signOut = useAuthStore((s) => s.signOut);

  // Close the account dropdown on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    function onClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const isAdmin = ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchProducts(searchQuery.trim(), 6);
        if (!cancelled) setSearchResults(results);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchOpen, searchQuery]);

  const linkClass = ({ isActive }) =>
    `text-[11px] font-normal tracking-widest uppercase transition-colors duration-200 ${
      isActive
        ? "text-(--color-ink)"
        : "text-(--color-muted) hover:text-(--color-ink)"
    }`;

  return (
    <nav className="relative z-50 border-b border-(--color-border) bg-(--color-cream)">
      <div className="flex min-h-20 items-center justify-between gap-3 px-5 sm:h-24 sm:px-8 md:px-10 lg:px-12">

        {/* Logo */}
        <Link to="/" aria-label="De Lady's Beauty World home" className="shrink-0">
          <div className="flex items-center gap-3">
            <img src={logo} alt="De Lady's Beauty World" className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14" />
            <span className="hidden font-display text-[18px] font-medium leading-none text-(--color-ink) sm:block sm:text-[23px]">
              De Lady's <em className="font-normal text-(--color-pink)">Beauty World</em>
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-8 xl:flex">
          {NAV_LINKS.map(({ label, to }) => (
            <li key={label}>
              <NavLink to={to} className={linkClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-5 sm:gap-7">
          {/* Search */}
          <button
            aria-label="Search"
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className="flex cursor-pointer text-(--color-muted) transition-colors duration-200 hover:text-(--color-ink)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Wishlist */}
          <button
            type="button"
            onClick={openFavorites}
            aria-label="Open favourites sidebar"
            className="relative hidden cursor-pointer text-(--color-muted) transition-colors duration-200 hover:text-(--color-ink) xl:block"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-(--color-ink) text-(--color-cream) text-[9px] font-medium w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label={`Cart, ${totalItems} items`}
            className="relative text-(--color-muted) hover:text-(--color-ink) transition-colors duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>

            {/* Badge — animates in when items exist */}
            <span className={`absolute -top-2 -right-2 bg-(--color-ink) text-(--color-cream) text-[9px] font-medium min-w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none px-1 transition-all duration-200 ${
              totalItems > 0 ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"
            }`}>
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          </Link>

          {/* Account / Auth */}
          {user ? (
              <div className="relative hidden xl:block" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-label="Open account menu"
                  className={[
                    "w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-medium transition-colors",
                    accountOpen
                      ? "bg-(--color-ink) text-(--color-cream) border-(--color-ink)"
                      : "bg-(--color-cream-dark) text-(--color-ink) border-(--color-border) hover:border-(--color-ink)",
                  ].join(" ")}
                >
                  {user.user_metadata?.full_name?.[0] ?? user.email[0].toUpperCase()}
                </button>

                {/* Dropdown — always rendered, shown via opacity/pointer-events */}
                <div
                  role="menu"
                  className={[
                    "absolute right-0 top-10 w-56 bg-(--color-cream) border border-(--color-border) rounded-sm shadow-lg z-50 transition-opacity duration-150",
                    accountOpen
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none",
                  ].join(" ")}
                >
                  {/* User identity header */}
                  <div className="px-4 py-3 border-b border-(--color-border)">
                    <p className="text-[12px] text-(--color-ink) font-medium truncate">
                      {user.user_metadata?.full_name || "Account"}
                    </p>
                    <p className="text-[11px] text-(--color-faint) font-light truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-3 text-[12px] text-(--color-muted) hover:text-(--color-ink) hover:bg-(--color-cream-dark) transition-colors"
                  >
                    My account
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-3 text-[12px] text-(--color-pink) hover:text-(--color-ink) hover:bg-(--color-cream-dark) transition-colors border-t border-(--color-border)"
                    >
                      Admin dashboard
                    </Link>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setAccountOpen(false); signOut(); }}
                    className="w-full text-left px-4 py-3 text-[12px] text-(--color-muted) hover:text-(--color-ink) hover:bg-(--color-cream-dark) transition-colors border-t border-(--color-border)"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden text-[11px] uppercase tracking-[0.08em] text-(--color-muted) transition-colors hover:text-(--color-ink) xl:block">
                Sign in
              </Link>
            )}

          {/* Mobile hamburger */}
          <button
            aria-label="Toggle menu"
            className="cursor-pointer text-(--color-muted) transition-colors hover:text-(--color-ink) xl:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute right-10 top-full z-50 w-[min(28rem,calc(100vw-2rem))] border border-(--color-border) bg-white p-4 shadow-lg">
          <form onSubmit={(event) => event.preventDefault()}>
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-11 w-full border border-(--color-border) bg-(--color-cream) px-4 text-[13px] text-(--color-ink) outline-none focus:border-(--color-pink)"
            />
          </form>

          {searchQuery.trim() && (
            <div className="mt-3">
              {searchLoading ? (
                <p className="px-1 py-3 text-[12px] text-(--color-muted)">Searching...</p>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col divide-y divide-(--color-border)">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 py-3 hover:text-(--color-pink)"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-(--color-cream-mid)">
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-(--color-ink)">{product.name}</p>
                        <p className="text-[12px] text-(--color-muted)">₦{Number(product.price).toLocaleString("en-NG")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-1 py-3 text-[12px] text-(--color-muted)">No products found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-(--color-border) bg-(--color-cream) px-4 py-4 sm:px-6 xl:hidden">
          <ul className="flex flex-col gap-4">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={label}>
                <NavLink
                  to={to}
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
            {user ? (
              <>
                <li className="border-t border-(--color-border) pt-4">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block text-[11px] tracking-[0.08em] uppercase text-(--color-muted)"
                  >
                    My account
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block text-[11px] tracking-[0.08em] uppercase text-(--color-pink)"
                    >
                      Admin dashboard
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="text-left text-[11px] tracking-[0.08em] uppercase text-(--color-muted)"
                  >
                    Sign out
                  </button>
                </li>
              </>
            ) : (
              <li className="border-t border-(--color-border) pt-4">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-[11px] tracking-[0.08em] uppercase text-(--color-muted)"
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
