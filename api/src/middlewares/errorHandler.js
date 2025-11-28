// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error("Erreur non gérée :", err);
  res.status(500).json({ error: "Erreur serveur interne" });
}

module.exports = errorHandler;
