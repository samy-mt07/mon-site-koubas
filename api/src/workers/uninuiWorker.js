// api/src/workers/uniuniWorker.js
const pool = require("../config/db");
const { createShipment } = require("../services/uniuniService");

async function processOnePendingShipment() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Pick 1 job (SKIP LOCKED => safe si plusieurs workers)
    const pickRes = await client.query(`
      SELECT s.*
      FROM shipments s
      WHERE s.carrier = 'uniuni'
        AND s.status = 'pending'
        AND (s.external_shipment_id IS NULL OR s.external_shipment_id = '')
      ORDER BY s.created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    if (pickRes.rows.length === 0) {
      await client.query("COMMIT");
      return false; // rien à traiter
    }

    const shipmentRow = pickRes.rows[0];

    // 2) Mark "processing" (optionnel mais utile)
    await client.query(
      `UPDATE shipments
       SET status = 'processing', updated_at = NOW()
       WHERE id = $1`,
      [shipmentRow.id]
    );

    // 3) Load order
    const orderRes = await client.query(`SELECT * FROM orders WHERE id = $1`, [
      shipmentRow.order_id,
    ]);
    const order = orderRes.rows[0];
    if (!order) {
      await client.query(
        `UPDATE shipments SET status='failed', last_error=$2, updated_at=NOW() WHERE id=$1`,
        [shipmentRow.id, "ORDER_NOT_FOUND"]
      );
      await client.query("COMMIT");
      return true;
    }

    // 4) Load items + product name
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

    // 5) Call UniUni
    const uniuni = await createShipment({ order, items });

    // 6) Update DB
    await client.query(
      `
      UPDATE shipments
      SET service_code=$2,
          external_shipment_id=$3,
          tracking_number=$4,
          label_url=$5,
          status='created',
          last_error=NULL,
          updated_at=NOW()
      WHERE id=$1
      `,
      [
        shipmentRow.id,
        uniuni.service_code,
        uniuni.external_shipment_id,
        uniuni.tracking_number,
        uniuni.label_url,
      ]
    );

    await client.query(
      `UPDATE orders SET shipping_status='shipment_created' WHERE id=$1`,
      [shipmentRow.order_id]
    );

    await client.query("COMMIT");
    return true;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
      // Log minimal, pas de crash worker
    } catch {}
    console.error("[UniUniWorker] process error:", err.message);

    // Essayons d’enregistrer l’erreur si possible (best-effort)
    try {
      if (err?.shipmentId) {
        await pool.query(
          `UPDATE shipments SET status='failed', last_error=$2, updated_at=NOW() WHERE id=$1`,
          [err.shipmentId, String(err.message)]
        );
      }
    } catch {}

    return true; // on a travaillé (même si failed)
  } finally {
    client.release();
  }
}

function startUniUniWorker() {
  const enabled = String(process.env.UNIUNI_WORKER_ENABLED || "false") === "true";
  if (!enabled) {
    console.log("[UniUniWorker] disabled (UNIUNI_WORKER_ENABLED=false)");
    return;
  }

  const intervalMs = Number(process.env.UNIUNI_WORKER_INTERVAL_MS || 15000);
  console.log(`[UniUniWorker] started (interval=${intervalMs}ms)`);

  // boucle simple
  setInterval(async () => {
    try {
      // traite 1 à la fois (tu peux faire while(...) pour vider la queue)
      await processOnePendingShipment();
    } catch (e) {
      console.error("[UniUniWorker] tick error:", e.message);
    }
  }, intervalMs);
}

module.exports = { startUniUniWorker };
