import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import SEOMeta from "../utils/seo";
import { getProducts } from "../lib/products";
import { supabase } from "../utils/supabase";
import FilterSidebar from "../components/shop/FilterSidebar";
import SortBar from "../components/shop/SortBar";
import ProductGrid from "../components/shop/ProductGrid";
import { getCanonicalUrl } from "../utils/seoConfig";

const PAGE_SIZE = 12;

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPage = Number(searchParams.get("page") || 1);

  const filters = useMemo(() => {
    const rawPrice = searchParams.get("price");
    let price = null;

    if (rawPrice) {
      try {
        const parsedPrice = JSON.parse(rawPrice);
        if (
          Array.isArray(parsedPrice) &&
          parsedPrice.length === 2 &&
          parsedPrice.every((value) => value === null || Number.isFinite(Number(value)))
        ) {
          price = parsedPrice.map((value) => (value === null ? null : Number(value)));
        }
      } catch {
        // Ignore malformed filter URLs and load the unfiltered catalogue.
      }
    }

    return {
      category: searchParams.get("category") || null,
      price,
      tag: searchParams.get("tag") || null,
    };
  }, [searchParams]);
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts]                 = useState([]);
  const [total, setTotal]                       = useState(0);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm]             = useState("");

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (searchTerm.trim()) {
      next.set("tag", searchTerm.trim());
    } else {
      next.delete("tag");
    }
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-(--color-cream)">
      <SEOMeta
        title="Shop All Products"
        description="Browse our complete collection of skincare, makeup, haircare, and beauty essentials. Find premium products for your beauty routine."
        canonical={getCanonicalUrl("/shop")}
      />
      <div className="border-b border-(--color-border) bg-(--color-navy) text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 md:px-12">
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-(--color-pink-light)">
            De Lady's Beauty World
          </p>
          <h1 className="font-display text-[36px] font-normal leading-none sm:text-[52px]">Shop all</h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 py-8 sm:py-10 flex gap-6 lg:gap-10 md:px-12">
        <div className="hidden md:block">
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />
        </div>

        <div className="w-full md:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center gap-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              className="h-11 flex-1 rounded-sm border border-(--color-border) bg-white px-3 text-[13px] text-(--color-ink) placeholder-(--color-faint) outline-none focus:border-(--color-pink)"
            />
            <button
              type="submit"
              className="h-11 rounded-sm bg-(--color-pink) px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-white"
            >
              Search
            </button>
          </form>
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
