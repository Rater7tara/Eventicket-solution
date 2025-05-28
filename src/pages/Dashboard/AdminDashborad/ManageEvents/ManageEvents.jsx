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
  Edit,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Users,
  Globe,
  CircleSlash,
  Save,
  X,
} from "lucide-react";
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";

// Add these styles to your global CSS or component
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

const ManageEvents = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublished, setFilterPublished] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(6);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Add state for edit modal
  const [isPublishingEvent, setIsPublishingEvent] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    image: "",
    price: 0,
    ticketsAvailable: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Get auth headers
      const authHeaders = getAuthHeaders();

      // Make API request with auth headers
      const response = await axios.get(
        `${serverURL.url}admin/events`,
        authHeaders
      );

      console.log("Events API response:", response.data);

      // Updated to access data from the correct property in the response
      setEvents(response.data.data || []);
      setTotalEvents(response.data.data?.length || 0);
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

  // Handle event update
  // const handleUpdateEvent = async (e) => {
  //   e.preventDefault();
  //   if (!selectedEvent) return;

  //   setIsSubmitting(true);
  //   try {
  //     // Construct the update URL based on the format you provided
  //     const updateUrl = `${serverURL.url}event/update/${selectedEvent._id}`;
  //     console.log("Updating event at:", updateUrl);

  //     // Make sure the request body matches exactly the example you provided
  //     const updateData = {
  //       title: editFormData.title,
  //       description: editFormData.description,
  //       date: editFormData.date,
  //       time: editFormData.time,
  //       location: editFormData.location,
  //       image: editFormData.image,
  //       price: Number(editFormData.price),
  //       ticketsAvailable: Number(editFormData.ticketsAvailable),
  //     };

  //     console.log("Update payload:", updateData);

  //     const response = await axios.put(updateUrl, updateData, getAuthHeaders());

  //     console.log("Update API response:", response.data);

  //     toast.success("Event updated successfully!");

  //     // Refresh the events list
  //     fetchEvents();

  //     // Close the modal
  //     setIsEditModalOpen(false);
  //     setSelectedEvent(null);
  //   } catch (err) {
  //     console.error("Error updating event:", err);
  //     toast.error(
  //       err.response?.data?.message ||
  //         `Update failed with status ${err.response?.status || "unknown"}`
  //     );

  //     console.log("Error details:", {
  //       endpoint: `${serverURL.url}event/update/${selectedEvent._id}`,
  //       status: err.response?.status,
  //       message: err.message,
  //       responseData: err.response?.data,
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

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
        fetchEvents(); // Make sure this function is available in your scope
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

  // Open edit modal and populate form with event data
  const openEditModal = (event) => {
    setSelectedEvent(event);

    // Format the date properly for the date input (YYYY-MM-DD)
    const formattedDate = event.date
      ? new Date(event.date).toISOString().split("T")[0]
      : "";

    // Make sure we're setting all expected fields from the API example
    setEditFormData({
      title: event.title || "",
      description: event.description || "",
      date: formattedDate,
      time: event.time || "",
      location: event.location || "",
      image: event.image || "",
      price: event.price || 0,
      ticketsAvailable: event.ticketsAvailable || 0,
      // Add any other fields that might be required by your API
    });

    setIsEditModalOpen(true);
    console.log("Opening edit modal for event:", event._id);
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    // Handle different time formats
    try {
      // If it's already in 12-hour format, return as is
      if (
        timeString.toLowerCase().includes("am") ||
        timeString.toLowerCase().includes("pm")
      ) {
        return timeString;
      }

      // Convert 24-hour format to 12-hour format
      const [hours, minutes] = timeString.split(":");
      const hour24 = parseInt(hours, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? "PM" : "AM";

      return `${hour12}:${minutes || "00"} ${ampm}`;
    } catch (error) {
      return timeString; // Return original if parsing fails
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
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{ animation: "fadeInUp 0.3s ease-out" }}
        >
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
            <div className="flex items-start space-x-3">
              <Clock className="text-gray-500 mt-1 shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-gray-500">Time</p>
                <p className="text-gray-900">
                  {formatTime(selectedEvent.time)}{" "}
                  {/* Use the new formatTime function */}
                </p>
              </div>
            </div>
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
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start space-x-3">
                <Clock className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-gray-900">
                    {selectedEvent.time || "Not specified"}
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
                    {selectedEvent.price ? `৳${selectedEvent.price}` : "Free"}
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

  // Edit Event Modal
  const EditEventModal = () => {
    if (!selectedEvent) return null;

    return (
      <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{ animation: "fadeInUp 0.3s ease-out" }}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Edit Event</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEvent(null);
              }}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleUpdateEvent} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={editFormData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={editFormData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={editFormData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time
                </label>
                <input
                  id="time"
                  name="time"
                  type="text"
                  value={editFormData.time}
                  onChange={handleInputChange}
                  placeholder="Ex: 18:30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={editFormData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Image URL
                </label>
                <input
                  id="image"
                  name="image"
                  type="text"
                  value={editFormData.image}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price (৳)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  value={editFormData.price}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="ticketsAvailable"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Available Tickets
                </label>
                <input
                  id="ticketsAvailable"
                  name="ticketsAvailable"
                  type="number"
                  value={editFormData.ticketsAvailable}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEvent(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-md font-medium cursor-pointer flex items-center"
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
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!selectedEvent) return null;

    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div
          className="bg-white rounded-lg p-6 w-96 shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{ animation: "fadeInUp 0.3s ease-out" }}
        >
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

                      <div className="flex justify-between mt-auto">
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsViewModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {/* <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            onClick={() => openEditModal(event)}
                            title="Edit Event"
                          >
                            <Edit size={18} />
                          </button> */}
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
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
                          onClick={() =>
                            togglePublish(event._id, event.isPublished)
                          }
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                            event.isPublished
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                          title={
                            event.isPublished
                              ? "Unpublish this event"
                              : "Publish this event"
                          }
                        >
                          {event.isPublished ? "Unpublish" : "Publish"}
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
                    // Show first page, last page, current page, and pages +/- 1 from current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis
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
      {/* {isEditModalOpen && <EditEventModal />} */}
      {isDeleteModalOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default ManageEvents;
