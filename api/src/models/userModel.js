// const pool = require("../config/db");

// async function getUserByEmail(email) {
//   const result = await pool.query(
//     `
//     SELECT
//       id,
//       full_name,
//       email,
//       password_hash,
//       is_admin
//     FROM users
//     WHERE email = $1
//     `,
//     [email]
//   );

//   return result.rows[0];
// }

// async function getUserById(id) {
//   const result = await pool.query(
//     `
//     SELECT
//       id,
//       full_name,
//       email,
//       password_hash,
//       is_admin
//     FROM users
//     WHERE id = $1
//     `,
//     [id]
//   );

//   return result.rows[0];
// }

// module.exports = {
//   getUserByEmail,
//   getUserById,
// };


// src/models/userModel.js
const pool = require("../config/db");

async function createUser(full_name, email, password_hash) {
  const result = await pool.query(
    `
    INSERT INTO users (full_name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, full_name, email, created_at, is_admin
    `,
    [full_name, email, password_hash]
  );

  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `
    SELECT id, full_name, email, password_hash, is_admin
    FROM users
    WHERE email = $1
    `,
    [email]
  );
  return result.rows[0];
}

async function getUserById(id) {
  const result = await pool.query(
    `
    SELECT id, full_name, email, password_hash, is_admin
    FROM users
    WHERE id = $1
    `,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};
