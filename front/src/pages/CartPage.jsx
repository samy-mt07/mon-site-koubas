import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useProducts, resolveImageUrl, formatPrice } from "../context/ProductsContext";
import "./CartPage.css";

function CartPage() {
  const { items, removeItem, updateQuantity, totalCents } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const navigate = useNavigate();

  const unavailableIds = productsLoading
    ? []
    : items.filter((item) => !products.some((p) => p.id === item.id)).map((item) => item.id);

  const canCheckout = items.length > 0 && unavailableIds.length === 0;

  if (items.length === 0) {
    return (
      <div className="cartEmptyState">
        <h1>Votre panier est vide</h1>
        <p>Découvrez nos diffuseurs et laissez-vous séduire par nos parfums d'exception.</p>
        <Link to="/#collection" className="cartEmptyButton">
          VOIR LA COLLECTION
        </Link>
      </div>
    );
  }

  return (
    <div className="cartPage">
      <h1>Mon panier</h1>

      <div className="cartItems">
        {items.map((item) => {
          const isUnavailable = unavailableIds.includes(item.id);
          const maxQuantity = Number.isFinite(item.stock) && item.stock > 0 ? item.stock : 20;

          return (
            <div key={item.id} className={`cartRow ${isUnavailable ? "cartRowUnavailable" : ""}`}>
              <div className="cartRowImageWrapper">
                {item.image_url ? (
                  <img src={resolveImageUrl(item.image_url)} alt={item.name} className="cartRowImage" />
                ) : (
                  <div className="cartRowPlaceholder" />
                )}
              </div>

              <div className="cartRowInfo">
                <span className="cartRowName">{item.name}</span>
                <span className="cartRowUnitPrice">{formatPrice(item.price_cents)} / unité</span>
                {isUnavailable && (
                  <span className="cartRowWarning">
                    Ce produit n'est plus disponible. Merci de le retirer du panier.
                  </span>
                )}
              </div>

              <div className="cartRowQuantity">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= maxQuantity}
                >
                  +
                </button>
              </div>

              <div className="cartRowSubtotal">{formatPrice(item.price_cents * item.quantity)}</div>

              <button
                type="button"
                className="cartRowRemove"
                onClick={() => removeItem(item.id)}
                aria-label="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="cartSummary">
        <div className="cartTotal">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
        <button
          type="button"
          className="cartCheckoutButton"
          disabled={!canCheckout}
          onClick={() => navigate("/checkout")}
        >
          PASSER AU CHECKOUT
        </button>
        {!canCheckout && items.length > 0 && (
          <p className="cartCheckoutHint">
            Retirez les produits indisponibles pour continuer.
          </p>
        )}
      </div>
    </div>
  );
}

export default CartPage;
