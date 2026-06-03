export default function PromoBanner() {
  return (
    <div className="mx-6 md:mx-10 rounded-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-(--color-ink)">

      {/* Left — copy */}
      <div className="px-10 md:px-14 py-14 flex flex-col justify-center">
        <p className="text-[11px] tracking-[0.14em] uppercase text-(--color-faint) mb-4 font-normal">
          Limited time
        </p>
        <h2 className="font-display text-[36px] md:text-[42px] font-light text-(--color-cream-dark) leading-[1.1] mb-4">
          Build your<br />perfect routine
        </h2>
        <p className="text-[13px] text-(--color-faint) leading-[1.8] font-light mb-8 max-w-xs">
          Bundle any 3 products and save 20%. Formulated to work in harmony — morning to night.
        </p>
        <button className="self-start bg-(--color-cream-dark) text-(--color-ink) text-[11px] tracking-widest uppercase font-normal px-7 h-11 rounded-sm hover:bg-white transition-colors duration-200">
          Shop bundles
        </button>
      </div>

      {/* Right — decorative bottles */}
      <div className="hidden md:flex items-center justify-center bg-[#242420] px-10 py-10">
        <div className="flex items-end gap-4">
          {[
            { w: 52, h: 110, label: "C" },
            { w: 64, h: 148, label: "M" },
            { w: 46, h: 88,  label: "S" },
          ].map(({ w, h, label }) => (
            <div
              key={label}
              style={{ width: w, height: h }}
              className="bg-[#3a3a36] rounded-[50%_50%_4px_4px] flex items-end justify-center pb-2"
            >
              <span className="font-display text-[11px] italic text-[#6a6a62]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}