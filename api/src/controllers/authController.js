// api/src/controllers/authController.js

const {
  registerUser,
  loginUser,
  verifyEmailCode,
  resendVerificationCode,
} = require("../services/authService");

// POST /auth/register
async function register(req, res) {
  try {
    const { full_name, email, password } = req.body;

    const { user, token } = await registerUser({ full_name, email, password });

    return res.status(201).json({
      message: "Utilisateur créé avec succès",
      user,
      token,
    });
  } catch (err) {
    console.error("Erreur register:", err);

    if (err.message === "MISSING_FIELDS") {
      return res
        .status(400)
        .json({ error: "Tous les champs sont obligatoires." });
    }

    if (err.message === "PASSWORD_TOO_SHORT") {
      return res
        .status(400)
        .json({ error: "Mot de passe trop court (minimum 8 caractères)." });
    }

    if (err.message === "EMAIL_ALREADY_USED") {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    if (err.message === "EMAIL_SEND_FAILED") {
      return res.status(502).json({
        error: "Compte créé mais l'envoi de l'email de vérification a échoué. Réessaie via 'Renvoyer le code'.",
      });
    }

    return res
      .status(500)
      .json({ error: "Erreur serveur lors de l'inscription." });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginUser({ email, password });

    return res.status(200).json({
      message: "Connexion réussie",
      user,
      token,
    });
  } catch (err) {
    console.error("Erreur login:", err);

    if (err.message === "MISSING_FIELDS") {
      return res
        .status(400)
        .json({ error: "Email et mot de passe sont obligatoires." });
    }

    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Identifiants invalides." });
    }

    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la connexion." });
  }
}

// POST /auth/logout
async function logout(req, res) {
  return res
    .status(200)
    .json({ message: "Déconnexion réussie (token supprimé côté client)" });
}

// POST /auth/verify-email
async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;

    const { user, token } = await verifyEmailCode({ email, code });

    return res.status(200).json({
      message: "Email vérifié avec succès",
      user,
      token,
    });
  } catch (err) {
    console.error("Erreur verify-email:", err);

    if (err.message === "MISSING_FIELDS") {
      return res.status(400).json({ error: "Email et code sont obligatoires." });
    }
    if (err.message === "ALREADY_VERIFIED") {
      return res.status(400).json({ error: "Cet email est déjà vérifié." });
    }
    if (err.message === "INVALID_CODE") {
      return res.status(400).json({ error: "Code de vérification invalide." });
    }
    if (err.message === "CODE_EXPIRED") {
      return res
        .status(400)
        .json({ error: "Code expiré, demande un nouveau code." });
    }

    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la vérification." });
  }
}

// POST /auth/resend-code
async function resendCode(req, res) {
  try {
    const { email } = req.body;

    const result = await resendVerificationCode({ email });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Erreur resend-code:", err);

    if (err.message === "MISSING_FIELDS") {
      return res.status(400).json({ error: "Email obligatoire." });
    }
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "Aucun compte pour cet email." });
    }
    if (err.message === "ALREADY_VERIFIED") {
      return res.status(400).json({ error: "Cet email est déjà vérifié." });
    }
    if (err.message === "COOLDOWN_ACTIVE") {
      return res.status(429).json({
        error: "Merci de patienter avant de redemander un code.",
        retryAfterMs: err.retryAfterMs,
      });
    }
    if (err.message === "EMAIL_SEND_FAILED") {
      return res
        .status(502)
        .json({ error: "Échec de l'envoi de l'email. Réessaie dans un instant." });
    }

    return res
      .status(500)
      .json({ error: "Erreur serveur lors du renvoi du code." });
  }
}

// GET /auth/google/callback
async function googleCallback(req, res) {
  const { user, token } = req.user;

  const redirectUrl = new URL("/oauth-callback", process.env.FRONTEND_URL);
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("user", JSON.stringify(user));

  res.redirect(redirectUrl.toString());
}

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  resendCode,
  googleCallback,
};
