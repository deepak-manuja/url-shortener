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
    "https://www.spliter.xyz"
  ]
}));
app.use(express.json());

// Routes
app.use("/api", urlRoutes);
app.use("/api/auth", authRoutes);

// Redirect short URL
app.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });
    if (!url) return res.status(404).json({ error: "URL not found" });

    url.clicks += 1;
    await url.save();

    res.redirect(url.originalUrl);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
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
