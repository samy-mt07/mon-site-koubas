import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import AuthCard from "../AuthCard";
import CartDrawer from "../cart/CartDrawer";
import Footer from "../Footer";
import { useAuth } from "../../context/AuthContext";

function Layout() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isLoggedIn, user } = useAuth();

  // Compte connecté mais email non vérifié → on force l'écran de code avant
  // de laisser l'utilisateur naviguer, y compris juste après un refresh de
  // page (pas seulement au moment du login).
  const forceVerify = isLoggedIn && user && user.email_verified === false;
  const authModalOpen = isAuthOpen || forceVerify;

  return (
    <div className="page-shell">
      <Navbar onUserClick={() => setIsAuthOpen(true)} />
      <main className="pageMain">
        <Outlet />
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
