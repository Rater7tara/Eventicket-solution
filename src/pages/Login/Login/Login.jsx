import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Mail, Lock, X, Send, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import serverURL from "../../../ServerConfig"; // Adjust path as needed
import logo from "../../../assets/logo.png";

// Keyframe animation for fade in effect
const fadeInUp = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}
`;

const Login = () => {
  const { signIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate input
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const result = await signIn(email, password);
      console.log("Login successful with role:", result.role);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message || "Failed to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Enhanced forgot password function with better error handling
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      toast.error("Email is required!");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail.trim())) {
      toast.error("Please enter a valid email address!");
      return;
    }

    setIsSubmittingForgot(true);
    
    try {
      console.log("🔄 Sending forgot password request...");
      
      const response = await axios.post(
        `${serverURL.url}auth/forget-password`,
        { 
          email: forgotPasswordEmail.trim() 
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("📥 Forgot password response:", response.data);

      // Handle different response scenarios
      if (response.data?.success || response.status === 200) {
        toast.success("Password reset link sent to your email! Please check your inbox and spam folder.");
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast.error(response.data?.message || "Request failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error in forgot password:", err);
      
      // Handle different error types
      if (err.code === 'ECONNABORTED') {
        toast.error("Request timed out. Please try again.");
      } else if (err.response?.status === 404) {
        toast.error("Email not found. Please check your email address.");
      } else if (err.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (err.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        const errorMessage = err.response?.data?.message || err.message || "Failed to process request. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Reset forgot password modal
  const resetForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setIsSubmittingForgot(false);
  };

  // Open forgot password modal with current email
  const openForgotPasswordModal = () => {
    setForgotPasswordEmail(email); // Pre-fill with login email if available
    setShowForgotPassword(true);
  };

  return (
    <>
      <style>{fadeInUp}</style>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-500 to-yellow-400 relative overflow-hidden px-4">
        <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 opacity-30 rounded-full blur-3xl animate-pulse -z-10"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-yellow-300 opacity-20 rounded-full blur-2xl -z-10"></div>

        <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="bg-gradient-to-br from-orange-100 to-orange-300 text-white p-4 rounded-full shadow-lg mb-4">
              <img className="w-12 h-12" src={logo} alt="Logo" />
            </div>
            <h2 className="text-3xl font-bold text-white text-center drop-shadow-lg mb-2">
              Welcome Back!
            </h2>
            <p className="text-sm text-orange-50 text-center">
              Sign in to access your tickets and upcoming events
            </p>
          </div>

          {error && (
            <div className="bg-red-500/30 backdrop-blur-sm border border-red-400 text-white p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="form-control">
              <label
                className="block text-white font-medium mb-2"
                htmlFor="email"
              >
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
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-white font-medium"
                  htmlFor="password"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-sm text-yellow-300 hover:text-yellow-100 font-medium underline underline-offset-2 hover:underline-offset-4 transition-all duration-200 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
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

            <div className="flex items-center">
              <input
                id="show-password"
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
              />
              <label
                htmlFor="show-password"
                className="ml-2 block text-sm text-white"
              >
                Show password
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="text-center text-sm text-white mt-6">
              Don't have an account?{" "}
              <a
                href="/register"
                className="font-medium text-yellow-300 hover:text-yellow-200 underline"
              >
                Sign up
              </a>
            </div>
          </form>
        </div>

        {/* <div className="absolute bottom-4 text-center text-xs text-white/60 w-full">
          © 2025 Event n Ticket. All rights reserved.
        </div> */}
      </div>

      {/* Updated Forgot Password Modal - Styled like Register OTP Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Reset Password</h3>
              <button
                onClick={resetForgotPasswordModal}
                className="text-white hover:text-red-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-400/50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle
                  className="text-orange-300 mr-3 mt-0.5 flex-shrink-0"
                  size={20}
                />
                <p className="text-sm text-orange-50">
                  We'll send you a password reset link to your email address. Please check your inbox and spam folder after submitting.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="form-control">
                <label className="block text-white font-medium mb-2" htmlFor="forgotEmail">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="w-5 h-5 text-orange-500" />
                  </div>
                  <input
                    id="forgotEmail"
                    name="forgotEmail"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForgotPasswordModal}
                  disabled={isSubmittingForgot}
                  className="flex-1 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmittingForgot ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={16} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;