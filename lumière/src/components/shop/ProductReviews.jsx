import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import {
  getCustomerProductRating,
  getProductReviewSummary,
  saveCustomerProductRating,
} from "../../lib/productReviews.js";

const STAR_VALUES = [1, 2, 3, 4, 5];

function Star({ filled, size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

export default function ProductReviews({ productId }) {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const [summary, setSummary] = useState({ rating: 0, count: 0 });
  const [savedRating, setSavedRating] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(null);
  const [loadedKey, setLoadedKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [successForKey, setSuccessForKey] = useState(null);
  const userId = user?.id;
  const requestKey = `${productId}:${userId ?? "guest"}`;
  const loading = loadedKey !== requestKey;
  const visibleSummary = loading ? { rating: 0, count: 0 } : summary;
  const error = loadedKey === requestKey
    ? loadError ?? (submissionError?.key === requestKey ? submissionError.message : null)
    : null;
  const success = successForKey === requestKey;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [nextSummary, currentRating] = await Promise.all([
          getProductReviewSummary(productId),
          userId ? getCustomerProductRating(productId, userId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setSummary(nextSummary);
        setSavedRating(currentRating);
        setSelectedRating(currentRating);
        setLoadError(null);
      } catch (loadError) {
        if (!cancelled) setLoadError(loadError.message);
      }
      if (!cancelled) setLoadedKey(requestKey);
    }

    load();
    return () => { cancelled = true; };
  }, [productId, requestKey, userId]);

  const handleSubmit = async () => {
    if (!userId || !selectedRating || saving || loading) return;

    setSaving(true);
    setSubmissionError(null);
    setSuccessForKey(null);
    try {
      const rating = await saveCustomerProductRating(productId, userId, selectedRating);
      const nextSummary = await getProductReviewSummary(productId);
      setSavedRating(rating);
      setSelectedRating(rating);
      setSummary(nextSummary);
      setSuccessForKey(requestKey);
    } catch (saveError) {
      setSubmissionError({ key: requestKey, message: saveError.message });
    } finally {
      setSaving(false);
    }
  };

  const starsToShow = hoveredRating ?? selectedRating ?? 0;

  return (
    <section aria-label="Product ratings" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          role="img"
          aria-label={visibleSummary.count
            ? `Rated ${visibleSummary.rating.toFixed(1)} out of 5 from ${visibleSummary.count} ratings`
            : "No ratings yet"}
          className="flex text-(--color-gold)"
        >
          {STAR_VALUES.map((value) => (
            <Star key={value} filled={value <= Math.round(visibleSummary.rating)} size={14} />
          ))}
        </div>
        <span className="text-[12px] text-(--color-muted) font-light">
          {loading
            ? "Loading ratings..."
            : visibleSummary.count
              ? `${visibleSummary.rating.toFixed(1)} · ${visibleSummary.count} ${visibleSummary.count === 1 ? "rating" : "ratings"}`
              : "No ratings yet"}
        </span>
      </div>

      {authLoading ? null : user ? loading ? (
        <span className="text-[11px] text-(--color-muted)">Loading your rating...</span>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[11px] text-(--color-muted)">
            {savedRating ? "Your rating" : "Rate this product"}
          </span>
          <div
            role="group"
            aria-label="Choose a product rating"
            className="flex items-center text-(--color-gold)"
            onMouseLeave={() => setHoveredRating(null)}
          >
            {STAR_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                aria-pressed={selectedRating === value}
                onMouseEnter={() => setHoveredRating(value)}
                onFocus={() => setHoveredRating(value)}
                onBlur={() => setHoveredRating(null)}
                onClick={() => {
                  setSelectedRating(value);
                  setSuccessForKey(null);
                }}
                className="p-1 text-(--color-gold) transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--color-pink)"
              >
                <Star filled={value <= starsToShow} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedRating || selectedRating === savedRating || saving}
            className="h-8 px-3 border border-(--color-border) text-[10px] tracking-widest uppercase text-(--color-ink) rounded-sm transition-colors hover:border-(--color-pink) disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : savedRating ? "Update rating" : "Submit rating"}
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-(--color-muted)">
          <Link to="/login" className="text-(--color-pink) underline underline-offset-2">
            Sign in
          </Link>{" "}
          to rate this product.
        </p>
      )}

      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
      {success && <p role="status" className="text-[11px] text-green-700">Thanks, your rating has been saved.</p>}
    </section>
  );
}