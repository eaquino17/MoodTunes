import { useState } from "react";
import axios from "axios";

const SearchBar = ({ onSelectTrack }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ✅ Handle Search Request
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        
        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await axios.get(`http://localhost:5000/api/spotify/search?query=${query}`);
            setResults(response.data);
        } catch (err) {
            console.error("Search Error:", err);
            setError("Failed to fetch tracks.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-center w-full max-w-lg mx-auto">
            <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a song..."
                    className="w-full p-2 rounded bg-gray-800 text-white outline-none"
                />
                <button
                    type="submit"
                    className="bg-green-500 px-4 py-2 rounded text-white hover:bg-green-600"
                >
                    Search
                </button>
            </form>

            {loading && <p className="text-gray-400">Searching...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <div className="mt-2 space-y-3">
                {results.map((track) => (
                    <div
                        key={track.id}
                        className="flex items-center space-x-3 bg-gray-900 p-3 rounded-lg cursor-pointer hover:bg-gray-800"
                        onClick={() => onSelectTrack(track)}
                    >
                        <img src={track.image} alt={track.name} className="w-12 h-12 rounded" />
                        <div className="text-left">
                            <p className="text-white font-semibold">{track.name}</p>
                            <p className="text-gray-400 text-sm">{track.artist}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchBar;
