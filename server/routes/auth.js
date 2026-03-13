const express = require("express");
const User = require("../models/User");

const router = express.Router();

function normalizeUserPayload(body) {
  return {
    name: body.name?.trim(),
    phone: body.phone?.trim(),
    email: body.email?.trim().toLowerCase(),
    role: body.role,
    location: body.location?.trim() || "Nipani",
  };
}

router.post("/register", async (req, res) => {
  try {
    const payload = normalizeUserPayload(req.body);

    if (!payload.name || !payload.role) {
      return res.status(400).json({ error: "name and role are required." });
    }

    if (!payload.phone && !payload.email) {
      return res.status(400).json({ error: "phone or email is required." });
    }

    const duplicateFilters = [];

    if (payload.phone) {
      duplicateFilters.push({ phone: payload.phone, role: payload.role });
    }

    if (payload.email) {
      duplicateFilters.push({ email: payload.email, role: payload.role });
    }

    if (duplicateFilters.length) {
      const existingUser = await User.findOne({ $or: duplicateFilters });

      if (existingUser) {
        return res.status(409).json({ error: "User already exists for this role." });
      }
    }

    const user = await User.create(payload);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, email, role } = normalizeUserPayload(req.body);

    if (!phone && !email) {
      return res.status(400).json({ error: "phone or email is required." });
    }

    const filters = [];

    if (phone) {
      filters.push({ phone });
    }

    if (email) {
      filters.push({ email });
    }

    const query = {
      $or: filters,
    };

    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
