import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listCustomers, getCustomerDetail } from "../../lib/admin.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";
import AdminStatusPill from "./components/AdminStatusPill.jsx";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

/**
 * Admin customers — searchable list, with order count + total spent.
 * Clicking a row opens /admin/customers/:id (CustomerDetail sub-page).
 */
export default function Customers() {
  const navigate  = useNavigate();
  const [filter, setFilter] = useState({ search: "", page: 0 });
  const { search, page }    = filter;
  const [data, setData]       = useState({ customers: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listCustomers({ search, page, pageSize: 20 });
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
  }, [search, page]);

  const setSearch = (newSearch) => {
    // Reset to first page when search text changes
    setFilter({ search: newSearch, page: 0 });
  };

  const setPage = (newPage) => {
    setFilter((f) => ({ ...f, page: newPage }));
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 max-w-6xl mx-auto">

        <AdminPageHeader
          title="Customers"
          subtitle={`${data.total} ${data.total === 1 ? "customer" : "customers"}`}
        />

        {/* Search */}
        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full sm:w-80 h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light"
          />
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 text-[12px] text-red-700 rounded-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-(--color-border) rounded-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 flex justify-center">
              <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
            </div>
          ) : data.customers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                {search ? "No customers match your search." : "No customers yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Customer</th>
                    <th className="px-6 py-3 font-normal">Joined</th>
                    <th className="px-6 py-3 font-normal">Orders</th>
                    <th className="px-6 py-3 font-normal text-right">Total spent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/customers/${c.id}`)}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-(--color-pink) text-white flex items-center justify-center text-[12px] font-medium shrink-0">
                            {c.full_name?.[0]?.toUpperCase() ?? c.email?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-(--color-ink) font-normal truncate">
                              {c.full_name ?? "—"}
                            </p>
                            <p className="text-[11px] text-(--color-faint) font-light truncate">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-6 py-3 text-(--color-ink) font-medium">
                        {c.orderCount}
                      </td>
                      <td className="px-6 py-3 text-(--color-ink) font-medium text-right">
                        {fmt(c.totalSpent)}
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
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-9 px-4 border border-(--color-border) rounded-sm text-[11px] tracking-widest uppercase hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(data.totalPages - 1, page + 1))}
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
 * Admin customer detail — full profile + their entire order history.
 * Mounted at /admin/customers/:id.
 */
export function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCustomerDetail(id);
        if (cancelled) return;
        setCustomer(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="px-6 md:px-10 py-10 max-w-3xl mx-auto">
        <Link
          to="/admin/customers"
          className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) mb-6 inline-block"
        >
          ← Back to customers
        </Link>
        <div className="px-4 py-3 border border-red-200 bg-red-50 text-[12px] text-red-700 rounded-sm">
          {error ?? "Customer not found."}
        </div>
      </div>
    );
  }

  const orders = (customer.orders ?? []).slice().sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const totalSpent = orders
    .filter((o) => !["cancelled", "pending"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-6 md:px-10 py-10 max-w-4xl mx-auto">

        <Link
          to="/admin/customers"
          className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) mb-4 inline-block transition-colors"
        >
          ← Back to customers
        </Link>

        {/* Header card */}
        <div className="bg-white border border-(--color-border) rounded-sm px-6 py-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-(--color-pink) text-white flex items-center justify-center font-display text-[24px] font-light shrink-0">
            {customer.full_name?.[0]?.toUpperCase() ?? customer.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.18em] uppercase text-(--color-pink) font-medium mb-1">
              Customer
            </p>
            <h1 className="font-display text-[28px] md:text-[32px] font-light text-(--color-ink) leading-tight truncate">
              {customer.full_name ?? "—"}
            </h1>
            <p className="text-[12px] text-(--color-faint) font-light mt-1 truncate">
              {customer.email} · Joined {formatDate(customer.created_at)}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-(--color-border) rounded-sm px-5 py-4">
            <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) font-normal">
              Total orders
            </p>
            <p className="font-display text-[24px] font-light text-(--color-ink) mt-2 leading-none">
              {orders.length}
            </p>
          </div>
          <div className="bg-white border border-(--color-border) rounded-sm px-5 py-4">
            <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) font-normal">
              Lifetime spend
            </p>
            <p className="font-display text-[24px] font-light text-(--color-ink) mt-2 leading-none">
              {fmt(totalSpent)}
            </p>
          </div>
        </div>

        {/* Order history */}
        <section className="bg-white border border-(--color-border) rounded-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-(--color-border)">
            <h2 className="text-[11px] tracking-[0.14em] uppercase font-medium text-(--color-ink)">
              Order history
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                This customer hasn't placed any orders yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Order</th>
                    <th className="px-6 py-3 font-normal">Date</th>
                    <th className="px-6 py-3 font-normal">Status</th>
                    <th className="px-6 py-3 font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-[12px] text-(--color-ink)">
                        {o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="px-6 py-3">
                        <AdminStatusPill status={o.status} />
                      </td>
                      <td className="px-6 py-3 text-(--color-ink) font-medium text-right">
                        {fmt(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
