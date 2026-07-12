import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./layout/Navbar";
import AuthCard from "./AuthCard";
import "./ProductsPage.css";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem("authToken")));
  const [welcome, setWelcome] = useState("");
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();
        if (isMounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError("Les produits sont momentanément indisponibles.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatPrice = (cents) => `${(Number(cents) / 100).toFixed(2)} $`;

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return "";

    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith("/images/")) return imageUrl;

    if (imageUrl.includes("/public/images/")) {
      return imageUrl.replace(/^.*\/public\/images\//, "/images/");
    }

    if (imageUrl.startsWith("/home/")) {
      const fileName = imageUrl.split("/").pop();
      return fileName ? `/images/${fileName}` : "";
    }

    return imageUrl;
  };

  const handleLogin = (userObj) => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(Boolean(token));
    setIsAuthOpen(false);
    localStorage.setItem("authUser", JSON.stringify(userObj || null));
    const name = userObj?.full_name || userObj?.name || userObj?.email || "";
    setWelcome(`Bienvenue ${name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setWelcome(""), 2000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  const handleAddToCart = (product) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentItems, { id: product.id, name: product.name, quantity: 1 }];
    });
  };

  return (
    <div className="productsPageShell">
      <Navbar
        isLoggedIn={isLoggedIn}
        onUserClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        cartItems={cartItems}
      />
      <section className="productsPage">
        <div className="productsHeader">
        <p className="eyebrow">Collection</p>
        <h1>Nos parfums</h1>
        <p className="productsIntro">
          Découvrez des créations raffinées pensées pour sublimer votre intérieur.
        </p>
        <Link to="/" className="backLink">
          Retour à l’accueil
        </Link>
      </div>

      {loading && <p className="productsStatus">Chargement des produits…</p>}
      {error && <p className="productsStatus">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="productsStatus">Aucun produit disponible pour le moment.</p>
      )}

        {!loading && !error && products.length > 0 && (
          <div className="productsGrid">
            {products.map((product) => (
              <article key={product.id} className="productCard">
                <div className="productImageWrapper">
                  {product.image_url ? (
                    <img
                      src={resolveImageUrl(product.image_url)}
                      alt={product.name}
                      className="productImage"
                    />
                  ) : (
                    <div className="productPlaceholder">AURA SCENTS</div>
                  )}
                </div>
                <div className="productContent">
                  <h2>{product.name}</h2>
                  <div className="productPrice">{formatPrice(product.price_cents)}</div>
                  <div className="productRating" aria-label="Note de 5 étoiles">
                    <span className="stars">★★★★★</span>
                    <span className="ratingCount">(59)</span>
                  </div>
                </div>
                <button type="button" className="productButton" onClick={() => handleAddToCart(product)}>
                  AJOUTER AU PANIER
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      {isAuthOpen && <AuthCard onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />}
      {welcome && <div className="welcomeToast">{welcome}</div>}
    </div>
  );
}

export default ProductsPage;
