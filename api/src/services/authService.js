

// api/src/services/authService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const {
  createUser,
  getUserByEmail,
  getUserByGoogleId,
  createGoogleUser,
  linkGoogleAccount,
  setVerificationCode,
  markEmailVerified,
} = require("../models/userModel");
const { sendVerificationEmail } = require("./emailService");

const JWT_SECRET = config.jwt.secret;
const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildTokenPayload(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    is_admin: user.is_admin ?? false,
    email_verified: user.email_verified ?? false,
  };
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

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

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

  // Créer user (email_verified=false par défaut)
  const user = await createUser(full_name, email, password_hash, code, expiresAt);

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    throw new Error("EMAIL_SEND_FAILED");
  }

  const payload = buildTokenPayload(user);
  const token = signToken(payload);

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

  //  On vérifie le mot de passe (compte Google sans mot de passe → pas de password_hash)
  if (!user.password_hash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const payload = buildTokenPayload(user);
  const token = signToken(payload);

  return { user: payload, token };
}

// POST /auth/verify-email  { email, code }
async function verifyEmailCode({ email, code }) {
  if (!email || !code) {
    throw new Error("MISSING_FIELDS");
  }

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("INVALID_CODE");
  }

  if (user.email_verified) {
    throw new Error("ALREADY_VERIFIED");
  }

  if (!user.verification_code || user.verification_code !== code) {
    throw new Error("INVALID_CODE");
  }

  if (!user.verification_code_expires_at || new Date(user.verification_code_expires_at) < new Date()) {
    throw new Error("CODE_EXPIRED");
  }

  const updated = await markEmailVerified(user.id);
  const payload = buildTokenPayload(updated);
  const token = signToken(payload);

  return { user: payload, token };
}

// POST /auth/resend-code  { email }
async function resendVerificationCode({ email }) {
  if (!email) {
    throw new Error("MISSING_FIELDS");
  }

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.email_verified) {
    throw new Error("ALREADY_VERIFIED");
  }

  if (user.verification_code_sent_at) {
    const elapsedMs = Date.now() - new Date(user.verification_code_sent_at).getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
      const err = new Error("COOLDOWN_ACTIVE");
      err.retryAfterMs = RESEND_COOLDOWN_MS - elapsedMs;
      throw err;
    }
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

  await setVerificationCode(user.id, code, expiresAt);

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    throw new Error("EMAIL_SEND_FAILED");
  }

  return { message: "CODE_RESENT" };
}

// Google OAuth: login/register + auto-link par email vérifié Google
async function findOrCreateGoogleUser({ googleId, email, fullName }) {
  let user = await getUserByGoogleId(googleId);

  if (!user) {
    const existingByEmail = await getUserByEmail(email);
    if (existingByEmail) {
      // Compte manuel existant avec le même email → on lie le compte Google
      // (Google a déjà vérifié cet email, donc on fait confiance à ce lien).
      user = await linkGoogleAccount(existingByEmail.id, googleId);
    } else {
      user = await createGoogleUser({
        full_name: fullName || email.split("@")[0],
        email,
        google_id: googleId,
      });
    }
  }

  const payload = buildTokenPayload(user);
  const token = signToken(payload);

  return { user: payload, token };
}

module.exports = {
  registerUser,
  loginUser,
  verifyEmailCode,
  resendVerificationCode,
  findOrCreateGoogleUser,
};


