// src/config/env.js
require("dotenv").config();

const config = {
  port: Number(process.env.PORT) || 4000,
  jwt: {
    secret: process.env.JWT_SECRET || "dev_jwt_secret_change_me",
  },
  db: {
    host: process.env.PGHOST || process.env.PGHOSTT || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "koubas_db",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "263674",
  },
};

module.exports = config;
