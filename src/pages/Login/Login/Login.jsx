import React from "react";
import { motion } from "framer-motion";
import { Music3 } from "lucide-react"; // Optional music icon

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-600 to-yellow-300 relative overflow-hidden px-4">
      {/* Balanced glowing background effects */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 opacity-30 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="absolute bottom-20 right-20 w-60 h-60 bg-yellow-300 opacity-20 rounded-full blur-2xl animate-ping -z-10"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-white/30 backdrop-blur-xl border border-orange-300 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto"
      >
        <div className="flex flex-col items-center justify-center text-center mb-4">
          <div className="bg-orange-100 text-orange-600 p-3 rounded-full shadow-md mb-2">
            <Music3 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white text-center drop-shadow-lg">
            Welcome Back!
          </h2>
          <p className="text-sm text-orange-100 text-center">
            Login to buy or sell concert tickets 🎟️
          </p>
        </div>

        <form className="w-full">
          <div className="form-control mb-4">
            <label className="block text-white font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="input input-bordered w-full bg-white/80 border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition duration-300"
              required
            />
          </div>

          <div className="form-control mb-4">
            <label className="block text-white font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full bg-white/80 border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition duration-300"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-orange-400"
          >
            Login
          </motion.button>

          <div className="mt-4 text-center text-sm text-white">
            New user?
            <a href="/register" className="ml-1 underline hover:text-yellow-200">
              Create an account
            </a>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
