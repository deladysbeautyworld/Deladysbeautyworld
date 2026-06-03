import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./components/Rootlayout";
import ComingSoon from "./components/ComingSoon";
import Home from "./pages/Home";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: <Shop /> },
      {path: "product/:id", element: <ProductDetail /> },
      {path: "cart", element: <Cart />},
      { path: "routines", element: <ComingSoon /> },
      { path: "ingredients", element: <ComingSoon /> },
      { path: "journal", element: <ComingSoon /> },
      { path: "about", element: <ComingSoon /> },
      { path: "*", element: <ComingSoon /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
