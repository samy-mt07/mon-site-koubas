// api/src/controllers/orderController.js
const pool = require("../config/db");

// corps attendu :
// {
//   "customer": { "full_name": "...", "email": "..." },
//   "cart": [
//      { "product_id": 1, "quantity": 2 },
//      ...
//   ]
// }

async function checkout(req, res) {
  const client = await pool.connect();

  try {
    const body = req.body;

    const customer = body.customer;
    const cart = body.cart;

    if (!customer || !customer.full_name || !customer.email) {
      return res.status(400).json({ error: "Customer invalide" });
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // On commence une transaction
    await client.query("BEGIN");

    // 1) Vérifier si l'utilisateur existe déjà
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [customer.email]
    );

    let userId;

    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      // Ici on met "no-password" car tu n'as pas encore de système d'auth
      const insertUserResult = await client.query(
        "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
        [customer.full_name, customer.email, "no-password"]
      );
      userId = insertUserResult.rows[0].id;
    }

    // 2) Calculer le total à partir de la table products (pour éviter qu’on triche côté front)
    let totalCents = 0;

    // On va créer un tableau pour stocker les infos produits complètes
    const cartWithPrices = [];

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];

      const productResult = await client.query(
        "SELECT id, price_cents FROM products WHERE id = $1 AND is_active = TRUE",
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(
          "Produit introuvable ou inactif (id=" + item.product_id + ")"
        );
      }

      const productRow = productResult.rows[0];
      const unitPrice = productRow.price_cents;
      const quantity = item.quantity;
      const subtotal = unitPrice * quantity;

      totalCents += subtotal;

      cartWithPrices.push({
        product_id: productRow.id,
        quantity: quantity,
        unit_price_cents: unitPrice,
        subtotal_cents: subtotal,
      });
    }

    // 3) Créer la commande
    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total_cents, status) VALUES ($1, $2, $3) RETURNING id",
      [userId, totalCents, "pending"]
    );

    const orderId = orderResult.rows[0].id;

    // 4) Créer les order_items
    for (let i = 0; i < cartWithPrices.length; i++) {
      const item = cartWithPrices[i];

      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, subtotal_cents) VALUES ($1, $2, $3, $4, $5)",
        [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price_cents,
          item.subtotal_cents,
        ]
      );
    }

    // 5) Créer un paiement "faux" (mock)
    await client.query(
      "INSERT INTO payments (order_id, amount_cents, provider, status) VALUES ($1, $2, $3, $4)",
      [orderId, totalCents, "mock-provider", "succeeded"]
    );

    // 6) Mettre la commande à "paid"
    await client.query("UPDATE orders SET status = $1 WHERE id = $2", [
      "paid",
      orderId,
    ]);

    // 7) Valider la transaction
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Commande créée avec succès",
      order_id: orderId,
      total_cents: totalCents,
    });
  } catch (err) {
    console.error("Erreur checkout :", err);
    await client.query("ROLLBACK");
    return res
      .status(500)
      .json({ error: "Erreur serveur pendant le checkout" });
  } finally {
    client.release();
  }
}

module.exports = {
  checkout: checkout,
};
