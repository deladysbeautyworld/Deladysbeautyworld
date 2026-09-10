import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import heroImage from "../../assets/background.jpg";

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so animation fires after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative isolate min-h-[calc(100svh-9rem)] overflow-hidden bg-(--color-navy) text-white sm:min-h-[calc(100svh-10rem)]">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-[center_right_28%] sm:bg-[center_right_18%]"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(18,14,52,0.72)_0%,rgba(22,17,59,0.58)_34%,rgba(25,18,55,0.22)_61%,rgba(17,12,42,0.08)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_68%_45%,rgba(229,0,125,0.1),transparent_28%)]" />

      {/* Editorial copy */}
      <div className="mx-auto flex min-h-[calc(100svh-10rem)] max-w-[1440px] items-center px-5 py-14 sm:min-h-[calc(100svh-11rem)] sm:px-8 md:px-6 lg:px-6 xl:px-24">
        <div className="max-w-xl">

        <p
          className={`mb-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/80 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <span className="text-base text-(--color-pink-light)">✦</span>
          Beauty, beautifully yours
        </p>

        <h1
          className={`mb-6 font-display text-[48px] font-normal leading-[0.98] tracking-[-0.02em] text-white transition-all duration-700 delay-100 sm:text-[60px] md:text-[68px] xl:text-[82px] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Let your<br />beauty make<br />the <em>introduction.</em>
        </h1>

        <p
          className={`mb-9 max-w-md text-[15px] font-light leading-[1.8] text-white/70 transition-all duration-700 delay-200 sm:text-[16px] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Discover makeup, skincare and fragrance chosen to celebrate every shade, every mood, every woman.
        </p>

        <div
          className={`flex flex-col items-start gap-3 transition-all duration-700 delay-300 sm:flex-row sm:items-center sm:gap-5 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Link
            to="/shop"
            className="flex h-12 items-center gap-3 rounded-full bg-(--color-pink) px-8 text-[13px] font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#f20b8e]"
          >
            Shop the edit
            <span aria-hidden="true" className="text-lg leading-none">→</span>
          </Link>
          <Link
            to="/about"
            className="flex h-12 items-center rounded-full border border-white/70 px-8 text-[13px] font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
          >
            Our beauty story
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}