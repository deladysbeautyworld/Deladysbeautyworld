import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../lib/products";
import { supabase } from "../utils/supabase";
import FilterSidebar from "../components/shop/FilterSidebar";
import SortBar from "../components/shop/SortBar";
import ProductGrid from "../components/shop/ProductGrid";

const PAGE_SIZE = 12;

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive state from URL
  const filters = {
    category: searchParams.get("category") || null,
    price: searchParams.get("price") ? JSON.parse(searchParams.get("price")) : null,
    tag: searchParams.get("tag") || null,
  };
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page") || 1);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load categories once
  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  // Load products when filters/sort/page change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { products: data, total: count } = await getProducts({
        category: filters.category,
        priceRange: filters.price,
        tag: filters.tag,
        sort,
        page,
        limit: PAGE_SIZE,
      });
      setProducts(data);
      setTotal(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.tag, JSON.stringify(filters.price), sort, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  function updateParams(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined) next.delete(k);
      else next.set(k, typeof v === "object" ? JSON.stringify(v) : v);
    });
    // Reset page on filter change
    next.delete("page");
    setSearchParams(next);
  }

  function handleFiltersChange(newFilters) {
    updateParams({
      category: newFilters.category,
      price: newFilters.price,
      tag: newFilters.tag,
    });
  }

  function clearFilters() {
    setSearchParams(sort !== "newest" ? { sort } : {});
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-(--color-cream)">
      {/* Page header */}
      <div className="border-b border-(--color-border) bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) mb-2">Lumière</p>
          <h1 className="font-display text-[36px] font-light text-(--color-ink)">Shop all</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar — desktop */}
        <div className="hidden md:block">
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />
        </div>

        {/* Mobile sidebar */}
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

        {/* Main */}
        <div className="flex-1 min-w-0">
          <SortBar
            total={total}
            sort={sort}
            onSort={val => updateParams({ sort: val })}
            onFilterToggle={() => setMobileFilterOpen(true)}
          />

          <ProductGrid products={products} loading={loading} error={error} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                disabled={page <= 1}
                onClick={() => updateParams({ page: page - 1 })}
                className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer px-2"
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => updateParams({ page: p })}
                  className={`w-8 h-8 text-[12px] border rounded-sm transition-colors cursor-pointer ${
                    p === page
                      ? "bg-(--color-ink) text-(--color-cream) border-(--color-ink)"
                      : "border-(--color-border) text-(--color-muted) hover:border-(--color-ink) hover:text-(--color-ink)"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: page + 1 })}
                className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer px-2"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}