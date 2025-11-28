import { API_BASE_URL } from "../config/config";

export async function fetchProducts() {
  const response = await fetch(`${API_BASE_URL}/api/products`);

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des produits");
  }

  return response.json();
}
