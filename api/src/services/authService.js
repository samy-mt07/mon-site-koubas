const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, getUserByEmail } = require("../models/userModel");

// REGISTER
async function registerUser({ full_name, email, password }) {
  // 1) Validation de base
  if (!full_name || !email || !password) {
    throw new Error("MISSING_FIELDS");
  }

  if (password.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  // 2) Vérifier si l'email existe déjà
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_USED");
  }

  // 3) Hasher le mot de passe
  const password_hash = await bcrypt.hash(password, 10);

  // 4) Créer l'utilisateur
  const user = await createUser(full_name, email, password_hash);

  // 5) Générer un token JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // On retire le hash avant de renvoyer au client
  delete user.password_hash;

  return { user, token };
}

// LOGIN
async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("MISSING_FIELDS");
  }

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  delete user.password_hash;

  return { user, token };
}

module.exports = {
  registerUser,
  loginUser,
};
