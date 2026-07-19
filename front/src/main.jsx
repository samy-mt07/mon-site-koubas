import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import AboutStory from "./pages/AboutStory";
import ComingSoon from "./components/ComingSoon";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import CheckoutPage from "./pages/CheckoutPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import AdminDashBoard from "./pages/AdminDashBoard";
import OAuthCallback from "./pages/OAuthCallback";
import DataPolicy from "./components/DataPolicy";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/notre-histoire" element={<AboutStory />} />
                  <Route path="/blog" element={<ComingSoon section="Blog" />} />
                  <Route path="/cadeaux" element={<ComingSoon section="Cadeaux" />} />
                  <Route path="/produit/:id" element={<ProductDetail />} />
                  <Route path="/panier" element={<CartPage />} />
                  <Route path="/mes-commandes" element={<OrdersPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/success" element={<SuccessPage />} />
                  <Route path="/cancel" element={<CancelPage />} />
                  <Route path="/oauth-callback" element={<OAuthCallback />} />
                  <Route path="/products" element={<Navigate to="/" replace />} />
                  <Route path="/politique-confidentialite" element={<DataPolicy />} />
                  <Route path="/admin" element={<AdminDashBoard />} />
                </Route>
              </Routes>
            </ToastProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
