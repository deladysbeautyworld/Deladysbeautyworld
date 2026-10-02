import { useEffect, useState } from "react";
import { getAdminProducts } from "../../lib/products.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;
const fmtDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-NG", { dateStyle: "medium" });
};

const STATUS_STYLES = {
  in_stock: "bg-green-50 text-green-700",
  low_stock: "bg-amber-50 text-amber-700",
  out: "bg-red-50 text-red-700",
};

function stockLabel(product) {
  const quantity = Number(product.stock);
  const threshold = product.reorder_level ?? 5;
  if (quantity <= 0) return { label: "Out of stock", cls: STATUS_STYLES.out };
  if (quantity <= threshold) {
    return { label: `Low · ${quantity}`, cls: STATUS_STYLES.low_stock };
  }
  return { label: `${quantity} in stock`, cls: STATUS_STYLES.in_stock };
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
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 max-w-6xl mx-auto">
        <AdminPageHeader
          title="Products"
          subtitle={`${data.total} ${data.total === 1 ? "product" : "products"} in your store`}
        />

        <div className="mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name..."
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
          ) : data.products.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                {search ? "No products match your search." : "No products yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                            <div className="w-10 h-10 bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-3 h-6 bg-(--color-stone) rounded-[6px_6px_1px_1px] opacity-40" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-(--color-ink) font-normal truncate max-w-50">
                                {product.name}
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
                          <span className={`inline-block px-2.5 py-1 rounded-sm text-[10px] tracking-[0.08em] uppercase font-normal ${stock.cls}`}>
                            {stock.label}
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
          )}
        </div>

        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-[12px] text-(--color-muted)">
            <p className="font-light">Page {page + 1} of {data.totalPages}</p>
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