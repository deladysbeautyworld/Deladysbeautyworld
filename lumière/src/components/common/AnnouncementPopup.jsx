import { useEffect, useState } from "react";
import { getActiveAnnouncement } from "../../lib/admin.js";

const DISMISSED_KEY = "lumiere-dismissed-announcement";

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncement() {
      try {
        const activeAnnouncement = await getActiveAnnouncement();
        if (cancelled || !activeAnnouncement) return;

        if (
          window.sessionStorage.getItem(
            `${DISMISSED_KEY}:${activeAnnouncement.id}`
          ) === "true"
        ) {
          return;
        }

        setAnnouncement(activeAnnouncement);
      } catch (error) {
        console.error("Unable to load the current store announcement.", error);
      }
    }

    loadAnnouncement();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(
        `${DISMISSED_KEY}:${announcement.id}`,
        "true"
      );
    } catch (error) {
      console.error("Unable to save the announcement dismissal.", error);
    }
    setAnnouncement(null);
  };

  if (!announcement) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm"
      onClick={dismiss}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        className="relative w-full max-w-lg border border-(--color-border) bg-(--color-cream) px-7 py-10 shadow-2xl sm:px-11 sm:py-12"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close announcement"
          className="absolute right-4 top-4 p-2 text-2xl leading-none text-(--color-faint) transition-colors hover:text-(--color-ink)"
        >
          ×
        </button>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-(--color-pink)">
          Important update
        </p>
        <h2
          id="announcement-title"
          className="font-display text-3xl font-light leading-tight text-(--color-ink)"
        >
          {announcement.title}
        </h2>
        <p className="mt-5 whitespace-pre-wrap text-sm font-light leading-7 text-(--color-muted)">
          {announcement.message}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-8 h-11 w-full rounded-sm bg-(--color-pink) text-[11px] font-normal uppercase tracking-[0.16em] text-white transition-colors hover:bg-(--color-navy)"
        >
          Got it
        </button>
      </section>
    </div>
  );
}
