import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  listOrders,
  getOrderDetail,
  updateOrderStatus,
} from "../../lib/admin.js";
import AdminPushSetup from "../../components/admin/AdminPushSetup.jsx";
import AdminPageHeader from "./components/AdminPageHeader.jsx";
import AdminStatusPill from "./components/AdminStatusPill.jsx";

// Same currency format used across the app.
const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const STATUS_FILTERS = [
  { value: null,        label: "All"      },
  { value: "pending",   label: "Pending"  },
  { value: "confirmed", label: "Confirmed"},
  { value: "shipped",   label: "Shipped"  },
  { value: "delivered", label: "Delivered"},
  { value: "cancelled", label: "Cancelled"},
];

/**
 * Admin orders — list view. Filters by status, paginated.
 * Clicking a row opens /admin/orders/:id (OrderDetail sub-page).
 */
export default function Orders() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({ status: null, page: 0 });
  const { status, page } = filter;
  const [data, setData]                 = useState({ orders: [], total: 0, totalPages: 0 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // Reload whenever the filter or page changes.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listOrders({ status, page, pageSize: 20 });
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [status, page]);

  // Reset to page 0 when changing filter — derived via a single update.
  const handleFilterChange = (newStatus) => {
    setFilter({ status: newStatus, page: 0 });
  };

  const handlePageChange = (newPage) => {
    setFilter((f) => ({ ...f, page: newPage }));
  };

  return (
    <div className="relative">

      {/* Brand gradient strip — same treatment as Overview */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 max-w-6xl mx-auto">

        <AdminPageHeader
          title="Orders"
          subtitle={`${data.total} ${data.total === 1 ? "order" : "orders"} total`}
        />

        <AdminPushSetup />

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value ?? "all"}
              onClick={() => handleFilterChange(f.value)}
              className={[
                "h-8 px-4 rounded-sm text-[11px] tracking-[0.08em] uppercase font-normal transition-colors",
                status === f.value
                  ? "bg-(--color-ink) text-(--color-cream)"
                  : "bg-white border border-(--color-border) text-(--color-muted) hover:border-(--color-pink) hover:text-(--color-pink)",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 text-[12px] text-red-700 rounded-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-(--color-border) rounded-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 flex justify-center">
              <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
            </div>
          ) : data.orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                No orders found.
              </p>
              {status && (
                <button
                  onClick={() => handleFilterChange(null)}
                  className="mt-2 text-[11px] tracking-widest uppercase text-(--color-pink) hover:text-(--color-ink) underline underline-offset-2"
                >
                  Clear filter
                </button>
              )}
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
                    <th className="px-6 py-3 font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/admin/orders/${o.id}`)}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3 font-mono text-[12px] text-(--color-ink)">
                        {o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3 text-(--color-ink)">
                        {o.profiles?.full_name ?? o.shipping_name ?? "—"}
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

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-[12px] text-(--color-muted)">
            <p className="font-light">
              Page {page + 1} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-9 px-4 border border-(--color-border) rounded-sm text-[11px] tracking-widest uppercase hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(data.totalPages - 1, page + 1))}
                disabled={page >= data.totalPages - 1}
                className="h-9 px-4 border border-(--color-border) rounded-sm text-[11px] tracking-widest uppercase hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Admin order detail — mounted at /admin/orders/:id.
 * Shows full shipping info, line items, and a status selector that writes back.
 */
export function OrderDetail() {
  const { id }   = useParams();

  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusDraft, setStatusDraft]   = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveError, setSaveError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrderDetail(id);
        if (cancelled) return;
        setOrder(data);
        setStatusDraft(data.status);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleSaveStatus = async () => {
    if (!order || statusDraft === order.status) return;
    setSavingStatus(true);
    setSaveError(null);
    try {
      const updated = await updateOrderStatus(order.id, statusDraft);
      setOrder((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="px-6 md:px-10 py-10 max-w-3xl mx-auto">
        <Link
          to="/admin/orders"
          className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) mb-6 inline-block"
        >
          ← Back to orders
        </Link>
        <div className="px-4 py-3 border border-red-200 bg-red-50 text-[12px] text-red-700 rounded-sm">
          {error ?? "Order not found."}
        </div>
      </div>
    );
  }

  const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-6 md:px-10 py-10 max-w-4xl mx-auto">

        <Link
          to="/admin/orders"
          className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) mb-4 inline-block transition-colors"
        >
          ← Back to orders
        </Link>

        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-(--color-pink) font-medium mb-1">
              Order
            </p>
            <h1 className="font-display text-[28px] md:text-[32px] font-light text-(--color-ink) leading-tight">
              {order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-[12px] text-(--color-faint) font-light mt-1.5">
              Placed {formatDateTime(order.created_at)}
            </p>
          </div>
          <AdminStatusPill status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Left — line items + shipping */}
          <div className="flex flex-col gap-6">

            {/* Items */}
            <section className="bg-white border border-(--color-border) rounded-sm">
              <div className="px-6 py-4 border-b border-(--color-border)">
                <h2 className="text-[11px] tracking-[0.14em] uppercase font-medium text-(--color-ink)">
                  Items ({itemCount})
                </h2>
              </div>
              <div className="divide-y divide-(--color-border)">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-14 h-14 bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                      {item.products?.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-4 h-7 bg-(--color-stone) rounded-[8px_8px_2px_2px] opacity-40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-normal text-(--color-ink) truncate">
                        {item.products?.name ?? "Product"}
                      </p>
                      <p className="text-[11px] text-(--color-faint) font-light">
                        Qty {item.quantity} · {fmt(item.unit_price)} each
                      </p>
                    </div>
                    <p className="text-[14px] font-medium text-(--color-ink) shrink-0">
                      {fmt(item.unit_price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 border-t border-(--color-border) bg-(--color-cream-dark)/40">
                <div className="flex flex-col gap-1.5 max-w-xs ml-auto text-[13px]">
                  <div className="flex justify-between text-(--color-muted) font-light">
                    <span>Subtotal</span>
                    <span>{fmt(order.total - order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between text-(--color-muted) font-light">
                    <span>Delivery fee</span>
                    <span>{fmt(order.delivery_fee)}</span>
                  </div>
                  <div className="border-t border-(--color-border) pt-2 mt-1 flex justify-between font-medium text-(--color-ink) text-[14px]">
                    <span>Total</span>
                    <span>{fmt(order.total)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Customer + shipping */}
            <section className="bg-white border border-(--color-border) rounded-sm">
              <div className="px-6 py-4 border-b border-(--color-border)">
                <h2 className="text-[11px] tracking-[0.14em] uppercase font-medium text-(--color-ink)">
                  Customer & shipping
                </h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
                <DetailRow label="Customer">
                  {order.profiles?.full_name ?? order.shipping_name ?? "—"}
                </DetailRow>
                <DetailRow label="Email">
                  {order.profiles?.email ?? order.shipping_email}
                </DetailRow>
                <DetailRow label="Phone">{order.shipping_phone}</DetailRow>
                <DetailRow label="WhatsApp">{order.whatsapp_number}</DetailRow>
                <DetailRow label="Address" wide>
                  {order.shipping_address}, {order.shipping_city}, {order.shipping_state}
                </DetailRow>
                {order.order_note && (
                  <DetailRow label="Note" wide>
                    <span className="italic font-light">{order.order_note}</span>
                  </DetailRow>
                )}
                <DetailRow label="Payment">{order.payment_method}</DetailRow>
              </div>
            </section>
          </div>

          {/* Right — status update */}
          <aside className="bg-white border border-(--color-border) rounded-sm p-6 h-fit lg:sticky lg:top-24">
            <h2 className="text-[11px] tracking-[0.14em] uppercase font-medium text-(--color-ink) mb-4">
              Update status
            </h2>

            <select
              value={statusDraft ?? ""}
              onChange={(e) => setStatusDraft(e.target.value)}
              className="w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) bg-white outline-none focus:border-(--color-pink) transition-colors font-light mb-4"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={handleSaveStatus}
              disabled={savingStatus || statusDraft === order.status}
              className="w-full h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingStatus && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {savingStatus ? "Saving…" : "Save status"}
            </button>

            {saveError && (
              <p className="text-[12px] text-red-500 font-light mt-3">{saveError}</p>
            )}

            {statusDraft !== order.status && (
              <p className="text-[11px] text-(--color-faint) font-light mt-3">
                Current: <span className="text-(--color-ink)">{order.status}</span>
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] tracking-[0.12em] uppercase text-(--color-faint) font-normal mb-1">
        {label}
      </p>
      <p className="text-(--color-ink) font-light">{children}</p>
    </div>
  );
}
