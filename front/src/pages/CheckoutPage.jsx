import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useProducts, formatPrice } from "../context/ProductsContext";
import AuthCard from "../components/AuthCard";
import "./CheckoutPage.css";

const ERROR_MESSAGES = {
  EMPTY_CART: "Votre panier est vide.",
  MISSING_SHIPPING_INFO: "Merci de compléter tous les champs obligatoires.",
  INVALID_PRODUCTS: "Un ou plusieurs produits ne sont plus disponibles.",
  STRIPE_NOT_CONFIGURED: "Le paiement est momentanément indisponible, réessayez plus tard.",
  CHECKOUT_FAILED: "Impossible de finaliser votre commande pour le moment.",
};

const CANADIAN_POSTAL_CODE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const PHONE_FORMAT = /^[0-9+()\-.\s]{7,}$/;

function CheckoutPage() {
  const { isLoggedIn } = useAuth();
  const { items, totalCents } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address1: "",
    apartment: "",
    city: "",
    postalCode: "",
    country: "Canada",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    return <Navigate to="/panier" replace />;
  }

  const unavailableItems = productsLoading
    ? []
    : items.filter((item) => !products.some((p) => p.id === item.id));

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Le nom complet est requis.";
    if (!form.phone.trim() || !PHONE_FORMAT.test(form.phone.trim())) {
      errors.phone = "Numéro de téléphone invalide.";
    }
    if (!form.address1.trim()) errors.address1 = "L'adresse est requise.";
    if (!form.city.trim()) errors.city = "La ville est requise.";
    if (
      !form.postalCode.trim() ||
      (form.country === "Canada" && !CANADIAN_POSTAL_CODE.test(form.postalCode.trim()))
    ) {
      errors.postalCode = "Code postal invalide.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (unavailableItems.length > 0) {
      setSubmitError("Certains produits de votre panier ne sont plus disponibles. Retournez au panier pour les retirer.");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          shipping: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            address1: form.address1.trim(),
            apartment: form.apartment.trim() || undefined,
            city: form.city.trim(),
            postalCode: form.postalCode.trim(),
            country: form.country.trim() || "Canada",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES[data.error] || ERROR_MESSAGES.CHECKOUT_FAILED);
      }

      window.location.href = data.url;
    } catch (err) {
      setSubmitError(err.message || ERROR_MESSAGES.CHECKOUT_FAILED);
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="checkoutAuthGate">
        <h1>Connectez-vous pour continuer</h1>
        <p>Votre panier vous attend, connectez-vous ou créez un compte pour finaliser votre commande.</p>
        <AuthCard onClose={() => navigate("/panier")} onAuthenticated={() => {}} />
      </div>
    );
  }

  return (
    <div className="checkoutPage">
      <h1>Livraison</h1>

      {unavailableItems.length > 0 && (
        <div className="checkoutWarning">
          Certains produits de votre panier ne sont plus disponibles. Retournez au{" "}
          <button type="button" className="checkoutLinkButton" onClick={() => navigate("/panier")}>
            panier
          </button>{" "}
          pour les retirer avant de continuer.
        </div>
      )}

      <div className="checkoutGrid">
        <form className="checkoutForm" onSubmit={handleSubmit}>
          <label htmlFor="fullName">Nom complet</label>
          <input id="fullName" className="checkoutInput" value={form.fullName} onChange={handleChange("fullName")} />
          {fieldErrors.fullName && <span className="checkoutFieldError">{fieldErrors.fullName}</span>}

          <label htmlFor="phone">Téléphone</label>
          <input id="phone" className="checkoutInput" value={form.phone} onChange={handleChange("phone")} placeholder="514 555 1234" />
          {fieldErrors.phone && <span className="checkoutFieldError">{fieldErrors.phone}</span>}

          <label htmlFor="address1">Adresse Complete</label>
          <input id="address1" className="checkoutInput" value={form.address1} onChange={handleChange("address1")} />
          {fieldErrors.address1 && <span className="checkoutFieldError">{fieldErrors.address1}</span>}

          <label htmlFor="apartment">Appartement (optionnel)</label>
          <input id="apartment" className="checkoutInput" value={form.apartment} onChange={handleChange("apartment")} />

          <label htmlFor="city">Ville</label>
          <input id="city" className="checkoutInput" value={form.city} onChange={handleChange("city")} />
          {fieldErrors.city && <span className="checkoutFieldError">{fieldErrors.city}</span>}

          <label htmlFor="postalCode">Code postal</label>
          <input id="postalCode" className="checkoutInput" value={form.postalCode} onChange={handleChange("postalCode")} placeholder="H1H 1H1" />
          {fieldErrors.postalCode && <span className="checkoutFieldError">{fieldErrors.postalCode}</span>}

          <label htmlFor="country">Pays</label>
          <input id="country" className="checkoutInput" value={form.country} onChange={handleChange("country")} />

          {submitError && <div className="checkoutSubmitError">{submitError}</div>}

          <button type="submit" className="checkoutSubmitButton" disabled={loading}>
            {loading ? "Redirection vers le paiement…" : "PAYER MAINTENANT"}
          </button>
        </form>

        <aside className="checkoutSummary">
          <h2>Récapitulatif</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price_cents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="checkoutSummaryTotal">
            <span>Total</span>
            <span>{formatPrice(totalCents)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;
