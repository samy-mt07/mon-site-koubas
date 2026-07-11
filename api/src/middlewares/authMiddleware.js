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
  } catch (err) {
    console.error("Erreur register détectée :", err);

    if (err.message === "MISSING_FIELDS") {
      return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }
    if (err.message === "PASSWORD_TOO_SHORT") {
      return res.status(400).json({ error: "Mot de passe trop court (minimum 8 caractères)." });
    }
    if (err.message === "EMAIL_ALREADY_USED") {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    // Si c'est une autre erreur (ex: registerUser is not a function, ou crash DB), 
    // on renvoie le vrai message pour arrêter le chargement infini dans Thunder Client !
    return res.status(500).json({ 
      error: "Erreur serveur lors de l'inscription.",
      details: err.message 
    });
  }
}

module.exports = authMiddleware;
