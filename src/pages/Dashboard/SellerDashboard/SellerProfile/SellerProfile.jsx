import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Edit2,
  Save,
  X,
  Trash2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Calendar,
  Shield,
  Send
} from "lucide-react";
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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

const SellerProfile = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    profilePicture: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    email: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordView, setResetPasswordView] = useState(false);
  
  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Get user ID from user context or localStorage
  const getUserId = () => {
    // Try to get from user context first
    if (user && user.id) {
      return user.id;
    }
    // Try to get from user context with different property name
    if (user && user._id) {
      return user._id;
    }
    // Try to get from localStorage if stored there
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.id || parsedUser._id;
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }
    return null;
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("No authentication token found. Please login again.");
      navigate('/login');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      // Using the correct API endpoint pattern: seller/profile/{id}
      const response = await axios.get(
        `${serverURL.url}seller/profile/${userId}`,
        authHeaders
      );

      console.log("Profile data:", response.data);
      
      if (response.data?.success && response.data?.data) {
        const profileData = response.data.data;
        setProfile(profileData);
        
        // Initialize edit form with current data
        setEditFormData({
          name: profileData.name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          profilePicture: profileData.profilePicture || "",
        });
        
        // Set email in password form
        setPasswordData(prev => ({ ...prev, email: profileData.email || "" }));
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Failed to fetch profile data. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem("auth-token");
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update user profile - FIXED VERSION
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!editFormData.name.trim()) {
        toast.error("Name is required!");
        return;
      }
      
      if (!editFormData.email.trim()) {
        toast.error("Email is required!");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editFormData.email)) {
        toast.error("Please enter a valid email address!");
        return;
      }

      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      // Clean the data - remove empty strings and trim whitespace
      const cleanedData = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone?.trim() || null,
        address: editFormData.address?.trim() || null,
        profilePicture: editFormData.profilePicture?.trim() || null,
      };

      console.log("Sending update data:", cleanedData);

      // Using the existing update endpoint
      const response = await axios.put(
        `${serverURL.url}seller/update-profile`,
        cleanedData,
        authHeaders
      );
      
      console.log("Update response:", response.data);
      
      if (response.data?.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        
        // Update the profile state with new data
        const updatedProfile = { ...profile, ...cleanedData };
        setProfile(updatedProfile);
        
        // Update user context if available
        if (setUser) {
          setUser(prev => ({ ...prev, ...cleanedData }));
        }
        
        // Optionally refetch to get server data
        // await fetchProfile();
      } else {
        const errorMsg = response.data?.message || "Update failed. Please try again.";
        toast.error(errorMsg);
        console.error("Update failed:", response.data);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem("auth-token");
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const response = await axios.put(
        `${serverURL.url}auth/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        authHeaders
      );
      
      console.log("Password change response:", response.data);
      
      if (response.data?.success) {
        toast.success("Password changed successfully!");
        setShowChangePassword(false);
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          email: profile?.email || ""
        });
      } else {
        toast.error(response.data?.message || "Password change failed. Please try again.");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(
        err.response?.data?.message || 
        "Failed to change password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.email) {
      toast.error("Email is required!");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${serverURL.url}auth/forget-password`,
        { email: passwordData.email }
      );
      
      console.log("Forgot password response:", response.data);
      
      if (response.data?.success) {
        toast.success("Password reset link sent to your email!");
        setShowForgotPassword(false);
      } else {
        toast.error(response.data?.message || "Request failed. Please try again.");
      }
    } catch (err) {
      console.error("Error in forgot password:", err);
      toast.error(
        err.response?.data?.message || 
        "Failed to process request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password (simulated - in a real app, this would be on a separate page)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${serverURL.url}auth/reset-password/${resetToken}`,
        { 
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        }
      );
      
      console.log("Reset password response:", response.data);
      
      if (response.data?.success) {
        toast.success("Password reset successfully! Please log in.");
        setResetPasswordView(false);
        navigate('/login');
      } else {
        toast.error(response.data?.message || "Reset failed. Please try again.");
      }
    } catch (err) {
      console.error("Error in reset password:", err);
      toast.error(
        err.response?.data?.message || 
        "Failed to reset password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete account - FIXED VERSION
  const handleDeleteAccount = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      // Using the correct delete endpoint pattern: seller/{id}
      const response = await axios.delete(
        `${serverURL.url}seller/${userId}`,
        authHeaders
      );
      
      console.log("Delete account response:", response.data);
      
      if (response.data?.success) {
        toast.success("Account deleted successfully!");
        localStorage.removeItem("auth-token");
        localStorage.removeItem("user"); // Also remove user data if stored
        if (logout) {
          logout();
        }
        navigate('/login');
      } else {
        toast.error(response.data?.message || "Failed to delete account. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error(
        err.response?.data?.message || 
        "Failed to delete account. Please try again."
      );
    }
  };

  // Handle form field changes - IMPROVED
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Cancel editing - IMPROVED
  const handleCancelEdit = () => {
    // Reset form data to original profile data
    setEditFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      profilePicture: profile?.profilePicture || "",
    });
    setIsEditing(false);
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Reset modal states when closing
  const resetModals = () => {
    setShowChangePassword(false);
    setShowForgotPassword(false);
    setResetPasswordView(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      email: profile?.email || ""
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <style>{fadeInUp}</style>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-600 mt-1">
              View and manage your personal information
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
              <p className="text-red-500 text-lg">{error}</p>
              <button
                onClick={fetchProfile}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center mx-auto"
              >
                <RefreshCw className="mr-2" size={16} />
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Main Content */}
              <div className="p-6">
                {/* Profile View Mode */}
                {!isEditing && (
                  <div className="animate-fade-in-up">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-4 border-orange-200">
                        {profile?.profilePicture ? (
                          <img
                            src={profile.profilePicture}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="text-orange-500" size={48} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">
                          {profile?.name || "User"}
                        </h2>
                        <p className="text-gray-500 mb-2 flex items-center">
                          <Mail className="mr-2" size={16} />
                          {profile?.email || "No email provided"}
                        </p>
                        <p className="text-gray-500 mb-2 flex items-center">
                          <Phone className="mr-2" size={16} />
                          {profile?.phone || "No phone provided"}
                        </p>
                        <p className="text-gray-500 flex items-center">
                          <MapPin className="mr-2" size={16} />
                          {profile?.address || "No address provided"}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2 w-full md:w-auto">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center justify-center"
                        >
                          <Edit2 className="mr-2" size={16} />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors duration-200 font-medium cursor-pointer flex items-center justify-center"
                        >
                          <Lock className="mr-2" size={16} />
                          Change Password
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200 font-medium cursor-pointer flex items-center justify-center"
                        >
                          <Trash2 className="mr-2" size={16} />
                          Delete Account
                        </button>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-1">
                            <Calendar className="text-orange-500 mr-2" size={18} />
                            <p className="text-sm font-medium text-gray-500">Joined On</p>
                          </div>
                          <p className="text-gray-800">
                            {profile?.createdAt ? formatDate(profile.createdAt) : "N/A"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-1">
                            <Shield className="text-orange-500 mr-2" size={18} />
                            <p className="text-sm font-medium text-gray-500">Role</p>
                          </div>
                          <p className="capitalize text-gray-800">
                            {profile?.role || "Seller"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-1">
                            <Calendar className="text-orange-500 mr-2" size={18} />
                            <p className="text-sm font-medium text-gray-500">Last Updated</p>
                          </div>
                          <p className="text-gray-800">
                            {profile?.updatedAt ? formatDate(profile.updatedAt) : "N/A"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-1">
                            <User className="text-orange-500 mr-2" size={18} />
                            <p className="text-sm font-medium text-gray-500">User ID</p>
                          </div>
                          <p className="text-gray-800 text-sm font-mono">
                            {profile?.id || profile?._id || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Mode */}
                {isEditing && (
                  <form onSubmit={handleUpdateProfile} className="animate-fade-in-up">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex justify-center mb-4">
                        <div className="relative w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-4 border-orange-200">
                          {editFormData.profilePicture ? (
                            <img
                              src={editFormData.profilePicture}
                              alt={editFormData.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <User className="text-orange-500" size={48} />
                          )}
                          <div className="hidden w-full h-full items-center justify-center">
                            <User className="text-orange-500" size={48} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
                          Profile Picture URL
                        </label>
                        <input
                          id="profilePicture"
                          name="profilePicture"
                          type="text"
                          value={editFormData.profilePicture}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter image URL"
                        />
                      </div>

                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={editFormData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={editFormData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="text"
                          value={editFormData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          rows="3"
                          value={editFormData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        ></textarea>
                      </div>

                      <div className="flex justify-end space-x-3 mt-4">
                        <button
                          type="button"
                          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="animate-spin mr-2" size={16} />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2" size={16} />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out animate-fade-in-up"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={resetModals}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                      minLength="6"
                    />
                    <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                    <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                </div>

                <div className="text-sm text-gray-500 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setShowForgotPassword(true);
                    }}
                    className="text-orange-600 hover:text-orange-800 inline-flex items-center"
                  >
                    Forgot your password?
                    <ArrowRight className="ml-1" size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                  onClick={resetModals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={16} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out animate-fade-in-up"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <h2 className="text-xl font-bold text-gray-800">Forgot Password</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={resetModals}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="p-6">
              <div className="mb-6">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="text-orange-500 mr-3 mt-0.5" size={20} />
                    <p className="text-sm text-orange-700">
                      We'll send you a password reset link to your email address. Please check your inbox after submitting.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="forgotEmail"
                      name="email"
                      type="email"
                      value={passwordData.email}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                  onClick={resetModals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
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

      {/* Reset Password Modal (Simulated) */}
      {resetPasswordView && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out animate-fade-in-up"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={resetModals}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="resetToken" className="block text-sm font-medium text-gray-700 mb-1">
                    Reset Token
                  </label>
                  <input
                    id="resetToken"
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter token from email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="resetNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="resetNewPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                      minLength="6"
                    />
                    <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="resetConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="resetConfirmPassword"
                      name="confirmPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                    <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                  onClick={resetModals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={16} />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div
            className="bg-white rounded-lg p-6 w-96 shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-500 mr-2" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">
                Delete Account
              </h3>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="mr-2" size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProfile;