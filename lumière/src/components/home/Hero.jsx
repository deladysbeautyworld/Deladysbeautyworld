import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../assets/logo.jpg";

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so animation fires after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 min-h-135">

      {/* Left — copy */}
      <div className="bg-(--color-cream-dark) px-6 sm:px-8 md:px-14 py-14 sm:py-20 flex flex-col justify-center">

        <p
          className={`text-[11px] tracking-[0.14em] uppercase text-(--color-faint) mb-6 font-normal transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          Makeup · Skincare · Fragrance
        </p>

        <h1
          className={`font-display text-[42px] sm:text-[52px] md:text-[60px] font-normal leading-[1.05] text-(--color-ink) mb-5 transition-all duration-700 delay-100 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Beauty that<br /><em>speaks</em><br />for itself
        </h1>

        <p
          className={`text-[14px] text-(--color-muted) leading-[1.8] max-w-sm mb-10 font-light transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Premium makeup, skincare and fragrance, delivered nationwide across Nigeria.
        </p>

        <div
          className={`flex items-center gap-6 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Link
            to="/shop"
            className="bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal px-7 h-11 rounded-sm hover:bg-(--color-navy) transition-colors duration-200 flex items-center"
          >
            Shop now
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors duration-200 font-normal"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Our story
          </Link>
        </div>
      </div>

      {/* Right — logo visual */}
      <div className="bg-(--color-cream-mid) flex items-center justify-center min-h-80 md:min-h-auto relative overflow-hidden">

        {/* Outer ring — slow pulse */}
        <div className="absolute w-80 h-80 sm:w-105 sm:h-105 rounded-full bg-(--color-pink)/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[ping_4s_ease-in-out_infinite]" />

        {/* Logo + tagline */}
        <div
          className={`relative z-10 flex flex-col justify-center items-center gap-5 transition-all duration-1000 delay-200 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <img
            src={logo}
            alt="De Lady's Beauty World"
            className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-500"
          />
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-(--color-pink)/40" />
            <p className="text-[10px] tracking-[0.18em] uppercase text-(--color-pink) font-normal">
              Est. in Nigeria
            </p>
            <div className="w-8 h-px bg-(--color-pink)/40" />
          </div>
        </div>

        {/* Top right badge */}
        <div className={`hidden md:block absolute top-6 right-6 bg-white/90 backdrop-blur-sm border border-(--color-border) rounded-sm px-3.5 py-2.5 text-right shadow-sm transition-all duration-700 delay-500 ${ visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4" }`} > <p className="text-[9px] tracking-[0.12em] uppercase text-(--color-faint) font-normal"> Trusted by </p> <p className="text-[14px] font-medium text-(--color-ink) mt-0.5"> 20K customers </p> </div>

        {/* Bottom left badge */}
        <div
          className={`hidden md:absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm border border-(--color-border) rounded-sm px-3.5 py-2.5 shadow-sm transition-all duration-700 delay-600 ${
            visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
          }`}
        >
          <p className="text-[9px] tracking-[0.12em] uppercase text-(--color-faint) font-normal mb-1">Nationwide delivery</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-(--color-pink) animate-pulse" />
            <p className="text-[12px] font-normal text-(--color-ink)">All 36 states</p>
          </div>
        </div>
      </div>
    </section>
  );
}