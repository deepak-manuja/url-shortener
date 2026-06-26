const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
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
 const {
  originalUrl,
  customAlias,
  expiryDays
} = req.body;

  if (!originalUrl) return res.status(400).json({ error: "URL is required" });
  if (!validUrl.isUri(originalUrl)) return res.status(400).json({ error: "Invalid URL" });

  try {
    // Normalize shortCode (lowercase, trim, no spaces)
    const normalizedCustomAlias = customAlias ? customAlias.trim().toLowerCase().replace(/\s+/g, "-") : null;
    const shortCode = normalizedCustomAlias || nanoid(6).toLowerCase();

    console.log(`📝 Creating short link: ${shortCode} -> ${originalUrl}`);

    if (customAlias) {
      const taken = await Url.findOne({ shortCode: shortCode });
      if (taken) {
        console.log(`⚠️ Custom alias already taken: ${shortCode}`);
        return res.status(409).json({ error: "Custom alias already taken" });
      }
    }

    // Logged in user ke liye duplicate check
    if (req.user) {
      const existing = await Url.findOne({ originalUrl, userId: req.user._id });
      if (existing) {
        const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");
        console.log(`✓ Duplicate link found for user: ${existing.shortCode}`);
        return res.json({
          shortCode: existing.shortCode,
          shortUrl: `${baseUrl}/${existing.shortCode}`,
          clicks: existing.clicks,
        });
      }
    }

    const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");
    const shortUrl = `${baseUrl}/${shortCode}`;

    console.log(`🔗 Short URL: ${shortUrl}`);

    const qrCode = await QRCode.toDataURL(shortUrl);

    let expiresAt = null;

  if (expiryDays) {
  expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + Number(expiryDays)
  );
}

    const url = await Url.create({
  originalUrl,
  shortCode,
  qrCode,
  expiresAt,
  userId: req.user ? req.user._id : null,
  });

    console.log(`✅ URL saved successfully:`, {
      id: url._id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
    });

    res.status(201).json({
      shortCode: url.shortCode,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      clicks: 0,
      qrCode: url.qrCode,
    });
  } catch (err) {
    console.error("❌ Error creating short link:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// GET /api/stats/:code — public
router.get("/stats/:code", async (req, res) => {
  try {
    const code = req.params.code.toLowerCase().trim();
    console.log(`📊 Stats request for code: ${code}`);
    
    const url = await Url.findOne({ shortCode: code });
    if (!url) {
      console.log(`⚠️ URL not found for code: ${code}`);
      return res.status(404).json({ error: "URL not found" });
    }

    console.log(`✓ Stats found:`, { code: url.shortCode, clicks: url.clicks });
    res.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
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
    const code = req.params.code.toLowerCase().trim();
    console.log(`🗑️ Delete request for code: ${code}`);
    
    const url = await Url.findOne({ shortCode: code });
    if (!url) {
      console.log(`⚠️ URL not found for deletion: ${code}`);
      return res.status(404).json({ error: "URL not found" });
    }
    
    if (url.userId?.toString() !== req.user._id.toString()) {
      console.log(`❌ Unauthorized delete attempt for code: ${code}`);
      return res.status(403).json({ error: "Not authorized" });
    }

    await url.deleteOne();
    console.log(`✅ URL deleted:`, code);
    res.json({ message: "URL deleted" });
  } catch (err) {
    console.error("❌ Error deleting URL:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;