const mongoose = require("mongoose");

const ListingSchema = new mongoose.Schema({
  crop: String,
  farmer: String,
  quantity: Number,
  price: Number,
  location: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Listing", ListingSchema);