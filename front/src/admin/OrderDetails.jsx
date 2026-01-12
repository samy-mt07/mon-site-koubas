import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setOrder(res.data));
  }, []);

  if (!order) return <p>Chargement...</p>;

  return (
    <div className="container mt-5">
      <h1>Commande #{order.order.id}</h1>

      <p>
        <strong>Client :</strong> {order.order.full_name}
      </p>
      <p>
        <strong>Email :</strong> {order.order.email}
      </p>
      <p>
        <strong>Total :</strong> {(order.order.total_cents / 100).toFixed(2)}$
      </p>

      <h3 className="mt-4">Articles :</h3>
      <ul>
        {order.items.map((i, idx) => (
          <li key={idx}>
            {i.name} — {i.quantity} × {(i.unit_price_cents / 100).toFixed(2)}$
          </li>
        ))}
      </ul>
    </div>
  );
}
