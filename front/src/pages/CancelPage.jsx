import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import "./ResultPage.css";

function CancelPage() {
  return (
    <div className="resultPage">
      <Seo title="Paiement annulé" noindex path="/cancel" />
      <div className="resultCard">
        <h1>Paiement annulé</h1>
        <p>Ton panier est toujours là, tu peux réessayer quand tu veux.</p>
        <Link to="/panier" className="resultButton">
          Retour au panier
        </Link>
      </div>
    </div>
  );
}

export default CancelPage;
