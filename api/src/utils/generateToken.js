const jwt = require("jsonwebtoken");
const config = require("../config/env");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role, // <-- OBLIGATOIRE POUR ADMIN
    },
    config.jwt.secret,
    { expiresIn: "24h" }
  );
}

module.exports = generateToken;
