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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrderConfirmation from "./pages/OrderConfirmation";

import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import ProfileSettings from "./pages/admin/ProfileSettings";
import Orders, { OrderDetail } from "./pages/admin/Orders.jsx";
import Products from "./pages/admin/Products.jsx";
import Customers, { CustomerDetail } from "./pages/admin/Customers.jsx";
import PromoCodes from "./pages/admin/PromoCodes.jsx";
import Categories from "./pages/admin/Categories.jsx";
import DeliveryZones from "./pages/admin/DeliveryZones.jsx";
import AdminNotFound from "./pages/admin/AdminNotFound";
import Profile from "./pages/Profiles/profile";

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
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },

      // Protected route
      {
        path: "checkout",
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
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
      { path: "orders", element: <Orders /> },
      { path: "orders/:id", element: <OrderDetail /> },
      { path: "products", element: <Products /> },
      { path: "categories", element: <Categories /> },
      { path: "promo-codes", element: <PromoCodes /> },
      { path: "delivery-zones", element: <DeliveryZones /> },
      { path: "customers", element: <Customers /> },
      { path: "customers/:id", element: <CustomerDetail /> },
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
