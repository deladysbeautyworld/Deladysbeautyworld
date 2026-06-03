import { Link } from "react-router-dom";

export default function Hero() {
  const productImage =
    "https://images.unsplash.com/photo-1627811015433-368c148f6c3c?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 min-h-135">

      {/* Left — copy */}
      <div className="bg-(--color-cream-dark) px-8 md:px-14 py-20 flex flex-col justify-center">
        <p className="text-[11px] tracking-[0.14em] uppercase text-(--color-faint) mb-6 font-normal">
          New arrival · Summer 2025 collection
        </p>

        <h1 className="font-display text-[52px] md:text-[60px] font-light leading-[1.05] text-(--color-ink) mb-5">
          Skin that<br /><em>speaks</em><br />for itself
        </h1>

        <p className="text-[14px] text-(--color-muted) leading-[1.8] max-w-sm mb-10 font-light">
          Clean formulas, consciously sourced. Skincare that works with your skin — not against it.
        </p>

        <div className="flex items-center gap-6">
          <Link
            to="/shop"
            className="bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal px-7 h-11 rounded-sm hover:bg-(--color-ink-soft) transition-colors duration-200 flex items-center"
          >
            Shop the collection
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors duration-200 font-normal"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Our story
          </Link>
        </div>
      </div>

      {/* Right — full bleed image with overlays */}
      <div className="relative min-h-80 md:min-h-auto overflow-hidden bg-(--color-cream-mid)">

        {/* Full bleed image */}
        <img
          src={productImage}
          alt="Lumière Radiance Serum"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Left-edge blend */}
        <div className="absolute inset-0 bg-linear-to-r from-[#F0EDE6]/30 via-transparent to-transparent" />

        {/* Bottom gradient for legibility */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

        {/* Top-right: brand badge */}
        <div className="absolute top-6 right-6 bg-white/85 backdrop-blur-sm border border-white/60 rounded-sm px-3.5 py-2.5 text-right">
          <p className="font-display text-[15px] italic text-(--color-ink)">Lumière</p>
          <p className="text-[9px] tracking-[0.12em] uppercase text-(--color-faint) mt-0.5">Radiance Serum</p>
        </div>

        {/* Bottom overlays */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          {/* Price + rating chip */}
          <div className="bg-white/85 backdrop-blur-sm border border-white/60 rounded-sm px-4 py-3">
            <div className="flex items-center gap-1 mb-1.5">
              {[1,2,3,4,5].map((i) => (
                <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="#C8A96E">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
              <span className="text-[10px] text-(--color-muted) ml-1 font-light">4.9 · 284 reviews</span>
            </div>
            <p className="text-[18px] font-medium text-(--color-ink) leading-none">$48.00</p>
          </div>

          {/* Best seller pill */}
          <div className="bg-(--color-ink) text-(--color-cream) text-[9px] tracking-[0.12em] uppercase font-normal px-3 py-1.5 rounded-sm">
            Best seller
          </div>
        </div>
      </div>
    </section>
  );
}
