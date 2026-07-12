import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, ShoppingCart, LogOut } from "lucide-react";
import styles from "./Navbar.module.css";

function Navbar({ isLoggedIn, onUserClick, onLogout, cartItems = [] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + Number(item?.quantity || 0), 0) : 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <Link to="/">AURA SCENTS</Link>
        </div>

        <ul className={styles.navLinks}>
          <li>
            <Link to="/products">Collection</Link>
          </li>
          <li>
            <a href="#story">Notre Histoire</a>
          </li>
          <li>
            <a href="#gifts">Cadeaux</a>
          </li>
          <li>
            <a href="#blog">Blog</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.authButton}
            onClick={() => {
              if (isLoggedIn) {
                setShowLogoutModal(true);
                return;
              }
              onUserClick?.();
            }}
            aria-label={isLoggedIn ? "Déconnexion" : "Connexion"}
          >
            {isLoggedIn ? <LogOut size={20} /> : <User size={20} />}
          </button>
          <button
            type="button"
            className={styles.cartButton}
            aria-label="Mon panier"
            onClick={() => {
              fetch("/api/orders/checkout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  customer: {
                    full_name: "Client",
                    email: "client@example.com",
                  },
                  cart: cartItems.map((item) => ({
                    product_id: item.id,
                    quantity: Number(item.quantity || 1),
                  })),
                  shipping: {
                    full_name: "Client",
                    phone: "0000000000",
                    address1: "1 rue de test",
                    city: "Montréal",
                    postal_code: "H1H1H1",
                    country: "Canada",
                  },
                }),
              })
                .then(async (response) => {
                  const data = await response.json();
                  if (!response.ok) {
                    throw new Error(data?.error || "Impossible d’ouvrir le panier.");
                  }
                  return data;
                })
                .then((data) => {
                  window.alert(`Commande créée avec succès : ${data.order_id || "n/a"}`);
                })
                .catch((error) => {
                  window.alert(error.message || "Impossible d’ouvrir le panier pour le moment.");
                });
            }}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelButton}
                onClick={() => setShowLogoutModal(false)}
              >
                Non
              </button>
              <button
                type="button"
                className={styles.modalConfirmButton}
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout?.();
                }}
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
