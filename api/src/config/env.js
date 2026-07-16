// src/config/env.js
require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env before starting the server.`
    );
  }
  return value;
}

const config = {
  port: Number(process.env.PORT) || 4000,
  jwt: {
    secret: requireEnv("JWT_SECRET"),
  },
  db: {
    host: process.env.PGHOST || process.env.PGHOSTT || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "koubas_db",
    user: process.env.PGUSER || "postgres",
    password: requireEnv("PGPASSWORD"),
  },
};

module.exports = config;
