const PRICE_RANGES = [
  { label: "All prices", value: null },
  { label: "Under $30", value: [0, 30] },
  { label: "$30 – $50", value: [30, 50] },
  { label: "$50 – $75", value: [50, 75] },
  { label: "$75+", value: [75, 999] },
];

const SKIN_TAGS = ["brightening", "hydration", "acne", "sensitive", "antiaging", "spf", "daily"];

export default function FilterSidebar({ categories, filters, onChange, onClear, isMobile, onClose }) {
  function toggle(key, val) {
    onChange({ ...filters, [key]: filters[key] === val ? null : val });
  }

  function toggleTag(tag) {
    const current = filters.tag;
    onChange({ ...filters, tag: current === tag ? null : tag });
  }

  const content = (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] tracking-[0.14em] uppercase text-(--color-ink) font-medium">Filters</h2>
        {(filters.category || filters.price || filters.tag) && (
          <button onClick={onClear} className="text-[10px] tracking-widest uppercase text-(--color-faint) hover:text-(--color-ink) transition-colors cursor-pointer">
            Clear all
          </button>
        )}
        {isMobile && (
          <button onClick={onClose} className="ml-auto text-(--color-muted) hover:text-(--color-ink) cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) mb-3">Category</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onChange({ ...filters, category: null })}
            className={`text-left text-[13px] transition-colors cursor-pointer ${!filters.category ? "text-(--color-ink) font-medium" : "text-(--color-muted) hover:text-(--color-ink)"}`}
          >
            All products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggle("category", cat.slug)}
              className={`text-left text-[13px] transition-colors cursor-pointer ${filters.category === cat.slug ? "text-(--color-ink) font-medium" : "text-(--color-muted) hover:text-(--color-ink)"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-(--color-border)" />

      {/* Price */}
      <div>
        <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) mb-3">Price</p>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map(range => {
            const active = JSON.stringify(filters.price) === JSON.stringify(range.value);
            return (
              <button
                key={range.label}
                onClick={() => onChange({ ...filters, price: range.value })}
                className={`text-left text-[13px] transition-colors cursor-pointer ${active ? "text-(--color-ink) font-medium" : "text-(--color-muted) hover:text-(--color-ink)"}`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-(--color-border)" />

      {/* Skin concern tags */}
      <div>
        <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) mb-3">Skin concern</p>
        <div className="flex flex-wrap gap-2">
          {SKIN_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-[10px] tracking-widest uppercase px-3 py-1.5 border rounded-sm transition-colors cursor-pointer ${
                filters.tag === tag
                  ? "bg-(--color-ink) text-(--color-cream) border-(--color-ink)"
                  : "border-(--color-border) text-(--color-muted) hover:border-(--color-ink) hover:text-(--color-ink)"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative ml-auto w-72 h-full bg-white overflow-y-auto p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return <aside className="w-52 shrink-0">{content}</aside>;
}