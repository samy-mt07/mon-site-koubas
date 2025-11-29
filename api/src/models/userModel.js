// src/models/userModel.js
const pool = require("../config/db");

// Créer un utilisateur
async function createUser(full_name, email, password_hash) {
  const query = `
    INSERT INTO users (full_name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, full_name, email, password_hash, created_at
  `;
  const values = [full_name, email, password_hash];

  const result = await pool.query(query, values);
  return result.rows[0]; // { id, full_name, email, password_hash, created_at }
}

// Chercher un utilisateur par email
async function getUserByEmail(email) {
  const query = `
    SELECT id, full_name, email, password_hash, created_at
    FROM users
    WHERE email = $1
  `;
  const values = [email];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

// Chercher un utilisateur par id (pour /me, profil, etc.)
async function getUserById(id) {
  const query = `
    SELECT id, full_name, email, password_hash, created_at
    FROM users
    WHERE id = $1
  `;
  const values = [id];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

// 🔥 Très important : exporter un OBJET avec toutes les fonctions
module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};
