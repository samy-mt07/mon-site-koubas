import { useEffect, useState } from "react";
import { Truck, Loader2 } from "lucide-react";

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function FreeDeliveryToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("FETCH_FAILED"))))
      .then((data) => {
        if (isMounted) setEnabled(Boolean(data.freeDelivery));
      })
      .catch(() => {
        if (isMounted) setError("Impossible de charger l'état.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/free-delivery", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur serveur (${res.status})`);
      setEnabled(Boolean(data.freeDelivery));
    } catch (err) {
      setError(err.message || "Impossible de modifier le réglage.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          enabled
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
        Livraison gratuite : {enabled ? "ON" : "OFF"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

export default FreeDeliveryToggle;
