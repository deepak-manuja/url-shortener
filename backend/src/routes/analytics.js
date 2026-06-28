const express = require("express");
const router = express.Router();
const Click = require("../models/Click");
const Url = require("../models/Url");
const protect = require("../middleware/auth");

// GET /api/analytics/:code — JWT protected
router.get("/:code", protect, async (req, res) => {
  try {
    const code = req.params.code.toLowerCase().trim();

    // Verify the URL belongs to this user
    const url = await Url.findOne({ shortCode: code, userId: req.user._id });
    if (!url) {
      return res.status(404).json({ error: "URL not found or not authorized" });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all aggregations in parallel
    const [
      clicksOverTime,
      topCountries,
      deviceBreakdown,
      topBrowsers,
      recentClicks,
    ] = await Promise.all([

      // Clicks per day for last 30 days
      Click.aggregate([
        { $match: { shortCode: code, timestamp: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),

      // Top 5 countries
      Click.aggregate([
        { $match: { shortCode: code } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { country: "$_id", count: 1, _id: 0 } },
      ]),

      // Device breakdown
      Click.aggregate([
        { $match: { shortCode: code } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
      ]),

      // Top 5 browsers
      Click.aggregate([
        { $match: { shortCode: code } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { browser: "$_id", count: 1, _id: 0 } },
      ]),

      // Last 10 clicks
      Click.find({ shortCode: code })
        .sort({ timestamp: -1 })
        .limit(10)
        .select("timestamp country city device browser -_id"),
    ]);

    // Fill in missing days in clicksOverTime with 0
    const filledDays = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = clicksOverTime.find((c) => c.date === dateStr);
      filledDays.push({ date: dateStr, count: found ? found.count : 0 });
    }

    // Normalise device breakdown into object
    const deviceMap = { mobile: 0, desktop: 0, tablet: 0 };
    deviceBreakdown.forEach(({ _id, count }) => {
      if (_id in deviceMap) deviceMap[_id] = count;
    });

    res.json({
      totalClicks: url.clicks,          // use Url.clicks — always accurate, includes pre-analytics history
      clicksOverTime: filledDays,
      topCountries,
      deviceBreakdown: deviceMap,
      topBrowsers,
      recentClicks,
    });
  } catch (err) {
    console.error("❌ Analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
