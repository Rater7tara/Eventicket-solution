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
  Send,
  Upload,
  ImageIcon,
  XCircle,
  KeyRound,
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

const AdminProfile = () => {
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
    contactNumber: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image upload states - Following ManageEvents pattern
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    email: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Forget password states - Following Login.jsx pattern
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("No authentication token found. Please login again.");
      navigate("/login");
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Handle image file selection - Following ManageEvents pattern
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      console.log("🖼️ Image selected:", file.name);
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      toast.success("Image selected successfully!");
    }
  };

  // Remove image - Following ManageEvents pattern
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      console.log("📡 Fetching profile...");

      const response = await fetch(`${serverURL.url}auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth-token");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("📥 Profile response:", result);

      if (result?.success && result?.data) {
        const profileData = result.data;
        setProfile(profileData);

        // Initialize form data
        setEditFormData({
          name: profileData.name || "",
          email: profileData.email || "",
          contactNumber: profileData.contactNumber || "",
          address: profileData.address || "",
        });

        // Set image preview if exists
        if (profileData.profileImg) {
          setImagePreview(profileData.profileImg);
        }

        // Set email for password form
        setPasswordData(prev => ({
          ...prev,
          email: profileData.email || "",
        }));

        // Set reset email for forgot password
        setResetEmail(profileData.email || "");
      } else {
        throw new Error(result?.message || "Invalid response format");
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      const errorMessage = err.message || "Failed to fetch profile data.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile - Following ManageEvents pattern
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
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
      if (!emailRegex.test(editFormData.email.trim())) {
        toast.error("Please enter a valid email address!");
        return;
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      let dataToSubmit;
      let headers;

      // Following ManageEvents pattern for handling FormData vs JSON
      if (imageFile) {
        // Use FormData if there's an image file
        dataToSubmit = new FormData();
        
        // Append all text fields
        Object.keys(editFormData).forEach(key => {
          if (editFormData[key] !== null && editFormData[key] !== undefined) {
            dataToSubmit.append(key, editFormData[key].toString().trim());
          }
        });

        // Append the image file
        dataToSubmit.append('profileImg', imageFile);

        headers = {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        };
      } else if (imagePreview === null) {
        // If image was removed, use FormData with removeImage flag
        dataToSubmit = new FormData();
        
        Object.keys(editFormData).forEach(key => {
          if (editFormData[key] !== null && editFormData[key] !== undefined) {
            dataToSubmit.append(key, editFormData[key].toString().trim());
          }
        });

        dataToSubmit.append('removeImage', 'true');

        headers = {
          'Authorization': `Bearer ${token}`,
        };
      } else {
        // Use regular JSON for text-only updates
        dataToSubmit = {
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          contactNumber: editFormData.contactNumber?.trim() || '',
          address: editFormData.address?.trim() || '',
        };

        headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
      }

      console.log("📨 Sending update request...");

      // Use axios following ManageEvents pattern
      const response = await axios.put(
        `${serverURL.url}auth/profile`,
        dataToSubmit,
        { headers }
      );

      console.log("📥 Update response:", response.data);

      if (response.data?.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        
        // Clean up image states
        setImageFile(null);

        // Update profile state with new data
        if (response.data.data) {
          setProfile(response.data.data);
          
          // Update form data
          setEditFormData({
            name: response.data.data.name || "",
            email: response.data.data.email || "",
            contactNumber: response.data.data.contactNumber || "",
            address: response.data.data.address || "",
          });

          // Handle image update
          if (response.data.data.profileImg) {
            setImagePreview(response.data.data.profileImg);
            console.log("🖼️ Profile image updated successfully");
          } else {
            setImagePreview(null);
          }

          // Update user context
          if (setUser) {
            setUser(prev => ({ ...prev, ...response.data.data }));
          }
        } else {
          // Refresh profile if no data returned
          await fetchProfile();
        }
      } else {
        toast.error(response.data?.message || "Update failed. Please try again.");
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change password - FIXED: Use currentPassword (not oldPassword)
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Enhanced validation
    if (!passwordData.currentPassword.trim()) {
      toast.error("Current password is required!");
      return;
    }

    if (!passwordData.newPassword.trim()) {
      toast.error("New password is required!");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }

    // Check if new password is different from current
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("New password must be different from current password!");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        navigate("/login");
        return;
      }

      console.log("🔑 Attempting password change...");

      // Use the exact API structure you provided
      const response = await fetch(`${serverURL.url}auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword.trim(),
          newPassword: passwordData.newPassword.trim()
        })
      });

      const result = await response.json();
      console.log("🔑 Password change response:", result);

      if (response.ok && result?.success) {
        toast.success("Password changed successfully!");
        setShowChangePassword(false);
        // Reset form
        setPasswordData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        const errorMessage = result?.message || `Error: ${response.status} ${response.statusText}`;
        toast.error(errorMessage);
        console.error("Password change failed:", result);
      }
    } catch (err) {
      console.error("❌ Error changing password:", err);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send reset OTP to email - Following Login.jsx pattern
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
        setShowForgotPassword(false);
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

  // Reset password with OTP verification - Following Login.jsx pattern
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
        console.log("✅ Success condition met, showing success toast and modal...");

        // Show success toast immediately - matching Login component
        const successMsg = response.data?.message || "Password reset successful! Your password has been updated.";
        
        // Show toast first
        toast.success(successMsg);
        console.log("📢 Success toast shown:", successMsg);

        // Store success message and close OTP modal
        setSuccessMessage(successMsg);
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

  // Resend OTP - Following Login.jsx pattern
  const handleResendOtp = async () => {
    setOtp(""); // Clear current OTP
    setNewPassword(""); // Clear password fields
    setConfirmPassword("");
    await handleSendResetOtp({ preventDefault: () => {} });
  };

  // Reset all password reset states - Following Login.jsx pattern
  const resetAllStates = () => {
    setShowForgotPassword(false);
    setShowOtpModal(false);
    setShowSuccessModal(false);
    setResetEmail(profile?.email || "");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowResetNewPassword(false);
    setIsSubmittingReset(false);
    setIsSubmittingOtp(false);
    setSuccessMessage("");
  };

  // Close success modal and return to profile
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowResetNewPassword(false);
    setIsSubmittingReset(false);
    setIsSubmittingOtp(false);
    setSuccessMessage("");
    // Refresh profile data
    fetchProfile();
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
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

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset form data to original profile data
    setEditFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      contactNumber: profile?.contactNumber || "",
      address: profile?.address || "",
    });

    // Reset image states
    setImageFile(null);
    setImagePreview(profile?.profileImg || null);
    
    // Clear the file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
    
    setIsEditing(false);
  };

  // Reset modal states when closing
  const resetModals = () => {
    setShowChangePassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      email: profile?.email || "",
    });
    resetAllStates();
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;
      const response = await axios.delete(`${serverURL.url}auth/profile`, authHeaders);
      if (response.data?.success) {
        toast.success("Account deleted successfully!");
        localStorage.removeItem("auth-token");
        if (logout) logout();
        navigate("/login");
      } else {
        toast.error(response.data?.message || "Failed to delete account. Please try again.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account. Please try again.");
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen">
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
                      {/* Profile Image */}
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-4 border-orange-200">
                        {profile?.profileImg ? (
                          <img
                            src={profile.profileImg}
                            alt={profile?.name || "Profile"}
                            className="w-full h-full object-cover"
                            onError={() => {
                              console.error("Failed to load profile image");
                            }}
                            onLoad={() => {
                              console.log("✅ Profile image loaded successfully");
                            }}
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
                          {profile?.contactNumber || "No phone provided"}
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
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Account Information
                      </h3>
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
                          <p className="capitalize text-gray-800">{profile?.role || "User"}</p>
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
                      
                      {/* Image Upload Section - Following ManageEvents pattern */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Picture
                        </label>
                        
                        {/* Image Preview */}
                        {imagePreview ? (
                          <div className="relative mb-4">
                            <div className="w-32 h-32 mx-auto">
                              <img
                                src={imagePreview}
                                alt="Profile preview"
                                className="w-full h-full object-cover rounded-full border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                title="Remove image"
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4 bg-gray-50">
                            <div className="text-center">
                              <User className="mx-auto text-gray-400 mb-2" size={48} />
                              <p className="text-gray-500 text-sm">No image</p>
                            </div>
                          </div>
                        )}

                        {/* File Input */}
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                        </p>
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
                        <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          id="contactNumber"
                          name="contactNumber"
                          type="text"
                          value={editFormData.contactNumber}
                          onChange={handleInputChange}
                          placeholder="Enter your contact number"
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
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h2 className="text-xl font-bold text-gray-800">
                Change Password
              </h2>
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
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                    <Lock
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
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
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                    <Key
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
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
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                    <Key
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
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

      {/* Forgot Password Modal - Following Login.jsx pattern */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out animate-fade-in-up"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <h2 className="text-xl font-bold text-gray-800">
                Reset Password
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={resetAllStates}
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-400/50 rounded-lg p-4 m-6 mb-4">
              <div className="flex items-start">
                <AlertTriangle
                  className="text-orange-500 mr-3 mt-0.5 flex-shrink-0"
                  size={20}
                />
                <p className="text-sm text-orange-700">
                  We'll send a 6-digit OTP to your email address. Please check
                  your inbox and spam folder.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendResetOtp} className="p-6 pt-0">
              <div className="form-control mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="pl-10 w-full py-3 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetAllStates}
                  disabled={isSubmittingReset}
                  className="flex-1 py-3 rounded-md bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="flex-1 py-3 rounded-md bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

      {/* OTP Verification and Password Reset Modal - Following Login.jsx pattern */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
              <button
                onClick={resetAllStates}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/50 rounded-lg p-3 m-6 mb-4">
              <div className="flex items-start">
                <KeyRound
                  className="text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                  size={18}
                />
                <div>
                  <p className="text-xs text-blue-700 mb-1">
                    OTP sent to{" "}
                    <span className="font-medium">{resetEmail}</span>
                  </p>
                  <p className="text-xs text-blue-600">
                    Enter OTP and new password. Expires in 10 minutes.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 pt-0">
              <div className="space-y-3">
                <div className="form-control">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                      className="pl-9 w-full py-2.5 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg tracking-widest"
                      maxLength="6"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="resetNewPassword"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-orange-500" />
                    </div>
                    <input
                      id="resetNewPassword"
                      name="resetNewPassword"
                      type={showResetNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-9 w-full py-2.5 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      minLength="6"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="resetConfirmPassword"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-orange-500" />
                    </div>
                    <input
                      id="resetConfirmPassword"
                      name="resetConfirmPassword"
                      type={showResetNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pl-9 w-full py-2.5 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      minLength="6"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="show-reset-password"
                      type="checkbox"
                      checked={showResetNewPassword}
                      onChange={() => setShowResetNewPassword(!showResetNewPassword)}
                      className="w-3 h-3 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label
                      htmlFor="show-reset-password"
                      className="ml-2 block text-xs text-gray-700"
                    >
                      Show passwords
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmittingReset}
                    className="text-xs text-orange-600 hover:text-orange-800 font-medium underline underline-offset-2 hover:underline-offset-4 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReset ? "Sending..." : "Resend OTP"}
                  </button>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpModal(false);
                      setShowForgotPassword(true);
                      setOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isSubmittingOtp}
                    className="flex-1 py-2.5 rounded-md bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                    className="flex-1 py-2.5 rounded-md bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal - Following Login.jsx pattern */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto animate-fade-in-up">
            <div className="p-8 text-center">
              <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-500"
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

              <h3 className="text-2xl font-bold text-gray-800 mb-4">Success!</h3>

              <p className="text-gray-600 mb-8 leading-relaxed">
                {successMessage}
              </p>

              <button
                onClick={closeSuccessModal}
                className="w-full py-3 rounded-md bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors duration-200"
              >
                Continue
              </button>
            </div>
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
              Are you sure you want to delete your account? This action cannot
              be undone and all your data will be permanently removed.
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

export default AdminProfile;