const CATEGORIES = [
  {
    name: "Brightening",
    count: "12 products",
    bg: "#D6CFC4",
    image: "https://images.unsplash.com/photo-1729701494051-7013553fafa5?q=80&w=900&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    position: "center",
  },
  {
    name: "Hydration",
    count: "18 products",
    bg: "#C9D4C7",
    image: "https://images.unsplash.com/photo-1740097041788-171fa58b74ea?q=80&w=900&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    position: "center",
  },
  {
    name: "Anti-aging",
    count: "9 products",
    bg: "#C8CEDB",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=900&auto=format&fit=crop",
    position: "center",
  },
  {
    name: "Sensitive skin",
    count: "14 products",
    bg: "#D9C9C9",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=900&auto=format&fit=crop",
    position: "center",
  },
  {
    name: "Acne control",
    count: "11 products",
    bg: "#D3CBD9",
    image: "https://images.unsplash.com/photo-1687700997210-1501e2682f02?q=80&w=900&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    position: "center",
  },
  {
    name: "Routines",
    count: "6 bundles",
    bg: "#CDD6CF",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=900&auto=format&fit=crop",
    position: "center",
  },
];

export default function Categories() {
  return (
    <section className="px-6 md:px-10 pb-16">
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="font-display text-[32px] font-light text-(--color-ink)">
          Shop by concern
        </h2>
        <button className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-(--color-faint) hover:text-(--color-ink) transition-colors duration-200 font-normal">
          All categories
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            style={{ backgroundColor: cat.bg }}
            className="relative h-45 md:h-50 rounded-sm text-left px-6 py-5 flex flex-col justify-end overflow-hidden group"
          >
            <img
              src={cat.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: cat.position }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/18 to-white/5" />
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-[2px] group-hover:scale-110 transition-transform duration-300" />

            <p className="relative z-10 font-display text-[22px] font-light text-white leading-tight drop-shadow-sm">
              {cat.name}
            </p>
            <p className="relative z-10 text-[11px] tracking-[0.08em] uppercase text-white/80 mt-1 font-normal">
              {cat.count}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
