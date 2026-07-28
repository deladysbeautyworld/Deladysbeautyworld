/**
 * Branded product image with a graceful no-photo fallback.
 *
 *  - If `src` is provided, renders it with the usual object-cover behaviour.
 *  - If `src` is missing or fails to load, renders an on-brand placeholder
 *    (cream gradient + product monogram + "De Lady's" tagline) instead of
 *    a broken-image icon or a stock Unsplash URL.
 *
 * Props:
 *   src       - image URL (optional)
 *   alt       - alt text; falls back to product name when shown as monogram
 *   name      - product name; first letters become the monogram
 *   className - extra classes for the wrapper
 *   priority  - if true, marks <img> as priority for lazy-loading libraries
 */
import { useState } from "react";

export default function ProductImage({ src, alt, name, className = "", priority = false }) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt || name || "Product image"}
        loading={priority ? "eager" : "lazy"}
        onError={() => setErrored(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  // Branded placeholder — used while the image is loading or missing entirely.
  const monogram = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      role="img"
      aria-label={alt || name || "Product image unavailable"}
      className={[
        "relative w-full h-full overflow-hidden",
        "bg-gradient-to-b from-(--color-pink-pale) via-(--color-cream-mid) to-(--color-cream)",
        className,
      ].join(" ")}
    >
      {/* Soft pink glow at the top */}
      <div
        aria-hidden
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-(--color-pink-light) opacity-25 blur-2xl"
      />

      {/* Monogram */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <div
          aria-hidden
          className="w-16 h-16 rounded-full border border-(--color-pink-light) bg-white/60 backdrop-blur-sm flex items-center justify-center mb-3"
        >
          <span className="font-display italic text-[22px] font-light text-(--color-pink)">
            {monogram || "DL"}
          </span>
        </div>
        <p className="text-[9px] tracking-[0.18em] uppercase text-(--color-faint) font-normal">
          Photo coming soon
        </p>
      </div>
    </div>
  );
}
