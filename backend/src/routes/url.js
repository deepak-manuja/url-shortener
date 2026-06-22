const express = require("express");
const router = express.Router();
const validUrl = require("valid-url");
const { nanoid } = require("nanoid");
const Url = require("../models/Url");
const protect = require("../middleware/auth");

// Optional auth middleware — token hai toh user set karo, nahi toh guest
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const jwt = require("jsonwebtoken");
    const User = require("../models/User");
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      User.findById(decoded.id)
        .select("-password")
        .then((user) => {
          req.user = user;
          next();
        });
    } catch {
      next(); // invalid token — guest treat karo
    }
  } else {
    next();
  }
};

// POST /api/shorten — logged in ho toh link user se link hoga
router.post("/shorten", optionalAuth, async (req, res) => {
  const { originalUrl, customAlias } = req.body;

  if (!originalUrl) return res.status(400).json({ error: "URL is required" });
  if (!validUrl.isUri(originalUrl)) return res.status(400).json({ error: "Invalid URL" });

  try {
    const shortCode = customAlias || nanoid(6);

    if (customAlias) {
      const taken = await Url.findOne({ shortCode: customAlias });
      if (taken) return res.status(409).json({ error: "Custom alias already taken" });
    }

    // Logged in user ke liye duplicate check
    if (req.user) {
      const existing = await Url.findOne({ originalUrl, userId: req.user._id });
      if (existing) {
        return res.json({
          shortCode: existing.shortCode,
          shortUrl: `${process.env.BASE_URL}/${existing.shortCode}`,
          clicks: existing.clicks,
        });
      }
    }

    const url = await Url.create({
      originalUrl,
      shortCode,
      userId: req.user ? req.user._id : null,
    });

    res.status(201).json({
      shortCode: url.shortCode,
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      clicks: 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/stats/:code — public
router.get("/stats/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });
    if (!url) return res.status(404).json({ error: "URL not found" });

    res.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/all — PROTECTED, sirf apne links
router.get("/all", protect, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/:code — PROTECTED, sirf apna link delete karo
router.delete("/:code", protect, async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });
    if (!url) return res.status(404).json({ error: "URL not found" });
    if (url.userId?.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not authorized" });

    await url.deleteOne();
    res.json({ message: "URL deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;