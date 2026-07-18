import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./ResultPage.css";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const cartCleared = useRef(false);

  const [status, setStatus] = useState(sessionId ? "loading" : "error");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(sessionId ? "" : "Session de paiement introuvable.");

  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/checkout/invoice/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error("Le paiement n'a pas pu être confirmé.");
        }

        if (isMounted) {
          setOrder(data);
          setStatus("success");
          if (!cartCleared.current) {
            clearCart();
            cartCleared.current = true;
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setError(err.message || "Le paiement n'a pas pu être confirmé.");
        }
      }
    };

    loadInvoice();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="resultPage">
      {status === "loading" && <p className="resultStatus">Vérification de votre paiement…</p>}

      {status === "success" && (
        <div className="resultCard resultCardSuccess">
          <h1>Merci pour votre commande !</h1>
          <p>Votre paiement a été confirmé avec succès.</p>
          <div className="resultDetails">
            <span>Commande n°{order.orderId}</span>
            <span>Statut : {order.orderStatus}</span>
          </div>
          <Link to="/" className="resultButton">
            Retour à l'accueil
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="resultCard resultCardError">
          <h1>Un problème est survenu</h1>
          <p>{error}</p>
          <Link to="/panier" className="resultButton">
            Retour au panier
          </Link>
        </div>
      )}
    </div>
  );
}

export default SuccessPage;
