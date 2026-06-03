const TRUST_ITEMS = [
  { icon: "🌿", label: "100% clean ingredients" },
  { icon: "🚚", label: "Free shipping over $60" },
  { icon: "↩", label: "30-day returns" },
  { icon: "✓", label: "Dermatologist tested" },
  { icon: "🌍", label: "Ships worldwide" },
];

export default function TrustStrip() {
  return (
    <div className="border-t border-b border-[var(--color-border)] bg-[#F5F3EE] overflow-x-auto">
      <div className="flex items-center justify-start md:justify-center gap-8 px-6 py-3 min-w-max md:min-w-0">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[13px]" aria-hidden="true">{item.icon}</span>
            <span className="text-[12px] tracking-[0.05em] text-[var(--color-muted)] font-normal">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}