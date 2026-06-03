import { useState } from "react";

const PRODUCTS = [
  {
    id: 1,
    name: "Radiance Vitamin C Serum",
    type: "Serum · 30ml",
    price: "$48.00",
    rating: "4.9",
    tag: "Best seller",
    bg: "#EDE9E2",
    bgImage: "https://images.unsplash.com/photo-1729701494051-7013553fafa5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    name: "Barrier Repair Moisturiser",
    type: "Moisturiser · 50ml",
    price: "$62.00",
    rating: "4.7",
    tag: "New",
    bg: "#E5E8E2",
    bgImage: "https://images.unsplash.com/photo-1740097041788-171fa58b74ea?q=80&w=775&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    name: "Dewy SPF 50 Sunscreen",
    type: "SPF · 60ml",
    price: "$38.00",
    rating: "4.8",
    tag: null,
    bg: "#E2E5EA",
    bgImage: "https://images.unsplash.com/photo-1657023828553-18c23601c4d7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",   
  },
  {
    id: 4,
    name: "Gentle Exfoliant Toner",
    type: "Toner · 150ml",
    price: "$34.00",
    rating: "4.6",
    tag: "Sale",
    bg: "#EAE4E2",
    bgImage: "https://images.unsplash.com/photo-1687700997210-1501e2682f02?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

function ProductCard({ product }) {
  const [wished, setWished] = useState(false);

  return (
    <div className="product-card group cursor-pointer">
      {/* Image area */}
      <div
        className="product-img-wrap relative aspect-3/4 rounded-sm flex items-center justify-center mb-4 overflow-hidden"
        style={{ backgroundImage: `url(${product.bgImage})`, backgroundColor: product.bg, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Tag */}
        {product.tag && (
          <span className="absolute top-2.5 left-2.5 bg-(--color-ink) text-(--color-cream) text-[9px] tracking-widest uppercase px-2 py-1 rounded-sm font-normal z-10">
            {product.tag}
          </span>
        )}

        {/* Wishlist */}
        <button
          aria-label="Add to wishlist"
          onClick={(e) => { e.stopPropagation(); setWished(!wished); }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill={wished ? "#D4527A" : "none"}
            stroke={wished ? "#D4527A" : "#6a6a62"}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Quick add */}
        <button className="quick-add absolute bottom-0 left-0 right-0 bg-(--color-ink)/90 text-(--color-cream) text-[10px] tracking-widest uppercase py-3 translate-y-full transition-transform duration-200 ease-out font-normal hover:bg-(--color-ink)">
          Quick add
        </button>
      </div>

      {/* Info */}
      <p className="text-[14px] font-normal text-(--color-ink) mb-1">{product.name}</p>
      <p className="text-[12px] text-(--color-faint) mb-2.5 font-light">{product.type}</p>

      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-(--color-ink)">{product.price}</span>
        <div className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#C8A96E">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="text-[11px] text-(--color-faint) font-light">{product.rating}</span>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProducts() {
  return (
    <section className="px-6 md:px-10 py-16">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="font-display text-[32px] font-light text-(--color-ink)">
          Best sellers
        </h2>
        <button className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-(--color-faint) hover:text-(--color-ink) cursor-pointer transition-colors duration-200 font-normal">
          View all
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}