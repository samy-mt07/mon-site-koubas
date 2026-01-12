// // api/src/controllers/orderController.js
// const pool = require("../config/db");

// // corps attendu :
// // {
// //   "customer": { "full_name": "...", "email": "..." },
// //   "cart": [
// //      { "product_id": 1, "quantity": 2 },
// //      ...
// //   ]
// // }

// async function checkout(req, res) {
//   const client = await pool.connect();

//   try {
//     const body = req.body;

//     const customer = body.customer;
//     const cart = body.cart;

//     if (!customer || !customer.full_name || !customer.email) {
//       return res.status(400).json({ error: "Customer invalide" });
//     }

//     if (!cart || !Array.isArray(cart) || cart.length === 0) {
//       return res.status(400).json({ error: "Panier vide" });
//     }

//     // On commence une transaction
//     await client.query("BEGIN");

//     // 1) Vérifier si l'utilisateur existe déjà
//     const userResult = await client.query(
//       "SELECT id FROM users WHERE email = $1",
//       [customer.email]
//     );

//     let userId;

//     if (userResult.rows.length > 0) {
//       userId = userResult.rows[0].id;
//     } else {
//       // Ici on met "no-password" car tu n'as pas encore de système d'auth
//       const insertUserResult = await client.query(
//         "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
//         [customer.full_name, customer.email, "no-password"]
//       );
//       userId = insertUserResult.rows[0].id;
//     }

//     // 2) Calculer le total à partir de la table products (pour éviter qu’on triche côté front)
//     let totalCents = 0;

//     // On va créer un tableau pour stocker les infos produits complètes
//     const cartWithPrices = [];

//     for (let i = 0; i < cart.length; i++) {
//       const item = cart[i];

//       const productResult = await client.query(
//         "SELECT id, price_cents FROM products WHERE id = $1 AND is_active = TRUE",
//         [item.product_id]
//       );

//       if (productResult.rows.length === 0) {
//         throw new Error(
//           "Produit introuvable ou inactif (id=" + item.product_id + ")"
//         );
//       }

//       const productRow = productResult.rows[0];
//       const unitPrice = productRow.price_cents;
//       const quantity = item.quantity;
//       const subtotal = unitPrice * quantity;

//       totalCents += subtotal;

//       cartWithPrices.push({
//         product_id: productRow.id,
//         quantity: quantity,
//         unit_price_cents: unitPrice,
//         subtotal_cents: subtotal,
//       });
//     }

//     // 3) Créer la commande
//     const orderResult = await client.query(
//       "INSERT INTO orders (user_id, total_cents, status) VALUES ($1, $2, $3) RETURNING id",
//       [userId, totalCents, "pending"]
//     );

//     const orderId = orderResult.rows[0].id;

//     // 4) Créer les order_items
//     for (let i = 0; i < cartWithPrices.length; i++) {
//       const item = cartWithPrices[i];

//       await client.query(
//         "INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, subtotal_cents) VALUES ($1, $2, $3, $4, $5)",
//         [
//           orderId,
//           item.product_id,
//           item.quantity,
//           item.unit_price_cents,
//           item.subtotal_cents,
//         ]
//       );
//     }

//     // 5) Créer un paiement "faux" (mock)
//     await client.query(
//       "INSERT INTO payments (order_id, amount_cents, provider, status) VALUES ($1, $2, $3, $4)",
//       [orderId, totalCents, "mock-provider", "succeeded"]
//     );

//     // 6) Mettre la commande à "paid"
//     await client.query("UPDATE orders SET status = $1 WHERE id = $2", [
//       "paid",
//       orderId,
//     ]);

//     // 7) Valider la transaction
//     await client.query("COMMIT");

//     return res.status(201).json({
//       message: "Commande créée avec succès",
//       order_id: orderId,
//       total_cents: totalCents,
//     });
//   } catch (err) {
//     console.error("Erreur checkout :", err);
//     await client.query("ROLLBACK");
//     return res
//       .status(500)
//       .json({ error: "Erreur serveur pendant le checkout" });
//   } finally {
//     client.release();
//   }
// }
// async function getAllOrders(req, res) {
//   try {
//     const result = await pool.query(
//       `SELECT
//          o.id,
//          o.created_at,
//          o.status,
//          o.total_cents,
//          u.full_name  AS customer_name,
//          u.email      AS customer_email
//        FROM orders o
//        JOIN users u ON o.user_id = u.id
//        ORDER BY o.created_at DESC`
//     );

