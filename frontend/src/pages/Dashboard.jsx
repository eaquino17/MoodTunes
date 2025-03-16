import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SearchBar from "../component/SearchBar";
import Navbar from "../component/Navbar";
import axios from "axios";

const Dashboard = () => {
    const [spotifyToken, setSpotifyToken] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [player, setPlayer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [jwtToken, setJwtToken] = useState(null);
    const [userType, setUserType] = useState("guest");
    const [similarTracks, setSimilarTracks] = useState([]);

    // ✅ Fetch Spotify token and store in localStorage
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const accessToken = urlParams.get("access_token");
                const jwt = urlParams.get("jwt");
                const refreshToken = urlParams.get("refresh_token");

                if (accessToken) {
                    localStorage.setItem("spotifyAccessToken", accessToken);
                    localStorage.setItem("spotifyRefreshToken", refreshToken);
                    setSpotifyToken(accessToken);
                    setUserType("spotify");
                    window.history.replaceState({}, document.title, "/dashboard");
                } else {
                    const storedToken = localStorage.getItem("jwtToken");
                    if (storedToken) {
                        setJwtToken(storedToken);
                        setUserType("Registered");
                    }
                }
            } catch (error) {
                console.error("Error fetching Spotify token:", error.message);
                setErrorMsg("Failed to fetch Spotify token. Please try again later.");
            }
        };

        fetchToken();
    }, []);

    // ✅ Initialize Spotify Web Playback SDK when token is available
    useEffect(() => {
        if (!spotifyToken) return;

        setLoading(true);
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const newPlayer = new window.Spotify.Player({
                name: "MoodTunes Player",
                getOAuthToken: cb => { cb(spotifyToken); },
                volume: 0.5
            });

            newPlayer.addListener("ready", ({ device_id }) => {
                console.log("✅ Ready with Device ID", device_id);
                setDeviceId(device_id);
                setPlayerReady(true);
                setLoading(false);
            });

            newPlayer.addListener("not_ready", ({ device_id }) => {
                console.log("⚠️ Device ID went offline", device_id);
                setPlayerReady(false);
            });

            newPlayer.addListener("player_state_changed", (state) => {
                if (!state) return;
                setIsPlaying(!state.paused);
                if (state.track_window && state.track_window.current_track) {
                    setSelectedTrack({
                        id: state.track_window.current_track.id,
                        name: state.track_window.current_track.name,
                        artist: state.track_window.current_track.artists.map(a => a.name).join(", "),
                        image: state.track_window.current_track.album.images[0]?.url,
                        uri: state.track_window.current_track.uri,
                    });
                }
            });

            newPlayer.connect();
            setPlayer(newPlayer);
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [spotifyToken]);

    // ✅ Sync playback when switching songs in Spotify app
    useEffect(() => {
        if (!spotifyToken) return;

        const fetchPlaybackState = async () => {
            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${spotifyToken}` },
                });

                if (response.status === 204) return;

                const data = await response.json();
                if (!data.item) return;

                setSelectedTrack({
                    id: data.item.id,
                    name: data.item.name,
                    artist: data.item.artists.map(a => a.name).join(", ") || "Unknown Artist",
                    image: data.item.album.images[0]?.url,
                    uri: data.item.uri,
                });

                setIsPlaying(data.is_playing);
            } catch (error) {
                console.error("❌ Error fetching playback state:", error.message);
            }
        };

        const interval = setInterval(fetchPlaybackState, 3000);
        return () => clearInterval(interval);
    }, [spotifyToken]);

    // ✅ Ensure MoodTunes is active before playback
    const ensureMoodTunesActive = async () => {
        if (!spotifyToken || !deviceId) return;

        try {
            const response = await fetch("https://api.spotify.com/v1/me/player", {
                method: "GET",
                headers: { "Authorization": `Bearer ${spotifyToken}` },
            });

            if (!response.ok) {
                console.warn("⚠️ No active device found. Transferring playback...");
                await transferPlayback();
                return;
            }

            const data = await response.json();
            if (data.device.id !== deviceId) {
                console.warn("⚠️ Switching to MoodTunes...");
                await transferPlayback();
            }
        } catch (error) {
            console.error("❌ Error checking active device:", error.message);
        }
    };

    const transferPlayback = async () => {
        if (!spotifyToken || !deviceId) return;

        try {
            await fetch("https://api.spotify.com/v1/me/player", {
                method: "PUT",
                headers: { "Authorization": `Bearer ${spotifyToken}` },
                body: JSON.stringify({ device_ids: [deviceId], play: true }),
            });
        } catch (error) {
            console.error("❌ Error transferring playback:", error.message);
        }
    };

    // ✅ Play a selected track
    const playTrack = async (track) => {
        if (!track || !deviceId || !spotifyToken) return;

        await ensureMoodTunesActive();

        try {
            console.log(`🎵 Playing: ${track.uri} on device ${deviceId}`);

            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${spotifyToken}` },
                body: JSON.stringify({ uris: [track.uri] }),
            });

            setSelectedTrack(track);
            setIsPlaying(true);
        } catch (error) {
            console.error("❌ Error playing track:", error.message);
        }
    };

    const togglePlayPause = async () => {
        if (!spotifyToken || !deviceId) return;

        await ensureMoodTunesActive();

        try {
            const endpoint = isPlaying ? "pause" : "play";
            await fetch(`https://api.spotify.com/v1/me/player/${endpoint}?device_id=${deviceId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${spotifyToken}` },
            });

            setIsPlaying(!isPlaying);
        } catch (error) {
            console.error(`❌ Error toggling ${isPlaying ? "pause" : "play"}:`, error.message);
        }
    };

    // ✅ Function to call Cyanite's findSimilarTracks endpoint
    const findSimilarTracks = async () => {
        let token = localStorage.getItem("jwtToken") || localStorage.getItem("spotifyAccessToken");
        if (!token) {
            alert("You must log in to access this feature.");
            return;
        }

        if (!selectedTrack || !selectedTrack.id) {
            console.error("No track selected for finding similar tracks!");
            return;
        }
        try {
            const response = await axios.post(
                `http://localhost:5000/api/cyanite/similar/spotify/${selectedTrack.id}`,
                { target: "spotify" },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Similar Tracks:", response.data);
            // Store the similar tracks for display
            setSimilarTracks(response.data.similarTracks);
        } catch (error) {
            console.error("Error fetching similar tracks:", error.response?.data || error.message);
        }
    };

    const fetchSimilarTracks = async (currentTrackId) => {
        try {
            let token = localStorage.getItem("jwtToken") || localStorage.getItem("spotifyAccessToken");
            if (!token) {
                alert("You must log in to access this feature.");
                return;
            }
    
            // 🔥 Step 1: Get similar track IDs from Cyanite API
            const cyaniteResponse = await axios.post(
                `http://localhost:5000/api/cyanite/similar/spotify/${currentTrackId}`,
                { target: "spotify" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            // ✅ Ensure trackIds is an array of strings
            const trackIds = cyaniteResponse.data.similarTracks.map(track => track.id || track); 
    
            if (!trackIds.length) {
                setSimilarTracks([]); // No results, show empty state
                return;
            }
    
            // 🔥 Step 2: Fetch full track details from Spotify
            const spotifyResponse = await axios.get(
                `https://api.spotify.com/v1/tracks?ids=${trackIds.join(",")}`, 
                { headers: { Authorization: `Bearer ${spotifyToken}` } }
            );
    
            // 🔥 Step 3: Map the response to required format
            const enrichedTracks = spotifyResponse.data.tracks.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists.map(a => a.name).join(", "),
                image: track.album.images[0]?.url || "fallback-image.jpg",
                uri: track.uri
            }));
    
            setSimilarTracks(enrichedTracks); // ✅ Update UI
        } catch (error) {
            console.error("Error fetching similar tracks:", error);
        }
    };
    

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#121212] flex flex-col justify-center items-center px-4 py-6">
                <h1 className="text-4xl md:text-5xl text-[#1e90ff] mb-4 text-center">MoodTunes 🎵</h1>
                <p className="text-lg text-gray-400 mb-8 text-center">Find, explore, and play your favorite music.</p>

                <SearchBar onSelectTrack={playTrack} />

                {selectedTrack && (
                    <div className="mt-6 w-full max-w-lg bg-gray-900 p-6 rounded-lg text-center shadow-lg">
                        <h2 className="text-xl text-white font-semibold">Now Playing:</h2>
                        <img src={selectedTrack.image} alt={selectedTrack.name} className="w-48 h-48 mx-auto rounded-lg mt-3 shadow-md" />
                        <p className="text-lg text-white mt-3 font-medium">{selectedTrack.name}</p>
                        <p className="text-gray-400 text-sm">{selectedTrack.artist}</p>

                        <button onClick={togglePlayPause} className="bg-[#1e90ff] text-white px-4 py-2 rounded-md mt-4">
                            {isPlaying ? "Pause" : "Play"} on Spotify
                        </button>

                        <div className="mt-4">
                            <button onClick={() => fetchSimilarTracks(selectedTrack.id)} className="bg-indigo-500 text-white px-4 py-2 rounded-md">
                                Find Similar Tracks
                            </button>
                        </div>
                    </div>
                )}

                {/* Grid container for similar tracks */}
                {similarTracks && similarTracks.length > 0 && (
                    <motion.div
                        className="mt-8 w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {similarTracks.map(track => (
                            <motion.div
                                key={track.id}
                                className="bg-gray-800 rounded-lg p-4"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => playTrack(track)}
                            >
                                <img src={track.image} alt={track.name} className="w-full h-40 object-cover rounded" />
                                <p className="mt-2 text-white font-semibold text-sm">{track.name}</p>
                                <p className="text-gray-400 text-xs">{track.artist}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </>
    );
};

export default Dashboard;
