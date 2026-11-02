import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProductPreview } from "../../lib/products";

const CATEGORIES = [
  {
    name: "Brightening",
    tag: "brightening",
    bg: "var(--color-pink-pale)",
  },
  {
    name: "Hydration",
    tag: "hydration",
    bg: "var(--color-cream-dark)",
  },
  {
    name: "Anti-aging",
    tag: "antiaging",
    bg: "var(--color-surface)",
  },
  {
    name: "Sensitive skin",
    tag: "sensitive",
    bg: "var(--color-cream-mid)",
  },
  {
    name: "Acne control",
    tag: "acne",
    bg: "var(--color-border)",
  },
  {
    name: "Routines",
    to: "/routines",
    description: "Build your routine",
    bg: "var(--color-pink-light)",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=900&auto=format&fit=crop",
  },
];

export default function Categories() {
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      CATEGORIES.filter((category) => category.tag).map(async (category) => {
        try {
          const preview = await getProductPreview(category.tag);
          return [category.tag, { ...preview, error: null }];
        } catch (error) {
          return [category.tag, { product: null, total: null, error }];
        }
      })
    ).then((results) => {
      if (!cancelled) {
        setPreviews(Object.fromEntries(results));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-(--color-surface) px-5 py-16 sm:px-8 sm:py-24 md:px-12">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8 sm:mb-10">
        <h2 className="font-display text-[36px] font-normal leading-none text-(--color-ink) sm:text-[48px]">
          Shop by Concern
        </h2>
        <Link
          to="/shop"
          className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-(--color-faint) hover:text-(--color-ink) transition-colors duration-200 font-normal"
        >
          All categories
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const preview = previews[cat.tag];
          const image = preview?.product?.image_url_source
            ? preview.product.image_url
            : cat.image;

          return (
            <Link
              key={cat.name}
              to={cat.to ?? `/shop?tag=${encodeURIComponent(cat.tag)}`}
              style={{ backgroundColor: cat.bg }}
              className="group relative flex h-56 flex-col justify-end overflow-hidden rounded-[1.25rem] px-5 py-5 text-left sm:h-72 sm:px-7 sm:py-7"
            >
              {image && (
                <img
                  src={image}
                  alt={preview?.product ? preview.product.name : `${cat.name} beauty products`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/18 to-white/5" />

              <p className="relative z-10 font-display text-[22px] font-light text-white leading-tight drop-shadow-sm">
                {cat.name}
              </p>
              <p
                className="relative z-10 text-[11px] tracking-[0.08em] uppercase text-white/80 mt-1 font-normal"
                title={preview?.error?.message}
              >
                {cat.description
                  || (preview?.error
                    ? "Products unavailable"
                    : preview
                      ? `${preview.total} ${preview.total === 1 ? "product" : "products"}`
                      : "Loading products…")}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
