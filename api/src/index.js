// src/index.js
const app = require("./app");
const config = require("./config/env");

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
