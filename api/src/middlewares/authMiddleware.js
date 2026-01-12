const jwt = require("jsonwebtoken");
const { getUserById } = require("../models/userModel");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token manquant ou invalide." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé." });
    }

    // DEBUG SI TU VEUX VOIR CE QUI ARRIVE :
    console.log("🔎 authMiddleware, req.user =", user);

    delete user.password_hash;
    req.user = user;

    next();
  } catch (err) {
    console.error("❌ Erreur authMiddleware :", err);
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

module.exports = authMiddleware;
