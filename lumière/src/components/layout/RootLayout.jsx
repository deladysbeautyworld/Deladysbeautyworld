import { Outlet, ScrollRestoration } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import FavoritesSidebar from "../favorites/FavoritesSidebar";
import { FavoritesProvider } from "../../context/FavoritesContext";

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <ScrollRestoration />
      <NavBar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FavoritesSidebar />
    </FavoritesProvider>
  );
}
