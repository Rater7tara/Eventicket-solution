import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Mail, Lock, User, Phone, X } from "lucide-react";
import logo from "../../../assets/logo.png";
import serverURL from "../../../ServerConfig";


const Register = () => {
  const { createUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // OTP related states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pendingUserData, setPendingUserData] = useState(null); // Store user data temporarily

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Basic validation
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      console.log("Form validation passed, attempting registration...");
      setLoading(true);

      // Create user account (backend sends OTP automatically)
      const result = await createUser(name, email, phone, password);
      console.log("Registration successful:", result);

      // Store user data for OTP verification
      setPendingUserData({
        name,
        email,
        phone,
        password,
        userId: result.userId // Store userId from registration response
      });
      
      // Show OTP modal
      setShowOtpModal(true);

    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in instead.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOtpVerification = async (email) => {
    try {
      const response = await fetch(`${serverURL.url}auth/send-verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      console.log("OTP sent successfully");
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw new Error("Failed to send verification code. Please try again.");
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setOtpError("");

    if (!otp.trim()) {
      setOtpError("Please enter the OTP code");
      return;
    }

    if (!pendingUserData || !pendingUserData.userId) {
      setOtpError("User data not found. Please try registering again.");
      return;
    }

    try {
      setOtpLoading(true);

      // Verify OTP to activate the account
      const verifyResponse = await fetch(`${serverURL.url}auth/verify-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: pendingUserData.userId,
          otp: otp.trim()
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || 'Invalid OTP code');
      }

      console.log("Account verified successfully", verifyData);
      
      // Clear pending data
      setPendingUserData(null);
      
      // Close modal and redirect to login page
      setShowOtpModal(false);
      navigate("/login", { replace: true });

    } catch (error) {
      console.error("OTP verification error:", error);
      setOtpError(error.message || "Invalid OTP code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setOtpError("");
      if (!pendingUserData || !pendingUserData.userId) {
        setOtpError("User data not found. Please try registering again.");
        return;
      }

      const response = await fetch(`${serverURL.url}auth/send-verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: pendingUserData.userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      console.log("OTP resent successfully");
    } catch (error) {
      console.error("Error resending OTP:", error);
      setOtpError("Failed to resend OTP. Please try again.");
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp("");
    setOtpError("");
    setPendingUserData(null); // Clear pending data when modal is closed
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-500 to-yellow-400 relative overflow-hidden px-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 opacity-30 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="absolute bottom-20 right-20 w-60 h-60 bg-yellow-300 opacity-20 rounded-full blur-2xl -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-pink-400 opacity-20 rounded-full blur-2xl -z-10"></div>
      <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-red-400 opacity-10 rounded-full blur-xl -z-10"></div>

      <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto my-8">
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
            <label className="block text-white font-medium mb-2" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                required
              />
            </div>
          </div>

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
            <label
              className="block text-white font-medium mb-2"
              htmlFor="phone"
            >
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone className="w-5 h-5 text-orange-500" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (234) 567-8910"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label
              className="block text-white font-medium mb-2"
              htmlFor="password"
            >
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
            <label
              className="block text-white font-medium mb-2"
              htmlFor="confirmPassword"
            >
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
            <label
              htmlFor="show-password"
              className="ml-2 block text-sm text-white"
            >
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
              I agree to the{" "}
              <a href="/terms" className="underline hover:text-yellow-200">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" className="underline hover:text-yellow-200">
                Privacy Policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center text-sm text-white mt-4">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-yellow-300 hover:text-yellow-200 underline"
            >
              Sign in
            </a>
          </div>
        </form>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Verify Your Email</h3>
              <button
                onClick={closeOtpModal}
                className="text-white hover:text-red-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-orange-50 text-sm mb-6 text-center">
              We've sent a verification code to{" "}
              <span className="font-semibold">{pendingUserData?.email}</span>
            </p>

            {otpError && (
              <div className="bg-red-500/30 backdrop-blur-sm border border-red-400 text-white p-3 rounded-lg mb-4">
                {otpError}
              </div>
            )}

            <form onSubmit={handleOtpVerification} className="space-y-4">
              <div className="form-control">
                <label className="block text-white font-medium mb-2" htmlFor="otp">
                  Enter OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300 text-center text-lg tracking-widest"
                  maxLength="6"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? "Verifying..." : "Verify Account"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-yellow-300 hover:text-yellow-200 underline text-sm"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* <div className="absolute bottom-4 text-center text-xs text-white/60 w-full">
        © 2025 Event n Ticket. All rights reserved.
      </div> */}
    </div>
  );
};

export default Register;