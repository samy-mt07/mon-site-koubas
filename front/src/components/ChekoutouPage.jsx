import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

function CheckoutPage() {
  const cart = useContext(CartContext);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const items = cart.items;
  const totalPrice = cart.getTotalPrice();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoggedIn = auth && auth.user;
  const hasItems = items && items.length > 0;

  async function handleConfirm() {
    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        "http://localhost:4000/api/checkout/create-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: auth.token ? `Bearer ${auth.token}` : "",
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              name: item.name,
              price: item.price, // ex: 24.99
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur création session paiement");
      }

      if (!data.url) {
        throw new Error("URL Stripe manquante");
      }

      // Redirection vers Stripe
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  }

  // 🔹 Si pas d'articles
  if (!hasItems) {
    return (
      <div>
        <h1>Paiement</h1>
        <p>Votre panier est vide.</p>
        <button type="button" onClick={() => navigate("/")}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // 🔹 Si pas connecté
  if (!isLoggedIn) {
    return (
      <div>
        <h1>Paiement</h1>
        <p>Vous devez créer un compte ou vous connecter pour payer.</p>
        <button type="button" onClick={() => navigate("/register")}>
          Créer un compte
        </button>
        <button type="button" onClick={() => navigate("/login")}>
          J'ai déjà un compte
        </button>
      </div>
    );
  }

  // 🔹 Si panier OK + user connecté → paiement Stripe possible
  return (
    <div>
      <h1>Paiement</h1>

      {error && <p>{error}</p>}

      <h2>Récapitulatif</h2>

      {items.map((item) => {
        const subtotal = item.price * item.quantity;

        return (
          <div key={item.id}>
            <p>
              {item.name} x {item.quantity} = {subtotal.toFixed(2)}
            </p>
          </div>
        );
      })}

      <h2>Total: {totalPrice.toFixed(2)}</h2>

      <button type="button" onClick={handleConfirm} disabled={loading}>
        {loading ? "Redirection vers Stripe..." : "Confirmer le paiement"}
      </button>
    </div>
  );
}

export default CheckoutPage;
