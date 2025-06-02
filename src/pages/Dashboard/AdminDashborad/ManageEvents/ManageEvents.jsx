import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Users,
  Ticket,
  Edit,
  Globe, Lock, Power, PowerOff, Upload, Download
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";

// Move EditEventModal outside of the main component
const EditEventModal = ({ 
  selectedEvent, 
  editFormData, 
  handleInputChange, 
  handleEditSubmit, 
  setIsEditModalOpen, 
  setSelectedEvent 
}) => {
  const [imagePreview, setImagePreview] = useState(selectedEvent?.image || null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!selectedEvent) return null;

  // Handle image file selection
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

      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Enhanced form submission with image
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Create FormData to handle both text data and image file
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(editFormData).forEach(key => {
        if (editFormData[key] !== null && editFormData[key] !== undefined) {
          formData.append(key, editFormData[key]);
        }
      });

      // If there's a new image file, append it
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreview === null) {
        // If image was removed, explicitly set empty image
        formData.append('removeImage', 'true');
      }

      // Submit the form with FormData
      await handleEditSubmit(e, formData);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Event</h2>
          <p className="text-gray-600 mt-1">Update event information</p>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6">
          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Image
            </label>
            
            {/* Image Preview */}
            {imagePreview ? (
              <div className="relative mb-4">
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                  title="Remove image"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4 bg-gray-50">
                <div className="text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-gray-500">No image selected</p>
                </div>
              </div>
            )}

            {/* File Input */}
            <input
              type="file"
              id="image-upload"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={editFormData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={editFormData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={editFormData.time}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={editFormData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={editFormData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Tickets
              </label>
              <input
                type="number"
                name="ticketsAvailable"
                value={editFormData.ticketsAvailable}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEvent(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-md font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                'Update Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageEvents = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublished, setFilterPublished] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(6);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    price: "",
    ticketsAvailable: ""
  });

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Navigate to coupons page with event filter
  const handleManageCoupons = (eventId = null) => {
    if (eventId) {
      navigate(`/dashboard/coupons?eventId=${eventId}`);
    } else {
      navigate('/dashboard/coupons');
    }
  };

  // Navigate to seat plan page for booking seats
  const handleBookSeats = (eventId) => {
    // Find the event details from the events state
    const eventDetails = events.find(event => event._id === eventId);
    
    if (!eventDetails) {
      toast.error('Event details not found');
      return;
    }
    
    // Navigate to SeatPlan page with event details in state and query parameters
    navigate('/SeatPlan', {
      state: {
        event: eventDetails,
        mode: 'reserve',
        sellerId: user?.id || user?._id
      }
    });
  };

  // Handle edit event
  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEditFormData({
      title: event.title || "",
      description: event.description || "",
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : "",
      time: event.time || "",
      location: event.location || "",
      price: event.price || "",
      ticketsAvailable: event.ticketsAvailable || ""
    });
    setIsEditModalOpen(true);
  };

// Updated handleEditSubmit function in the main ManageEvents component
const handleEditSubmit = async (e, formData = null) => {
  e.preventDefault();
  
  try {
    // Use formData if provided (multipart data with image), otherwise use regular editFormData
    const dataToSubmit = formData || editFormData;
    
    // Determine headers based on data type
    const headers = formData 
      ? {
          'Authorization': `Bearer ${localStorage.getItem("auth-token")}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        }
      : {
          'Authorization': `Bearer ${localStorage.getItem("auth-token")}`,
          'Content-Type': 'application/json',
        };

    const response = await axios.put(
      `${serverURL.url}event/update/${selectedEvent._id}`,
      dataToSubmit,
      { headers }
    );

    if (response.data.success) {
      toast.success("Event updated successfully!");
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      fetchEvents(); // Refresh the events list
    } else {
      toast.error(response.data.message || "Failed to update event");
    }
  } catch (err) {
    console.error("Error updating event:", err);
    toast.error(err.response?.data?.message || "Failed to update event");
  }
};

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const authHeaders = getAuthHeaders();
      const response = await axios.get(
        `${serverURL.url}admin/events`,
        authHeaders
      );

      console.log("Events API response:", response.data);
      setEvents(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch events. Check your admin privileges."
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle event deletion
  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(
        `${serverURL.url}event/delete/${eventId}`,
        getAuthHeaders()
      );
      setEvents(events.filter((event) => event._id !== eventId));
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
      toast.success("Event deleted successfully!");
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err.response?.data?.message || "Failed to delete event");
      toast.error("Failed to delete event. Please try again.");
    }
  };

  const togglePublish = async (eventId, currentStatus) => {
    const token = localStorage.getItem("auth-token");

    if (!token) {
      toast.error("No token found. Please log in again.");
      return;
    }

    try {
      console.log("🔄 Toggling publish status for event:", eventId);
      console.log("📌 Current publish status:", currentStatus);

      const response = await axios.put(
        `${serverURL.url}admin/events/${eventId}/publish`,
        { isPublished: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Full Publish API response:", response);

      const data = response?.data;

      if (data?.success) {
        toast.success(data.message || "Status updated successfully!");
        fetchEvents();
      } else {
        toast.error(data?.message || "Failed to update publish status.");
      }
    } catch (error) {
      console.error(
        "❌ Error toggling publish status:",
        error?.response || error
      );
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while updating publish status.";

      toast.error(errMsg);
    }
  };

  // Filter and search events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterPublished === "all" ||
      (filterPublished === "published" && event.isPublished) ||
      (filterPublished === "unpublished" && !event.isPublished);

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent
  );
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Not specified";

    try {
      if (
        timeString.toLowerCase().includes("am") ||
        timeString.toLowerCase().includes("pm")
      ) {
        return timeString;
      }

      const [hours, minutes] = timeString.split(":");
      const hour24 = parseInt(hours, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? "PM" : "AM";

      return `${hour12}:${minutes || "00"} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  // Truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // View Event Modal
  const ViewEventModal = () => {
    if (!selectedEvent) return null;

    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
          {/* Header with image */}
          <div className="relative h-64 bg-gray-300 overflow-hidden rounded-t-lg">
            {selectedEvent.image ? (
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
                <Calendar className="text-white" size={64} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute top-4 right-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedEvent.isPublished
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedEvent.isPublished ? "Published" : "Not Published"}
              </span>
            </div>
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-bold text-white">{selectedEvent.title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start space-x-3">
                <Calendar className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-gray-900">{formatDate(selectedEvent.date)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-gray-900">
                    {formatTime(selectedEvent.time)}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-900">
                    {selectedEvent.location || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Tag className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-gray-900">
                    {selectedEvent.price ? `$${selectedEvent.price}` : "Free"}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Available Tickets
                  </p>
                  <p className="text-gray-900">
                    {selectedEvent.ticketsAvailable || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Description
              </h3>
              <p className="text-gray-700">
                {selectedEvent.description || "No description available."}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <p>Created: {formatDate(selectedEvent.createdAt)}</p>
                <p>Last updated: {formatDate(selectedEvent.updatedAt)}</p>
              </div>
              <button
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedEvent(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!selectedEvent) return null;

    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div className="bg-white rounded-lg p-6 w-96 shadow-2xl transform transition-all duration-300 ease-out">
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-xl font-semibold text-gray-800">
              Confirm Deletion
            </h3>
          </div>
          <p className="mb-6 text-gray-600">
            Are you sure you want to delete the event{" "}
            <span className="font-medium text-gray-800">
              "{selectedEvent.title}"
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-md font-medium cursor-pointer"
              onClick={() => handleDeleteEvent(selectedEvent._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h1 className="text-2xl font-bold text-gray-800">Manage Events</h1>
            <p className="text-gray-600 mt-1">
              View, publish, and manage all events in the system
            </p>
          </div>

          {/* User role check */}
          {user?.role !== "admin" && (
            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="mr-2" size={20} />
                <p>
                  You need admin privileges to manage events. Current role:{" "}
                  {user?.role || "unknown"}
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={filterPublished}
                  onChange={(e) => setFilterPublished(e.target.value)}
                >
                  <option value="all">All Events</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
                <Filter
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
              </div>

              {/* Refresh */}
              <button
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={fetchEvents}
                disabled={loading}
              >
                <RefreshCw
                  className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
                  size={20}
                />
              </button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : currentEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No events found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentEvents.map((event) => (
                  <div
                    key={event._id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="relative h-48 bg-gray-300">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
                          <Calendar className="text-white" size={36} />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.isPublished
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {event.isPublished ? (
                            <>
                              <CheckCircle className="mr-1" size={12} />
                              Published
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1" size={12} />
                              Not Published
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1.5 line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {truncateText(
                          event.description || "No description available",
                          100
                        )}
                      </p>

                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <Calendar className="mr-1" size={14} />
                        <span>{formatDate(event.date)}</span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock className="mr-1" size={14} />
                          <span>{formatTime(event.time)}</span>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {event.price ? `$${event.price}` : "Free"}
                        </div>
                      </div>

                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin className="mr-1" size={14} />
                        <span className="truncate">
                          {event.location || "Not specified"}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <Users className="mr-1" size={14} />
                        <span>
                          {event.ticketsAvailable || 0} tickets available
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsViewModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                            onClick={() => handleEditEvent(event)}
                            title="Edit Event"
                          >
                            <Edit size={18} />
                          </button>
                          
                          <button 
                            onClick={() => handleBookSeats(event._id)}
                            className="p-2 cursor-pointer text-green-500 hover:bg-green-50 rounded-full transition-colors duration-200"
                            title="Book Seats for Personal Guests"
                          >
                            <Users size={18} />
                          </button>
                          
                          <button 
                            onClick={() => handleManageCoupons(event._id)}
                            className="p-2 cursor-pointer text-purple-500 hover:bg-purple-50 rounded-full transition-colors duration-200"
                            title="Manage Coupons for this Event"
                          >
                            <Ticket size={18} />
                          </button>
                          
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Event"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <button
                          onClick={() => togglePublish(event._id, event.isPublished)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                            event.isPublished
                              ? "bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md"
                              : "bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md"
                          }`}
                          title={
                            event.isPublished
                              ? "Make event private"
                              : "Publish event to public"
                          }
                        >
                          {event.isPublished ? (
                            <>
                              <Lock size={16} />
                              {/* <span>Private</span> */}
                            </>
                          ) : (
                            <>
                              <Globe size={16} />
                              {/* <span>Publish</span> */}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredEvents.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstEvent + 1} to{" "}
                {Math.min(indexOfLastEvent, filteredEvents.length)} of{" "}
                {filteredEvents.length} events
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsisBefore =
                      index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter =
                      index < array.length - 1 && array[index + 1] !== page + 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-3 py-1 text-gray-500">...</span>
                        )}
                        <button
                          className={`px-3 py-1 rounded-md cursor-pointer ${
                            currentPage === page
                              ? "bg-blue-500 text-white"
                              : "border border-gray-300 text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                        {showEllipsisAfter && (
                          <span className="px-3 py-1 text-gray-500">...</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isViewModalOpen && <ViewEventModal />}
      {isEditModalOpen && (
        <EditEventModal 
          selectedEvent={selectedEvent}
          editFormData={editFormData}
          handleInputChange={handleInputChange}
          handleEditSubmit={handleEditSubmit}
          setIsEditModalOpen={setIsEditModalOpen}
          setSelectedEvent={setSelectedEvent}
        />
      )}
      {isDeleteModalOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default ManageEvents;