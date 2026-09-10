import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import FavoritesSidebar from "../favorites/FavoritesSidebar";
import { FavoritesProvider } from "../../context/FavoritesContext";
import WhatsAppButton from "./../WhatsAppButton";

export default function RootLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  if (isAuthPage) {
    return (
      <FavoritesProvider>
        <ScrollRestoration />
        <Outlet />
      </FavoritesProvider>
    );
  }

  return (
    <FavoritesProvider>
      <ScrollRestoration />
      <div className="bg-(--color-navy) px-4 py-3.5 text-center text-[11px] font-medium tracking-[0.04em] text-white sm:text-[12px]">
        Complimentary delivery on orders over ₦50,000
      </div>
      <NavBar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FavoritesSidebar />
      <WhatsAppButton />
    </FavoritesProvider>
  );
}