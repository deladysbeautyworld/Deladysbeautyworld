import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import {
  getOverviewStats,
  getRecentOrders,
  getOverviewTrendsSafe,
  getOrderActivity,
} from "../../lib/admin.js";
import { getInventorySnapshot } from "../../lib/products.js";

import AdminPageHeader from "./components/AdminPageHeader.jsx";
import AdminMetricCard from "./components/AdminMetricCard.jsx";
import AdminStatusPill from "./components/AdminStatusPill.jsx";
import { STATUS_META, formatNaira } from "./components/format.js";
import {
  Card, CardHeader, EmptyState, ErrorBanner, RevenueChart, SegmentedBar, Skeleton, SourceTag,
} from "./components/ui.jsx";
import {
  IconAlert, IconArrowRight, IconBox, IconClock, IconOrders, IconRefresh, IconRevenue,
  IconUsers, IconTicket,
} from "./components/icons.jsx";

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
    : "—";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** Small async-state helper so each panel loads (and fails) on its own. */
function useAsync(fn) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error: error?.message || "Failed to load." });
      });
    return () => {
      cancelled = true;
    };
  }, [fn, nonce]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  return [state, reload];
}

const loadSummary = () =>
  Promise.all([getOverviewStats(), getOverviewTrendsSafe()]).then(([stats, trends]) => ({ stats, trends }));
const loadActivity = () => getOrderActivity(30);
const loadRecent = () => getRecentOrders(6);
const loadInventory = () => getInventorySnapshot();

export default function Overview() {
  const user = useAuthStore((s) => s.user);
  const firstName = (user?.user_metadata?.full_name || "").split(" ")[0];

  const [summary, reloadSummary] = useAsync(loadSummary);
  const [activity, reloadActivity] = useAsync(loadActivity);
  const [recent, reloadRecent] = useAsync(loadRecent);
  const [inventory, reloadInventory] = useAsync(loadInventory);

  const refreshAll = () => {
    reloadSummary();
    reloadActivity();
    reloadRecent();
    reloadInventory();
  };

  const stats = summary.data?.stats;
  const trends = summary.data?.trends;
  const series = activity.data?.series ?? [];
  const pending = stats?.pendingOrders ?? 0;
  const inv = inventory.data;

  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      <AdminPageHeader
        eyebrow={today}
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        subtitle="Here's how the store is doing over the last 30 days."
        action={
          <>
            <button type="button" onClick={refreshAll} className="admin-btn admin-btn--ghost" aria-label="Refresh dashboard">
              <IconRefresh size={16} /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link to="/admin/orders" className="admin-btn admin-btn--primary flex-1 sm:flex-none">
              <IconOrders size={16} /> Manage orders
            </Link>
          </>
        }
      />

      <ErrorBanner onRetry={reloadSummary}>{summary.error}</ErrorBanner>

      {/* Needs attention */}
      <AttentionStrip loading={summary.loading || inventory.loading} pending={pending} inventory={inv} />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <AdminMetricCard
          label="Revenue · 30 days"
          value={formatNaira(trends?.sales?.current ?? 0)}
          loading={summary.loading}
          icon={<IconRevenue size={16} />}
          trend={trends?.sales}
          spark={series.map((p) => p.revenue)}
          accent
        />
        <AdminMetricCard
          label="Orders · 30 days"
          value={(trends?.orders?.current ?? 0).toLocaleString("en-NG")}
          loading={summary.loading}
          icon={<IconOrders size={16} />}
          trend={trends?.orders}
          spark={series.map((p) => p.orders)}
        />
        <AdminMetricCard
          label="Average order value"
          value={formatNaira(activity.data?.averageOrderValue ?? 0)}
          loading={activity.loading}
          icon={<IconTicket size={16} />}
          footnote="Confirmed, shipped & delivered orders"
        />
        <AdminMetricCard
          label="New customers · 30 days"
          value={(trends?.customers?.current ?? 0).toLocaleString("en-NG")}
          loading={summary.loading}
          icon={<IconUsers size={16} />}
          trend={trends?.customers}
          footnote={stats ? `${(stats.totalCustomers ?? 0).toLocaleString("en-NG")} customers in total` : null}
        />
      </div>

      {/* Revenue + status mix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue"
            description="Daily revenue from confirmed, shipped and delivered orders."
            action={
              !activity.loading && (
                <p className="text-right">
                  <span className="block text-[20px] font-medium tabular-nums text-(--color-ink)">
                    {formatNaira(activity.data?.revenue ?? 0)}
                  </span>
                  <span className="text-[11.5px] text-(--color-faint)">last 30 days</span>
                </p>
              )
            }
          />
          {activity.loading ? (
            <div className="px-6 pb-6"><Skeleton className="h-56 w-full" /></div>
          ) : activity.error ? (
            <div className="px-6 pb-6"><ErrorBanner onRetry={reloadActivity}>{activity.error}</ErrorBanner></div>
          ) : (
            <RevenueChart series={series} />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Order status"
            description={
              activity.data ? `${activity.data.totalOrders} orders in the last 30 days` : "Last 30 days"
            }
          />
          <div className="px-5 sm:px-6 pb-6">
            {activity.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-2.5 w-full" />
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : activity.data?.totalOrders ? (
              <SegmentedBar
                segments={["pending", "confirmed", "shipped", "delivered", "cancelled"].map((key) => ({
                  key,
                  label: STATUS_META[key].label,
                  color: STATUS_META[key].color,
                  value: activity.data.statusCounts[key] ?? 0,
                }))}
              />
            ) : (
              <p className="text-[13px] text-(--color-muted) py-6 text-center">No orders in this period yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent orders + inventory */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <RecentOrders state={recent} onRetry={reloadRecent} />
        <InventoryHealth state={inventory} onRetry={reloadInventory} />
      </div>
    </div>
  );
}

