import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Mail, Lock, User } from "lucide-react";
import logo from "../../../assets/logo.png";

const Register = () => {
  const { createUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createUser(email, password);
      console.log("Registration successful with role:", result.role);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-500 to-yellow-400 relative overflow-hidden px-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 opacity-30 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="absolute bottom-20 right-20 w-60 h-60 bg-yellow-300 opacity-20 rounded-full blur-2xl -z-10"></div>
      
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="bg-gradient-to-br from-orange-100 to-orange-300 text-white p-4 rounded-full shadow-lg mb-4">
            <img className="w-12 h-12" src={logo} alt="Logo" />
          </div>
          <h2 className="text-3xl font-bold text-white text-center drop-shadow-lg mb-2">
            Create Account
          </h2>
          <p className="text-sm text-orange-50 text-center">
            Sign up to discover and book exciting events
          </p>
        </div>

        {error && (
          <div className="bg-red-500/30 backdrop-blur-sm border border-red-400 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="w-full space-y-4">
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
                name="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="block text-white font-medium mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-orange-500" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="block text-white font-medium mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-orange-500" />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input 
              id="show-password" 
              type="checkbox" 
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="show-password" className="ml-2 block text-sm text-white">
              Show password
            </label>
          </div>

          <div className="flex items-center mt-4">
            <input 
              id="terms" 
              type="checkbox" 
              required
              className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-white">
              I agree to the <a href="/terms" className="underline hover:text-yellow-200">Terms of Service</a> and <a href="/privacy" className="underline hover:text-yellow-200">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 mt-4"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center text-sm text-white mt-4">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-yellow-300 hover:text-yellow-200 underline">
              Sign in
            </a>
          </div>
        </form>
      </div>
      
      <div className="absolute bottom-4 text-center text-xs text-white/60 w-full">
        © 2025 Event n Ticket. All rights reserved.
      </div>
    </div>
  );
};

export default Register;