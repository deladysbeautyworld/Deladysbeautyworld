import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect } from "react";

import RootLayout from "./components/layout/RootLayout";
import ComingSoon from "./components/common/ComingSoon";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Careers from "./pages/Careers";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Journal from "./pages/Journal";
import JournalPost from "./pages/JournalPost.jsx";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrderConfirmation from "./pages/OrderConfirmation";
import Routines from "./pages/Routines";

import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import ProfileSettings from "./pages/admin/ProfileSettings";
import Orders, { OrderDetail } from "./pages/admin/Orders.jsx";
import Products from "./pages/admin/ProductsReadOnly.jsx";
import Customers, { CustomerDetail } from "./pages/admin/Customers.jsx";
import PromoCodes from "./pages/admin/PromoCodes.jsx";
import Categories from "./pages/admin/Categories.jsx";
import DeliveryZones from "./pages/admin/DeliveryZones.jsx";
import AdminJournal from "./pages/admin/Journal.jsx";
import JournalEditor from "./pages/admin/JournalEditor.jsx";
import AdminNotFound from "./pages/admin/AdminNotFound";

import Profile from "./pages/Profiles/profile";

import { useAuthStore } from "./stores/authStore";

const router = createBrowserRouter([
  {
    path: "/admin/login",
    element: <AuthPage adminOnly />,
  },

  // -------------------------
  // Public + Auth Routes
  // -------------------------
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },

      { path: "shop", element: <Shop /> },
      { path: "product/:id", element: <ProductDetail /> },
      { path: "cart", element: <Cart /> },

      // Auth
      { path: "login", element: <AuthPage /> },
      { path: "signup", element: <AuthPage /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },

      // Protected
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

      // Other pages
      { path: "routines", element: <Routines /> },
      { path: "journal", element: <Journal /> },
      { path: "journal/:slug", element: <JournalPost /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "faq", element: <FAQ /> },
      { path: "shipping", element: <Shipping /> },
      { path: "returns", element: <Returns /> },
      { path: "privacy", element: <Privacy /> },
      { path: "terms", element: <Terms /> },
      { path: "cookies", element: <Cookies /> },
      { path: "careers", element: <Careers /> },

      // Public 404
      { path: "*", element: <ComingSoon /> },
    ],
  },

  // -------------------------
  // Admin Routes
  // -------------------------
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
      { path: "journal", element: <AdminJournal /> },
      { path: "journal/new", element: <JournalEditor /> },
      { path: "journal/:id/edit", element: <JournalEditor /> },

      { path: "customers", element: <Customers /> },
      { path: "customers/:id", element: <CustomerDetail /> },

      // Admin 404
      { path: "*", element: <AdminNotFound /> },
    ],
  },
]);

export default function App() {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return <RouterProvider router={router} />;
}