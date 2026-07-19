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

const USER_FIELDS = `
  id, full_name, email, password_hash, is_admin,
  email_verified, verification_code, verification_code_expires_at,
  verification_code_sent_at, google_id, auth_provider, created_at
`;

const PUBLIC_USER_FIELDS = `
  id, full_name, email, created_at, is_admin,
  email_verified, auth_provider, google_id
`;

async function createUser(full_name, email, password_hash, verificationCode, verificationCodeExpiresAt) {
  const result = await pool.query(
    `
    INSERT INTO users (full_name, email, password_hash, verification_code, verification_code_expires_at, verification_code_sent_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING ${PUBLIC_USER_FIELDS}
    `,
    [full_name, email, password_hash, verificationCode, verificationCodeExpiresAt]
  );

  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `
    SELECT ${USER_FIELDS}
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
    SELECT ${USER_FIELDS}
    FROM users
    WHERE id = $1
    `,
    [id]
  );
  return result.rows[0];
}

async function getUserByGoogleId(googleId) {
  const result = await pool.query(
    `
    SELECT ${USER_FIELDS}
    FROM users
    WHERE google_id = $1
    `,
    [googleId]
  );
  return result.rows[0];
}

async function createGoogleUser({ full_name, email, google_id }) {
  const result = await pool.query(
    `
    INSERT INTO users (full_name, email, google_id, auth_provider, email_verified)
    VALUES ($1, $2, $3, 'google', true)
    RETURNING ${PUBLIC_USER_FIELDS}
    `,
    [full_name, email, google_id]
  );
  return result.rows[0];
}

async function linkGoogleAccount(userId, googleId) {
  const result = await pool.query(
    `
    UPDATE users
    SET google_id = $2, email_verified = true
    WHERE id = $1
    RETURNING ${PUBLIC_USER_FIELDS}
    `,
    [userId, googleId]
  );
  return result.rows[0];
}

async function setVerificationCode(userId, code, expiresAt) {
  await pool.query(
    `
    UPDATE users
    SET verification_code = $2, verification_code_expires_at = $3, verification_code_sent_at = NOW()
    WHERE id = $1
    `,
    [userId, code, expiresAt]
  );
}

async function markEmailVerified(userId) {
  const result = await pool.query(
    `
    UPDATE users
    SET email_verified = true, verification_code = NULL, verification_code_expires_at = NULL
    WHERE id = $1
    RETURNING ${PUBLIC_USER_FIELDS}
    `,
    [userId]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByGoogleId,
  createGoogleUser,
  linkGoogleAccount,
  setVerificationCode,
  markEmailVerified,
};
