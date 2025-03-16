import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear tokens from localStorage
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("spotifyAccessToken");
        localStorage.removeItem("spotifyRefreshToken");
        // Optionally clear any other stored data here

        // Redirect to login page (or home page)
        navigate("/login");
    };

    const isLoggedIn = !!localStorage.getItem("jwtToken") || !!localStorage.getItem("spotifyAccessToken");

    return (
        <nav className="bg-gray-900 p-4 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-[#1e90ff]">
                MoodTunes
            </Link>
            <div className="flex space-x-4">
                <Link
                    to="/"
                    className="text-white hover:text-[#1e90ff] transition-colors duration-300"
                >
                    Home
                </Link>
                {!isLoggedIn && (
                    <>
                        <Link
                            to="/login"
                            className="text-white hover:text-[#1e90ff] transition-colors duration-300"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="text-white hover:text-[#1e90ff] transition-colors duration-300"
                        >
                            Register
                        </Link>
                    </>
                )}
                {isLoggedIn && (
                    <button
                        onClick={handleLogout}
                        className="text-white hover:text-[#1e90ff] transition-colors duration-300"
                    >
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
