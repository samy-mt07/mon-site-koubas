import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import AuthCard from "../AuthCard";
import CartDrawer from "../cart/CartDrawer";

function Layout() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="page-shell">
      <Navbar onUserClick={() => setIsAuthOpen(true)} />
      <main className="pageMain">
        <Outlet />
      </main>
      {isAuthOpen && (
        <AuthCard onClose={() => setIsAuthOpen(false)} onAuthenticated={() => setIsAuthOpen(false)} />
      )}
      <CartDrawer />
    </div>
  );
}

export default Layout;
