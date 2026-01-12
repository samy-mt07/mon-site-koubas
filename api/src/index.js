// src/index.js
const app = require("./app");
const config = require("./config/env");
const { startUniUniWorker } = require("./workers/uninuiWorker");

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

if (process.env.UNIUNI_WORKER_ENABLED === "true") {
  startUniUniWorker();
}
