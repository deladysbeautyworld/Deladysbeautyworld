import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getOverviewStats,
  getRecentOrders,
  getOverviewTrendsSafe,
} from "../../lib/admin.js";

import AdminPageHeader from "./components/AdminPageHeader.jsx";
import AdminMetricCard from "./components/AdminMetricCard.jsx";
import AdminStatusPill from "./components/AdminStatusPill.jsx";

// Same currency format used across the app.
const fmt = (amount) => `₦${Number(amount ?? 0).toLocaleString("en-NG")}`;

const formatDate = (iso) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Admin dashboard — top-level metrics + recent orders.
 */
export default function Overview() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [statsData, recentOrders, trendsData] = await Promise.all([
          getOverviewStats(),
          getRecentOrders(5),
          getOverviewTrendsSafe(),
        ]);

        // Debug customer counts.
        console.log("Admin dashboard data:", {
          stats: statsData,
          recent: recentOrders,
          trends: trendsData,
          customers: trendsData?.customers,
        });

        if (cancelled) return;

        setStats(statsData);
        setRecent(Array.isArray(recentOrders) ? recentOrders : []);
        setTrends(trendsData);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);

        if (!cancelled) {
          setError(err?.message || "Failed to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative">
      {/* Brand gradient strip */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 max-w-6xl mx-auto">
        <AdminPageHeader
          title="Overview"
          subtitle="A snapshot of your store today."
          action={
            <Link
              to="/admin/announcements"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-(--color-pink) px-6 text-[11px] font-normal uppercase tracking-widest text-white transition-colors hover:bg-(--color-navy)"
            >
              Manage announcements
            </Link>
          }
        />

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 text-[12px] text-red-700 rounded-sm">
            {error}
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <AdminMetricCard
            label="Revenue (30d)"
            value={
              loading
                ? "—"
                : fmt(trends?.sales?.current ?? stats?.revenue ?? 0)
            }
            loading={loading}
            icon={<RevenueIcon />}
            trend={trends?.sales}
          />

          <AdminMetricCard
            label="Orders (30d)"
            value={
              loading
                ? "—"
                : trends?.orders?.current ?? stats?.orders ?? 0
            }
            loading={loading}
            icon={<OrdersIcon />}
            trend={trends?.orders}
          />

          <AdminMetricCard
            label="Pending orders"
            value={loading ? "—" : stats?.pendingOrders ?? 0}
            loading={loading}
            accent
            icon={<PendingIcon />}
          />

          <AdminMetricCard
            label="New customers (30d)"
            value={
              loading
                ? "—"
                : trends?.customers?.current ?? stats?.customers ?? 0
            }
            loading={loading}
            icon={<CustomersIcon />}
            trend={trends?.customers}
          />
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-(--color-border) rounded-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-(--color-border)">
            <h2 className="text-[11px] tracking-[0.14em] uppercase font-medium text-(--color-ink)">
              Recent orders
            </h2>

            <Link
              to="/admin/orders"
              className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-10 flex justify-center">
              <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                No orders yet.
              </p>

              <p className="text-[11px] text-(--color-faint) font-light mt-1">
                Once customers start placing orders, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Order</th>
                    <th className="px-6 py-3 font-normal">Customer</th>
                    <th className="px-6 py-3 font-normal">Date</th>
                    <th className="px-6 py-3 font-normal">Status</th>
                    <th className="px-6 py-3 font-normal text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recent.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-[12px] text-(--color-ink)">
                        {o.id?.slice(0, 8).toUpperCase() ?? "—"}
                      </td>

                      <td className="px-6 py-3 text-(--color-ink)">
                        {o.profiles?.full_name ??
                          o.shipping_name ??
                          "Unknown customer"}
                      </td>

                      <td className="px-6 py-3 text-(--color-muted) font-light">
                        {formatDate(o.created_at)}
                      </td>

                      <td className="px-6 py-3">
                        <AdminStatusPill status={o.status} />
                      </td>

                      <td className="px-6 py-3 text-(--color-ink) text-right font-medium">
                        {fmt(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Icons */

function RevenueIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11V7a3 3 0 0 1 6 0v4" />
      <rect x="5" y="11" width="14" height="10" rx="1" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}