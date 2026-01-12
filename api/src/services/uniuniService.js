// const axios = require("axios");

// const BASE_URL = process.env.UNIUNI_BASE_URL;
// const CLIENT_ID = process.env.UNIUNI_CLIENT_ID;
// const CLIENT_SECRET = process.env.UNIUNI_CLIENT_SECRET;

// const api = axios.create({
//   baseURL: BASE_URL,
//   timeout: 30000,
//   headers: { "Content-Type": "application/json" },
// });

// // 1️⃣ GET TOKEN
// async function getUniUniToken() {
//   const res = await api.post("/storeauth/customertoken", {
//     grant_type: "client_credentials",
//     client_id: CLIENT_ID,
//     client_secret: CLIENT_SECRET,
//   });

//   return res.data.access_token;
// }

// // 2️⃣ CREATE SHIPMENT (Business Order)
// async function createShipment({ order }) {
//   const token = await getUniUniToken();

//   const payload = {
//     customer_no: Number(process.env.UNIUNI_CUSTOMER_NO), // fourni par UniUni
//     reference: `ORDER-${order.id}`,
//     pickup_address: "Warehouse Address, Canada",
//     delivery_address: `${order.shipping_address1}, ${order.shipping_city}, ${order.shipping_postal_code}`,
//     receiver: order.shipping_full_name,
//     delivery_unit_no: order.shipping_apartment || "",
//     delivery_phone: order.shipping_phone,
//     postal_code: order.shipping_postal_code,
//   };

//   const res = await api.post(
//     "/orders/createbusinessorder",
//     payload,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );

//   return res.data;
// }

// module.exports = { createShipment };


// api/src/services/uniuniService.js
const axios = require("axios");

const BASE_URL = process.env.UNIUNI_BASE_URL;
const CLIENT_ID = process.env.UNIUNI_CLIENT_ID;
const CLIENT_SECRET = process.env.UNIUNI_CLIENT_SECRET;

const TOKEN_PATH = process.env.UNIUNI_TOKEN_PATH || "/storeauth/customertoken";
const CREATE_ORDER_PATH =
  process.env.UNIUNI_CREATE_ORDER_PATH || "/orders/createbusinessorder";

if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
  console.warn("[UniUni] Missing UNIUNI_BASE_URL / UNIUNI_CLIENT_ID / UNIUNI_CLIENT_SECRET");
}

// Cache token en mémoire
let cachedToken = null;
let cachedTokenExpiresAt = 0; // timestamp ms

function isTokenValid() {
  return cachedToken && Date.now() < cachedTokenExpiresAt - 60_000; // 1 min marge
}

async function getAccessToken() {
  if (isTokenValid()) return cachedToken;

  // D’après la doc: POST /storeauth/customertoken?grant_type=client_credentials
  const url = `${BASE_URL}${TOKEN_PATH}?grant_type=client_credentials`;

  try {
    const res = await axios.post(
      url,
      {
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
      { timeout: 20000 }
    );

    // Selon les APIs, le champ peut varier. On gère plusieurs cas.
    const token =
      res.data?.access_token ||
      res.data?.token ||
      res.data?.data?.access_token;

    if (!token) {
      throw new Error("UNIUNI_TOKEN_NOT_FOUND_IN_RESPONSE");
    }

    // La doc dit 24h. Si l'API renvoie expires_in on l'utilise.
    const expiresInSeconds =
      Number(res.data?.expires_in || res.data?.data?.expires_in) || 24 * 3600;

    cachedToken = token;
    cachedTokenExpiresAt = Date.now() + expiresInSeconds * 1000;

    return cachedToken;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    console.error("[UniUni] getAccessToken failed:", {
      status,
      data,
      message: err.message,
      url,
    });

    throw err;
  }
}

// Appel API UniUni avec Bearer token
async function uniuniRequest(method, path, body) {
  const token = await getAccessToken();

  const url = `${BASE_URL}${path}`;
  try {
    const res = await axios({
      method,
      url,
      data: body,
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    console.error("[UniUni] request failed:", {
      status,
      data,
      message: err.message,
      url,
    });

    // Si token invalide/expiré => on force refresh une fois
    if (status === 401 || status === 403) {
      cachedToken = null;
      cachedTokenExpiresAt = 0;
    }

    throw err;
  }
}

/**
 * Create shipment/business order (selon doc: /orders/createbusinessorder)
 * Tu dois adapter les champs EXACTS selon la doc UniUni (customer_no, pickup, delivery, etc.)
 */
async function createShipment({ order, items }) {
  // ⚠️ Ici il faut suivre la doc “Create Business Order”.
  // Je mets une base propre, tu ajustes les champs obligatoires (customer_no etc.)
  const payload = {
    reference: String(order.id),

    // Exemple (à adapter selon les noms exacts UniUni):
    receiver: order.shipping_full_name,
    receiver_phone: order.shipping_phone,
    delivery_address: `${order.shipping_address1}${order.shipping_apartment ? " " + order.shipping_apartment : ""}`,
    postal_code: order.shipping_postal_code,
    // city / province si demandé dans la doc

    // Items
    items: items.map((it) => ({
      name: it.name,
      quantity: Number(it.quantity),
      unit_price_cents: Number(it.unit_price_cents),
    })),
  };

  // ✅ endpoint correct d’après ta doc
  const data = await uniuniRequest("POST", CREATE_ORDER_PATH, payload);

  // La réponse exacte dépend de la doc (dans ton screenshot: data.tno, order_id, uni_order_sn…)
  const d = data?.data || data;

  return {
    external_shipment_id: String(d.order_id || d.id || ""),
    tracking_number: d.tno || d.tracking_number || null,
    label_url: d.label_url || null,
    raw: data,
  };
}

module.exports = {
  getAccessToken,
  createShipment,
};
