import { useEffect, useState } from "react";
import axios from "axios";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await axios.get("http://localhost:4000/api/admin/orders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        console.log("📦 admin/orders data =", res.data);

        // Si le back renvoie directement un tableau
        if (Array.isArray(res.data)) {
          setOrders(res.data);
        }
        // Si le back renvoie { orders: [...] }
        else if (Array.isArray(res.data.orders)) {
          setOrders(res.data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Erreur chargement commandes admin:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return <p className="text-center mt-4">Chargement des commandes…</p>;
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    return <p className="text-center mt-4">Aucune commande pour le moment.</p>;
  }

  return (
    <div className="container mt-5">
      <h1>📦 Commandes</h1>

      <table className="table table-dark table-hover mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.full_name}</td>
              <td>{(o.total_cents / 100).toFixed(2)} $</td>
              <td>{o.status}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
