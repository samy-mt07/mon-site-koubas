// src/config/db.js
const { Pool } = require("pg");
const config = require("./env");

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

pool.on("error", (err) => {
  console.error("Erreur client BD : ", err);
});

module.exports = pool;
