// front/src/App.jsx
import { useEffect, useState } from "react";
import { fetchProducts } from "./api/apiClient";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les produits");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Aucun produit pour l’instant.
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white" }}>
      <header
        style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #1e293b" }}
      >
        <h1 style={{ margin: 0 }}>KOUBAS Shop</h1>
        <p style={{ margin: 0, marginTop: "0.5rem", color: "#9ca3af" }}>
          Boutique officielle – Diffuseur et produits Koubas
        </p>
      </header>

      <main
        style={{ padding: "2rem", display: "flex", justifyContent: "center" }}
      >
        <div
          style={{
            maxWidth: "800px",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {products.map((product) => (
            <article
              key={product.id}
              style={{
                background: "#020617",
                borderRadius: "1rem",
                padding: "1.25rem",
                border: "1px solid #1f2933",
                boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
              }}
            >
              {product.image_url && (
                <div
                  style={{
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    marginBottom: "1rem",
                    border: "1px solid #1f2937",
                  }}
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              )}

              <h2 style={{ marginBottom: "0.5rem", fontSize: "1.2rem" }}>
                {product.name}
              </h2>
              {product.description && (
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.95rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {product.description}
                </p>
              )}

              <p
                style={{
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  marginBottom: "1rem",
                }}
              >
                {product.price_cents != null
                  ? (product.price_cents / 100).toFixed(2) + " $"
                  : "Prix non disponible"}
              </p>

              <button
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, rgba(236,72,153,1) 0%, rgba(59,130,246,1) 100%)",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
                onClick={() =>
                  alert("Ici plus tard : ajouter au panier / checkout")
                }
              >
                Acheter maintenant
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
