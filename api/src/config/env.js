// src/config/env.js
require("dotenv").config();

const config = {
  port: process.env.PORT || 4000,
  db: {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "koubas_db",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
  },
};

module.exports = config;
