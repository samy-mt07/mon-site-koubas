// src/app.js
const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");
const healthRoutes = require("./routes/health.route");
const productRoutes = require("./routes/product.route");
const errorHandler = require("./middlewares/errorHandler");
const userRoute = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const checkoutRoutes = require("./routes/chekoutRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const telegramMsg = require("./routes/telegramRoute");
const adminRoutes = require("./routes/adminRoutes");
const app = express();
const path = require("path");

app.use(cors());
app.use(passport.initialize());
app.use(
  "/api/checkout/webhook",
  express.raw({ type: "application/json" })
);

app.use((req, res, next) => {
  if (req.originalUrl === "/api/checkout/webhook") {
    return next();
  }
  express.json()(req, res, next);
});

app.use("/api/", telegramMsg);
app.use("/api", healthRoutes);
app.use("/api", productRoutes);
// POST /api/orders/checkout (mock-provider, no Stripe) retired pre-production.
// order.route.js and orderController.js are left on disk, just unmounted.
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/labels", express.static(path.join(__dirname, "../labels")));
app.use(errorHandler);

module.exports = app;