import { useState } from "react";

const REVIEWS = [
  {
    initials: "AK",
    name: "Amara K.",
    handle: "Verified buyer",
    rating: 5,
    text: "My skin has never looked this good. The serum alone changed my whole morning routine.",
  },
  {
    initials: "SL",
    name: "Sophie L.",
    handle: "Verified buyer",
    rating: 5,
    text: "Clean ingredients I can actually read. Finally a brand that's honest about what goes into their products.",
  },
  {
    initials: "TO",
    name: "Tolu O.",
    handle: "Verified buyer",
    rating: 5,
    text: "The moisturiser is genuinely the best I've tried. No greasy feeling, absorbs fast. Worth every penny.",
  },
  {
    initials: "NB",
    name: "Nadia B.",
    handle: "Verified buyer",
    rating: 5,
    text: "I was skeptical at first but the results after two weeks speak for themselves. My hyperpigmentation has visibly faded.",
  },
  {
    initials: "EO",
    name: "Emeka O.",
    handle: "Verified buyer",
    rating: 4,
    text: "Genuinely clean formula. No fragrance, no nonsense. The SPF is the best lightweight sunscreen I've found.",
  },
  {
    initials: "JM",
    name: "Jade M.",
    handle: "Verified buyer",
    rating: 5,
    text: "Ordered the bundle and have been using it for a month. My skin texture has completely transformed.",
  },
];

const REVIEWS_PER_PAGE = 3;

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12" height="12" viewBox="0 0 24 24"
          fill={i < count ? "var(--color-gold)" : "none"}
          stroke={i < count ? "var(--color-gold)" : "var(--color-border)"}
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="border border-(--color-border) rounded-sm p-7 bg-(--color-cream)">
      <StarRating count={review.rating} />
      <p className="font-display text-[15px] italic font-light text-(--color-ink-soft) leading-[1.8] mb-5">
        "{review.text}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-(--color-border) flex items-center justify-center text-[12px] font-medium text-(--color-muted) shrink-0">
          {review.initials}
        </div>
        <div>
          <p className="text-[13px] font-normal text-(--color-ink)">{review.name}</p>
          <p className="text-[11px] text-(--color-faint) font-light">{review.handle}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [activePage, setActivePage] = useState(0);

  const pages = Array.from(
    { length: Math.ceil(REVIEWS.length / REVIEWS_PER_PAGE) },
    (_, i) => REVIEWS.slice(i * REVIEWS_PER_PAGE, i * REVIEWS_PER_PAGE + REVIEWS_PER_PAGE)
  );

  // Guard against activePage going out of bounds if REVIEWS shrinks
  const currentPage = Math.min(activePage, pages.length - 1);
  const hasMultiplePages = pages.length > 1;

  const prev = () => setActivePage((p) => (p === 0 ? pages.length - 1 : p - 1));
  const next = () => setActivePage((p) => (p === pages.length - 1 ? 0 : p + 1));

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 md:px-12">
      <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10">
        <h2 className="font-display text-[36px] font-normal leading-none text-(--color-ink) sm:text-[48px]">
          What people say
        </h2>

        {hasMultiplePages && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous testimonials"
              onClick={prev}
              className="w-9 h-9 rounded-full border border-(--color-border) text-(--color-muted) flex items-center justify-center hover:text-(--color-ink) hover:border-(--color-ink) transition-colors duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next testimonials"
              onClick={next}
              className="w-9 h-9 rounded-full border border-(--color-border) text-(--color-muted) flex items-center justify-center hover:text-(--color-ink) hover:border-(--color-ink) transition-colors duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pages[currentPage].map((review, i) => (
          <ReviewCard key={`${currentPage}-${i}`} review={review} />
        ))}
      </div>

      {hasMultiplePages && (
        <div className="flex justify-center gap-2 mt-7">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show testimonial group ${i + 1}`}
              onClick={() => setActivePage(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                currentPage === i
                  ? "w-6 bg-(--color-ink)"
                  : "w-1.5 bg-(--color-border) hover:bg-(--color-faint)"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
