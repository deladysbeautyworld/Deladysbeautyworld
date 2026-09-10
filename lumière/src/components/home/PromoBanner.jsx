import { Link } from "react-router-dom";
import cosBundle from "./../../assets/cos_bundle.jpg";

export default function PromoBanner() {
  return (
    <div className="grid min-h-[28rem] grid-cols-1 overflow-hidden bg-(--color-navy) md:grid-cols-2">

      {/* Left — copy */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 md:px-16">
        <p className="text-[11px] tracking-[0.14em] uppercase text-(--color-faint) mb-4 font-normal">
          Limited time
        </p>
        <h2 className="mb-4 font-display text-[42px] font-normal leading-[1.05] text-white md:text-[56px]">
          Build your<br />perfect routine
        </h2>
        <p className="mb-8 max-w-xs text-[14px] font-light leading-[1.8] text-white/65">
          With our inbuilt AI, you can now create a skincare routine by just selecting the products and clicking generate to get a routine for you
        </p>
        <Link
          to="/routines"
          className="flex h-12 items-center self-start rounded-full bg-(--color-pink) px-8 text-[11px] font-medium uppercase tracking-widest text-white transition-colors duration-200 hover:bg-white hover:text-(--color-ink)"
        >
          Shop bundles
        </Link>
      </div>

      {/* Right — decorative bottles */}
      <div className="hidden md:flex items-center justify-center bg-(--color-navy-soft)">
          <img src={cosBundle} alt="Cosmetic Bundle" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}
