// src/app.js
const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.route");
const productRoutes = require("./routes/product.route");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", productRoutes);

app.use(errorHandler);

module.exports = app;
