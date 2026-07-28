import { createContext, useContext, useEffect, useState, useCallback } from "react";

const FavoritesContext = createContext(null);
const STORAGE_KEY = "lumiere-favorites";
const EXPIRY_MS = 1000 * 60 * 60; // 1 hour

function loadFavorites() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const payload = JSON.parse(stored);
    if (!payload || typeof payload !== "object") return [];
    if (payload.expiresAt && payload.expiresAt > Date.now() && Array.isArray(payload.favorites)) {
      return payload.favorites;
    }
  } catch (error) {
    console.warn("Failed to load favorites", error);
  }
  window.localStorage.removeItem(STORAGE_KEY);
  return [];
}

function getFavoriteImage(product) {
  // Returns null when no image is available — the favorites sidebar
  // renders a branded placeholder in that case.
  return product.image_url || product.bgImage || product.image || null;
}

function createFavoriteItem(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price ?? product.price_display ?? product.price_display ?? 0,
    image: getFavoriteImage(product),
  };
}

function saveFavorites(favorites) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        expiresAt: Date.now() + EXPIRY_MS,
        favorites,
      })
    );
  } catch (error) {
    console.warn("Failed to save favorites", error);
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const openFavorites = useCallback(() => setIsOpen(true), []);
  const closeFavorites = useCallback(() => setIsOpen(false), []);

  const toggleFavorite = useCallback((product) => {
    setFavorites((current) => {
      const exists = current.some((item) => item.id === product.id);
      if (exists) {
        return current.filter((item) => item.id !== product.id);
      }
      return [...current, createFavoriteItem(product)];
    });
  }, []);

  const removeFavorite = useCallback((productId) => {
    setFavorites((current) => current.filter((item) => item.id !== productId));
  }, []);

  const isFavorited = useCallback(
    (productId) => favorites.some((item) => item.id === productId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        count: favorites.length,
        isOpen,
        openFavorites,
        closeFavorites,
        toggleFavorite,
        removeFavorite,
        isFavorited,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
