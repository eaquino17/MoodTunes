const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader) return res.status(401).json({ error: "Access denied. No token provided." });

        const token = authHeader.replace("Bearer ", "");

        // ✅ Step 1: Try JWT Authentication First
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { id: decoded.userId, type: "jwt" };
            return next();
        } catch (jwtError) {
            console.log("🔍 Not a JWT token. Checking Spotify token...");
        }

        // ✅ Step 2: Try Spotify OAuth Token
        try {
            const spotifyResponse = await axios.get("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const { id, display_name, email } = spotifyResponse.data;

            // ✅ Step 3: Check if Spotify User Exists in Database
            let user = await User.findOne({ spotifyId: id });

            if (!user) {
                // ✅ Create Spotify User (First-time login)
                user = new User({
                    username: display_name || `SpotifyUser_${id}`,
                    email: email || `${id}@spotify.com`,
                    spotifyId: id,
                    isSpotifyUser: true,
                });
                await user.save();
            }

            // ✅ Attach Spotify user info & proceed
            req.user = { id: user._id, type: "spotify" };
            return next();
        } catch (spotifyError) {
            console.error("❌ Spotify Authentication Failed:", spotifyError.response?.data || spotifyError.message);
            return res.status(401).json({ error: "Invalid token (Neither JWT nor Spotify OAuth)" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Authentication error" });
    }
};

module.exports = authMiddleware;
