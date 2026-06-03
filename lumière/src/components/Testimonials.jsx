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
];

const REVIEWS_PER_PAGE = 3;

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12" height="12" viewBox="0 0 24 24"
          fill={i < count ? "#C8A96E" : "none"}
          stroke={i < count ? "#C8A96E" : "#D4CFC5"}
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

      <p className="font-display text-[15px] italic font-light text-[#4a4a44] leading-[1.8] mb-5">
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
    (_, pageIndex) =>
      REVIEWS.slice(
        pageIndex * REVIEWS_PER_PAGE,
        pageIndex * REVIEWS_PER_PAGE + REVIEWS_PER_PAGE
      )
  );
  const hasMultiplePages = pages.length > 1;

  const goToPreviousPage = () => {
    setActivePage((page) => (page === 0 ? pages.length - 1 : page - 1));
  };

  const goToNextPage = () => {
    setActivePage((page) => (page === pages.length - 1 ? 0 : page + 1));
  };

  return (
    <section className="px-6 md:px-10 py-16">
      <div className="flex items-center justify-between gap-4 mb-10">
        <h2 className="font-display text-[32px] font-light text-(--color-ink)">
          What people say
        </h2>

        {hasMultiplePages && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous testimonials"
              onClick={goToPreviousPage}
              className="w-9 h-9 rounded-full border border-(--color-border) text-(--color-muted) flex items-center justify-center hover:text-(--color-ink) hover:border-(--color-ink) transition-colors duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next testimonials"
              onClick={goToNextPage}
              className="w-9 h-9 rounded-full border border-(--color-border) text-(--color-muted) flex items-center justify-center hover:text-(--color-ink) hover:border-(--color-ink) transition-colors duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pages[activePage].map((review) => (
          <ReviewCard key={review.name} review={review} />
        ))}
      </div>

      {hasMultiplePages && (
        <div className="flex justify-center gap-2 mt-7">
          {pages.map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              aria-label={`Show testimonial group ${pageIndex + 1}`}
              onClick={() => setActivePage(pageIndex)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                activePage === pageIndex
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
