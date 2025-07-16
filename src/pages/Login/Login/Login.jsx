import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import {
  Mail,
  Lock,
  X,
  Send,
  RefreshCw,
  AlertTriangle,
  KeyRound,
} from "lucide-react";
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

  // Reset password OTP states
  const [showResetEmailModal, setShowResetEmailModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // Send reset OTP to email
  const handleSendResetOtp = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error("Email is required!");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      toast.error("Please enter a valid email address!");
      return;
    }

    setIsSubmittingReset(true);

    try {
      console.log("🔄 Sending reset OTP request...");

      const response = await axios.post(
        `${serverURL.url}auth/send-reset-otp`,
        {
          email: resetEmail.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("📥 Reset OTP response:", response.data);

      // Handle different response scenarios
      if (response.data?.success || response.status === 200) {
        toast.success(
          "OTP sent to your email! Please check your inbox and spam folder."
        );
        setShowResetEmailModal(false);
        setShowOtpModal(true);
      } else {
        toast.error(
          response.data?.message || "Failed to send OTP. Please try again."
        );
      }
    } catch (err) {
      console.error("❌ Error in sending reset OTP:", err);

      // Handle different error types
      if (err.code === "ECONNABORTED") {
        toast.error("Request timed out. Please try again.");
      } else if (err.response?.status === 404) {
        toast.error("Email not found. Please check your email address.");
      } else if (err.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else if (err.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to send OTP. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Reset password with OTP verification
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("OTP is required!");
      return;
    }

    if (otp.trim().length !== 6) {
      toast.error("OTP must be 6 digits!");
      return;
    }

    if (!newPassword.trim()) {
      toast.error("New password is required!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsSubmittingOtp(true);

    try {
      console.log("🔄 Resetting password with OTP...");

      const response = await axios.post(
        `${serverURL.url}auth/reset-password`,
        {
          email: resetEmail.trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("📥 Password reset response:", response.data);
      console.log("🔍 Success check:", response.data?.success === true);
      console.log("🔍 Status check:", response.status === 200);
      console.log("🔍 Success value type:", typeof response.data?.success);
      console.log("🔍 Success value:", response.data?.success);

      // Show success toast first, then delay modal closing
      if (
        response.data?.success === true ||
        response.data?.success == true ||
        response.status === 200
      ) {
        console.log("✅ Success condition met, showing success modal...");

        // Store success message and close OTP modal
        setSuccessMessage(
          response.data?.message ||
            "Password reset successful! You can now login with your new password."
        );
        setShowOtpModal(false);

        // Show success modal after a brief delay
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 300);
      } else {
        console.log("❌ Success condition not met");
        toast.error(
          response.data?.message ||
            "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      console.error("❌ Error in password reset:", err);

      if (err.code === "ECONNABORTED") {
        toast.error("Request timed out. Please try again.");
      } else if (err.response?.status === 400) {
        toast.error("Invalid or expired OTP. Please try again.");
      } else if (err.response?.status === 404) {
        toast.error(
          "Password reset service not available. Please contact support."
        );
      } else if (err.response?.status === 429) {
        toast.error("Too many attempts. Please try again later.");
      } else if (err.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to reset password. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  // Reset all password reset states
  const resetAllStates = () => {
    setShowResetEmailModal(false);
    setShowOtpModal(false);
    setShowSuccessModal(false);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setIsSubmittingReset(false);
    setIsSubmittingOtp(false);
    setSuccessMessage("");
  };

  // Close success modal and return to login
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setIsSubmittingReset(false);
    setIsSubmittingOtp(false);
    setSuccessMessage("");
    // Pre-fill the login email with the reset email
    setEmail(resetEmail);
  };

  // Open reset email modal with current email
  const openResetEmailModal = () => {
    setResetEmail(email); // Pre-fill with login email if available
    setShowResetEmailModal(true);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtp(""); // Clear current OTP
    setNewPassword(""); // Clear password fields
    setConfirmPassword("");
    await handleSendResetOtp({ preventDefault: () => {} });
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
                  onClick={openResetEmailModal}
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
      </div>

      {/* Reset Email Modal */}
      {showResetEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Reset Password</h3>
              <button
                onClick={resetAllStates}
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
                  We'll send a 6-digit OTP to your email address. Please check
                  your inbox and spam folder.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div className="form-control">
                <label
                  className="block text-white font-medium mb-2"
                  htmlFor="resetEmail"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="w-5 h-5 text-orange-500" />
                  </div>
                  <input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetAllStates}
                  disabled={isSubmittingReset}
                  className="flex-1 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmittingReset ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={16} />
                      Send OTP
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification and Password Reset Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-6 w-full max-w-md mx-auto animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Reset Password</h3>
              <button
                onClick={resetAllStates}
                className="text-white hover:text-red-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/50 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <KeyRound
                  className="text-blue-300 mr-2 mt-0.5 flex-shrink-0"
                  size={18}
                />
                <div>
                  <p className="text-xs text-blue-50 mb-1">
                    OTP sent to{" "}
                    <span className="font-medium">{resetEmail}</span>
                  </p>
                  <p className="text-xs text-blue-100">
                    Enter OTP and new password. Expires in 10 minutes.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="form-control">
                <label
                  className="block text-white font-medium mb-1 text-sm"
                  htmlFor="otp"
                >
                  Enter OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <KeyRound className="w-4 h-4 text-orange-500" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    className="pl-9 w-full py-2.5 px-3 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300 text-center text-lg tracking-widest"
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label
                  className="block text-white font-medium mb-1 text-sm"
                  htmlFor="newPassword"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-orange-500" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-9 w-full py-2.5 px-3 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                    minLength="6"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label
                  className="block text-white font-medium mb-1 text-sm"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-orange-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-9 w-full py-2.5 px-3 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                    minLength="6"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="show-new-password"
                    type="checkbox"
                    checked={showNewPassword}
                    onChange={() => setShowNewPassword(!showNewPassword)}
                    className="w-3 h-3 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label
                    htmlFor="show-new-password"
                    className="ml-2 block text-xs text-white"
                  >
                    Show passwords
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmittingReset}
                  className="text-xs text-yellow-300 hover:text-yellow-100 font-medium underline underline-offset-2 hover:underline-offset-4 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReset ? "Sending..." : "Resend OTP"}
                </button>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setShowResetEmailModal(true);
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isSubmittingOtp}
                  className="flex-1 py-2.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingOtp ||
                    otp.length !== 6 ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                >
                  {isSubmittingOtp ? (
                    <>
                      <RefreshCw className="animate-spin mr-1" size={14} />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-1" size={14} />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto animate-fade-in-up">
            <div className="text-center">
              <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">Success!</h3>

              <p className="text-white/90 mb-8 leading-relaxed">
                {successMessage}
              </p>

              <button
                onClick={closeSuccessModal}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300"
              >
                Continue to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
