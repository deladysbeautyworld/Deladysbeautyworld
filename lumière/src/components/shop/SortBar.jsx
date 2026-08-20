const SORT_OPTIONS = [
  { label: "Newest",       value: "newest" },
  { label: "Best rated",   value: "rating" },
  { label: "Price: low",   value: "price_asc" },
  { label: "Price: high",  value: "price_desc" },
  { label: "Most reviewed",value: "popular" },
];

export default function SortBar({ total, sort, onSort, onFilterToggle }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-(--color-border) mb-6">
      <div className="flex items-center gap-3">
        {/* Mobile filter toggle */}
        <button
          onClick={onFilterToggle}
          className="md:hidden flex items-center gap-2 text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters
        </button>

        <p className="text-[12px] text-(--color-faint)">
          {total} {total === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] tracking-widest uppercase text-(--color-faint) hidden sm:block">Sort</span>
        <select
          value={sort}
          onChange={e => onSort(e.target.value)}
          className="text-[12px] text-(--color-ink) bg-transparent border border-(--color-border) px-3 py-1.5 rounded-sm focus:outline-none focus:border-(--color-ink) cursor-pointer"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}