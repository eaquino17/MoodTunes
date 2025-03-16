const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Null for Spotify users
    spotifyId: { type: String, unique: true, sparse: true }, // Optional for normal users
    isSpotifyUser: { type: Boolean, default: false }, // Differentiate accounts
});

module.exports = mongoose.model("User", UserSchema);
