import { lazy, Suspense, useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { useAuthStore } from "./stores/authStore";

const RootLayout = lazy(() => import("./components/layout/RootLayout"));
const ComingSoon = lazy(() => import("./components/common/ComingSoon"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Careers = lazy(() => import("./pages/Careers"));
const ProtectedRoute = lazy(() => import("./components/common/ProtectedRoute"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));
const Journal = lazy(() => import("./pages/Journal"));
const JournalPost = lazy(() => import("./pages/JournalPost.jsx"));
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Routines = lazy(() => import("./pages/Routines"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Overview = lazy(() => import("./pages/admin/Overview"));
const ProfileSettings = lazy(() => import("./pages/admin/ProfileSettings"));
const Orders = lazy(() => import("./pages/admin/Orders.jsx"));
const OrderDetail = lazy(() =>
  import("./pages/admin/Orders.jsx").then((module) => ({
    default: module.OrderDetail,
  }))
);
const Products = lazy(() => import("./pages/admin/ProductsReadOnly.jsx"));
const Customers = lazy(() => import("./pages/admin/Customers.jsx"));
const CustomerDetail = lazy(() =>
  import("./pages/admin/Customers.jsx").then((module) => ({
    default: module.CustomerDetail,
  }))
);
const PromoCodes = lazy(() => import("./pages/admin/PromoCodes.jsx"));
const Categories = lazy(() => import("./pages/admin/Categories.jsx"));
const DeliveryZones = lazy(() => import("./pages/admin/DeliveryZones.jsx"));
const AdminJournal = lazy(() => import("./pages/admin/Journal.jsx"));
const JournalEditor = lazy(() => import("./pages/admin/JournalEditor.jsx"));
const Announcements = lazy(() => import("./pages/admin/Announcements.jsx"));
const AdminNotFound = lazy(() => import("./pages/admin/AdminNotFound"));
const Profile = lazy(() => import("./pages/Profiles/profile"));

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
      { path: "announcements", element: <Announcements /> },

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

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-(--color-muted)">
          Loading…
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}