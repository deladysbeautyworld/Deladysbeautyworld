const TRUST_ITEMS = [
  { icon: "🌿", label: "100% clean ingredients" },
  { icon: "🚚", label: "Free shipping over $60" },
  { icon: "↩️", label: "30-day returns" },
  { icon: "🧪", label: "Dermatologist tested" },
  { icon: "🌎", label: "Ships worldwide" },
];

export default function TrustStrip() {
  return (
    <div className="border-t border-b border-(--color-border) bg-(--color-surface) overflow-x-auto">
      <div className="flex items-center justify-start md:justify-center gap-8 px-6 py-3 min-w-max md:min-w-0">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[9px] tracking-widest uppercase text-(--color-pink)" aria-hidden="true">{item.icon}</span>
            <span className="text-[12px] tracking-wider text-(--color-muted) font-normal">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
