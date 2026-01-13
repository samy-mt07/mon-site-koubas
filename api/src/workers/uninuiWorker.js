// api/src/workers/uniuniWorker.js
const pool = require("../config/db");
const {
  createShipment,
  purchaseShipment,
  getLabel,
} = require("../integrations/uniuni/uniuniService");

// --- Helpers ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function envTrue(name, defaultValue = "false") {
  return String(process.env[name] ?? defaultValue).toLowerCase() === "true";
}

/**
 * Erreurs "transitoires" (on peut retry)
 * - UNIUNI_NOT_DRAFT : UniUni a déjà changé le status (souvent PENDING) => purchase impossible maintenant
 * - UNIUNI_UNPAID_LABEL : label impossible tant que pas acheté/paiement pas passé
 */
function isRetryableUniUni(err) {
  return err?.kind === "UNIUNI_NOT_DRAFT" || err?.kind === "UNIUNI_UNPAID_LABEL";
}

async function updateShipmentStatus(client, shipmentId, patch) {
  // patch: { status, external_shipment_id, tracking_number, label_url, last_error }
  const fields = [];
  const values = [shipmentId];
  let i = 2;

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = $${i++}`);
    values.push(v);
  }

  fields.push(`updated_at = NOW()`);

  const sql = `
    UPDATE shipments
    SET ${fields.join(", ")}
    WHERE id = $1
  `;
  await client.query(sql, values);
}

async function updateOrderShippingStatus(client, orderId, shippingStatus) {
  await client.query(
    `UPDATE orders SET shipping_status=$2 WHERE id=$1`,
    [orderId, shippingStatus]
  );
}

async function markFailed(poolOrClient, shipmentId, err) {
  const msg =
    (err?.uniuni && JSON.stringify(err.uniuni).slice(0, 1500)) ||
    String(err?.message || err);

  await poolOrClient.query(
    `UPDATE shipments SET status='failed', last_error=$2, updated_at=NOW() WHERE id=$1`,
    [shipmentId, msg]
  );
}

async function processOnePendingShipment() {
  const client = await pool.connect();
  let pickedShipmentId = null;
  let pickedOrderId = null;

  const autoPurchase = envTrue("UNIUNI_AUTO_PURCHASE", "false");
  const autoLabel = envTrue("UNIUNI_AUTO_LABEL", "false");

  // petits retry côté UniUni
  const maxAttempts = Number(process.env.UNIUNI_STEP_MAX_ATTEMPTS || 3);
  const retryDelayMs = Number(process.env.UNIUNI_STEP_RETRY_DELAY_MS || 2500);

  try {
    await client.query("BEGIN");

    // 1) Pick 1 shipment pending seulement si order paid
    const pickRes = await client.query(`
      SELECT s.*
      FROM shipments s
      JOIN orders o ON o.id = s.order_id
      WHERE s.carrier = 'uniuni'
        AND s.status = 'pending'
        AND o.status = 'paid'
        AND (s.external_shipment_id IS NULL OR s.external_shipment_id = '')
      ORDER BY s.created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    if (pickRes.rows.length === 0) {
      await client.query("COMMIT");
      return false;
    }

    const shipmentRow = pickRes.rows[0];
    pickedShipmentId = shipmentRow.id;
    pickedOrderId = shipmentRow.order_id;

    // 2) processing
    await updateShipmentStatus(client, shipmentRow.id, {
      status: "processing",
      last_error: null,
    });

    // 3) load order
    const orderRes = await client.query(`SELECT * FROM orders WHERE id=$1`, [
      shipmentRow.order_id,
    ]);
    const order = orderRes.rows[0];

    if (!order) {
      await updateShipmentStatus(client, shipmentRow.id, {
        status: "failed",
        last_error: "ORDER_NOT_FOUND",
      });
      await client.query("COMMIT");
      return true;
    }

    // 4) items
    const itemsRes = await client.query(
      `
      SELECT oi.quantity, oi.unit_price_cents, oi.subtotal_cents, p.name
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      `,
      [shipmentRow.order_id]
    );

    const items = itemsRes.rows.map((r) => ({
      name: r.name || "Unknown product",
      quantity: Number(r.quantity),
      unit_price_cents: Number(r.unit_price_cents),
      subtotal_cents: Number(r.subtotal_cents),
    }));

    // 🔥 NOTE PROD :
    // Aujourd’hui le mapper UniUni utilise une adresse statique.
    // En production: on doit prendre l’adresse du client au checkout et l’envoyer à UniUni.

    // 5) Create shipment on UniUni (DRAFT normalement)
    const created = await createShipment({ order, items });
    const orderNumber = created.orderNumber;

    // 6) Save draft
    await updateShipmentStatus(client, shipmentRow.id, {
      external_shipment_id: orderNumber,
      status: "draft",
      last_error: null,
    });
    await updateOrderShippingStatus(client, shipmentRow.order_id, "shipment_draft");

    // --- Après CREATE : on peut COMMIT déjà (optionnel) ---
    // Mais on continue dans la même transaction pour garder cohérence.
    // (UniUni est externe, mais au moins nos updates DB sont atomiques)

    // 7) AUTO PURCHASE (si activé)
    let trackingId = null;
    if (autoPurchase) {
      let purchased = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          purchased = await purchaseShipment(orderNumber);
          trackingId = purchased.trackingId || null;

          await updateShipmentStatus(client, shipmentRow.id, {
            tracking_number: trackingId,
            status: "purchased",
            last_error: null,
          });
          await updateOrderShippingStatus(
            client,
            shipmentRow.order_id,
            "shipment_purchased"
          );
          break;
        } catch (err) {
          // si UniUni dit "not draft" => pas payable maintenant, on arrête les retries purchase
          if (err?.kind === "UNIUNI_NOT_DRAFT") {
            await updateShipmentStatus(client, shipmentRow.id, {
              // on reste draft côté DB, mais on log l'info
              status: "draft",
              last_error: `PURCHASE_SKIPPED_NOT_DRAFT: ${err.message}`,
            });
            break;
          }

          if (attempt === maxAttempts || !isRetryableUniUni(err)) {
            throw err;
          }

          await updateShipmentStatus(client, shipmentRow.id, {
            last_error: `PURCHASE_RETRY_${attempt}: ${err.message}`,
          });
          await sleep(retryDelayMs);
        }
      }
    }

    // 8) AUTO LABEL (si activé)
    if (autoLabel) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // Si pas encore payé, UniUni renvoie "Cannot print labels for unpaid shipments"
          // => retry possible, car parfois le purchase vient de passer.
          const label = await getLabel(orderNumber, "shipping");

          // tu ne veux pas stocker le PDF en DB => OK
          // mais tu peux marquer "labeled" pour dire "label récupérable"
          await updateShipmentStatus(client, shipmentRow.id, {
            status: "labeled",
            last_error: null,
          });
          await updateOrderShippingStatus(client, shipmentRow.order_id, "label_ready");

          // Si un jour tu veux un endpoint /shipments/:id/label, tu l’appelles à la demande
          // et tu renvoies label.bodyBase64 converti en PDF.

          break;
        } catch (err) {
          // Si unpaid label => soit purchase n’a pas été fait, soit il n’est pas encore pris en compte
          if (attempt === maxAttempts || !isRetryableUniUni(err)) {
            throw err;
          }

          await updateShipmentStatus(client, shipmentRow.id, {
            last_error: `LABEL_RETRY_${attempt}: ${err.message}`,
          });
          await sleep(retryDelayMs);
        }
      }
    }

    await client.query("COMMIT");
    return true;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error("[UniUniWorker] process error:", err.message);

    // best effort: enregistrer erreur sur la shipment pick
    if (pickedShipmentId) {
      try {
        await markFailed(pool, pickedShipmentId, err);
      } catch {}
    }

    return true;
  } finally {
    client.release();
  }
}

function startUniUniWorker() {
  const enabled = envTrue("UNIUNI_WORKER_ENABLED", "false");
  if (!enabled) {
    console.log("[UniUniWorker] disabled (UNIUNI_WORKER_ENABLED=false)");
    return;
  }

  const intervalMs = Number(process.env.UNIUNI_WORKER_INTERVAL_MS || 15000);
  console.log(`[UniUniWorker] started (interval=${intervalMs}ms)`);

  setInterval(async () => {
    try {
      await processOnePendingShipment();
    } catch (e) {
      console.error("[UniUniWorker] tick error:", e.message);
    }
  }, intervalMs);
}

module.exports = { startUniUniWorker };
