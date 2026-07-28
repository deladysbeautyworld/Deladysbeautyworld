import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect } from "react";

import RootLayout from "./components/layout/RootLayout";
import ComingSoon from "./components/common/ComingSoon";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OrderConfirmation from "./pages/OrderConfirmation";

import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import ProfileSettings from "./pages/admin/ProfileSettings";
import AdminNotFound from "./pages/admin/AdminNotFound";

import { useAuthStore } from "./stores/authStore";

const router = createBrowserRouter([
  // ---- Public + auth routes (wrapped in RootLayout) ----
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

      // Protected route
      {
        path: "checkout",
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      { path: "order-confirmation", element: <OrderConfirmation /> },

      { path: "routines", element: <ComingSoon /> },
      { path: "ingredients", element: <ComingSoon /> },
      { path: "journal", element: <ComingSoon /> },
      { path: "about", element: <ComingSoon /> },

      { path: "*", element: <ComingSoon /> },
    ],
  },

  // ---- Admin section (no public chrome) ----
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: "profile", element: <ProfileSettings /> },
      // Future children:
      // { path: "orders",    element: <Orders /> },
      // { path: "products",  element: <AdminProducts /> },
      // { path: "customers", element: <AdminCustomers /> },
      { path: "*", element: <AdminNotFound /> },
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
