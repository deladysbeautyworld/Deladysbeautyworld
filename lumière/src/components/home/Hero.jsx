import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../../assets/background.jpg";
import bundleImage from "../../assets/cos_bundle.jpg";
import serumProductImage from "../../assets/serum-product.jpg";

const SLIDES = [
  {
    id: 1,
    title: "Let your\nbeauty make\nthe introduction.",
    subtitle: "Discover makeup, skincare and fragrance chosen to celebrate every shade, every mood, every woman.",
    label: "Beauty, beautifully yours",
    buttonText: "Shop the edit",
    buttonLink: "/shop",
    secondaryText: "Our beauty story",
    secondaryLink: "/about",
    image: heroImage,
    imageAlt: "A beauty portrait from De Lady's Beauty World",
    imageClass: "bg-[position:62%_center] sm:bg-[position:68%_center]",
    overlay: "from-[#171332]/85 via-[#171332]/55 to-[#171332]/10",
    theme: "dark",
  },
  {
    id: 2,
    title: "Expert skincare\nstarts with you.",
    subtitle: "Build a routine that feels right for your skin with carefully selected essentials for every day.",
    label: "Your daily skin ritual",
    buttonText: "Shop skincare",
    buttonLink: "/shop?category=Skincare",
    secondaryText: "Explore best sellers",
    secondaryLink: "/shop?sort=popular",
    overlay: "from-[#f5eee5] via-[#f5eee5] to-[#f5eee5]",
    backgroundColor: "#f5eee5",
    theme: "light",
  },
  {
    id: 3,
    title: "Your next\nbeauty favourite\nawaits.",
    subtitle: "Find the finishing touches and feel-good finds that make your routine your own.",
    label: "A little beauty discovery",
    buttonText: "Find your favourite",
    buttonLink: "/shop?sort=newest",
    secondaryText: "Browse all products",
    secondaryLink: "/shop",
    image: bundleImage,
    imageAlt: "A curated bundle of beauty products",
    imageClass: "bg-[position:70%_center] sm:bg-[position:74%_center]",
    overlay: "from-[#f8edf2]/95 via-[#f8edf2]/75 to-[#f8edf2]/10",
    theme: "light",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visible, setVisible] = useState(false);
  const slide = SLIDES[currentSlide];
  const isLight = slide.theme === "light";

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 50);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((index) => (index + 1) % SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const moveSlide = (direction) => {
    setCurrentSlide((index) => (index + direction + SLIDES.length) % SLIDES.length);
  };

  return (
    <section
      aria-label="Featured beauty collections"
      className="relative isolate min-h-[min(760px,calc(100svh-5rem))] overflow-hidden bg-[#171332] text-white sm:min-h-[min(800px,calc(100svh-6rem))]"
    >
      {SLIDES.map((item, index) => (
        item.image && (
          <div
            key={item.id}
            role="img"
            aria-label={item.imageAlt}
            className={`absolute inset-0 -z-20 bg-cover transition-opacity duration-1000 ${item.imageClass} ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url(${item.image})` }}
          />
        )
      ))}

      <div className={`absolute inset-0 -z-10 transition-colors duration-700 ${slide.backgroundColor ? "" : `bg-gradient-to-r ${slide.overlay}`}`} style={slide.backgroundColor ? { backgroundColor: slide.backgroundColor } : undefined} />
      <div className={`absolute inset-0 -z-10 ${currentSlide === 1 ? "bg-[radial-gradient(ellipse_at_76%_48%,rgba(255,255,255,0.78),transparent_38%)]" : isLight ? "bg-[radial-gradient(ellipse_at_75%_50%,rgba(255,255,255,0.12),transparent_42%)]" : "bg-[radial-gradient(ellipse_at_72%_45%,rgba(229,0,125,0.12),transparent_38%)]"}`} />

      <div className="mx-auto flex min-h-[min(760px,calc(100svh-5rem))] max-w-[1440px] items-center px-6 py-20 sm:min-h-[min(800px,calc(100svh-6rem))] sm:px-12 lg:px-20 xl:px-24">
        <div key={slide.id} className={`relative w-full ${currentSlide === 1 ? "grid items-center gap-8 lg:grid-cols-[1fr_0.8fr] lg:gap-4" : "max-w-[700px]"}`}>
          <div className={currentSlide === 1 ? "relative z-10 max-w-[640px]" : undefined}>
          <p className={`mb-7 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] transition-all duration-700 sm:text-[11px] ${isLight ? "text-[#805d72]" : "text-white/80"} ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
            <span className={`h-px w-10 ${isLight ? "bg-[#805d72]/60" : "bg-white/70"}`} aria-hidden="true" />
            {slide.label}
          </p>

          <h1
            className={`mb-7 whitespace-pre-line font-display text-[clamp(3.1rem,7.2vw,6.7rem)] font-normal leading-[0.96] tracking-[-0.045em] transition-all delay-100 duration-700 ${isLight ? "text-[#3b1230]" : "text-white"} ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            {slide.title}
          </h1>

          <p className={`mb-9 max-w-lg text-[15px] leading-[1.8] transition-all delay-200 duration-700 sm:text-[17px] ${isLight ? "text-[#644e5f]" : "text-white/80"} ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            {slide.subtitle}
          </p>

          <div className={`flex flex-col items-start gap-4 transition-all delay-300 duration-700 sm:flex-row sm:items-center sm:gap-7 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <Link
              to={slide.buttonLink}
              className={`inline-flex min-h-12 items-center gap-3 border-b pb-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${isLight ? "border-[#6a314d]/50 text-[#45172f] hover:border-[#d90078] hover:text-[#d90078]" : "border-white/60 text-white hover:border-white"}`}
            >
              {slide.buttonText}
              <span aria-hidden="true" className="text-base">→</span>
            </Link>
            <Link
              to={slide.secondaryLink}
              className={`text-[11px] font-medium uppercase tracking-[0.17em] transition-opacity hover:opacity-70 ${isLight ? "text-[#644e5f]" : "text-white/85"}`}
            >
              {slide.secondaryText}
            </Link>
          </div>
          </div>

          {currentSlide === 1 && (
            <div className="relative mt-4 flex h-[300px] items-center justify-center sm:h-[360px] lg:mt-0 lg:h-[440px] xl:h-[500px]">
              <img
                src={serumProductImage}
                alt="Amber glass skincare serum bottle on a stone pedestal"
                className="h-full w-full animate-[hero-bounce_3.2s_ease-in-out_infinite] object-contain drop-shadow-[0_24px_28px_rgba(65,45,25,0.18)]"
              />
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3 sm:bottom-9">
        {SLIDES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}: ${item.label}`}
            aria-current={index === currentSlide ? "true" : undefined}
            className={`h-1 rounded-full transition-all duration-300 ${index === currentSlide ? "w-9 bg-current" : "w-2 bg-current/40"} ${isLight ? "text-[#45172f]" : "text-white"}`}
          />
        ))}
        <span className={`ml-2 font-display text-xs tabular-nums ${isLight ? "text-[#644e5f]" : "text-white/75"}`}>0{currentSlide + 1} / 0{SLIDES.length}</span>
      </div>

      <button
        type="button"
        onClick={() => moveSlide(-1)}
        aria-label="Previous slide"
        className={`absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-colors sm:flex lg:left-8 ${isLight ? "border-[#45172f]/20 bg-white/45 text-[#45172f] hover:bg-white/80" : "border-white/50 bg-black/10 text-white hover:bg-white/15"}`}
      >
        <span aria-hidden="true" className="text-2xl leading-none">‹</span>
      </button>
      <button
        type="button"
        onClick={() => moveSlide(1)}
        aria-label="Next slide"
        className={`absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-colors sm:flex lg:right-8 ${isLight ? "border-[#45172f]/20 bg-white/45 text-[#45172f] hover:bg-white/80" : "border-white/50 bg-black/10 text-white hover:bg-white/15"}`}
      >
        <span aria-hidden="true" className="text-2xl leading-none">›</span>
      </button>
    </section>
  );
}
