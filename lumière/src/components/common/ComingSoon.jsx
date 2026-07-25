import { Link, useLocation } from "react-router-dom";

export default function ComingSoon() {
  const { pathname } = useLocation();
  const name = pathname.replace("/", "").replace(/-/g, " ");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-[10px] tracking-[0.16em] uppercase text-(--color-faint) mb-4">De Lady's Beauty World</p>
      <h1 className="font-display text-[40px] font-light text-(--color-ink) capitalize mb-3">{name}</h1>
      <p className="text-[13px] text-(--color-muted) mb-8">This page is coming soon.</p>
      <Link
        to="/"
        className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors border-b border-(--color-border) pb-0.5"
      >
        Back to home
      </Link>
    </div>
  );
}
