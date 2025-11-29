// src/middlewares/validateUser.js

function validateUser(req, res, next) {
  const { full_name, email, password } = req.body;

  // Nom : 3–20 caractères, lettres/chiffres uniquement
  const nameRegex = /^[A-Za-z0-9]{3,20}$/;

  // Email valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Mot de passe : min 8 caractères + 1 maj + 1 min + 1 chiffre + 1 caractère spécial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!nameRegex.test(full_name)) {
    return res.status(400).json({
      message:
        "Nom invalide (3-20 caractères, lettres et chiffres uniquement).",
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Email invalide." });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Mot de passe invalide (min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 caractère spécial).",
    });
  }

  next();
}

module.exports = validateUser;
