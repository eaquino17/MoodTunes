import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "../component/Navbar";

const Login = () => {
  // Function to Redirect User to Spotify Login
  const loginWithSpotify = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/spotify/login");
      window.location.href = res.data.url; // Redirect to Spotify OAuth
    } catch (error) {
      console.error("Spotify Login Error:", error.message);
    }
  };

  return (
    <>
      <Navbar />
      <motion.div 
        className="min-h-screen bg-[#121212] flex justify-center items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="bg-gray-900 p-8 rounded-lg w-80"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.button
            type="button"
            onClick={loginWithSpotify}
            className="w-full bg-green-500 p-2 rounded text-white font-semibold mt-4 flex justify-center items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <img src="src/assets/spotify-logo.png" alt="Spotify" className="w-5 h-5" />
            Login with Spotify
          </motion.button>

          <motion.p 
            className="mt-4 text-sm text-center text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1 }}
          >
            Don't have an account? <a href="https://www.spotify.com/signup" target="_blank" className="text-[#1e90ff]">Sign up</a>
          </motion.p>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Login;
