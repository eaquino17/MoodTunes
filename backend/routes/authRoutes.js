const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import user model
const authMiddleware = require("../middleware/authMiddleware");
const querystring = require("querystring");
const axios = require("axios");
require("dotenv").config();


const router = express.Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// ✅ User Registration
// ✅ User Registration Route
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// ✅ User Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Change Password (Only the Logged-in User Can Change Their Own Password)
router.put("/change-password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: "User not found" });

        // Compare old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "Old password is incorrect" });

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Route to generate Spotify Login URL (Frontend calls this to get login URL)
router.get("/spotify/login", (req, res) => {
    const scope = "user-read-email user-read-private streaming user-modify-playback-state user-read-playback-state user-read-currently-playing";
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope,
        redirect_uri: SPOTIFY_REDIRECT_URI,
    })}`;

    res.json({ url: authUrl });
});

// ✅ Route to handle callback & exchange code for access token
router.get("/spotify/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "Missing authorization code" });

    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,  // Must match the registered URI
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token, refresh_token, expires_in } = response.data;

        const userProfile = await axios.get("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { id, display_name, email } = userProfile.data;

        let user = await User.findOne({ spotifyId: id });

        if (!user) {

            user = new User({
                username: display_name || `SpotifyUser_${id}`,
                email: email || `${id}@spotify.com`,
                spotifyId: id,
                isSpotifyUser: true, // Flag to differentiate accounts
            });
            await user.save();
        }

         // ✅ Step 5: Generate JWT for session tracking
        const jwtToken = jwt.sign(
            { userId: user._id, spotifyId: user.spotifyId, isSpotifyUser: user.isSpotifyUser },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ Redirect to frontend with tokens in the URL
        res.redirect(`http://localhost:5173/dashboard?access_token=${access_token}&refresh_token=${refresh_token}&jwt=${jwtToken}`);

    } catch (error) {
        console.error("❌ Spotify OAuth Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to authenticate with Spotify" });
    }
});





module.exports = router;
