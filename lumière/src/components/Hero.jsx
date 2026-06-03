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
          <button className="bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal px-7 h-11 rounded-sm hover:bg-(--color-ink-soft) cursor-pointer transition-colors duration-200">
            Shop the collection
          </button>
          <button className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors duration-200 cursor-pointer font-normal">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Our story
          </button>
        </div>
      </div>

      {/* Right — visual placeholder */}
      <div className="bg-(--color-cream-mid) flex items-center justify-center min-h-80 md:min-h-auto relative overflow-hidden">
        {/* Background circle */}
        <div className="absolute w-70 h-70 rounded-full bg-(--color-stone) opacity-60 -translate-y-12" />

        {/* Bottle silhouette */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-39 h-66 bg-(--color-stone) rounded-[65px_65px_6px_6px] overflow-hidden border border-white/45 shadow-sm flex flex-col items-center pb-5">
            <img
              src={productImage}
              alt="Lumière Radiance Serum"
              className="w-full h-39 object-cover rounded-[64px_64px_5px_5px] border-b border-white/40 mb-4"
            />
            <span className="font-display text-[16px] italic text-[#6a6560]">Lumière</span>
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#8a8580] mt-1">Radiance Serum</span>
          </div>

          {/* Floating badge */}
          <div className="absolute -right-10 top-8 bg-white/80 backdrop-blur-sm border border-(--color-border) rounded-sm px-3 py-2">
            <p className="text-[9px] tracking-widest uppercase text-(--color-faint)">Best seller</p>
            <p className="text-[13px] font-medium text-(--color-ink) mt-0.5">$48.00</p>
          </div>
        </div>
      </div>
    </section>
  );
}
