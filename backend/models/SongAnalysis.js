const mongoose = require("mongoose");

const SongAnalysisSchema = new mongoose.Schema({
    youtubeUrl: { type: String, required: false },
    spotifyId: { type: String, required: false },
    cyaniteTrackId: { type: String, required: true }, // Store track ID from Cyanite
    mood: { type: String, default: "pending" },
    genre: { type: String, default: "pending" },
    energy: { type: Number, default: -1 },
}, { timestamps: true });

module.exports = mongoose.model("SongAnalysis", SongAnalysisSchema);
