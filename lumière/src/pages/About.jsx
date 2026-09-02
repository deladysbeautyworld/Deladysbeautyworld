import { Link } from "react-router-dom";
import SEOMeta from "../utils/seo";

export default function About() {
  return (
    <div className="min-h-[80vh] flex flex-col items-start justify-start px-6 py-16">
      <SEOMeta
        title="About De Lady's Beauty World"
        description="Learn about De Lady's Beauty World, Abuja's premier beauty institution dedicated to authentic skincare, expert education, and empowering every woman."
        canonical={`${window.location.origin}/about`}
      />

      <div className="w-full max-w-4xl">
        {/* Hero & Narrative Section */}
        <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square overflow-hidden rounded-sm">
            <img
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2070&auto=format&fit=crop"
              alt="Founder and store of De Lady's Beauty World"
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h1 className="font-display text-[32px] md:text-[48px] font-light text-(--color-ink) mb-6 leading-tight">
              Redefining Beauty Standards in Abuja and Beyond.
            </h1>
            <h2 className="text-[18px] md:text-[24px] font-light text-(--color-muted) mb-8 leading-relaxed max-w-2xl">
              More than a retail brand—a beauty institution dedicated to authenticity, education, and the empowerment of every woman.
            </h2>
            <div className="space-y-6 text-[14px] md:text-[15px] font-light text-(--color-muted) leading-relaxed max-w-3xl">
              <p>
                Founded on the belief that everyone deserves access to genuine, high-efficacy beauty
                solutions, De Lady's Beauty World was born out of a necessity to combat the proliferation
                of counterfeit products in the market. For Florence, the mission was clear: to create a
                sanctuary where authenticity is non-negotiable and excellence is the standard.
              </p>
              <p>
                We understand that skincare is not one-size-fits-all. What works for one skin type may
                not work for another, and what works in one climate may fail in another. That's why we
                curate our collection with a clinical eye, ensuring every product we offer is not only
                authentic but also relevant to the unique needs of the African skin and the Nigerian environment.
              </p>
              <p>
                Our goal is to move beyond the transaction. We strive to empower our community through
                knowledge, helping women navigate the complexities of beauty with confidence and clarity.
              </p>
            </div>
          </div>
        </section>

        {/* Gold Standard Section */}
        <section className="mb-24 border-t border-(--color-border) pt-16">
          <h2 className="font-display text-[24px] font-light text-(--color-ink) mb-8">
            Uncompromising Quality, Unwavering Trust
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col p-6 border border-(--color-border) rounded-sm">
              <span className="text-[11px] tracking-widest uppercase text-(--color-faint) mb-3 font-light">Authenticity</span>
              <h3 className="font-display text-[18px] font-light text-(--color-ink) mb-2">100% Authentic</h3>
              <p className="text-[13px] font-light text-(--color-muted) leading-relaxed">
                Zero tolerance for counterfeits. Every product is sourced directly from authorized
                distributors to ensure purity and efficacy.
              </p>
            </div>
            <div className="flex flex-col p-6 border border-(--color-border) rounded-sm">
              <span className="text-[11px] tracking-widest uppercase text-(--color-faint) mb-3 font-light">Curation</span>
              <h3 className="font-display text-[18px] font-light text-(--color-ink) mb-2">Climate-Relevant</h3>
              <p className="text-[13px] font-light text-(--color-muted) leading-relaxed">
                Our catalog is specifically selected to perform optimally in the heat and humidity
                of the Nigerian climate.
              </p>
            </div>
            <div className="flex flex-col p-6 border border-(--color-border) rounded-sm">
              <span className="text-[11px] tracking-widest uppercase text-(--color-faint) mb-3 font-light">Approach</span>
              <h3 className="font-display text-[18px] font-light text-(--color-ink) mb-2">Efficacy-First</h3>
              <p className="text-[13px] font-light text-(--color-muted) leading-relaxed">
                We prioritize results-driven formulations that deliver visible improvements to skin
                health and appearance.
              </p>
            </div>
          </div>
        </section>

        {/* Expert Guidance Section */}
        <section className="mb-24 bg-(--color-faint) p-8 md:p-12 rounded-sm grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square overflow-hidden rounded-sm order-2 md:order-1">
            <img
              src="https://images.unsplash.com/photo-1570176063796-4534100b070a?q=80&w=2070&auto=format&fit=crop"
              alt="Professional beauty consultation"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="max-w-2xl order-1 md:order-2">
            <h2 className="font-display text-[24px] font-light text-(--color-ink) mb-4">
              Your Virtual Dermatologist & Makeup Artist.
            </h2>
            <p className="text-[14px] font-light text-(--color-muted) mb-8 leading-relaxed">
              We believe beauty is a science. From understanding the nuances of undertones to the
              precise layering of active ingredients, our approach is rooted in education. We don't
              just sell products; we guide you toward a routine that respects your skin's unique biology.
            </p>
            <Link
              to="/routines"
              className="inline-block h-11 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase rounded-sm px-6 flex items-center justify-center"
            >
              Explore Routines
            </Link>
          </div>
        </section>

        {/* Footprint Section */}
        <section className="mb-8">
          <h2 className="font-display text-[24px] font-light text-(--color-ink) mb-6">
            Our Footprint
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-(--color-faint) mb-4 font-light">Physical Locations</p>
              <ul className="space-y-3 text-[14px] font-light text-(--color-muted)">
                <li>Habo Mall, #128 Adetotunbo Ademola Crescent, Wuse II.</li>
                <li>Cappadors Center, Alexandria Crescent, Off Aminu Kano Crescent (Beside Banex Plaza), Wuse II.</li>
                <li>#44 1st Avenue, Gwarinpa (Beside Amba Bakery).</li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] tracking-widest uppercase text-(--color-faint) mb-4 font-light">Shipping & Logistics</p>
              <p className="text-[14px] font-light text-(--color-muted) leading-relaxed">
                Same-day delivery within Abuja. Dependable nationwide shipping to ensure your beauty
                essentials reach you, wherever you are in Nigeria.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
