import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFeaturedProducts } from "../../lib/products";

const SLIDE_CONFIGS = [
  {
    id: 1,
    title: "Let your\nbeauty make\nthe introduction.",
    subtitle: "Discover makeup, skincare and fragrance chosen to celebrate every shade, every mood, every woman.",
    label: "Beauty, beautifully yours",
    buttonText: "Shop the edit",
    buttonLink: "/shop",
    secondaryText: "Our beauty story",
    secondaryLink: "/about",
    bgGradient: "bg-[linear-gradient(135deg,rgba(23,19,50,1)_0%,rgba(40,32,79,1)_100%)]",
    accentColor: "var(--color-pink)",
    tag: "Most Recommended",
  },
  {
    id: 2,
    title: "Best Selling\nSkin Essentials\nfor Glow.",
    subtitle: "Experience the magic of our most loved products, designed to give you that timeless, radiant look.",
    label: "Most Loved Products",
    buttonText: "Shop Best Sellers",
    buttonLink: "/shop?sort=popular",
    secondaryText: "View Collection",
    secondaryLink: "/shop",
    bgGradient: "bg-[linear-gradient(135deg,rgba(60,20,60,1)_0%,rgba(80,30,60,1)_100%)]",
    accentColor: "var(--color-gold)",
    tag: "Trending Now",
  },
  {
    id: 3,
    title: "New Arrivals\nFresh Beauty\nFor Every Day.",
    subtitle: "Stay ahead of the trend with our latest arrivals in makeup and skincare. Freshly curated for you.",
    label: "Just Arrived",
    buttonText: "Explore New",
    buttonLink: "/shop?sort=newest",
    secondaryText: "See What's New",
    secondaryLink: "/shop",
    bgGradient: "bg-[linear-gradient(135deg,rgba(60,10,40,1)_0%,rgba(80,20,50,1)_100%)]",
    accentColor: "var(--color-pink-light)",
    tag: "Exclusive Drop",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visible, setVisible] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function loadProduct() {
      try {
        const products = await getFeaturedProducts(1);
        if (products && products.length > 0) {
          setFeaturedProduct(products[0]);
        }
      } catch (err) {
        console.error("Hero: Could not load featured product", err);
      }
    }
    loadProduct();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_CONFIGS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDE_CONFIGS[currentSlide];

  return (
    <section className="relative isolate min-h-[calc(100svh-9rem)] overflow-hidden bg-(--color-navy) text-white sm:min-h-[calc(100svh-10rem)]">
      {/* Dynamic Gradient Background */}
      <div className={`absolute inset-0 -z-10 transition-all duration-1000 ${slide.bgGradient}`} />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_68%_45%,rgba(229,0,125,0.15),transparent_35%)]" />

      {/* Abstract Decorative Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-(--color-pink) rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute top-1/2 -left-24 w-64 h-64 bg-(--color-gold) rounded-full blur-[100px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="mx-auto flex min-h-[calc(100svh-10rem)] max-w-[1440px] items-center px-5 py-14 sm:min-h-[calc(100svh-11rem)] sm:px-8 md:px-12 lg:px-12 xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

          {/* Text Column */}
          <div className="z-10">
            <p
              className={`mb-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/80 transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              <span className="text-base" style={{ color: slide.accentColor }}>✦</span>
              {slide.label}
            </p>

            <h1
              className={`mb-6 font-display text-[48px] font-normal leading-[0.98] tracking-[-0.02em] text-white transition-all duration-700 delay-100 sm:text-[60px] md:text-[68px] xl:text-[82px] ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ whiteSpace: "pre-line" }}
            >
              {slide.title}
            </h1>

            <p
              className={`mb-9 max-w-md text-[15px] font-light leading-[1.8] text-white/70 transition-all duration-700 delay-200 sm:text-[16px] ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {slide.subtitle}
            </p>

            <div
              className={`flex flex-col items-start gap-3 transition-all duration-700 delay-300 sm:flex-row sm:items-center sm:gap-5 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Link
                to={slide.buttonLink}
                className="flex h-12 items-center gap-3 rounded-full bg-(--color-pink) px-8 text-[13px] font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#f20b8e]"
              >
                {slide.buttonText}
                <span aria-hidden="true" className="text-lg leading-none">→</span>
              </Link>
              <Link
                to={slide.secondaryLink}
                className="flex h-12 items-center rounded-full border border-white/70 px-8 text-[13px] font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
              >
                {slide.secondaryText}
              </Link>
            </div>
          </div>

          {/* Product Display Column */}
          <div className="hidden lg:flex items-center justify-center relative">
            {/* Bouncing Animation Container */}
            <div className="relative w-80 h-80 flex items-center justify-center animate-bounce-slow">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse" />

              {featuredProduct ? (
                <div className="relative z-10 group">
                  {/* Product Badge */}
                  <div className="absolute -top-8 -right-12 bg-white text-(--color-navy) text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg rotate-12 animate-float">
                    {slide.tag}
                  </div>

                  <div className="relative w-64 h-64 overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 p-4 transition-transform duration-500 group-hover:scale-105">
                    <img
                      src={featuredProduct.image_url}
                      alt={featuredProduct.name}
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-64 h-64 rounded-2xl bg-white/10 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
          {SLIDE_CONFIGS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 transition-all duration-300 rounded-full ${
                index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
