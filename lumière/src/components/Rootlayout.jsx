import { Outlet, ScrollRestoration } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

export default function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <NavBar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
