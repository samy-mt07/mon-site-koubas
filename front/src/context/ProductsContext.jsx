import React, { createContext, useContext, useEffect, useState } from "react";

const ProductsContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "";

  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/images/")) return imageUrl;

  if (imageUrl.includes("/public/images/")) {
    return imageUrl.replace(/^.*\/public\/images\//, "/images/");
  }

  if (imageUrl.startsWith("/home/")) {
    const fileName = imageUrl.split("/").pop();
    return fileName ? `/images/${fileName}` : "";
  }

  return imageUrl;
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatPrice(cents) {
  return `${(Number(cents) / 100).toFixed(2)} $`;
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();
        if (isMounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setError("Les produits sont momentanément indisponibles.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const getProductById = (id) => products.find((product) => String(product.id) === String(id));

  const value = { products, loading, error, getProductById };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return ctx;
}
