import React from "react";
import { formatPrice } from "../context/ProductsContext";
import "./OrderRecap.css";

function OrderRecap({ items, address, deliveryFee, freeDelivery, total, error, confirming, onModify, onConfirm }) {
  const addressLines = [
    address.fullName,
    [address.address1, address.apartment].filter(Boolean).join(", "),
    `${address.city} ${address.postalCode}`.trim(),
    address.country,
    address.phone,
  ].filter(Boolean);

  return (
    <div className="orderRecapGrid">
      <div className="orderRecapCard">
        <h2>Articles</h2>
        <ul className="orderRecapItems">
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.name} × {item.quantity}</span>
              <span>{formatPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <h2>Adresse de livraison</h2>
        <address className="orderRecapAddress">
          {addressLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </address>
      </div>

      <aside className="checkoutSummary">
        <h2>Récapitulatif</h2>
        <div className="orderRecapLine">
          <span>Livraison</span>
          <span>{freeDelivery ? "Livraison gratuite" : formatPrice(deliveryFee)}</span>
        </div>
        <div className="checkoutSummaryTotal">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {error && <div className="checkoutSubmitError">{error}</div>}

        <div className="orderRecapActions">
          <button type="button" className="orderRecapModifyButton" onClick={onModify} disabled={confirming}>
            Modifier
          </button>
          <button type="button" className="checkoutSubmitButton" onClick={onConfirm} disabled={confirming}>
            {confirming ? "Redirection vers le paiement…" : "Confirmer et payer"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default OrderRecap;
