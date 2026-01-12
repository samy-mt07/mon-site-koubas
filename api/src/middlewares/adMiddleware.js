function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  // On accepte plusieurs formats selon la BD : true / 1 / 'true'
  const isAdmin =
    req.user.is_admin === true ||
    req.user.is_admin === 1 ||
    req.user.is_admin === "true";

  if (!isAdmin) {
    return res
      .status(403)
      .json({ error: "Accès interdit : admin uniquement." });
  }

  next();
}

module.exports = adminMiddleware;
