import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import SEOMeta from "../utils/seo";
import { getProducts } from "../lib/products";
import { supabase } from "../utils/supabase";
import FilterSidebar from "../components/shop/FilterSidebar";
import SortBar from "../components/shop/SortBar";
import ProductGrid from "../components/shop/ProductGrid";

const PAGE_SIZE = 12;

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPage = Number(searchParams.get("page") || 1);

  const filters = {
    category: searchParams.get("category") || null,
    price:    searchParams.get("price") ? JSON.parse(searchParams.get("price")) : null,
    tag:      searchParams.get("tag") || null,
  };
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts]                 = useState([]);
  const [total, setTotal]                       = useState(0);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const priceRange = filters.price;
      const { products: data, total: count } = await getProducts({
        category: filters.category,
        minPrice: priceRange ? priceRange[0] : null,
        maxPrice: priceRange ? priceRange[1] : null,
        tag:      filters.tag,
        sort,
        page:     urlPage - 1,
        pageSize: PAGE_SIZE,
      });
      setProducts(data);
      setTotal(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.price, filters.tag, sort, urlPage]);

  // Load products when filters or pagination changes
  // Calling setState indirectly via loadProducts is necessary for data fetching
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  function updateParams(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined) next.delete(k);
      else next.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    });
    setSearchParams(next);
  }

  function handleFiltersChange(newFilters) {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (newFilters.category) next.set("category", newFilters.category);
    else next.delete("category");
    if (newFilters.price) next.set("price", JSON.stringify(newFilters.price));
    else next.delete("price");
    if (newFilters.tag) next.set("tag", newFilters.tag);
    else next.delete("tag");
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams(sort !== "newest" ? { sort } : {});
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-(--color-cream)">
      <SEOMeta
        title="Shop All Products"
        description="Browse our complete collection of skincare, makeup, haircare, and beauty essentials. Find premium products for your beauty routine."
        canonical={`${window.location.origin}/shop`}
      />
      <div className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) mb-2">
            De Lady's Beauty World
          </p>
          <h1 className="font-display text-[36px] font-light text-(--color-ink)">Shop all</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">
        <div className="hidden md:block">
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />
        </div>

        {mobileFilterOpen && (
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={(f) => { handleFiltersChange(f); setMobileFilterOpen(false); }}
            onClear={() => { clearFilters(); setMobileFilterOpen(false); }}
            isMobile
            onClose={() => setMobileFilterOpen(false)}
          />
        )}

        <div className="flex-1 min-w-0">
          <SortBar
            total={total}
            sort={sort}
            onSort={(val) => updateParams({ sort: val })}
            onFilterToggle={() => setMobileFilterOpen(true)}
          />

          <ProductGrid products={products} loading={loading} error={error} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                disabled={urlPage <= 1}
                onClick={() => updateParams({ page: urlPage - 1 })}
                className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParams({ page: p })}
                  className={`w-8 h-8 text-[12px] border rounded-sm transition-colors ${
                    p === urlPage
                      ? "bg-(--color-ink) text-(--color-cream) border-(--color-ink)"
                      : "border-(--color-border) text-(--color-muted) hover:border-(--color-ink) hover:text-(--color-ink)"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={urlPage >= totalPages}
                onClick={() => updateParams({ page: urlPage + 1 })}
                className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
