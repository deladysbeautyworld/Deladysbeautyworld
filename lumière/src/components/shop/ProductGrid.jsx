import ProductCard from "./ProductCard";

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white border border-(--color-border) rounded-sm overflow-hidden animate-pulse">
      <div className="aspect-3/4 bg-(--color-cream-mid)" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-2 w-16 bg-(--color-stone) rounded" />
        <div className="h-3 w-3/4 bg-(--color-stone) rounded" />
        <div className="h-3 w-1/3 bg-(--color-stone) rounded mt-2" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, error }) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[13px] text-(--color-muted) mb-2">Something went wrong.</p>
        <p className="text-[11px] text-(--color-faint)">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-10 h-10 text-(--color-stone) mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-[14px] text-(--color-ink) font-medium mb-1">No products found</p>
        <p className="text-[12px] text-(--color-faint)">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}