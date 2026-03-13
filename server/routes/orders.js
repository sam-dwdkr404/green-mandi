const express = require("express");
const Listing = require("../models/Listing");
const Order = require("../models/Order");

const router = express.Router();

const LOCATION_COORDS = {
  Nipani: { lat: 16.399, lng: 74.382 },
  Belagavi: { lat: 15.8497, lng: 74.4977 },
  Kolhapur: { lat: 16.705, lng: 74.2433 },
  Sangli: { lat: 16.8524, lng: 74.5815 },
  Hubballi: { lat: 15.3647, lng: 75.124 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Pune: { lat: 18.5204, lng: 73.8567 },
};

function getCoordinates(location) {
  return LOCATION_COORDS[location] || { lat: 15.9, lng: 74.7 };
}

function buildTrackingPoints(origin, destination) {
  return [
    { label: "Farm pickup", lat: origin.lat, lng: origin.lng },
    {
      label: "Highway checkpoint",
      lat: Number(((origin.lat + destination.lat) / 2).toFixed(4)),
      lng: Number(((origin.lng + destination.lng) / 2).toFixed(4)),
    },
    { label: "Retail delivery", lat: destination.lat, lng: destination.lng },
  ];
}

router.get("/", async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(20);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { listingId, retailer, quantity, deliveryLocation } = req.body;
    const parsedQuantity = Number(quantity);

    if (!listingId || !retailer || !deliveryLocation || !parsedQuantity) {
      return res.status(400).json({
        error: "listingId, retailer, quantity, and deliveryLocation are required.",
      });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }

    if (parsedQuantity > listing.quantity) {
      return res.status(400).json({
        error: "Requested quantity exceeds the available stock.",
      });
    }

    const origin = getCoordinates(listing.location);
    const destination = getCoordinates(deliveryLocation);
    const order = await Order.create({
      listing: listing._id,
      crop: listing.crop,
      farmer: listing.farmer,
      retailer: retailer.trim(),
      quantity: parsedQuantity,
      pricePerKg: listing.price,
      totalAmount: parsedQuantity * listing.price,
      deliveryLocation: deliveryLocation.trim(),
      paymentMethod: "UPI",
      paymentStatus: "pending",
      paymentReference: `UPI-${Date.now()}`,
      status: "payment_pending",
      logisticsProgress: 6,
      etaText: "Awaiting payment confirmation",
      trackingPoints: buildTrackingPoints(origin, destination),
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/pay/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.paymentStatus === "paid") {
      return res.json(order);
    }

    const listing = await Listing.findById(order.listing);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found for this order." });
    }

    if (listing.quantity < order.quantity) {
      return res.status(400).json({
        error: "Insufficient live stock left to confirm this payment.",
      });
    }

    listing.quantity -= order.quantity;
    await listing.save();

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.transactionId = req.body.transactionId || "";
    order.logisticsProgress = 18;
    order.etaText = "Arriving in 3h 10m";
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/progress", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ error: "Payment is still pending for this order." });
    }

    const nextState =
      order.status === "confirmed"
        ? { status: "packed", logisticsProgress: 42, etaText: "Arriving in 2h 05m" }
        : order.status === "packed"
          ? {
              status: "in_transit",
              logisticsProgress: 78,
              etaText: "Arriving in 48m",
            }
          : {
              status: "delivered",
              logisticsProgress: 100,
              etaText: "Delivered successfully",
            };

    order.status = nextState.status;
    order.logisticsProgress = nextState.logisticsProgress;
    order.etaText = nextState.etaText;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/update-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: "orderId and status are required." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    order.status = status;
    
    // If accepted, progress logistics
    if (status === "confirmed") {
      order.logisticsProgress = 18;
      order.etaText = "Farmer is preparing your order";
    } else if (status === "declined") {
      order.logisticsProgress = 0;
      order.etaText = "Order declined by farmer";
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
