const express = require("express");
const authRoutes = require("./routes/auth");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const urlRoutes = require("./routes/url");
const Url = require("./models/Url");

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://www.spliter.xyz",
    "https://spliter.xyz"
  ]
}));
app.use(express.json());

// Routes
app.use("/api", urlRoutes);
app.use("/api/auth", authRoutes);

// Redirect short URL
app.get("/:code", async (req, res) => {
  try {
    const code = req.params.code.toLowerCase().trim();
    
    // Prevent hitting this route for static assets or other endpoints
    if (code.startsWith(".") || code.includes(".") || ["api", "auth", "health"].includes(code)) {
      return res.status(404).json({ error: "Not found" });
    }
    
    console.log(`🔗 Redirect request for code: ${code}`);
    
    const url = await Url.findOne({ shortCode: code });
    
    if (!url) {
      console.log(`❌ Short link not found: ${code}`);
      console.log(`📋 Available codes in DB: Searching...`);
      const allUrls = await Url.find().select("shortCode").limit(5);
      console.log(`Sample codes:`, allUrls.map(u => u.shortCode));
      return res.status(404).json({ error: "URL not found" });
    }
     if (
      url.expiresAt &&
      new Date() > url.expiresAt
    ) {
      return res.status(410).json({
        error: "This link has expired",
      });
    }

    url.clicks += 1;
    await url.save();

    console.log(`✅ Redirecting ${code} (clicks: ${url.clicks}) to:`, url.originalUrl);
    res.redirect(url.originalUrl);
  } catch (err) {
    console.error("❌ Redirect error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Health check
app.get("/", (req, res) => res.json({ status: "URL Shortener API running" }));

// Connect DB and start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error("DB connection error:", err));
