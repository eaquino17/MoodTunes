const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

let spotifyAccessToken = null;
let tokenExpiryTime = 0;

// ✅ Function to refresh Spotify access token
const getSpotifyToken = async () => {
    if (spotifyAccessToken && Date.now() < tokenExpiryTime) return spotifyAccessToken;

    const authResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials" }).toString(),
        {
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    spotifyAccessToken = authResponse.data.access_token;
    tokenExpiryTime = Date.now() + authResponse.data.expires_in * 1000;
    return spotifyAccessToken;
};

// ✅ Spotify Search Route
router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: "Query parameter is required" });

        const token = await getSpotifyToken();

        const response = await axios.get(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const tracks = response.data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map(a => a.name).join(", "),
            album: track.album.name,
            image: track.album.images[0]?.url,
            uri: track.uri
        }));

        res.json(tracks);
    } catch (error) {
        console.error("❌ Spotify Search Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to search for tracks" });
    }
});

router.post("/play", async (req, res) => {
    const { trackUri, accessToken } = req.body;

    if (!trackUri || !accessToken) {
        return res.status(400).json({ error: "Missing trackUri or accessToken" });
    }

    try {
        await axios.put(
            "https://api.spotify.com/v1/me/player/play",
            { uris: [trackUri] },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        res.json({ message: "Playback started!" });
    } catch (error) {
        console.error("Spotify Playback Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to play the track" });
    }
});



module.exports = router;
