const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const validUrl = require("valid-url");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
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
  expiryDays,
  pin,
} = req.body;

  if (!originalUrl) return res.status(400).json({ error: "URL is required" });
  if (!validUrl.isUri(originalUrl)) return res.status(400).json({ error: "Invalid URL" });
  if (pin && !/^\d{4}$/.test(pin)) return res.status(400).json({ error: "PIN must be exactly 4 digits" });

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
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    let passwordHash = null;
    if (pin) {
      passwordHash = await bcrypt.hash(pin, 10);
    }

    const url = await Url.create({
      originalUrl,
      shortCode,
      qrCode,
      expiresAt,
      passwordHash,
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
      expiresAt: url.expiresAt,
      isPasswordProtected: !!url.passwordHash,
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
      isPasswordProtected: !!url.passwordHash,
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/verify-pin/:code — verify PIN before redirect
router.post("/verify-pin/:code", async (req, res) => {
  try {
    const code = req.params.code.toLowerCase().trim();
    const { pin } = req.body;

    const url = await Url.findOne({ shortCode: code });
    if (!url) return res.status(404).json({ error: "URL not found" });

    if (!url.passwordHash) return res.json({ valid: true }); // no pin set

    if (!pin) return res.status(400).json({ error: "PIN required" });

    const isMatch = await bcrypt.compare(String(pin), url.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Incorrect PIN" });

    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/urls/:code — PROTECTED, edit own link
router.patch("/urls/:code", protect, async (req, res) => {
  try {
    const code = req.params.code.toLowerCase().trim();
    const { originalUrl, customAlias, expiresAt, pin } = req.body;

    const url = await Url.findOne({ shortCode: code });
    if (!url) return res.status(404).json({ error: "URL not found" });
    if (url.userId?.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not authorized" });

    // originalUrl
    if (originalUrl !== undefined) {
      if (!validUrl.isUri(originalUrl))
        return res.status(400).json({ error: "Invalid URL" });
      url.originalUrl = originalUrl;
    }

    // customAlias → changes shortCode
    if (customAlias !== undefined) {
      const newCode = customAlias.trim().toLowerCase().replace(/\s+/g, "-");
      if (!/^[a-z0-9-]{3,20}$/.test(newCode))
        return res.status(400).json({ error: "Alias must be 3-20 alphanumeric characters or hyphens" });
      if (newCode !== url.shortCode) {
        const taken = await Url.findOne({ shortCode: newCode });
        if (taken) return res.status(400).json({ error: "Custom alias already taken" });
        // Regenerate QR for the new short URL
        const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");
        url.qrCode = await QRCode.toDataURL(`${baseUrl}/${newCode}`);
        url.shortCode = newCode;
      }
    }

    // expiresAt — null clears it, date string sets it
    if (expiresAt !== undefined) {
      url.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    // pin — null clears it, string sets/updates it
    if (pin !== undefined) {
      if (pin === null || pin === "") {
        url.passwordHash = null;
      } else {
        if (!/^\d{4}$/.test(pin))
          return res.status(400).json({ error: "PIN must be exactly 4 digits" });
        url.passwordHash = await bcrypt.hash(pin, 10);
      }
    }

    await url.save();

    res.json({
      _id: url._id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt,
      clicks: url.clicks,
      qrCode: url.qrCode,
      passwordHash: url.passwordHash,
      isPasswordProtected: !!url.passwordHash,
      createdAt: url.createdAt,
    });
  } catch (err) {
    console.error("❌ Edit error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
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