//     return res.status(200).json(result.rows);
//   } catch (err) {
//     console.error("Erreur getAllOrders :", err);
//     return res
//       .status(500)
//       .json({ error: "Erreur serveur lors de la récupération des commandes" });
//   }
// }
// module.exports = {
//   checkout: checkout,
//   getAllOrders,
// };

// api/src/controllers/orderController.js
const pool = require("../config/db");

// Corps attendu :
//
// {
//   "customer": {          // optionnel, surtout utile côté front
//     "full_name": "...",
//     "email": "..."
//   },
//   "shipping": {          // OBLIGATOIRE
//     "full_name": "...",
//     "phone": "...",
//     "address1": "...",
//     "apartment": "Apt 305",   // optionnel
//     "city": "...",
//     "postal_code": "...",
//     "country": "Canada"       // optionnel, default dans la BD
//   },
//   "cart": [
//      { "product_id": 1, "quantity": 2 },
//      ...
//   ]
// }
//
// ⚠️ La route checkout doit être protégée par authMiddleware
//    pour que req.user soit défini (user déjà authentifié)

async function checkout(req, res) {
  const client = await pool.connect();

  try {
    const body = req.body;

    const customer = body.customer || {};
    const cart = body.cart;
    const shipping = body.shipping;

    // 0) Vérifier que l'utilisateur est authentifié
    const authUser = req.user; // vient de authMiddleware
    if (!authUser || !authUser.id) {
      return res
        .status(401)
        .json({ error: "Utilisateur non authentifié pour le checkout." });
    }
    const userId = authUser.id;

    // 1) Validation customer (minimale)
    // On tolère que customer ne soit pas parfait, car on a authUser
    if (!customer.full_name) {
      // on peut utiliser le nom de l'utilisateur loggé comme fallback
      customer.full_name = authUser.full_name || "Client";
    }
    if (!customer.email) {
      customer.email = authUser.email;
    }

    // 2) Validation panier
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // 3) Validation adresse de livraison
    if (
      !shipping ||
      !shipping.full_name ||
      !shipping.phone ||
      !shipping.address1 ||
      !shipping.city ||
      !shipping.postal_code
    ) {
      return res.status(400).json({ error: "Adresse de livraison incomplète" });
    }

    // On commence une transaction
    await client.query("BEGIN");

    // 4) Calculer le total à partir de la table products
    let totalCents = 0;
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

    // 5) Créer la commande AVEC adresse de livraison
    const orderResult = await client.query(
      `INSERT INTO orders (
         user_id,
         total_cents,
         status,
         shipping_full_name,
         shipping_phone,
         shipping_address1,
         shipping_apartment,
         shipping_city,
         shipping_postal_code,
         shipping_country,
         shipping_status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        userId,
        totalCents,
        "paid", // on considère le paiement OK à ce stade
        shipping.full_name,
        shipping.phone,
        shipping.address1,
        shipping.apartment || null,
        shipping.city,
        shipping.postal_code,
        shipping.country || "Canada",
        "pending_shipment", // pour le worker UniUni
      ]
    );

    const orderId = orderResult.rows[0].id;

    // 6) Créer les order_items
    for (let i = 0; i < cartWithPrices.length; i++) {
      const item = cartWithPrices[i];

      await client.query(
        `INSERT INTO order_items (
           order_id,
           product_id,
           quantity,
           unit_price_cents,
           subtotal_cents
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price_cents,
          item.subtotal_cents,
        ]
      );
    }

    // 7) Créer un paiement "faux" (mock)
    await client.query(
      `INSERT INTO payments (
         order_id,
         amount_cents,
         provider,
         status
       )
       VALUES ($1, $2, $3, $4)`,
      [orderId, totalCents, "mock-provider", "succeeded"]
    );

    // 8) Créer un shipment pending pour UniUni (async plus tard)
    await client.query(
      `INSERT INTO shipments (order_id, carrier, status)
       VALUES ($1, $2, $3)`,
      [orderId, "uniuni", "pending"]
    );

    // 9) Valider la transaction
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Commande créée avec succès",
      order_id: orderId,
      total_cents: totalCents,
      shipping_status: "pending_shipment",
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

// Admin: liste des commandes
async function getAllOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         o.id,
         o.created_at,
         o.status,
         o.shipping_status,
         o.total_cents,
         o.shipping_city,
         o.shipping_country,
         u.full_name  AS customer_name,
         u.email      AS customer_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erreur getAllOrders :", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des commandes" });
  }
}

module.exports = {
  checkout,
  getAllOrders,
};
