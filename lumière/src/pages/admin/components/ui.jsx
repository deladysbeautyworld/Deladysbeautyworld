import { useId, useState } from "react";
import { formatNaira } from "./format.js";

/* ------------------------------------------------------------------ *
 *  Admin UI kit — small, dependency-free building blocks shared by
 *  the dashboard pages. Styling lives in admin.css (scoped to
 *  .admin-shell) plus Tailwind utilities.
 * ------------------------------------------------------------------ */



export function Card({ as: Tag = "section", className = "", children, ...rest }) {
  return (
    <Tag className={`admin-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, icon }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="admin-icon-chip mt-0.5">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-[15px] font-medium text-(--color-ink) leading-tight">{title}</h2>
          {description && (
            <p className="text-[12.5px] text-(--color-muted) mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <span className={`admin-skeleton block ${className}`} />;
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="px-6 py-12 text-center flex flex-col items-center">
      {icon && <span className="admin-icon-chip admin-icon-chip--lg mb-4">{icon}</span>}
      <p className="text-[14px] font-medium text-(--color-ink)">{title}</p>
      {children && (
        <p className="text-[13px] text-(--color-muted) mt-1 max-w-sm">{children}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ children, onRetry }) {
  if (!children) return null;
  return (
    <div role="alert" className="admin-alert mb-6">
      <span className="font-medium">Something went wrong.</span>
      <span className="text-(--color-ink-soft)/80">{children}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-auto admin-link">
          Try again
        </button>
      )}
    </div>
  );
}

/** Tiny inline trend line for metric cards. */
export function Sparkline({ values = [], className = "" }) {
  const id = useId();
  if (values.length < 2 || values.every((v) => v === 0)) return null;

  const width = 120;
  const height = 36;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => [i * step, height - 3 - ((v - min) / range) * (height - 6)]);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-9 ${className}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Revenue bar chart with hover read-out. Bars rather than a line because
 * daily store revenue is sparse — most days are zero — and bars make that
 * honest instead of drawing slopes between unrelated days.
 */
export function RevenueChart({ series = [], formatValue = formatNaira }) {
  const [active, setActive] = useState(null);
  const peak = Math.max(0, ...series.map((p) => p.revenue));
  const empty = peak === 0;
  // Round the axis top up to a "nice" number so tick labels read cleanly.
  const max = empty
    ? 1
    : (() => {
        const magnitude = 10 ** Math.floor(Math.log10(peak));
        const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= peak) ?? 10;
        return step * magnitude;
      })();
  const point = active != null ? series[active] : null;
  const ticks = empty ? [0] : [1, 0.5, 0];

  const dateLabel = (date) =>
    date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });

  return (
    <div className="px-5 sm:px-6 pt-1 pb-6">
      <div
        className={`h-8 mb-6 inline-flex items-center rounded-lg px-3 text-[12.5px] transition-colors ${point ? "bg-(--color-pink-pale) text-(--color-muted)" : "bg-(--color-off-white) text-(--color-faint)"}`}
        aria-live="polite"
      >
        {empty ? (
          "No paid orders in the last 30 days yet"
        ) : point ? (
          <>
            <span className="font-medium text-(--color-ink)">{dateLabel(point.date)}</span>
            {" · "}
            <span className="tabular-nums">{formatValue(point.revenue)}</span>
            {" · "}
            {point.orders} {point.orders === 1 ? "order" : "orders"}
          </>
        ) : (
          "Hover a bar to see the day"
        )}
      </div>

      <div className={`relative mt-2 ${empty ? "h-16" : "h-48 sm:h-56"}`}>
        {/* Gridlines */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 flex items-center gap-3 pointer-events-none translate-y-1/2"
            style={{ bottom: `${t * 100}%` }}
          >
            <span className="w-11 shrink-0 text-right text-[10.5px] tabular-nums text-(--color-faint)">
              {formatValue(max * t, { compact: true })}
            </span>
            <span className="flex-1 border-t border-dashed border-(--color-border)" />
          </div>
        ))}

        <div
          className="absolute inset-y-0 left-14 right-0 flex items-end gap-[3px]"
          onMouseLeave={() => setActive(null)}
          role="img"
          aria-label={`Daily revenue for the last ${series.length} days`}
        >
          {series.map((p, i) => {
            const pct = (p.revenue / max) * 100;
            return (
              <button
                key={p.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${dateLabel(p.date)}: ${formatValue(p.revenue)}, ${p.orders} orders`}
                className="group relative flex-1 h-full flex items-end focus:outline-none"
              >
                <span
                  className={[
                    "w-full rounded-t-[4px] transition-colors",
                    p.revenue > 0 ? "" : "opacity-60",
                    active === i ? "bg-(--color-pink)" : "bg-(--color-pink-light) group-hover:bg-(--color-pink)",
                  ].join(" ")}
                  style={{ height: p.revenue > 0 ? `max(${pct}%, 4px)` : "2px" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {series.length > 0 && (
        <div className="ml-14 mt-3 flex justify-between text-[10.5px] text-(--color-faint)">
          <span>{dateLabel(series[0].date)}</span>
          <span>{dateLabel(series[Math.floor(series.length / 2)].date)}</span>
          <span>Today</span>
        </div>
      )}
    </div>
  );
}

/** Horizontal segmented bar + legend, used for order status mix. */
export function SegmentedBar({ segments = [] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (!total) return null;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-(--color-cream-dark)">
        {segments.filter((s) => s.value > 0).map((s) => (
          <span
            key={s.key}
            title={`${s.label}: ${s.value}`}
            className="h-full border-r-2 border-white last:border-r-0"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-3 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-(--color-ink-soft) flex-1">{s.label}</span>
            <span className="tabular-nums text-(--color-ink) font-medium">{s.value}</span>
            <span className="tabular-nums text-(--color-faint) w-10 text-right">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small "source" tag so admins know which system a number comes from. */
export function SourceTag({ source }) {
  const label = source === "pos" ? "POS" : "Store DB";
  return (
    <span className={`admin-source-tag admin-source-tag--${source}`} title={source === "pos" ? "From the POS inventory API" : "From the Supabase store database"}>
      {label}
    </span>
  );
}
