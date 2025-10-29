import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
      setTokenValid(false);
      return;
    }

    // Optional: Verify token with backend
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}auth/verify-reset-token?token=${token}`
      );
      
      if (!response.data?.success) {
        setError("Invalid or expired reset token");
        setTokenValid(false);
      }
    } catch (err) {
      console.error("Token verification failed:", err);
      setError("Invalid or expired reset token");
      setTokenValid(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate passwords
      if (!password || !confirmPassword) {
        throw new Error("Both password fields are required");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Submit password reset
      const response = await axios.post(
        `${serverURL.url}auth/reset-password`,
        {
          token: token,
          newPassword: password,
          confirmPassword: confirmPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data?.success) {
        setSuccess(true);
        toast.success("Password reset successfully!");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } else {
        throw new Error(response.data?.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      
      if (err.response?.status === 400) {
        setError("Invalid or expired reset token");
      } else if (err.response?.status === 404) {
        setError("Reset token not found");
      } else {
        setError(err.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!tokenValid) {
    return (
      <>
        <style>{fadeInUp}</style>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-500 to-yellow-400 relative overflow-hidden px-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto animate-fade-in-up">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-red-500/30 backdrop-blur-sm border border-red-400 text-white p-4 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
              <p className="text-orange-100 mb-6 text-center">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <style>{fadeInUp}</style>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-500 to-yellow-400 relative overflow-hidden px-4">
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto animate-fade-in-up">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-green-500/30 backdrop-blur-sm border border-green-400 text-white p-4 rounded-full mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Password Reset Successfully!</h2>
              <p className="text-orange-100 mb-6 text-center">
                Your password has been reset successfully. You will be redirected to login shortly.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-lg hover:shadow-green-500/50 transition-all duration-300"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{fadeInUp}</style>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-orange-500 to-yellow-400 relative overflow-hidden px-4">
        <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 opacity-30 rounded-full blur-3xl animate-pulse -z-10"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-yellow-300 opacity-20 rounded-full blur-2xl -z-10"></div>

        <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-auto animate-fade-in-up">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="bg-gradient-to-br from-orange-100 to-orange-300 text-white p-4 rounded-full shadow-lg mb-4">
              <img className="w-12 h-12" src={logo} alt="Logo" />
            </div>
            <h2 className="text-3xl font-bold text-white text-center drop-shadow-lg mb-2">
              Reset Password
            </h2>
            <p className="text-sm text-orange-50 text-center">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="bg-red-500/30 backdrop-blur-sm border border-red-400 text-white p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="form-control">
              <label className="block text-white font-medium mb-2" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex space-x-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-full rounded ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-orange-100">
                    Password strength: {strengthLabels[passwordStrength - 1] || 'Very Weak'}
                  </p>
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="block text-white font-medium mb-2" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 w-full py-3 px-4 rounded-lg bg-white/90 border border-orange-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2">
                  {password === confirmPassword ? (
                    <p className="text-xs text-green-300 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Passwords match
                    </p>
                  ) : (
                    <p className="text-xs text-red-300 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <div className="text-center text-sm text-white mt-6">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-yellow-300 hover:text-yellow-200 underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;