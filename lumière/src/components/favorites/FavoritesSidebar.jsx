import { useState, useLayoutEffect } from "react";
import { useFavorites } from "../../context/FavoritesContext";

export default function FavoritesSidebar() {
  const { isOpen, closeFavorites, favorites, removeFavorite } = useFavorites();
  const [rendered, setRendered] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  // Use useLayoutEffect to synchronize DOM state for CSS animations.
  // Setting state in effect is intentional for CSS transition sequencing.
  useLayoutEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRendered(true);
      // Use a microtask to ensure DOM is updated before animation
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    if (rendered) {
      setVisible(false);
      const timeoutId = window.setTimeout(() => setRendered(false), 300);
      return () => window.clearTimeout(timeoutId);
    }
  }, [isOpen, rendered]);

  if (!rendered) {
    return null;
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeFavorites}
      />
      <aside className={`fixed right-0 top-0 z-50 h-full w-full max-w-full bg-(--color-cream) border-l border-(--color-border) shadow-2xl overflow-y-auto transform transition-transform duration-300 ${
        visible ? "translate-x-0" : "translate-x-full"
      } sm:max-w-md md:max-w-lg lg:max-w-xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border) sm:px-6 sm:py-5">
          <div>
            <p className="text-[10px] tracking-[0.14em] uppercase text-(--color-faint) mb-1">Favorites</p>
            <h2 className="font-display text-[24px] font-light text-(--color-ink)">Your favourites</h2>
          </div>
          <button
            type="button"
            onClick={closeFavorites}
            className="text-(--color-muted) hover:text-(--color-ink) transition-colors duration-200"
            aria-label="Close favorites sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {favorites.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[14px] font-medium text-(--color-ink) mb-3">Nothing in your favorites yet.</p>
              <p className="text-[12px] text-(--color-faint)">Tap the heart icon on any product to save it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((product) => {
                const image = product.image || product.image_url || null;
                const rawPrice = String(product.price ?? product.price_display ?? "0").replace(/[^0-9.]/g, "");
                const displayPrice = Number(rawPrice) ? `$${Number(rawPrice).toFixed(2)}` : product.price || product.price_display || "$0.00";
                return (
                  <div key={product.id} className="flex items-center gap-4 rounded-sm border border-(--color-border) bg-white p-4">
                    <div className="h-16 w-16 rounded-sm overflow-hidden bg-(--color-cream-mid) shrink-0">
                      {image ? (
                        <img src={image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-(--color-pink)">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-(--color-ink) truncate">{product.name}</p>
                      <p className="text-[11px] text-(--color-faint) mt-1 truncate">{displayPrice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFavorite(product.id)}
                      className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink)"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
