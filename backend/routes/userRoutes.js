const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Import user model (we'll create this next)
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Protected Route: Only authenticated users can get all users
router.get("/", authMiddleware, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ✅ Get User Info (Only Authenticated Users)
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ id: user._id, name: user.name, email: user.email });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Get User by ID
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Error fetching user" });
    }
});

// ✅ Update User Info (Only Authenticated User Can Edit Their Own Profile)
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: "User not found" });

        user.name = name || user.name;
        user.email = email || user.email;

        await user.save();
        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
