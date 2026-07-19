import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { resolveImageUrl, formatPrice } from "../context/ProductsContext";
import "./ProductCard.css";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const isOutOfStock = Number(product.stock_quantity) <= 0;

  const handleAddToCart = (event) => {
    event.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, 1);
    showToast("Ajouté au panier !");
  };

  return (
    <article
      className="productCard"
      onClick={() => navigate(`/produit/${product.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") navigate(`/produit/${product.id}`);
      }}
    >
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
      <button
        type="button"
        className="productButton"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
      >
        {isOutOfStock ? "RUPTURE DE STOCK" : "AJOUTER AU PANIER"}
      </button>
    </article>
  );
}

export default ProductCard;
