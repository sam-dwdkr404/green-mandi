const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");

router.post("/add", async (req, res) => {
  try {
    const newListing = new Listing(req.body);
    await newListing.save();

    res.status(201).json(newListing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find({ quantity: { $gt: 0 } }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedListing) return res.status(404).json({ error: "Listing not found" });
    res.json(updatedListing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedListing = await Listing.findByIdAndDelete(req.params.id);
    if (!deletedListing) return res.status(404).json({ error: "Listing not found" });
    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
