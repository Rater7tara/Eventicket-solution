import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  Search,
  Edit,
  Trash2,
  UserPlus,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  X,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";
import serverURL from "../../../../ServerConfig";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth-token");
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

const ViewAllModerators = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [moderators, setModerators] = useState([]);
  const [filteredModerators, setFilteredModerators] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventData, setEventData] = useState(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModerator, setEditingModerator] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingModerator, setDeletingModerator] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await axios.get(
          `${serverURL.url}events/${eventId}`
        );
        setEventData(response.data);
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  // Fetch moderators
  useEffect(() => {
    fetchModerators();
  }, [eventId]);

  const fetchModerators = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${serverURL.url}admin/moderators`,
        getAuthHeaders()
      );
      
      console.log("API Response:", response.data); // Debug log
      
      // Extract moderators array - handle different response structures
      let moderatorsList = [];
      
      if (Array.isArray(response.data)) {
        moderatorsList = response.data;
      } else if (Array.isArray(response.data.data)) {
        moderatorsList = response.data.data;
      } else if (Array.isArray(response.data.moderators)) {
        moderatorsList = response.data.moderators;
      } else if (response.data.data && typeof response.data.data === 'object') {
        // Sometimes the response might be nested
        moderatorsList = Array.isArray(response.data.data.moderators) 
          ? response.data.data.moderators 
          : [];
      }
      
      console.log("Extracted moderators:", moderatorsList); // Debug log
      
      setModerators(moderatorsList);
      setFilteredModerators(moderatorsList);
    } catch (error) {
      console.error("Error fetching moderators:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Failed to load moderators");
      setModerators([]);
      setFilteredModerators([]);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredModerators(moderators);
    } else {
      const filtered = moderators.filter(
        (moderator) =>
          moderator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moderator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moderator.phone?.includes(searchTerm)
      );
      setFilteredModerators(filtered);
    }
  }, [searchTerm, moderators]);

  // Handle edit modal
  const handleEditClick = (moderator) => {
    setEditingModerator(moderator);
    setEditFormData({
      name: moderator.name || "",
      email: moderator.email || "",
      phone: moderator.phone || "",
      password: "",
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!editFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!editFormData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (editFormData.password && editFormData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateModerator = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setUpdating(true);

    try {
      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
        phone: editFormData.phone.trim(),
      };

      // Only include password if it's being updated
      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      const response = await axios.put(
        `${serverURL.url}admin/moderators/${editingModerator._id}`,
        payload,
        getAuthHeaders()
      );

      if (response.data.success || response.status === 200) {
        toast.success("Moderator updated successfully!");
        setShowEditModal(false);
        fetchModerators(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating moderator:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update moderator";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (moderator) => {
    setDeletingModerator(moderator);
    setShowDeleteModal(true);
  };

  const handleDeleteModerator = async () => {
    if (!deletingModerator) return;

    setDeleting(true);

    try {
      const response = await axios.delete(
        `${serverURL.url}admin/moderators/${deletingModerator._id}`,
        getAuthHeaders()
      );

      if (response.data.success || response.status === 200) {
        toast.success("Moderator deleted successfully!");
        setShowDeleteModal(false);
        setDeletingModerator(null);
        fetchModerators(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting moderator:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete moderator";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/dashboard/reports/event/${eventId}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Event Report
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                  <Users className="mr-3 text-blue-600" size={32} />
                  Event Moderators
                </h1>
                {eventData && (
                  <p className="text-gray-600 mt-2">
                    Managing moderators for: <span className="font-semibold">{eventData.title}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(`/dashboard/event/${eventId}/create-moderator`)}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
              >
                <UserPlus size={20} className="mr-2" />
                Create New Moderator
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Moderators List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredModerators.length === 0 ? (
            <div className="text-center p-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm ? "No moderators found matching your search" : "No moderators created yet"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate(`/dashboard/event/${eventId}/create-moderator`)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Moderator
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredModerators.map((moderator) => (
                    <tr key={moderator._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="text-blue-600" size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {moderator.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">ID: {moderator._id?.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            {moderator.email || "N/A"}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            {moderator.phone || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar size={14} className="mr-2 text-gray-400" />
                          {formatDate(moderator.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(moderator)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Moderator"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(moderator)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Moderator"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Card */}
        {!loading && moderators.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Total Moderators:</strong> {moderators.length} | 
              <strong className="ml-4">Showing:</strong> {filteredModerators.length}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Edit className="mr-2 text-blue-600" size={24} />
                  Edit Moderator
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateModerator} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-2 border ${
                      editErrors.name ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {editErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-2 border ${
                      editErrors.email ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {editErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-2 border ${
                      editErrors.phone ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {editErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password (leave blank to keep current)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={editFormData.password}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-2 border ${
                        editErrors.password ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter new password (optional)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {editErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.password}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Update Moderator
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertCircle className="text-red-600" size={32} />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
              Delete Moderator
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>{deletingModerator?.name}</strong>? 
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingModerator(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteModerator}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAllModerators;