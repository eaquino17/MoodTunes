const axios = require("axios");
const SongAnalysis = require("../models/SongAnalysis");
require("dotenv").config();

const CYANITE_API_URL = "https://api.cyanite.ai/graphql";

const analyzeSong = async (req, res) => {
    try {
        const { youtubeUrl, spotifyId } = req.body;

        if (!youtubeUrl && !spotifyId) {
            return res.status(400).json({ error: "You must provide either a YouTube URL or a Spotify Track ID" });
        }

        let mutation;
        let variables;

        if (youtubeUrl) {
            mutation = `
                mutation EnqueueYouTubeTrack($input: YouTubeTrackEnqueueInput!) {
                    youTubeTrackEnqueue(input: $input) {
                        __typename
                        ... on YouTubeTrackEnqueueSuccess {
                            enqueuedYouTubeTrack {
                                id
                            }
                        }
                        ... on YouTubeTrackEnqueueError {
                            message
                        }
                    }
                }
            `;
            variables = { input: { youtubeUrl } };
        } else if (spotifyId) {
            mutation = `
                mutation EnqueueSpotifyTrack($input: SpotifyTrackEnqueueInput!) {
                    spotifyTrackEnqueue(input: $input) {
                        __typename
                        ... on SpotifyTrackEnqueueSuccess {
                            enqueuedSpotifyTrack {
                                id
                            }
                        }
                        ... on SpotifyTrackEnqueueError {
                            message
                        }
                    }
                }
            `;
            variables = { input: { spotifyTrackId: spotifyId } };
        }

        console.log(`🎵 Sending request to Cyanite AI...`);

        // ✅ Send GraphQL request to Cyanite AI
        const response = await axios.post(
            "https://api.cyanite.ai/graphql",
            { query: mutation, variables },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CYANITE_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const analysisData = response.data;
        console.log("✅ Cyanite AI Response:", JSON.stringify(analysisData, null, 2));

        // Extract track ID
        let trackId;
        if (youtubeUrl) {
            trackId = analysisData.data.youTubeTrackEnqueue.enqueuedYouTubeTrack?.id;
        } else if (spotifyId) {
            trackId = analysisData.data.spotifyTrackEnqueue.enqueuedSpotifyTrack?.id;
        }

        if (!trackId) {
            return res.status(400).json({ error: "Failed to enqueue track for analysis" });
        }

        // ✅ Store analysis results in MongoDB
        const newAnalysis = new SongAnalysis({
            youtubeUrl: youtubeUrl || null,
            spotifyId: spotifyId || null,
            cyaniteTrackId: trackId,
            mood: "pending",
            genre: "pending",
            energy: -1,
        });

        await newAnalysis.save();

        res.json({ message: "Track successfully enqueued for analysis", trackId });
    } catch (error) {
        console.error("❌ Cyanite AI Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to analyze song" });
    }
};

const getTrackAnalysis = async (req, res) => {
    try {
        const { trackId, source } = req.params;

        if (!trackId || !source) {
            return res.status(400).json({ error: "Track ID and source (spotify/youtube) are required" });
        }

        // ✅ Correct GraphQL Query with the actual field names
        let query;
        if (source === "spotify") {
            query = `
                query GetSpotifyTrackAnalysis($id: ID!) {
                    spotifyTrack(id: $id) {
                        ... on Track {
                            audioAnalysisV7 {
                                arousal { value }  # Energy
                                valence { value }  # Mood
                                genres { name }    # Genre list
                            }
                        }
                    }
                }
            `;
        } else if (source === "youtube") {
            query = `
                query GetYouTubeTrackAnalysis($id: ID!) {
                    youTubeTrack(id: $id) {
                        ... on Track {
                            audioAnalysisV7 {
                                arousal { value }  # Energy
                                valence { value }  # Mood
                                genres { name }    # Genre list
                            }
                        }
                    }
                }
            `;
        } else {
            return res.status(400).json({ error: "Invalid source type. Must be 'spotify' or 'youtube'." });
        }

        console.log(`🎵 Fetching analysis for ${source} track ID: ${trackId}`);

        // ✅ Send GraphQL request to Cyanite AI
        const response = await axios.post(
            "https://api.cyanite.ai/graphql",
            { query, variables: { id: trackId } },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CYANITE_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const analysisData = response.data;
        console.log("✅ Cyanite AI Analysis Response:", JSON.stringify(analysisData, null, 2));

        let audioAnalysis;
        if (source === "spotify") {
            audioAnalysis = analysisData.data.spotifyTrack?.audioAnalysisV7;
        } else if (source === "youtube") {
            audioAnalysis = analysisData.data.youTubeTrack?.audioAnalysisV7;
        }

        if (!audioAnalysis) {
            return res.status(400).json({ error: "Analysis not available yet, try again later." });
        }

        // ✅ Extract correct fields
        const energy = audioAnalysis.arousal?.value || -1;
        const mood = audioAnalysis.valence?.value || -1;
        const genres = audioAnalysis.genres?.map(g => g.name) || [];

        // ✅ Update MongoDB with final analysis
        await SongAnalysis.findOneAndUpdate(
            { cyaniteTrackId: trackId },
            { mood, genre: genres.join(", "), energy },
            { new: true }
        ); 

        res.json({ trackId, mood, genre: genres, energy });
    } catch (error) {
        console.error("❌ Cyanite AI Fetch Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch track analysis" });
    }
};

const findSimilarTracks = async (req, res) => {
    try {
        const { trackId, source } = req.params;
        const { target } = req.body; // Receive target from the request body

        if (!trackId || !source || !["spotify", "library"].includes(source)) {
            return res.status(400).json({ error: "Valid track ID and source (spotify/library) are required" });
        }

        // Validate and construct the target object
        let targetObject;
        if (target === "library") {
            targetObject = `{ library: {} }`;
        } else if (target === "crate" && req.body.crateId) {
            targetObject = `{ crate: { crateId: "${req.body.crateId}" } }`;
        } else if (target === "spotify") {
            targetObject = `{ spotify: {} }`;
        } else {
            return res.status(400).json({ error: "Invalid target specified" });
        }

        const query = `
            query SimilarTracksQuery($trackId: ID!) {
                ${source}Track(id: $trackId) {
                    __typename
                    ... on Error {
                        message
                    }
                    ... on Track {
                        id
                        similarTracks(target: ${targetObject}) {
                            __typename
                            ... on SimilarTracksError {
                                code
                                message
                            }
                            ... on SimilarTracksConnection {
                                edges {
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        console.log(`🔍 Finding similar tracks for ${source} track ID: ${trackId} with target: ${target}`);

        const response = await axios.post(
            "https://api.cyanite.ai/graphql",
            { query, variables: { trackId } },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CYANITE_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const trackData = response.data.data[`${source}Track`];

        if (!trackData) {
            return res.status(404).json({ message: "Track not found" });
        }

        if (trackData.__typename === "Error") {
            return res.status(400).json({ error: trackData.message });
        }

        


        const similarTracksData = trackData.similarTracks;

        if (!similarTracksData || similarTracksData.__typename === "SimilarTracksError") {
            return res.status(400).json({ error: similarTracksData?.message || "No similar tracks found" });
        }

        console.log("Cyanite AI Raw Response:", JSON.stringify(response.data, null, 2));
        
        // ✅ Extract similar track IDs
        const similarTracks = similarTracksData.edges.map(({ node }) => ({
            id: node.id
        }));

        res.json({ trackId, target, similarTracks });

    } catch (error) {
        console.error("❌ Cyanite AI Similarity Fetch Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to find similar tracks" });
    }
};


module.exports = { analyzeSong, getTrackAnalysis, findSimilarTracks };
