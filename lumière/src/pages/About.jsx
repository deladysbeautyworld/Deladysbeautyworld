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

      <div className="w-full max-w-7xl">
        {/* Hero & Narrative Section */}
        <section className="mb-24 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-sm">
            <img
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2070&auto=format&fit=crop"
              alt="Beauty and skincare consultation at De Lady's Beauty World"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <h1 className="mb-6 font-display text-[32px] font-light leading-tight text-(--color-ink) md:text-[48px]">
              Redefining beauty standards in Abuja and beyond.
            </h1>
            <h2 className="mb-8 max-w-2xl text-[18px] font-light leading-relaxed text-(--color-muted) md:text-[24px]">
              More than a retail brand — a beauty institution built on authenticity, education, and empowerment.
            </h2>
            <div className="max-w-3xl space-y-6 text-[14px] font-light leading-relaxed text-(--color-muted) md:text-[15px]">
              <p>
                Founded on the belief that every woman deserves access to genuine, high-performing beauty
                solutions, De Lady&apos;s Beauty World was created to challenge the prevalence of counterfeit
                products in the market. The mission was simple: create a space where authenticity is
                non-negotiable and quality is the standard.
              </p>
              <p>
                We understand that skincare is never one-size-fits-all. What works for one skin type may not
                work for another, and what works in one climate may not suit another. That is why we curate our
                collection with care, ensuring every product we offer is authentic, effective, and relevant to the
                needs of African skin and the Nigerian environment.
              </p>
              <p>
                Our goal is to go beyond the transaction. We want to equip our community with knowledge and
                confidence, helping women build routines that feel personal, informed, and beautiful.
              </p>
            </div>
          </div>
        </section>

        {/* Gold Standard Section */}
        <section className="mb-24 border-t border-(--color-border) pt-16">
          <h2 className="mb-8 font-display text-[24px] font-light text-(--color-ink)">
            Uncompromising quality, unwavering trust.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col rounded-sm border border-(--color-border) p-6">
              <span className="mb-3 text-[11px] font-light uppercase tracking-widest text-(--color-faint)">Authenticity</span>
              <h3 className="mb-2 font-display text-[18px] font-light text-(--color-ink)">100% authentic</h3>
              <p className="text-[13px] font-light leading-relaxed text-(--color-muted)">
                Zero tolerance for counterfeits. Every product is sourced directly from authorized
                distributors to ensure purity, efficacy, and confidence in every purchase.
              </p>
            </div>
            <div className="flex flex-col rounded-sm border border-(--color-border) p-6">
              <span className="mb-3 text-[11px] font-light uppercase tracking-widest text-(--color-faint)">Curation</span>
              <h3 className="mb-2 font-display text-[18px] font-light text-(--color-ink)">Climate-relevant</h3>
              <p className="text-[13px] font-light leading-relaxed text-(--color-muted)">
                Our catalog is chosen to perform beautifully in the heat, humidity, and skincare demands of the Nigerian climate.
              </p>
            </div>
            <div className="flex flex-col rounded-sm border border-(--color-border) p-6">
              <span className="mb-3 text-[11px] font-light uppercase tracking-widest text-(--color-faint)">Approach</span>
              <h3 className="mb-2 font-display text-[18px] font-light text-(--color-ink)">Efficacy-first</h3>
              <p className="text-[13px] font-light leading-relaxed text-(--color-muted)">
                We prioritize results-driven formulas that support visible skin improvement, healthy routines, and long-term confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Expert Guidance Section */}
        <section className="mb-24 grid grid-cols-1 items-center gap-12 rounded-sm bg-(--color-faint) p-8 md:grid-cols-2 md:p-12">
          <div className="order-2 relative aspect-square overflow-hidden rounded-sm md:order-1">
            <img
              src="https://images.unsplash.com/photo-1522337660859-0adc7cdf2799?q=80&w=2070&auto=format&fit=crop"
              alt="Professional beauty consultation"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="order-1 max-w-2xl md:order-2">
            <h2 className="mb-4 font-display text-[24px] font-light text-(--color-ink)">
              Your virtual dermatologist and makeup artist.
            </h2>
            <p className="mb-8 text-[14px] font-light leading-relaxed text-(--color-muted)">
              We believe beauty is a science. From understanding undertones to choosing the right actives,
              our approach is rooted in education and care. We do not just sell products — we help you build a
              routine that respects your skin and your lifestyle.
            </p>
            <Link
              to="/routines"
              className="flex h-11 items-center justify-center rounded-sm bg-(--color-ink) px-6 text-[11px] uppercase tracking-widest text-(--color-cream)"
            >
              Explore routines
            </Link>
          </div>
        </section>

        {/* Footprint Section */}
        <section className="mb-8">
          <h2 className="mb-6 font-display text-[24px] font-light text-(--color-ink)">
            Our footprint
          </h2>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <p className="mb-4 text-[11px] font-light uppercase tracking-widest text-(--color-faint)">Physical locations</p>
              <ul className="space-y-4 text-[14px] font-light text-(--color-muted)">
                <li>
                  <span className="block font-medium text-(--color-ink)">Habo Mall</span>
                  #128 Adetotunbo Ademola Crescent, Wuse II.
                </li>
                <li>
                  <span className="block font-medium text-(--color-ink)">Cappadors Center</span>
                  Alexandria Crescent, Off Aminu Kano Crescent, Beside Banex Plaza, Wuse II.
                </li>
                <li>
                  <span className="block font-medium text-(--color-ink)">Gwarinpa outlet</span>
                  #44 1st Avenue, Gwarinpa, beside Amba Bakery.
                </li>
              </ul>

              <div className="mt-8">
                <p className="mb-4 text-[11px] font-light uppercase tracking-widest text-(--color-faint)">Shipping & logistics</p>
                <p className="text-[14px] font-light leading-relaxed text-(--color-muted)">
                  Same-day delivery within Abuja and dependable nationwide shipping so your beauty essentials arrive when you need them.
                </p>
              </div>
            </div>
            <div className="lg:col-span-2 overflow-hidden rounded-sm border border-(--color-border)" style={{ height: "420px" }}>
              <iframe
                title="De Lady's Beauty World locations map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=De+Lady's+Beauty+World+Abuja&output=embed"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
