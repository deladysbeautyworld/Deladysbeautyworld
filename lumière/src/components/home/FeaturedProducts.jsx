import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeaturedProducts } from "../../lib/products.js";
import ProductCard from "../shop/ProductCard";

/**
 * Featured products on the homepage — pulls `is_featured = true` products from
 * Supabase via getFeaturedProducts(). Uses the standard ProductCard so each
 * tile gets favourites, quick-add, and the correct `/product/:id` link.
 */
export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getFeaturedProducts(4);
        if (cancelled) return;
        setProducts(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 md:px-12">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8 sm:mb-10">
        <h2 className="font-display text-[36px] font-normal leading-none text-(--color-ink) sm:text-[48px]">
          Best sellers
        </h2>
        <Link
          to="/shop"
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-(--color-pink) transition-colors duration-200 hover:text-(--color-ink)"
        >
          View all
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-(--color-border) rounded-sm overflow-hidden animate-pulse">
              <div className="aspect-3/4 bg-(--color-cream-mid)" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-2 w-1/3 bg-(--color-cream-mid) rounded" />
                <div className="h-3 w-3/4 bg-(--color-cream-mid) rounded" />
                <div className="h-3 w-1/4 bg-(--color-cream-mid) rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 text-[13px] text-red-700 rounded-sm px-4 py-3 font-light">
          Couldn't load featured products: {error}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-display text-[20px] font-light text-(--color-ink) mb-2">
            No featured products yet
          </p>
          <p className="text-[12px] text-(--color-muted) font-light mb-6">
            Mark some products as featured in the admin to showcase them here.
          </p>
          <Link
            to="/shop"
            className="text-[11px] tracking-widest uppercase text-(--color-pink) hover:text-(--color-ink) underline underline-offset-2"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
