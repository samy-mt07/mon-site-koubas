import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProducts, resolveImageUrl, formatPrice } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import Seo from "../components/Seo";
import "./ProductDetail.css";

const SITE_URL = "https://aurassens.shop";

function ProductDetail() {
  const { id } = useParams();
  const { getProductById, loading } = useProducts();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const product = getProductById(id);
  const stock = Number.isFinite(Number(product?.stock_quantity)) ? Number(product.stock_quantity) : undefined;
  const isOutOfStock = Number.isFinite(stock) && stock <= 0;
  const maxQuantity = Number.isFinite(stock) && stock > 0 ? stock : 20;

  if (loading) {
    return <p className="productDetailStatus">Chargement du produit…</p>;
  }

  if (!product) {
    return (
      <div className="productDetailStatus">
        <p>Ce produit n'est plus disponible.</p>
        <Link to="/#collection" className="backLink">
          Retour à la collection
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    showToast("Ajouté au panier !");
  };

  const absoluteImageUrl = product.image_url ? `${SITE_URL}${resolveImageUrl(product.image_url)}` : undefined;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: absoluteImageUrl,
    sku: String(product.id),
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: (Number(product.price_cents) / 100).toFixed(2),
      availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${SITE_URL}/produit/${product.id}`,
    },
  };

  return (
    <div className="productDetailPage">
      <Seo
        title={product.name}
        description={product.description ? product.description.slice(0, 160) : undefined}
        path={`/produit/${product.id}`}
        image={absoluteImageUrl}
        type="product"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Link to="/" className="backLink">
        Retour à l'accueil
      </Link>
      <div className="productDetailGrid">
        <div className="productDetailImageWrapper">
          {product.image_url ? (
            <img
              src={resolveImageUrl(product.image_url)}
              alt={product.name}
              className="productDetailImage"
              width="600"
              height="480"
            />
          ) : (
            <div className="productDetailPlaceholder">AURA SCENTS</div>
          )}
        </div>
        <div className="productDetailInfo">
          <h1>{product.name}</h1>
          <div className="productDetailPrice">{formatPrice(product.price_cents)}</div>
          {product.description && <p className="productDetailDescription">{product.description}</p>}

          {isOutOfStock ? (
            <p className="productDetailOutOfStock">Rupture de stock</p>
          ) : (
            <div className="quantitySelector">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            className="productDetailButton"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? "RUPTURE DE STOCK" : "AJOUTER AU PANIER"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
