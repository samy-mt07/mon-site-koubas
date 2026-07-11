import React, { useEffect, useState } from "react";
import { User, ShoppingCart } from "lucide-react";
import styles from "./Navbar.module.css";

function Navbar({ isLoggedIn, onUserClick, onLogout }) {
  const [isScrolled, setIsScrolled] = useState(false);

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
          <a href="#">AURA SCENTS</a>
        </div>

        <ul className={styles.navLinks}>
          <li>
            <a href="#collections">Collection</a>
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
            onClick={isLoggedIn ? onLogout : onUserClick}
          >
            {isLoggedIn ? "Déconnexion" : "Authentifier"}
          </button>
          <button type="button" className={styles.cartButton} aria-label="Mon panier">
            <ShoppingCart size={20} />
            <span className={styles.badge}>3</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
