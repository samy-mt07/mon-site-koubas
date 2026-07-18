const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { getUserById } = require("../models/userModel");

async function authMiddleware(req, res, next) {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé." });
    }

    // DEBUG SI TU VEUX VOIR CE QUI ARRIVE :
    console.log("🔎 authMiddleware, req.user =", user);

    delete user.password_hash;
    req.user = user;

    next();
  }  catch (err) {
    console.error("Erreur authMiddleware :", err.name, err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "TOKEN_EXPIRED" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }
  
    return res.status(500).json({
      error: "Erreur serveur lors de l'authentification.",
      details: err.message,
    });
  }
}

module.exports = authMiddleware;