function AttentionStrip({ loading, pending, inventory }) {
  if (loading) return null;
  const items = [];
  if (pending > 0) {
    items.push({
      key: "pending",
      to: "/admin/orders",
      icon: <IconClock size={16} />,
      tone: "",
      text: `${pending} ${pending === 1 ? "order is" : "orders are"} waiting to be confirmed`,
      cta: "Review",
    });
  }
  if (inventory?.outOfStock > 0) {
    items.push({
      key: "out",
      to: "/admin/products",
      icon: <IconAlert size={16} />,
      tone: "admin-icon-chip--amber",
      text: `${inventory.outOfStock} products are out of stock`,
      cta: "See products",
    });
  }
  if (inventory?.lowStockCount > 0) {
    items.push({
      key: "low",
      to: "/admin/products",
      icon: <IconBox size={16} />,
      tone: "admin-icon-chip--amber",
      text: `${inventory.lowStockCount} products are running low`,
      cta: "See products",
    });
  }
  if (!items.length) return null;

  return (
    <div className={`grid grid-cols-1 gap-3 mb-6 ${items.length === 3 ? "md:grid-cols-3" : items.length === 2 ? "md:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.to}
          className="admin-card group flex items-center gap-3 px-4 py-3 hover:shadow-[var(--admin-shadow-hover)] transition-shadow"
        >
          <span className={`admin-icon-chip ${item.tone}`}>{item.icon}</span>
          <span className="flex-1 text-[13px] text-(--color-ink)">{item.text}</span>
          <span className="admin-link opacity-80 group-hover:opacity-100">
            {item.cta} <IconArrowRight size={14} />
          </span>
        </Link>
      ))}
    </div>
  );
}

function RecentOrders({ state, onRetry }) {
  const navigate = useNavigate();
  const orders = state.data ?? [];

  return (
    <Card className="xl:col-span-2 overflow-hidden">
      <CardHeader
        title="Recent orders"
        description="The latest orders placed on the store."
        action={
          <Link to="/admin/orders" className="admin-link">
            View all <IconArrowRight size={14} />
          </Link>
        }
      />
      {state.loading ? (
        <div className="px-6 pb-6 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : state.error ? (
        <div className="px-6 pb-6"><ErrorBanner onRetry={onRetry}>{state.error}</ErrorBanner></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<IconOrders size={20} />} title="No orders yet">
          When customers start checking out, their orders will show up here.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-(--color-muted) border-y border-(--color-border)">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const customer = o.profiles?.full_name ?? o.shipping_name ?? "Guest";
                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/admin/orders/${o.id}`)}
                    className="border-b border-(--color-border) last:border-b-0 cursor-pointer"
                  >
                    <td className="px-6 py-3">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-[12px] text-(--color-ink) hover:text-(--color-pink)"
                      >
                        #{o.id?.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-(--color-cream-dark) text-(--color-navy-soft) text-[11px] font-medium flex items-center justify-center shrink-0">
                          {customer.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="truncate text-(--color-ink)">{customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-(--color-muted) hidden sm:table-cell">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-3"><AdminStatusPill status={o.status} /></td>
                    <td className="px-6 py-3 text-right font-medium text-(--color-ink)">{formatNaira(o.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function InventoryHealth({ state, onRetry }) {
  const inv = state.data;
  const total = inv?.total ?? 0;
  const low = inv?.lowStockCount ?? 0;
  const healthy = Math.max(0, (inv?.inStock ?? 0) - low);
  const out = inv?.outOfStock ?? 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Inventory health"
        description={inv ? `${total.toLocaleString("en-NG")} products in the POS` : "Synced from the POS"}
        action={<SourceTag source="pos" />}
      />
      <div className="px-5 sm:px-6 pb-5">
        {state.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-2.5 w-full" />
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : state.error ? (
          <ErrorBanner onRetry={onRetry}>{state.error}</ErrorBanner>
        ) : (
          <>
            <SegmentedBar
              segments={[
                { key: "ok", label: "Healthy stock", value: healthy, color: "#16834a" },
                { key: "low", label: "Running low", value: low, color: "#d48a1c" },
                { key: "out", label: "Out of stock", value: out, color: "#c7345a" },
              ]}
            />
            <div className="mt-5 rounded-xl bg-(--color-off-white) border border-(--color-border) px-4 py-3">
              <p className="text-[12px] text-(--color-muted)">Retail value on hand</p>
              <p className="text-[20px] font-medium tabular-nums text-(--color-ink)">
                {formatNaira(inv?.stockValue ?? 0)}
              </p>
              {inv && inv.scanned < inv.total && (
                <p className="text-[11px] text-(--color-faint) mt-0.5">
                  Based on the first {inv.scanned} of {inv.total} products.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {inv?.lowStock?.length > 0 && (
        <div className="border-t border-(--color-border)">
          <p className="px-5 sm:px-6 pt-4 pb-2 text-[12px] font-medium text-(--color-muted)">Restock soon</p>
          <ul className="pb-3">
            {inv.lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 sm:px-6 py-2">
                <img
                  src={p.image_url}
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                  className="w-9 h-9 rounded-lg object-cover bg-(--color-cream-dark) shrink-0"
                />
                <span className="flex-1 min-w-0 text-[12.5px] text-(--color-ink) truncate capitalize">
                  {p.name.toLowerCase()}
                </span>
                <span className="text-[12px] font-medium tabular-nums text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
