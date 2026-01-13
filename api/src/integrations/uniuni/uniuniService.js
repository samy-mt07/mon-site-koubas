// api/src/integrations/uniuni/uniuniService.js
const { getUniUniClient } = require("./uniuniClient");
const { mapToCreateShipmentPayload } = require("./uniuniMapper");

/**
 * Erreur typée UniUni (pour le worker)
 */
class UniUniError extends Error {
  constructor(action, message, uniuniPayload) {
    super(`UNIUNI_${action}_FAILED: ${message || "Unknown"}`);
    this.name = "UniUniError";
    this.action = action; // CREATE | PURCHASE | LABEL | ...
    this.uniuni = uniuniPayload || null; // { code, message, data }
  }
}

function assertOk(res, actionName) {
  if (!res?.data) throw new UniUniError(actionName, "NO_RESPONSE", null);

  const { code, message, data } = res.data;

  if (code !== 0) {
    throw new UniUniError(actionName, message, { code, message, data });
  }
  return data;
}

// Helpers de classification d'erreurs
function isNotDraftError(err) {
  const msg = err?.uniuni?.message || err?.message || "";
  return (
    msg.includes("Only DRAFT shipments can be paid") ||
    msg.includes("Only DRAFT") ||
    msg.includes("Current status")
  );
}

function isUnpaidLabelError(err) {
  const msg = err?.uniuni?.message || err?.message || "";
  return msg.includes("Cannot print labels for unpaid shipments");
}

async function createShipment({ order, items }) {
  const api = getUniUniClient();
  const payload = mapToCreateShipmentPayload({ order, items });

  const res = await api.post("/shipments/create", payload);
  const data = assertOk(res, "CREATE");

  // data: { orderNumber, trackingId, status, rates, ... }
  return {
    orderNumber: data.orderNumber,
    trackingId: data.trackingId || null, // souvent vide en DRAFT
    status: data.status || null, // DRAFT
    rates: data.rates || null,
    raw: data,
  };
}

/**
 * Purchase = payer automatiquement sur UniUni
 * IMPORTANT: UniUni peut répondre "Only DRAFT shipments can be paid..."
 * => on renvoie une erreur typée pour que le worker fasse fallback.
 */
async function purchaseShipment(orderNumber) {
  const api = getUniUniClient();

  try {
    const res = await api.post(
      `/shipments/${encodeURIComponent(orderNumber)}/purchase`
    );
    const data = assertOk(res, "PURCHASE");

    return {
      orderNumber: data.orderNumber || orderNumber,
      trackingId: data.trackingId || null,
      labelBase64: data.label || null, // parfois UniUni renvoie un label ici
      labelFormat: data.labelformat || data.labelFormat || null,
      raw: data,
    };
  } catch (err) {
    // Si c’est une erreur UniUni (code != 0), elle est déjà UniUniError
    if (isNotDraftError(err)) {
      err.kind = "UNIUNI_NOT_DRAFT";
    }
    throw err;
  }
}

/**
 * Label = récupérer le PDF en base64.
 * Attention: si pas payé => "Cannot print labels for unpaid shipments"
 */
async function getLabel(orderNumber, labelType = "shipping") {
  const api = getUniUniClient();

  try {
    const res = await api.get(`/label/${encodeURIComponent(orderNumber)}`, {
      params: { labelType },
    });
    const data = assertOk(res, "LABEL");

    return {
      headers: data.headers || null,
      bodyBase64: data.body || null,
    };
  } catch (err) {
    if (isUnpaidLabelError(err)) {
      err.kind = "UNIUNI_UNPAID_LABEL";
    }
    throw err;
  }
}

module.exports = {
  createShipment,
  purchaseShipment,
  getLabel,

  // exports utiles (optionnel) pour ton worker si tu veux:
  UniUniError,
};
