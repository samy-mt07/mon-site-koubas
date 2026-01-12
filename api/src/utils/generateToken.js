const jwt = require("jsonwebtoken");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role, // <-- OBLIGATOIRE POUR ADMIN
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

module.exports = generateToken;
