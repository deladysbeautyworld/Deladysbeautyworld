import { Skeleton, Sparkline, SourceTag } from "./ui.jsx";

/**
 * KPI card for the admin dashboard.
 *
 *  - `trend={{ deltaPct, prior }}` renders a ▲/▼ chip vs the prior period.
 *    Suppressed when there's no prior data (a % change over zero is noise).
 *  - `spark` is an array of numbers drawn as a small trend line.
 *  - `accent` highlights the card the admin should act on first.
 *  - `source` ("db" | "pos") tags where the number comes from.
 *  - `footnote` is a short line of context under the value.
 */
export default function AdminMetricCard({
  label,
  value,
  loading = false,
  accent = false,
  icon = null,
  trend = null,
  trendLabel = "vs prior 30 days",
  spark = null,
  source = null,
  footnote = null,
}) {
  const showTrend =
    trend && !loading && Number(trend.prior ?? 0) > 0 && Number.isFinite(Number(trend.deltaPct));
  const delta = Number(trend?.deltaPct ?? 0);
  const positive = showTrend && delta > 0;
  const negative = showTrend && delta < 0;

  return (
    <div
      className={[
        "admin-card relative p-4 sm:p-5 overflow-hidden flex flex-col",
        accent ? "ring-1 ring-(--color-pink)/30 bg-linear-to-br from-(--color-pink-pale) to-white" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <span className={`admin-icon-chip hidden sm:inline-flex ${accent ? "" : "admin-icon-chip--navy"}`}>{icon}</span>
          )}
          <p className="text-[12px] sm:text-[13px] text-(--color-muted) leading-snug line-clamp-2">{label}</p>
        </div>
        {source && <span className="hidden sm:inline"><SourceTag source={source} /></span>}
      </div>

      <div className="mt-3 sm:mt-4 flex flex-wrap items-end justify-between gap-2">
        <p className="text-[22px] sm:text-[28px] leading-none font-medium text-(--color-ink) tabular-nums tracking-tight">
          {loading ? <Skeleton className="w-24 h-7" /> : value}
        </p>
        {showTrend && (
          <span
            className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium tabular-nums",
              positive ? "bg-(--color-success-soft) text-(--color-success)" : "",
              negative ? "bg-[#fdecef] text-(--color-error)" : "",
              !positive && !negative ? "bg-(--color-cream-dark) text-(--color-muted)" : "",
            ].join(" ")}
            title={trendLabel}
          >
            {positive ? "▲" : negative ? "▼" : "•"} {Math.abs(delta)}%
          </span>
        )}
      </div>

      <div className="mt-auto pt-3">
        {!loading && spark && (
          <div className={accent ? "text-(--color-pink)" : "text-(--color-navy-soft)"}>
            <Sparkline values={spark} />
          </div>
        )}
        {!loading && (footnote || showTrend) && (
          <p className="text-[12px] text-(--color-faint) mt-1">{footnote ?? trendLabel}</p>
        )}
      </div>
    </div>
  );
}
