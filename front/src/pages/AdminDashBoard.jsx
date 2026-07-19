import { useState, useEffect, useCallback } from "react";
import {
  Package,
  ListOrdered,
  Plus,
  RefreshCw,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  Truck,
  Trash2,
  Upload,
  Pencil,
} from "lucide-react";
import FreeDeliveryToggle from "../components/FreeDeliveryToggle";

/**
 * AdminDashboard — koubas
 * -----------------------------------------------------------------------
 * Panneau admin avec deux vues basculables :
 *   1. Commandes (GET /api/admin/orders)
 *   2. Nouveau produit (POST /api/admin/products)
 *
 * Palette (standard, pro, neutre) :
 *   - Fond page       : slate-50
 *   - Surface/carte    : white + slate-200 border
 *   - Texte principal  : slate-900
 *   - Texte secondaire : slate-500
 *   - Accent primaire  : indigo-600 (actions, liens, focus)
 *   - Succès           : emerald-600
 *   - Attente          : amber-600
 *   - Erreur / annulé  : rose-600
 *
 * Adapte simplement API_BASE et le header d'auth (token) à ton setup.
 * -----------------------------------------------------------------------
 */

const API_BASE = "/api/admin";

// Le token JWT — adapte selon où tu le stockes (context, cookie, etc.)
function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatPrice(cents) {
  return (cents / 100).toLocaleString("fr-CA", {
    style: "currency",
    currency: "CAD",
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ---------------------------------------------------------------------------
// Badge de statut de commande
// ---------------------------------------------------------------------------
const STATUS_STYLES = {
  paid: { label: "Payée", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  pending: { label: "En attente", icon: Clock, className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  cancelled: { label: "Annulée", icon: XCircle, className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  failed: { label: "Échouée", icon: AlertTriangle, className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || {
    label: status || "Inconnu",
    icon: Clock,
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

const SHIPPING_STATUS_STYLES = {
  pending_shipment: { label: "En attente d'expédition", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  shipped: { label: "Expédiée", className: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  delivered: { label: "Livrée", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
};

function ShippingStatusBadge({ status }) {
  const s = SHIPPING_STATUS_STYLES[status] || {
    label: status || "Inconnu",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.className}`}>
      <Truck size={13} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tiroir de détail de commande
// ---------------------------------------------------------------------------
function OrderDetailDrawer({ order, onClose, onDeleteClick}) {
  if (!order) return null;

  const addressLine = [order.shipping_address1, order.shipping_apartment]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panneau */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Commande #{order.id}
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-0.5">
              {order.full_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Résumé */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-slate-900">
              {formatPrice(order.total_cents)}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-slate-400 -mt-4">{formatDate(order.created_at)}</p>

          {/* Client */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Client
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <User size={15} className="text-slate-400 shrink-0" />
                {order.full_name}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={15} className="text-slate-400 shrink-0" />
                {order.email}
              </div>
              {order.shipping_phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  {order.shipping_phone}
                </div>
              )}
            </div>
          </section>

          {/* Livraison */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Livraison
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p>{order.shipping_full_name}</p>
                  <p>{addressLine || "—"}</p>
                  <p>
                    {order.shipping_city}
                    {order.shipping_province ? `, ${order.shipping_province}` : ""}{" "}
                    {order.shipping_postal_code}
                  </p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>
              {order.shipping_status && (
                <ShippingStatusBadge status={order.shipping_status} />
              )}
            </div>
          </section>
          <button
            onClick={() => onDeleteClick(order)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={15} />
            Supprimer la commande
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vue : Commandes
// ---------------------------------------------------------------------------
function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message || "Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function handleOrderDeleted(id) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setOrderToDelete(null);
    setSelectedOrder(null); // ferme le tiroir de détail s'il était ouvert
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Commandes</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Chargement…" : `${orders.length} commande${orders.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Courriel</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-4 w-full max-w-sm animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))}

            {!loading && orders.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Aucune commande pour le moment.
                </td>
              </tr>
            )}

            {!loading &&
              orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{o.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{o.email}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatPrice(o.total_cents)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // évite d'ouvrir le tiroir de détail
                        setOrderToDelete(o);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onDeleteClick={(o) => setOrderToDelete(o)}
      />
        <DeleteOrderDialog
        order={orderToDelete}
        onCancel={() => setOrderToDelete(null)}
        onConfirmed={handleOrderDeleted}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vue : Nouveau produit
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  name: "",
  description: "",
  price_cents: "",
  image_url: "",
  is_active: true,
  stock_quantity: 0,
};

// ---------------------------------------------------------------------------
// Vue : Liste des produits
// ---------------------------------------------------------------------------
function ProductsView({ onAddNew }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message || "Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleUpdated(updated) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProduct(null);
  }

  function handleDeleted(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setProductToDelete(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Produits</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Chargement…" : `${products.length} produit${products.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            Nouveau produit
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-4 w-full max-w-sm animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))}

            {!loading && products.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Aucun produit pour le moment.
                </td>
              </tr>
            )}

            {!loading &&
              products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {p.image_url ? (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <img src={p.image_url} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-slate-300" />
                        )}
                      </div>
                      <span className="font-medium text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatPrice(p.price_cents)}</td>
                  <td className="px-4 py-3">
                    {Number(p.stock_quantity) === 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
                        <AlertTriangle size={13} />
                        Rupture de stock
                      </span>
                    ) : (
                      <span className="font-medium text-slate-800">{p.stock_quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        p.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-500 ring-slate-500/20"
                      }`}
                    >
                      {p.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>
                      <button
                        onClick={() => setProductToDelete(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <EditProductDrawer
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdated={handleUpdated}
      />

      <DeleteProductDialog
        product={productToDelete}
        onCancel={() => setProductToDelete(null)}
        onConfirmed={handleDeleted}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiroir : Modifier un produit
// ---------------------------------------------------------------------------
function EditProductDrawer({ product, onClose, onUpdated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price_cents: product.price_cents ?? "",
        image_url: product.image_url || "",
        is_active: product.is_active,
        stock_quantity: product.stock_quantity ?? 0,
      });
      setError(null);
    }
  }, [product]);

  if (!product) return null;

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Le nom du produit est requis.");
      return;
    }
    const priceValue = Number(form.price_cents);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Le prix doit être un nombre positif (en cents).");
      return;
    }

    const stockValue = Number(form.stock_quantity);
    if (!Number.isInteger(stockValue) || stockValue < 0) {
      setError("La quantité en stock doit être un entier positif.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/products/${product.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price_cents: priceValue,
          image_url: form.image_url.trim() || null,
          is_active: form.is_active,
          stock_quantity: stockValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur serveur (${res.status})`);
      onUpdated(data);
    } catch (err) {
      setError(err.message || "Impossible de modifier le produit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">Modifier le produit</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nom du produit <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Prix (en cents) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.price_cents}
                onChange={(e) => updateField("price_cents", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Quantité en stock <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock_quantity}
                onChange={(e) => updateField("stock_quantity", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
              />
              Produit actif
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Image</label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {form.image_url ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <img src={form.image_url} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-slate-300" />
                )}
              </div>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirmation de suppression (produit)
// ---------------------------------------------------------------------------
function DeleteProductDialog({ product, onCancel, onConfirmed }) {
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!product) return null;

  const canDelete = input.trim().toLowerCase() === "delete";

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/products/${product.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      onConfirmed(product.id);
    } catch (err) {
      setError(err.message || "Impossible de supprimer le produit.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onCancel} />

      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Supprimer « {product.name} » ?
          </h3>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Cette action est irréversible. Tape <span className="font-semibold text-slate-700">delete</span> pour confirmer.
        </p>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-600/20">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="delete"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={15} />
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}


function NewProductView({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        // Pas de Content-Type ici : le navigateur le gère avec le bon boundary
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur serveur (${res.status})`);

      updateField("image_url", data.image_url);
    } catch (err) {
      setError(err.message || "Impossible d'uploader l'image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError("Le nom du produit est requis.");
      return;
    }
    const priceValue = Number(form.price_cents);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Le prix doit être un nombre positif (en cents).");
      return;
    }

    const stockValue = Number(form.stock_quantity);
    if (!Number.isInteger(stockValue) || stockValue < 0) {
      setError("La quantité en stock doit être un entier positif.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price_cents: priceValue,
          image_url: form.image_url.trim() || null,
          is_active: form.is_active,
          stock_quantity: stockValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur (${res.status})`);
      }

      setSuccess(`Produit « ${data.name} » créé avec succès.`);
      setForm(EMPTY_FORM);
      onCreated?.(data);
    } catch (err) {
      setError(err.message || "Impossible de créer le produit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Nouveau produit</h2>
      <p className="text-sm text-slate-500 mb-5">
        Ajoute un produit au catalogue koubas.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nom du produit <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Ex. Sac banane koubas"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Description courte du produit…"
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Prix (en cents) <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.price_cents}
              onChange={(e) => updateField("price_cents", e.target.value)}
              placeholder="Ex. 4999"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {form.price_cents !== "" && Number.isFinite(Number(form.price_cents)) && (
              <p className="mt-1 text-xs text-slate-500">
                Affiché comme {formatPrice(Number(form.price_cents) || 0)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Quantité en stock <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={(e) => updateField("stock_quantity", e.target.value)}
              placeholder="Ex. 20"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
            />
            Produit actif
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Image</label>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {form.image_url ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img
                  src={form.image_url}
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <ImageIcon size={20} className="text-slate-300" />
              )}
            </div>

            <input
              type="text"
              value={form.image_url}
              onChange={(e) => updateField("image_url", e.target.value)}
              placeholder="https://… ou upload à droite"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors whitespace-nowrap">
              <Upload size={15} />
              {uploading ? "…" : "Parcourir"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setForm(EMPTY_FORM)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={15} />
            {submitting ? "Création…" : "Créer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export default function AdminDashboard() {
  const [tab, setTab] = useState("products"); // "products" | "orders" | "new-product"

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">koubas · Admin</h1>
            <p className="text-sm text-slate-500">Gestion des commandes et du catalogue</p>
          </div>
          <FreeDeliveryToggle />
        </header>

        <nav className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setTab("products")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === "products" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Package size={15} />
            Produits
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ListOrdered size={15} />
            Commandes
          </button>
        </nav>

        <main>
          {tab === "products" && <ProductsView onAddNew={() => setTab("new-product")} />}
          {tab === "orders" && <OrdersView />}
          {tab === "new-product" && (
            <NewProductView onCreated={() => setTab("products")} />
          )}
        </main>
      </div>
    </div>
  );
}
// ---------------------------------------------------------------------------
// Confirmation de suppression
// ---------------------------------------------------------------------------
function DeleteOrderDialog({ order, onCancel, onConfirmed }) {
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!order) return null;

  const canDelete = input.trim().toLowerCase() === "delete";

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      onConfirmed(order.id);
    } catch (err) {
      setError(err.message || "Impossible de supprimer la commande.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onCancel} />

      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Supprimer la commande #{order.id} ?
          </h3>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Cette action est irréversible. Tape <span className="font-semibold text-slate-700">delete</span> pour confirmer.
        </p>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-600/20">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="delete"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={15} />
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}