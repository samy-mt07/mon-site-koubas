

// api/src/services/authService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { createUser, getUserByEmail } = require("../models/userModel");

const JWT_SECRET = config.jwt.secret;

// REGISTER
async function registerUser({ full_name, email, password }) {
  if (!full_name || !email || !password) {
    throw new Error("MISSING_FIELDS");
  }

  if (password.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  // Vérifie si email existe
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_USED");
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Créer user → ton modèle créer l'utilisateur SANS is_admin donc on fait comme avant
  const user = await createUser(full_name, email, password_hash);

  // IMPORTANT : si colonne is_admin existe, on le renvoie, sinon false
  user.is_admin = user.is_admin ?? false;

  // Construire le payload complet du token
  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    is_admin: user.is_admin, 
  };

  // Générer token
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  delete user.password_hash;

  return { user: payload, token };
}


if (!JWT_SECRET) {
  throw new Error("JWT_SECRET non défini dans le .env");
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("MISSING_FIELDS");
  }

  //  On cherche l'utilisateur par email
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  //  On vérifie le mot de passe
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 3️ On s'assure que is_admin est bien un booléen
  // (si dans la BD c'est NULL → false)
  user.is_admin = user.is_admin ?? false;

  // 4️ Payload qui sera dans le token ET renvoyé au front
  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    is_admin: user.is_admin, //  très important
  };

// 5️Générer le token JWT
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  // 6️ On enlève le hash avant de renvoyer l'utilisateur
  delete user.password_hash;

  return { user: payload, token };
}

//  UN SEUL EXPORT PROPRE ICI :
module.exports = {
  registerUser,
  loginUser,
};


