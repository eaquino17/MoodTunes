const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Set up Multer with Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "music", // Stores files in a "music" folder in Cloudinary
        resource_type: "auto",
    },
});

const upload = multer({ storage });

// ✅ Upload MP3 File (Only Authenticated Users)
router.post("/audio", authMiddleware, upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        res.json({ 
            message: "File uploaded successfully", 
            audioUrl: req.file.path 
        });

    } catch (error) {
        console.error("❌ Upload Error:", error);
        res.status(500).json({ error: "File upload failed" });
    }
});

module.exports = router;
