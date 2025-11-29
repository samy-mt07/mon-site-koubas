async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié." });
  }

  return res.status(200).json({
    user: req.user,
  });
}

module.exports = {
  getMe,
};
