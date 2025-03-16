import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../component/Navbar';

const Home = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/login');
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
                <div className="text-center p-8">
                    <motion.h1 
                        className="text-5xl md:text-6xl text-[#1e90ff] mb-4"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Welcome to MoodTunes
                    </motion.h1>
                    <motion.p 
                        className="text-lg md:text-2xl text-gray-400 mb-8"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        Discover music recommendations curated just for you.
                    </motion.p>
                    <motion.button
                        onClick={handleGetStarted}
                        className="px-6 py-3 text-lg rounded-full bg-[#1e90ff] text-white transition-colors duration-300 hover:bg-blue-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Get Started
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
};

export default Home;
