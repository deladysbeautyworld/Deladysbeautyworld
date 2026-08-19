import { Link } from "react-router-dom";
import cosBundle from "./../../assets/cos_bundle.jpg";

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
          With our inbuilt AI, you can now create a skincare routine by just selecting the products and clicking generate to get a routine for you
        </p>
        <Link
          to="/routines"
          className="self-start bg-(--color-cream-dark) text-(--color-ink) text-[11px] tracking-widest uppercase font-normal px-7 h-11 rounded-sm hover:bg-white transition-colors duration-200 flex items-center"
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
