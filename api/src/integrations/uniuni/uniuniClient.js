// api/src/integrations/uniuni/uniuniClient.js
const axios = require("axios");

function getUniUniClient() {
  const baseUrl = process.env.UNIUNI_BASE_URL; // ex: https://api-sandbox.ship.uniuni.com/client
  const token = process.env.UNIUNI_ACCESS_TOKEN; // Bearer token

  if (!baseUrl || !token) {
    console.warn("[UniUni] Missing UNIUNI_BASE_URL or UNIUNI_ACCESS_TOKEN");
  }

  return axios.create({
    baseURL: baseUrl,
    timeout: 60000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

module.exports = { getUniUniClient };
