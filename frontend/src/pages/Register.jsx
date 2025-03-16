import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/Navbar";
import { motion } from "framer-motion";

const Register = () => {
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      console.log(res.data); // Handle success message
    } catch (err) {
      console.error("Registration failed:", err.response.data);
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
        <motion.form 
          onSubmit={handleSubmit}
          className="bg-gray-900 p-8 rounded-lg w-80"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.h2
            className="text-2xl font-bold text-[#1e90ff] mb-6 text-center"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Sign Up
          </motion.h2>
          <motion.input
            type="text"
            name="name"
            placeholder="Name"
            className="w-full p-2 mb-4 bg-gray-800 border-none text-white rounded"
            onChange={handleChange}
            required
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
          <motion.input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-2 mb-4 bg-gray-800 border-none text-white rounded"
            onChange={handleChange}
            required
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          />
          <motion.input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-2 mb-4 bg-gray-800 border-none text-white rounded"
            onChange={handleChange}
            required
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          />
          <motion.button
            type="submit"
            className="w-full bg-[#1e90ff] p-2 rounded text-white font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            Sign Up
          </motion.button>
          <motion.p
            className="mt-4 text-sm text-center text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            Already have an account?{" "}
            <Link to="/login" className="text-[#1e90ff]">Login</Link>
          </motion.p>
        </motion.form>
      </motion.div>
    </>
  );
};

export default Register;
