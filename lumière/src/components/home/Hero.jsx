import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import heroImage from "../../assets/background.jpg";

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
    bgGradient: "bg-[linear-gradient(90deg,rgba(18,14,52,0.72)_0%,rgba(22,17,59,0.58)_34%,rgba(25,18,55,0.22)_61%,rgba(17,12,42,0.08)_100%)]",
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
    image: heroImage, // Using same placeholder, can be replaced with specific images
    bgGradient: "bg-[linear-gradient(90deg,rgba(40,20,60,0.72)_0%,rgba(50,25,70,0.58)_34%,rgba(60,30,80,0.22)_61%,rgba(30,15,50,0.08)_100%)]",
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
    image: heroImage,
    bgGradient: "bg-[linear-gradient(90deg,rgba(60,10,40,0.72)_0%,rgba(70,20,50,0.58)_34%,rgba(80,30,60,0.22)_61%,rgba(40,15,40,0.08)_100%)]",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <section className="relative isolate min-h-[calc(100svh-9rem)] overflow-hidden bg-(--color-navy) text-white sm:min-h-[calc(100svh-10rem)]">
      {/* Background Image with Transition */}
      {SLIDES.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 -z-20 bg-cover bg-position-[center_right_28%] sm:bg-position-[center_right_18%] transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${s.image})` }}
        />
      ))}

      {/* Dynamic Gradient Overlay */}
      <div className={`absolute inset-0 -z-10 transition-all duration-1000 ${slide.bgGradient}`} />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_68%_45%,rgba(229,0,125,0.1),transparent_28%)]" />

      {/* Editorial copy */}
      <div className="mx-auto flex min-h-[calc(100svh-10rem)] max-w-360 items-center px-5 py-14 sm:min-h-[calc(100svh-11rem)] sm:px-8 md:px-6 lg:px-6 xl:px-24">
        <div className="max-w-xl">
          <p
            className={`mb-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/80 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <span className="text-base text-(--color-pink-light)">✦</span>
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
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {SLIDES.map((_, index) => (
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
    </section>
  );
}
