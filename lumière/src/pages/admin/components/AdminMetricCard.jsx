/**
 * Branded metric card for the admin dashboard.
 *
 * Variants:
 *  - default: cream background, subtle border, navy ink value
 *  - accent:  pink border + pale pink tint, reserved for the headline
 *             metric the admin should look at first (pending orders, etc.)
 *
 * Pass `trend={{ deltaPct, prior }}` to render a small "▲ 12% vs prior 30d"
 * badge below the value. If `deltaPct === 0` the badge is suppressed (don't
 * show a misleading flat line for empty data).
 *
 * While `loading` is true the value slot renders a small pulse skeleton so
 * the layout doesn't jump when data arrives.
 */
export default function AdminMetricCard({
  label,
  value,
  loading = false,
  accent = false,
  icon = null,
  trend = null,
}) {
  // Suppress trend badges for empty data — a 0% delta over zero prior isn't
  // informative and looks like a layout bug.
  const showTrend =
    trend &&
    !loading &&
    Number(trend.prior ?? 0) > 0 &&
    Number.isFinite(Number(trend.deltaPct));

  const positive = showTrend && Number(trend.deltaPct) > 0;
  const negative = showTrend && Number(trend.deltaPct) < 0;

  return (
    <div
      className={[
        "relative border rounded-sm px-5 py-5 overflow-hidden transition-colors",
        accent
          ? "border-(--color-pink) bg-(--color-pink-pale)"
          : "border-(--color-border) bg-white",
      ].join(" ")}
    >
      {/* Pink hairline on accent cards so they pop against the grid */}
      {accent && (
        <span className="absolute left-0 top-0 bottom-0 w-0.75 bg-(--color-pink)" />
      )}

      <div className="flex items-start justify-between">
        <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) font-normal">
          {label}
        </p>
        {icon && (
          <span className={accent ? "text-(--color-pink)" : "text-(--color-muted)"}>
            {icon}
          </span>
        )}
      </div>

      <p className="font-display text-[26px] md:text-[28px] font-light text-(--color-ink) mt-3 leading-none">
        {loading ? (
          <span className="inline-block w-20 h-7 bg-(--color-cream-dark) rounded-sm animate-pulse" />
        ) : (
          value
        )}
      </p>

      {showTrend && (
        <p
          className={[
            "mt-2 text-[10px] tracking-[0.14em] uppercase font-normal",
            positive ? "text-emerald-600" : negative ? "text-red-500" : "text-(--color-faint)",
          ].join(" ")}
        >
          {positive ? "▲" : "▼"} {Math.abs(Number(trend.deltaPct))}% vs prior 30d
        </p>
      )}
    </div>
  );
}
