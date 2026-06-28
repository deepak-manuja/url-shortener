const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  country: {
    type: String,
    default: "Unknown",
  },
  city: {
    type: String,
    default: "Unknown",
  },
  device: {
    type: String,
    enum: ["mobile", "tablet", "desktop"],
    default: "desktop",
  },
  browser: {
    type: String,
    default: "Unknown",
  },
  referrer: {
    type: String,
    default: "Direct",
  },
});

// Index for fast queries per shortCode
clickSchema.index({ shortCode: 1, timestamp: -1 });

module.exports = mongoose.model("Click", clickSchema);
