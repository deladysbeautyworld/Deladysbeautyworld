import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect } from "react";

import RootLayout from "./components/layout/RootLayout";
import ComingSoon from "./components/common/ComingSoon";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
/* import Checkout from "./pages/Checkout";  */// Add this
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { useAuthStore } from "./stores/authStore";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "product/:id", element: <ProductDetail /> },
      { path: "cart", element: <Cart /> },

      // Auth routes
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },

/*       // Protected route
      {
        path: "checkout",
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      }, */

      { path: "routines", element: <ComingSoon /> },
      { path: "ingredients", element: <ComingSoon /> },
      { path: "journal", element: <ComingSoon /> },
      { path: "about", element: <ComingSoon /> },

      { path: "*", element: <ComingSoon /> },
    ],
  },
]);

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return <RouterProvider router={router} />;
}
