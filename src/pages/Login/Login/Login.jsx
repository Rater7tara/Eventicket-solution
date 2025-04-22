import React from "react";
import { motion } from "framer-motion"; // Uncommented framer-motion import
import { Music3, Ticket, Lock, Mail } from "lucide-react"; 
import logo from "../../../assets/logo.png"; 

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-500 to-yellow-400 relative overflow-hidden px-4">
      {/* Enhanced background effects */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 opacity-30 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="absolute bottom-20 right-20 w-60 h-60 bg-yellow-300 opacity-20 rounded-full blur-2xl -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-pink-400 opacity-20 rounded-full blur-2xl -z-10"></div>
      <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-red-400 opacity-10 rounded-full blur-xl -z-10"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto"
      >
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="bg-gradient-to-br from-orange-100 to-orange-300 text-white p-4 rounded-full shadow-lg mb-4">
            <img className="w-12 h-12" src={logo} alt="" />
            {/* <Ticket className="w-8 h-8" /> */}
          </div>
          <h2 className="text-3xl font-bold text-white text-center drop-shadow-lg mb-2">
            Welcome Back!
          </h2>
          <p className="text-sm text-orange-50 text-center">
            Sign in to access your tickets and upcoming events
          </p>
        </div>

        <form className="w-full space-y-5">
          <div className="form-control">
            <label className="block text-white font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="w-5 h-5 text-orange-500" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-white font-medium" htmlFor="password">
                Password
              </label>
              <a href="/forgot-password" className="text-xs text-orange-100 hover:text-white">
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-orange-500" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input 
              id="remember-me" 
              type="checkbox" 
              className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
              Remember me for 30 days
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300"
            type="submit"
          >
            Sign In
          </motion.button>

          {/* Social login options */}
          <div className="relative flex items-center justify-center mt-3 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative px-4 bg-orange-500/20 rounded-full">
              <span className="text-sm text-white">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              className="py-2.5 px-4 rounded-lg bg-white/90 text-gray-800 font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              className="py-2.5 px-4 rounded-lg bg-[#1877F2]/90 text-white font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
              </svg>
              Facebook
            </motion.button>
          </div>

          <div className="text-center text-sm text-white">
            Don't have an account?{" "}
            <a href="/register" className="font-medium text-yellow-300 hover:text-yellow-200 underline">
              Sign up
            </a>
          </div>
        </form>
      </motion.div>
      
      {/* Footer text */}
      <div className="absolute bottom-4 text-center text-xs text-white/60 w-full">
        © 2025 Event n Ticket. All rights reserved.
      </div>
    </div>
  );
};

export default Login;