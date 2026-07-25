import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProductById, getProducts } from "../lib/products";
import { useCartStore } from "../stores/cartStore";

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24"
            fill={i < Math.round(rating) ? "var(--color-gold)" : "none"}
            stroke={i < Math.round(rating) ? "var(--color-gold)" : "var(--color-border)"}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <span className="text-[12px] text-(--color-muted) font-light">
        {rating} / {count} reviews
      </span>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
      <div className="aspect-square bg-(--color-border) rounded-sm" />
      <div className="flex flex-col gap-4 py-4">
        <div className="h-3 w-24 bg-(--color-border) rounded" />
        <div className="h-8 w-3/4 bg-(--color-border) rounded" />
        <div className="h-4 w-32 bg-(--color-border) rounded" />
        <div className="h-6 w-20 bg-(--color-border) rounded" />
        <div className="h-24 bg-(--color-border) rounded mt-4" />
        <div className="h-11 bg-(--color-border) rounded mt-4" />
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    setQuantity(1);

    getProductById(id)
      .then((p) => {
        setProduct(p);
        // Fetch related products from same category
        return getProducts({ category: p.categories?.slug, pageSize: 4 });
      })
      .then(({ products }) => {
        setRelated(products.filter((p) => p.id !== id));
      })
      .catch(() => navigate("/shop"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const inStock = product?.stock > 0;

  return (
    <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase text-(--color-faint) mb-10">
        <Link to="/" className="hover:text-(--color-ink) transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-(--color-ink) transition-colors">Shop</Link>
        {product && (
          <>
            <span>/</span>
            <span className="text-(--color-ink)">{product.name}</span>
          </>
        )}
      </nav>

      {/* Main content */}
      {loading ? (
        <SkeletonDetail />
      ) : product ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">

          {/* Image */}
          <div className="aspect-square bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 opacity-30">
                <div className="w-20 h-32 bg-(--color-stone) rounded-[40px_40px_4px_4px]" />
              </div>
            )}

            {/* Stock badge */}
            {!inStock && (
              <div className="absolute top-4 left-4 bg-white/90 text-(--color-ink) text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-sm">
                Out of stock
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col py-2">
            {/* Category */}
            <Link
              to={`/shop?category=${product.categories?.slug}`}
              className="text-[11px] tracking-[0.12em] uppercase text-(--color-faint) hover:text-(--color-ink) transition-colors mb-3 w-fit"
            >
              {product.categories?.name}
            </Link>

            {/* Name */}
            <h1 className="font-display text-[38px] md:text-[44px] font-light text-(--color-ink) leading-[1.1] mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mb-5">
              <StarRating rating={product.rating} count={product.review_count} />
            </div>

            {/* Price */}
            <p className="text-[28px] font-medium text-(--color-ink) mb-6">
              ${Number(product.price).toFixed(2)}
            </p>

            {/* Description */}
            <p className="text-[14px] text-(--color-muted) leading-[1.8] font-light mb-8">
              {product.description}
            </p>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] tracking-[0.08em] uppercase px-3 py-1.5 border border-(--color-border) text-(--color-muted) rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 mb-4">
              {/* Quantity selector */}
              <div className="flex items-center border border-(--color-border) rounded-sm h-11">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-full flex items-center justify-center text-(--color-muted) hover:text-(--color-ink) transition-colors"
                  aria-label="Decrease quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span className="w-10 text-center text-[14px] font-normal text-(--color-ink)">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-full flex items-center justify-center text-(--color-muted) hover:text-(--color-ink) transition-colors"
                  aria-label="Increase quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 h-11 text-[11px] tracking-widest uppercase font-normal rounded-sm transition-all duration-200 ${
                  added
                    ? "bg-(--color-success) text-white"
                    : inStock
                    ? "bg-(--color-ink) text-(--color-cream) hover:bg-(--color-ink-soft)"
                    : "bg-(--color-border) text-(--color-faint) cursor-not-allowed"
                }`}
              >
                {added ? "Added to cart" : inStock ? "Add to cart" : "Out of stock"}
              </button>
            </div>

            {/* Stock indicator */}
            {inStock && product.stock <= 10 && (
              <p className="text-[11px] text-(--color-warning) tracking-widest font-light">
                Only {product.stock} left in stock
              </p>
            )}

            {/* Trust signals */}
            <div className="border-t border-(--color-border) mt-8 pt-6 flex flex-col gap-2.5">
              {[
                "Free shipping on orders over $60",
                "30-day returns, no questions asked",
                "Dermatologist tested formula",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[12px] text-(--color-muted) font-light">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Related products */}
      {related.length > 0 && (
        <div className="border-t border-(--color-border) pt-14">
          <h2 className="font-display text-[28px] font-light text-(--color-ink) mb-8">
            You may also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group cursor-pointer">
                <div className="aspect-3/4 bg-(--color-cream-mid) rounded-sm mb-3 overflow-hidden flex items-center justify-center group-hover:bg-(--color-cream-dark) transition-colors duration-300">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-10 h-16 bg-(--color-stone) rounded-[20px_20px_3px_3px] opacity-40" />
                  )}
                </div>
                <p className="text-[13px] font-normal text-(--color-ink) mb-1 group-hover:underline underline-offset-2 transition-all">
                  {p.name}
                </p>
                <p className="text-[13px] font-medium text-(--color-ink)">
                  ${Number(p.price).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
