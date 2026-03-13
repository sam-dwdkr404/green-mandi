const mongoose = require("mongoose");

const TrackingPointSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    farmer: {
      type: String,
      required: true,
      trim: true,
    },
    retailer: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryLocation: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "UPI",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paymentReference: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["payment_pending", "confirmed", "packed", "in_transit", "delivered"],
      default: "payment_pending",
    },
    logisticsProgress: {
      type: Number,
      default: 6,
      min: 0,
      max: 100,
    },
    etaText: {
      type: String,
      default: "Awaiting payment confirmation",
      trim: true,
    },
    trackingPoints: {
      type: [TrackingPointSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderSchema);
