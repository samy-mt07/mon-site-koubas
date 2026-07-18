import React from "react";
import { Link } from "react-router-dom";
import "./ResultPage.css";

function CancelPage() {
  return (
    <div className="resultPage">
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
