import { useEffect, useState } from "react";
import { getAdminProducts } from "../../lib/products.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";
import { EmptyState, ErrorBanner, Skeleton, SourceTag } from "./components/ui.jsx";
import { IconBox, IconSearch } from "./components/icons.jsx";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;
const fmtDate = (value) => {
  const date = new Date(value);
  // The POS sends 1 Jan 1970 when no expiry is set — treat that as empty.
  return Number.isNaN(date.getTime()) || date.getFullYear() < 2000
    ? null
    : date.toLocaleDateString("en-NG", { dateStyle: "medium" });
};

const STATUS_STYLES = {
  in_stock: "bg-green-50 text-green-700",
  low_stock: "bg-amber-50 text-amber-800",
  out: "bg-rose-50 text-rose-700",
};
const BAR_COLORS = { in_stock: "#16834a", low_stock: "#d48a1c", out: "#c7345a" };

function stockLabel(product) {
  const quantity = Number(product.stock);
  const threshold = product.reorder_level ?? 5;
  // Meter fills relative to 4x the reorder point, so "low" sits at ≤25%.
  const fill = Math.min(100, Math.round((Math.max(0, quantity) / Math.max(1, threshold * 4)) * 100));
  if (quantity <= 0) return { label: "Out of stock", cls: STATUS_STYLES.out, color: BAR_COLORS.out, fill: 0 };
  if (quantity <= threshold) {
    return { label: `Low · ${quantity}`, cls: STATUS_STYLES.low_stock, color: BAR_COLORS.low_stock, fill };
  }
  return { label: `${quantity} in stock`, cls: STATUS_STYLES.in_stock, color: BAR_COLORS.in_stock, fill };
}

export default function Products() {
  const [filter, setFilter] = useState({ search: "", page: 0 });
  const { search, page } = filter;
  const [data, setData] = useState({ products: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getAdminProducts({ search, page, pageSize: 20 });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [search, page]);

  const setSearch = (newSearch) => setFilter({ search: newSearch, page: 0 });
  const setPage = (newPage) => {
    setFilter((current) => ({ ...current, page: newPage }));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
        <AdminPageHeader
          eyebrow="Catalog"
          title="Products"
          subtitle={loading && !data.total ? "Loading products from the POS…" : `${data.total.toLocaleString("en-NG")} ${data.total === 1 ? "product" : "products"} synced from the POS. Edit stock and prices in the POS system.`}
          action={<SourceTag source="pos" />}
        />

        <div className="mb-5 relative w-full sm:w-96">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-faint) pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name…"
            aria-label="Search products"
            className="w-full h-11 border border-(--color-border) pl-10 pr-4 text-[13.5px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none"
          />
        </div>

        <ErrorBanner>{error}</ErrorBanner>

        <div className="bg-white border border-(--color-border) rounded-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data.products.length === 0 ? (
            <EmptyState icon={<IconBox size={20} />} title={search ? "No matches" : "No products yet"}>
              {search ? `Nothing in the POS matches “${search}”.` : "Products added in the POS will appear here."}
            </EmptyState>
          ) : (
            <>
            {/* Phones: one card per product, price + stock always visible */}
            <ul className="md:hidden divide-y divide-(--color-border)">
              {data.products.map((product) => {
                const stock = stockLabel(product);
                return (
                  <li key={product.id} className="flex gap-3 px-4 py-3.5">
                    <div className="w-14 h-14 bg-(--color-cream-dark) rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-3 h-6 bg-(--color-stone) rounded-[6px_6px_1px_1px] opacity-40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] text-(--color-ink) leading-snug capitalize line-clamp-2">
                        {product.name.toLowerCase()}
                      </p>
                      <p className="text-[11.5px] text-(--color-faint) truncate mt-0.5">
                        {[product.categories?.name, product.pack_size && `Pack ${product.pack_size}`].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[14px] font-medium text-(--color-ink) tabular-nums">{fmt(product.price)}</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${stock.cls}`}>
                          {stock.label}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Product</th>
                    <th className="px-6 py-3 font-normal">Category</th>
                    <th className="px-6 py-3 font-normal">Price</th>
                    <th className="px-6 py-3 font-normal">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product) => {
                    const stock = stockLabel(product);
                    const expiryDate = fmtDate(product.expiry_date);
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-(--color-cream-dark) rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-3 h-6 bg-(--color-stone) rounded-[6px_6px_1px_1px] opacity-40" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-(--color-ink) truncate max-w-72 capitalize">
                                {product.name.toLowerCase()}
                              </p>
                              {(product.pack_size || expiryDate) && (
                                <p className="text-[10px] text-(--color-faint)">
                                  {[product.pack_size && `Pack ${product.pack_size}`, expiryDate && `Expires ${expiryDate}`].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-(--color-muted) font-light">
                          {product.categories?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-(--color-ink) font-medium">
                          {fmt(product.price)}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-medium ${stock.cls}`}>
                            {stock.label}
                          </span>
                          <span className="mt-2 block h-1 w-24 rounded-full bg-(--color-cream-dark) overflow-hidden" aria-hidden="true">
                            <span className="block h-full rounded-full" style={{ width: `${stock.fill}%`, background: stock.color }} />
                          </span>
                          {product.reorder_level != null && (
                            <p className="mt-1 text-[10px] text-(--color-faint)">
                              Reorder at {product.reorder_level}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-[12px] text-(--color-muted)">
            <p className="font-light">Page {page + 1} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-9 px-4 border border-(--color-border) rounded-lg bg-white text-[12.5px] font-medium hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(data.totalPages - 1, page + 1))}
                disabled={page >= data.totalPages - 1}
                className="h-9 px-4 border border-(--color-border) rounded-lg bg-white text-[12.5px] font-medium hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
    </div>
  );
}