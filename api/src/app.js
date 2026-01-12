// src/app.js
const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.route");
const productRoutes = require("./routes/product.route");
const errorHandler = require("./middlewares/errorHandler");
const orderRoutes = require("./routes/order.route");
const userRoute = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const checkoutRoutes = require("./routes/chekoutRoutes");
const telegramMsg = require("./routes/telegramRoute");
const adminRoutes = require("./routes/adminRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/", telegramMsg);
app.use("/api", healthRoutes);
app.use("/api", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

module.exports = app;
