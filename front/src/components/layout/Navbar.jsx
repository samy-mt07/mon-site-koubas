import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, ShoppingCart, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import styles from "./Navbar.module.css";

function Navbar({ onUserClick }) {
  const { isLoggedIn, logout } = useAuth();
  const { totalCount, openDrawer } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionVisible, setIsCollectionVisible] = useState(false);
  const isCollectionActive = location.pathname === "/" && isCollectionVisible;
  const observerRef = useRef(null);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showAccountMenu) return;

    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAccountMenu]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (location.pathname !== "/") {
      return;
    }

    const el = document.getElementById("collection");
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsCollectionVisible(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(el);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [location.pathname]);

  const goToCollection = (event) => {
    event.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname === "/") {
      document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: "collection" } });
    }
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <Link to="/">AURA SCENTS</Link>
        </div>

        <ul className={styles.navLinks}>
          <li>
            <a
              href="#collection"
              className={isCollectionActive ? styles.activeLink : ""}
              onClick={goToCollection}
            >
              Ma Collection
            </a>
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
          <div className={styles.accountWrapper} ref={accountMenuRef}>
            <button
              type="button"
              className={styles.authButton}
              onClick={() => {
                if (isLoggedIn) {
                  setShowAccountMenu((value) => !value);
                  return;
                }
                onUserClick?.();
              }}
              aria-label={isLoggedIn ? "Mon compte" : "Connexion"}
            >
              <User size={20} />
            </button>

            {isLoggedIn && showAccountMenu && (
              <div className={styles.accountMenu}>
                <Link
                  to="/mes-commandes"
                  className={styles.accountMenuLink}
                  onClick={() => setShowAccountMenu(false)}
                >
                  Mes commandes
                </Link>
                <button
                  type="button"
                  className={styles.accountMenuLogout}
                  onClick={() => {
                    setShowAccountMenu(false);
                    setShowLogoutModal(true);
                  }}
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.cartButton}
            aria-label="Mon panier"
            onClick={openDrawer}
          >
            <ShoppingCart size={20} />
            {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
          </button>
          <button
            type="button"
            className={styles.menuToggle}
            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <ul className={styles.mobileNavLinks}>
          <li>
            <a
              href="#collection"
              className={isCollectionActive ? styles.activeLink : ""}
              onClick={goToCollection}
            >
              Ma Collection
            </a>
          </li>
          <li>
            <a href="#story" onClick={() => setIsMobileMenuOpen(false)}>
              Notre Histoire
            </a>
          </li>
          <li>
            <a href="#gifts" onClick={() => setIsMobileMenuOpen(false)}>
              Cadeaux
            </a>
          </li>
          <li>
            <a href="#blog" onClick={() => setIsMobileMenuOpen(false)}>
              Blog
            </a>
          </li>
          <li>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </a>
          </li>
        </ul>
      )}

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
                  logout();
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
