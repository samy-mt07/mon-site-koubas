import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import AuthCard from "../AuthCard";
import CartDrawer from "../cart/CartDrawer";
import Footer from "../Footer";
import ScrollToTop from "../ScrollToTop";
import PageTransition from "../PageTransition";
import { useAuth } from "../../context/AuthContext";

function Layout() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();

  // Compte connecté mais email non vérifié → on force l'écran de code avant
  // de laisser l'utilisateur naviguer, y compris juste après un refresh de
  // page (pas seulement au moment du login).
  const forceVerify = isLoggedIn && user && user.email_verified === false;
  const authModalOpen = isAuthOpen || forceVerify;

  return (
    <div className="page-shell">
      <ScrollToTop />
      <Navbar onUserClick={() => setIsAuthOpen(true)} />
      <main className="pageMain">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      {authModalOpen && (
        <AuthCard
          forceVerify={forceVerify}
          onClose={() => setIsAuthOpen(false)}
          onAuthenticated={() => setIsAuthOpen(false)}
        />
      )}
      <CartDrawer />
    </div>
  );
}

export default Layout;
