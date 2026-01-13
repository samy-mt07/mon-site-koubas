// api/src/integrations/uniuni/uniuniMapper.js
function mapToCreateShipmentPayload({ order, items }) {
  return {
    recipient: {
      name: order.shipping_full_name || "Test Receiver",
      phone: order.shipping_phone || "+1-514-123-4567",
      email: order.shipping_email || "test@example.com",
      signature: false,
    },
    address: {
      address1: order.shipping_address1 || "2455 Meadowvale Blvd",
      address2: order.shipping_apartment || "",
      city: order.shipping_city || "Montreal",
      province: order.shipping_province || "QC",
      postalCode: order.shipping_postal_code || "H2X 1Y4",
      country: order.shipping_country || "CA",
    },
    dimensions: {
      length: 1,
      width: 1,
      height: 1,
      dimensionUnit: "INCH",
    },
    weight: {
      value: 1,
      weightUnit: "LB",
    },
    postageType: "STANDARD",
    note: `Order #${order.id}`,
    shipmentLineItems: (items || []).map((it) => ({
      description: it.name || "Item",
      quantity: Number(it.quantity || 1),
      unit_value: Math.round(Number(it.unit_price_cents || 0) / 100),
      currency: "CAD",
    })),
  };
}

module.exports = { mapToCreateShipmentPayload };
