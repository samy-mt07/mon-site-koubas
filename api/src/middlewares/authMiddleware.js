const jwt = require("jsonwebtoken");
const { getUserById } = require("../models/userModel");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // on verifie la presence du header Authorization: Bearer xxx
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // on verifie et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé." });
    }

    // on enleve le hash avant d’attacher au req
    delete user.password_hash;
    req.user = user;

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

module.exports = authMiddleware;
