const express = require("express");
const router = express.Router();
const validUrl = require("valid-url");
const { nanoid } = require("nanoid");
const Url = require("../models/Url");

// POST /api/shorten
router.post("/shorten", async (req, res) => {
  const { originalUrl, customAlias } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    // Check if URL already shortened
    const existing = await Url.findOne({ originalUrl });
    if (existing) {
      return res.json({
        shortCode: existing.shortCode,
        shortUrl: `${process.env.BASE_URL}/${existing.shortCode}`,
        clicks: existing.clicks,
      });
    }

    // Custom alias or random
    const shortCode = customAlias || nanoid(6);

    // Check if custom alias taken
    if (customAlias) {
      const taken = await Url.findOne({ shortCode: customAlias });
      if (taken) {
        return res.status(409).json({ error: "Custom alias already taken" });
      }
    }

    const url = await Url.create({ originalUrl, shortCode });

    res.status(201).json({
      shortCode: url.shortCode,
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      clicks: 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/stats/:code
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

// GET /api/all
router.get("/all", async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 }).limit(20);
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
