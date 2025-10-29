import React, { useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  X,
} from "lucide-react";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";
import serverURL from "../../../../ServerConfig";

const ModeratorCreate = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    eventId: eventId || "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Get auth headers using token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token");
    
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Copy to clipboard function
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success(`Copied!`, {
        autoClose: 1500,
        hideProgressBar: true,
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        eventId: eventId,
      };

      const response = await axios.post(
        `${serverURL.url}admin/create-moderator`,
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success || response.status === 200 || response.status === 201) {
        // Store credentials for the success modal
        setCreatedCredentials({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          eventId: eventId,
        });
        
        // Show success modal
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("❌ Error creating moderator:", error);
      
      let errorMessage = "Failed to create moderator";
      
      if (error.response?.status === 401) {
        errorMessage = "🔒 Authentication failed. Please login again.";
      } else if (error.response?.status === 403) {
        errorMessage = "⛔ You don't have permission to create moderators.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate(`/dashboard/event/${eventId}/moderators`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                  <UserPlus className="mr-3 text-blue-600" size={32} />
                  Create Moderator
                </h1>
                <p className="text-gray-600 mt-2">
                  Event ID: <span className="font-mono text-sm">{eventId}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="text-blue-600 mr-3 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Important Information:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>This moderator will have access to scan tickets for this event only</li>
                    <li>Make sure to save the credentials after creation</li>
                    <li>The password cannot be retrieved later</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                placeholder="Enter moderator's full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                placeholder="moderator@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock size={16} className="inline mr-2" />
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock size={16} className="inline mr-2" />
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center justify-center ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} className="mr-2" />
                    Create Moderator
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Security Note:</strong> After creating the moderator, make sure to securely 
            share the credentials with the moderator. The password will not be visible again.
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdCredentials && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp border border-white/20">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Moderator Created</h2>
                    <p className="text-sm text-gray-600">Save these credentials securely</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Warning Banner */}
              <div className="bg-amber-50 border border-amber-200 p-3 mb-6 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="text-amber-600 mr-2 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-amber-800">
                    Password will not be shown again. Copy and save it now.
                  </p>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-3">
                {/* Name */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Name</p>
                      <p className="text-sm font-semibold text-gray-800">{createdCredentials.name}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.name, "Name")}
                      className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      {copiedField === "Name" ? (
                        <Check size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} className="text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-800 break-all">{createdCredentials.email}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.email, "Email")}
                      className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      {copiedField === "Email" ? (
                        <Check size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} className="text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-red-600 font-medium mb-1 flex items-center">
                        <Lock size={12} className="mr-1" />
                        Password
                      </p>
                      <p className="text-sm font-mono font-bold text-red-900">{createdCredentials.password}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.password, "Password")}
                      className="ml-4 p-2 hover:bg-red-100 rounded-lg transition-all"
                    >
                      {copiedField === "Password" ? (
                        <Check size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} className="text-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-semibold text-gray-800">{createdCredentials.phone}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.phone, "Phone")}
                      className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      {copiedField === "Phone" ? (
                        <Check size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} className="text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Copy All Button */}
              <button
                onClick={() => {
                  const allText = `Moderator Credentials\n\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nPhone: ${createdCredentials.phone}`;
                  copyToClipboard(allText, "All credentials");
                }}
                className="w-full mt-4 px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 transition-all font-medium flex items-center justify-center"
              >
                <Copy size={18} className="mr-2" />
                Copy All
              </button>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
              <button
                onClick={handleCloseModal}
                className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                Continue to Moderators List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ModeratorCreate;