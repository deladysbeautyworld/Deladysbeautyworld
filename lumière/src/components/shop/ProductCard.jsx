import { useState } from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import { useCartStore } from "../../stores/cartStore";

export default function ProductCard({ product }) {
  const { toggleFavorite, isFavorited } = useFavorites();
  const addItem = useCartStore((state) => state.addItem);
  const wishlisted = isFavorited(product.id);
  const [added, setAdded] = useState(false);

  function handleAddToCart(e) {
    e.preventDefault();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating));

  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative flex flex-col bg-white border border-(--color-border) rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-(--color-cream-mid) aspect-3/4">
        <img
          src={product.image_url || `https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80`}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Tags */}
        {product.tags?.includes("bestseller") && (
          <span className="absolute top-3 left-3 bg-(--color-ink) text-(--color-cream) text-[9px] tracking-widest uppercase px-2 py-1">
            Bestseller
          </span>
        )}

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          aria-label={wishlisted ? "Remove from favourites" : "Add to favourites"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className={wishlisted ? "text-(--color-pink)" : "text-(--color-ink)"}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className="w-full bg-(--color-ink) text-(--color-cream) text-[10px] tracking-widest uppercase py-3 hover:bg-(--color-ink-soft) transition-colors cursor-pointer"
          >
            {added ? "✓ Added" : "Quick Add"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="text-[10px] tracking-[0.12em] uppercase text-(--color-faint)">
          {product.categories?.name || "Skincare"}
        </p>
        <h3 className="text-[13px] font-medium text-(--color-ink) leading-snug">{product.name}</h3>

        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex gap-0.5">
            {stars.map((filled, i) => (
              <svg key={i} width="9" height="9" viewBox="0 0 24 24" fill={filled ? "var(--color-gold)" : "none"} stroke="var(--color-gold)" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="text-[10px] text-(--color-faint)">({product.review_count})</span>
        </div>

        <p className="text-[14px] font-medium text-(--color-ink) mt-auto pt-2">${Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  );
}
