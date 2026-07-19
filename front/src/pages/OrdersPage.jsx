import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../context/ProductsContext";
import "./OrdersPage.css";

const STATUS_LABELS = {
  pending: "En attente",
  paid: "Payée",
  cancelled: "Annulée",
};

function formatDate(value) {
  return new Date(value).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAddress(address) {
  const line = [address.address1, address.apartment].filter(Boolean).join(", ");
  const cityLine = [address.city, address.province, address.postalCode]
    .filter(Boolean)
    .join(" ");
  return { line, cityLine };
}

function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false);
  const { line, cityLine } = formatAddress(order.shippingAddress);

  return (
    <div className="orderCard">
      <button
        type="button"
        className="orderCardHeader"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="orderCardInfo">
          <span className="orderNumber">Commande #{order.id}</span>
          <span className="orderDate">{formatDate(order.created_at)}</span>
        </div>
        <span className={`orderStatusBadge orderStatus-${order.status}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
        <span className="orderTotal">{formatPrice(order.total_cents)}</span>
        <span className="orderCardChevron">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {expanded && (
        <div className="orderCardDetails">
          <div className="orderItemsList">
            {order.items.map((item, index) => (
              <div className="orderItemRow" key={index}>
                <span className="orderItemName">
                  {item.name} <span className="orderItemQty">x{item.quantity}</span>
                </span>
                <span className="orderItemPrice">{formatPrice(item.subtotal_cents)}</span>
              </div>
            ))}
          </div>

          <div className="orderShippingBlock">
            <p className="orderShippingTitle">Adresse de livraison</p>
            <p>{order.shippingAddress.fullName}</p>
            <p>{line || "—"}</p>
            <p>{cityLine}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/orders/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du chargement des commandes.");
        }

        setOrders(data);
      } catch (err) {
        setError(err.message || "Erreur réseau.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchOrders();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="ordersPage">
        <h1>Mes commandes</h1>
        <p className="ordersLoading">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ordersPage">
        <h1>Mes commandes</h1>
        <p className="ordersError">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="ordersEmptyState">
        <h1>Aucune commande pour l'instant</h1>
        <p>Vos commandes apparaîtront ici une fois votre première commande passée.</p>
        <Link to="/#collection" className="ordersEmptyButton">
          VOIR LA COLLECTION
        </Link>
      </div>
    );
  }

  return (
    <div className="ordersPage">
      <h1>Mes commandes</h1>
      <div className="ordersList">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

export default OrdersPage;
