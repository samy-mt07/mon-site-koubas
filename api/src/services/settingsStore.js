// In-memory app settings. Not persisted — resets to defaults on server restart.
let freeDelivery = true;

function getFreeDelivery() {
  return freeDelivery;
}

function setFreeDelivery(value) {
  freeDelivery = Boolean(value);
  return freeDelivery;
}

module.exports = { getFreeDelivery, setFreeDelivery };
