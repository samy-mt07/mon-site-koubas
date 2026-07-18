import React from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../context/ProductsContext";
import "./CollectionSection.css";

function ProductCardSkeleton() {
  return (
    <div className="productCardSkeleton">
      <div className="skeletonImage" />
      <div className="skeletonLine skeletonLineWide" />
      <div className="skeletonLine skeletonLineNarrow" />
      <div className="skeletonButton" />
    </div>
  );
}

function CollectionSection() {
  const { products, loading, error } = useProducts();

  return (
    <section id="collection" className="collectionSection">
      <div className="collectionHeader">
        <p className="eyebrow">Collection</p>
        <h1>Nos parfums</h1>
        <p className="collectionIntro">
          Découvrez des créations raffinées pensées pour sublimer votre intérieur.
        </p>
      </div>

      {loading && (
        <div className="productsGrid">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && error && <p className="productsStatus">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="productsStatus">Aucun produit disponible pour le moment.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="productsGrid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default CollectionSection;
