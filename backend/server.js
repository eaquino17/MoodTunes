require("dotenv").config({path: __dirname + '/.env'});
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const cyaniteRoutes = require("./routes/cyaniteRoutes"); // ✅ Now pointing to modular route
const userRoutes = require("./routes/userRoutes"); // ✅ Now pointing to modular route
const authRoutes = require("./routes/authRoutes"); // ✅ Now pointing to modular route
const uploadRoutes = require("./routes/uploadRoutes");
const spotifyRoutes = require("./routes/spotifyRoutes");


const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use modular routes
app.use("/api/cyanite", cyaniteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/spotify", spotifyRoutes);


// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Webhook Route
app.post("/webhook/cyanite", (req, res) => {
    console.log("🔔 Webhook Received:", req.body);
    res.status(200).send("Received");
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
