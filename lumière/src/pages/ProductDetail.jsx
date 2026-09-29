import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SEOMeta from "../utils/seo";
import { getProductById, getRelatedProducts } from "../lib/products";
import { useCartStore } from "../stores/cartStore";
import ProductImage from "../components/shop/ProductImage";
import { getCanonicalUrl } from "../utils/seoConfig";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

const VARIANT_TYPE_LABELS = {
  shade: "Shade",
  size:  "Size",
  scent: "Scent",
};

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24"
            fill={i < Math.round(rating) ? "#C8A96E" : "none"}
            stroke={i < Math.round(rating) ? "#C8A96E" : "var(--color-border)"}
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <span className="text-[12px] text-(--color-muted) font-light">
        {rating} · {count} reviews
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
  const { id }     = useParams();
  const navigate   = useNavigate();
  const addItem    = useCartStore((s) => s.addItem);

  const [product, setProduct]           = useState(null);
  const [related, setRelated]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [quantity, setQuantity]         = useState(1);
  const [added, setAdded]               = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setAdded(false);
    setQuantity(1);
    setSelectedVariant(null);

    async function load() {
      try {
        const p = await getProductById(id);
        if (cancelled) return;
        setProduct(p);

        // Auto-select first variant if product has variants
        if (p.product_variants?.length > 0) {
          setSelectedVariant(p.product_variants[0]);
        }

        // Fetch related products in parallel — empty array if no category
        const related = p.category_id
          ? await getRelatedProducts(p.category_id, p.id, 4)
          : [];
        if (cancelled) return;
        setRelated(related ?? []);
      } catch {
        if (!cancelled) navigate("/shop");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const hasVariants = product?.product_variants?.length > 0;

  // Group variants by type (shade, size, scent)
  const variantGroups = hasVariants
    ? product.product_variants.reduce((acc, v) => {
        if (!acc[v.type]) acc[v.type] = [];
        acc[v.type].push(v);
        return acc;
      }, {})
    : {};

  // Effective price — use variant price if set, else product price
  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;

  // Effective stock — use variant stock if has variants, else product stock
  const effectiveStock = hasVariants
    ? (selectedVariant?.stock ?? 0)
    : (product?.stock ?? 0);

  const inStock = effectiveStock > 0;

  // Must select a variant if product has variants
  const canAddToCart = inStock && (!hasVariants || selectedVariant !== null);

  const handleAddToCart = () => {
    if (!product || !canAddToCart) return;
    addItem(product, quantity, hasVariants ? selectedVariant : null);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
      <SEOMeta
        title={product?.name || "Product"}
        description={product?.description || "View this product from De Lady's Beauty World"}
        canonical={getCanonicalUrl(`/product/${id}`)}
        ogImage={product?.image_url}
        ogType="product"
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase text-(--color-faint) mb-10">
        <Link to="/" className="hover:text-(--color-pink) transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-(--color-pink) transition-colors">Shop</Link>
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
            <ProductImage
              src={product.image_url}
              alt={product.name}
              name={product.name}
            />

            {/* Out of stock badge */}
            {!inStock && selectedVariant && (
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
              className="text-[11px] tracking-[0.12em] uppercase text-(--color-faint) hover:text-(--color-pink) transition-colors mb-3 w-fit"
            >
              {product.categories?.name}
            </Link>

            {/* Name */}
            <h1 className="font-display text-[38px] md:text-[44px] font-light text-(--color-ink) leading-[1.1] mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mb-4">
              <StarRating rating={product.rating} count={product.review_count} />
            </div>

            {/* Price — updates with variant */}
            <p className="text-[28px] font-medium text-(--color-ink) mb-6">
              {fmt(effectivePrice)}
            </p>

            {/* Description */}
            <p className="text-[14px] text-(--color-muted) leading-[1.8] font-light mb-6">
              {product.description}
            </p>

            {/* Variant selector */}
            {hasVariants && Object.entries(variantGroups).map(([type, variants]) => (
              <div key={type} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[11px] tracking-[0.1em] uppercase font-medium text-(--color-ink)">
                    {VARIANT_TYPE_LABELS[type] ?? type}
                  </p>
                  {selectedVariant && variantGroups[type]?.find(v => v.id === selectedVariant.id) && (
                    <p className="text-[11px] text-(--color-faint) font-light">
                      — {selectedVariant.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const isOOS = variant.stock === 0;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                          setAdded(false);
                        }}
                        disabled={isOOS}
                        className={`relative px-4 py-2 text-[12px] border rounded-sm transition-all duration-150 font-light ${
                          isSelected
                            ? "border-(--color-pink) bg-(--color-pink) text-white"
                            : isOOS
                            ? "border-(--color-border) text-(--color-faint) cursor-not-allowed line-through"
                            : "border-(--color-border) text-(--color-muted) hover:border-(--color-pink) hover:text-(--color-pink)"
                        }`}
                      >
                        {variant.name}
                        {/* Price diff label if variant has its own price */}
                        {variant.price && variant.price !== product.price && (
                          <span className="ml-1 text-[10px] opacity-70">
                            · {fmt(variant.price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] tracking-[0.08em] uppercase px-3 py-1.5 border border-(--color-border) text-(--color-muted) rounded-sm capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 mb-3">
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
                  onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                  disabled={!inStock}
                  className="w-10 h-full flex items-center justify-center text-(--color-muted) hover:text-(--color-ink) transition-colors disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`flex-1 h-11 text-[11px] tracking-widest uppercase font-normal rounded-sm transition-all duration-200 ${
                  added
                    ? "bg-green-600 text-white"
                    : canAddToCart
                    ? "bg-(--color-pink) text-white hover:bg-(--color-navy)"
                    : "bg-(--color-border) text-(--color-faint) cursor-not-allowed"
                }`}
              >
                {added
                  ? "✓ Added to cart"
                  : !inStock
                  ? "Out of stock"
                  : "Add to cart"}
              </button>
            </div>

            {/* Stock warning */}
            {inStock && effectiveStock <= 10 && (
              <p className="text-[11px] text-amber-600 tracking-wide font-light mb-4">
                Only {effectiveStock} left in stock
              </p>
            )}

            {/* Trust signals */}
            <div className="border-t border-(--color-border) mt-6 pt-6 flex flex-col gap-2.5">
              {[
                "Secure payment via KoraPay",
                "Nationwide delivery across Nigeria",
                "WhatsApp support available",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-pink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                <div className="aspect-[3/4] bg-(--color-cream-mid) rounded-sm mb-3 overflow-hidden flex items-center justify-center group-hover:bg-(--color-cream-dark) transition-colors duration-300">
                  <ProductImage
                    src={p.image_url}
                    alt={p.name}
                    name={p.name}
                  />
                </div>
                <p className="text-[13px] font-normal text-(--color-ink) mb-1 group-hover:underline underline-offset-2">
                  {p.name}
                </p>
                <p className="text-[13px] font-medium text-(--color-ink)">
                  {fmt(p.price)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}