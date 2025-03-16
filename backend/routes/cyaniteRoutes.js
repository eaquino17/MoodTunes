const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { analyzeSong, getTrackAnalysis, findSimilarTracks } = require("../controllers/cyaniteControllers");

// Test route to verify it's working
router.get("/", (req, res) => {
    res.send("🎵 Cyanite API Route is working!");
});

// ✅ Protect route (Only logged-in users can analyze songs)
router.post("/analyze", authMiddleware, analyzeSong);

// ✅ Fetch analysis results by track ID & source
router.get("/analysis/:source/:trackId", authMiddleware, getTrackAnalysis);

// ✅ Find similar tracks using Cyanite AI
router.get("/similar/:source/:trackId", authMiddleware, findSimilarTracks);

router.post("/similar/:source/:trackId", authMiddleware, findSimilarTracks);




module.exports = router;
