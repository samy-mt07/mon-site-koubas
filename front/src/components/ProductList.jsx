import React, { useEffect, useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import ProductCard from "./ProductCard";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const cart = useContext(CartContext);

  useEffect(function () {
    async function loadProducts() {
      try {
        const response = await fetch("http://localhost:4000/api/products");
        const data = await response.json();
        console.log("products from API:", data);

        if (!response.ok) {
          throw new Error("Erreur chargement produits");
        }

        setProducts(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadProducts();
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  if (products.length === 0) {
    return <p>No products.</p>;
  }

  return (
    <div className="product-list">
      {products.map(function (product) {
        return (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={cart.addToCart}
          />
        );
      })}
    </div>
  );
}

export default ProductList;
