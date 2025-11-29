import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

function SuccessPage() {
  const auth = useContext(AuthContext);
  const cart = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState(null);

  // Récupérer session_id dans l'URL
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get("session_id");

  useEffect(
    function () {
      async function loadInvoice() {
        // on reset l'erreur à chaque tentative
        setError("");

        if (!sessionId) {
          setError("Session de paiement introuvable.");
          setLoading(false);
          return;
        }

        // on attend que le contexte auth soit chargé
        if (!auth || !auth.token) {
          // on ne met PAS d'erreur définitive ici, on attend juste
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const response = await fetch(
            `http://localhost:4000/api/checkout/invoice/${sessionId}`,
            {
              headers: {
                Authorization: `Bearer ${auth.token}`,
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Erreur chargement facture");
          }

          setInvoice(data);
          cart.clearCart();
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }

      loadInvoice();
    },
    [sessionId, auth, cart]
  );

  // ⬇️ AFFICHAGE

  if (loading && !invoice) {
    return <p>Chargement de votre facture...</p>;
  }

  // Si on a déjà la facture, on l'affiche même s'il y a eu une erreur avant
  if (invoice) {
    const { order, items } = invoice;
    const total = (order.total_cents / 100).toFixed(2);

    return (
      <div>
        <h1>Paiement réussi 🎉</h1>
        <h2>Facture</h2>

        <p>Commande n° {order.id}</p>
        <p>Date : {new Date(order.created_at).toLocaleString()}</p>
        <p>Total : {total} CAD</p>

        <h3>Détails</h3>
        <ul>
          {items.map((item) => {
            const lineTotal = item.subtotal_cents / 100;
            return (
              <li key={item.id}>
                Produit #{item.product_id} x {item.quantity} ={" "}
                {lineTotal.toFixed(2)} CAD
              </li>
            );
          })}
        </ul>

        <button type="button" onClick={() => navigate("/")}>
          Retour à la boutique
        </button>
      </div>
    );
  }

  // Si pas de facture et qu'on a une erreur réelle
  if (error) {
    return (
      <div>
        <h1>Erreur</h1>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/")}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // Cas extrême : rien à afficher
  return null;
}

export default SuccessPage;
