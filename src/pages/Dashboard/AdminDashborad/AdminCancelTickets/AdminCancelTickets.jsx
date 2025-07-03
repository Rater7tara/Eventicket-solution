import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Eye,
  FileText,
  User,
  X,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../../providers/AuthProvider";
import serverURL from "../../../../ServerConfig";
import { useContext, useEffect, useState } from "react";

const API_BASE_URL = serverURL.url;

const AdminCancelTickets = () => {
  const { user, refreshToken } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Function to format time to 12-hour format
  const formatTime = (timeString) => {
    if (!timeString) return "Time TBA";

    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return timeString;
      }

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeString;
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Function to format date and time together
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "TBA";

    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateTimeString;
    }
  };

  // Load bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Filter bookings when search term or filter changes
  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Function to fetch all bookings from admin API
  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if refreshToken function is available
      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      // Get token from localStorage
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Call the admin all bookings API
      const response = await fetch(`${API_BASE_URL}admin/all-bookings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Parse the response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to fetch bookings (Status: ${response.status})`
        );
      }

      // Check if the data structure matches what we expect
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log("Processing bookings:", data.data);

        // Filter out cancelled bookings and only show active ones that can be cancelled
        const activeBookings = data.data.filter(
          (booking) =>
            booking.status !== "cancelled" &&
            booking.status !== "canceled" &&
            booking.ticketStatus !== "cancelled" &&
            booking.ticketStatus !== "canceled" &&
            booking.isUserVisible !== false &&
            // Only show bookings with successful payments that can be refunded
            booking.paymentStatus === "success" &&
            booking.status === "success" &&
            booking.ticketStatus === "unused"
        );

        // Sort bookings by order time (most recent first)
        const sortedBookings = activeBookings.sort((a, b) => {
          const dateA = new Date(a.orderTime || a.createdAt);
          const dateB = new Date(b.orderTime || b.createdAt);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });

        console.log("Active bookings (sorted by most recent):", sortedBookings);
        setBookings(sortedBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(
        `${err.message} Please try refreshing or check your admin permissions.`
      );
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to filter bookings based on search and status
  const filterBookings = () => {
    let filtered = [...bookings];

    // Enhanced Search filter - includes buyer name, booking ID, order ID, event name, and payment ID
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          // Order ID (top-level _id)
          booking._id.toLowerCase().includes(searchLower) ||
          // Booking ID
          booking.bookingId?.toLowerCase().includes(searchLower) ||
          // Event name/title
          booking.eventId?.title?.toLowerCase().includes(searchLower) ||
          // Payment Intent ID
          booking.paymentIntentId?.toLowerCase().includes(searchLower) ||
          // Buyer name (check if buyerId is populated and has name)
          booking.buyerId?.name?.toLowerCase().includes(searchLower) ||
          // Buyer email (additional search option)
          booking.buyerId?.email?.toLowerCase().includes(searchLower) ||
          // Seat details (section and row)
          booking.seats?.some(
            (seat) =>
              seat.section?.toLowerCase().includes(searchLower) ||
              seat.row?.toLowerCase().includes(searchLower)
          )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => {
        switch (statusFilter) {
          case "paid":
            return booking.paymentStatus === "success";
          case "unpaid":
            return booking.paymentStatus !== "success";
          case "success":
            return booking.status === "success";
          case "pending":
            return booking.status === "pending";
          default:
            return true;
        }
      });
    }

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Function to cancel a booking using the refund API
  const cancelBooking = async (booking) => {
    setCancelLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Check if refreshToken function is available
      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      // Get token from localStorage
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      console.log("=== DEBUGGING CANCEL BOOKING ===");
      console.log("Full booking object:", booking);
      console.log("Order ID (booking._id):", booking._id);
      console.log("Booking ID (booking.bookingId):", booking.bookingId);
      console.log("Seats:", booking.seats);

      // Validate that we have required data
      if (!booking._id) {
        throw new Error(
          "Order ID (_id) is missing. Cannot process cancellation for this booking."
        );
      }

      if (!booking.seats || booking.seats.length === 0) {
        throw new Error(
          "Seat information is missing. Cannot process cancellation for this booking."
        );
      }

      // Prepare request body with orderId and seat details (using the correct structure)
      const requestBody = {
        orderId: String(booking._id), // Use the top-level _id as orderId
        seatToCancel: {
          section: String(booking.seats[0].section),
          row: String(booking.seats[0].row),
          seatNumber: Number(booking.seats[0].seatNumber),
          price: Number(booking.seats[0].price || booking.totalAmount || 0),
        },
      };

      console.log("=== REQUEST BODY DETAILS ===");
      console.log("orderId:", requestBody.orderId, "type:", typeof requestBody.orderId);
      console.log("Full request body:", requestBody);
      console.log("Stringified body:", JSON.stringify(requestBody));

      // Call the refund API with the correct endpoint
      const response = await fetch(`${API_BASE_URL}payments/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error(
          `Server returned invalid JSON response (Status: ${response.status})`
        );
      }

      console.log("=== API RESPONSE ===");
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      // Handle the response
      if (!response.ok) {
        // More detailed error handling
        let errorMessage = "Unknown error";

        if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }

        // Log the full error details
        console.error("=== API ERROR DETAILS ===");
        console.error("Status:", response.status);
        console.error("Error message:", errorMessage);
        console.error("Full response data:", data);

        // Provide more user-friendly error messages
        if (errorMessage.includes("does not have a successful charge to refund")) {
          throw new Error(
            "This payment cannot be refunded. The payment may not have been completed successfully, or it may have already been refunded. Please check the payment status in your Stripe dashboard."
          );
        } else if (errorMessage.includes("PaymentIntent")) {
          throw new Error(
            "Payment processing error: " + errorMessage + ". Please check the payment details in Stripe."
          );
        } else {
          throw new Error(
            `Failed to cancel booking: ${errorMessage} (Status: ${response.status})`
          );
        }
      }

      // If cancellation was successful
      console.log("Booking cancelled successfully - removing from state...");

      // Remove the cancelled booking from state
      setBookings((prevBookings) =>
        prevBookings.filter((b) => b._id !== booking._id)
      );

      setShowCancelModal(false);
      setBookingToCancel(null);
      setSuccessMessage(
        `Order ${booking._id} has been successfully cancelled and refunded.`
      );

      // Refresh bookings to get most up-to-date data
      try {
        await fetchBookings();
        console.log("Bookings refreshed successfully after cancellation");
      } catch (refreshError) {
        console.error(
          "Failed to refresh bookings after cancellation:",
          refreshError
        );
      }
    } catch (err) {
      console.error("=== CANCEL BOOKING ERROR ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      setError(`Failed to cancel booking: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Show cancel confirmation with validation
  const showCancelConfirmation = (booking) => {
    console.log("=== SHOWING CANCEL CONFIRMATION ===");
    console.log("Booking to cancel:", booking);
    
    // Validate if booking can be cancelled
    if (booking.paymentStatus !== "success") {
      setError(`Cannot cancel this order: Payment status is "${booking.paymentStatus}". Only successfully paid orders can be cancelled.`);
      return;
    }
    
    if (booking.status !== "success") {
      setError(`Cannot cancel this order: Order status is "${booking.status}". Only successful orders can be cancelled.`);
      return;
    }
    
    if (booking.ticketStatus === "used") {
      setError(`Cannot cancel this order: Ticket has already been used. Used tickets cannot be refunded.`);
      return;
    }
    
    if (!booking.paymentIntentId) {
      setError(`Cannot cancel this order: No payment information found. This order may not have been processed through Stripe.`);
      return;
    }
    
    setBookingToCancel(booking);
    setShowCancelModal(true);
    console.log("Modal state set to true");
  };

  // Function to close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setBookingToCancel(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Function to view booking details
  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
  };

  // Function to close details modal
  const closeDetailsModal = () => {
    setSelectedBooking(null);
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Admin - Cancel Tickets
            </h2>
            <p className="text-gray-600">
              Manage and cancel active bookings with automatic refunds
            </p>
          </div>
          <button
            onClick={fetchBookings}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <RefreshCw size={20} />
            )}
            Refresh Bookings
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-500" />
          {successMessage}
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <XCircle size={20} className="text-red-500" />
          {error}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by buyer name, order ID, booking ID, event name, payment ID, or seat details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="success">Success Status</option>
              <option value="pending">Pending Status</option>
            </select>
            <ChevronDown
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
        </div>

        {/* Results count and sorting info */}
        <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
          <span className="font-medium">
            Showing {currentBookings.length} of {filteredBookings.length} active
            bookings
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Sorted by most recent orders first
          </span>
        </div>
      </div>

      {/* No bookings message */}
      {!loading && filteredBookings.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket size={48} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Active Bookings Found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria to find more bookings."
              : "There are no active bookings that can be cancelled at the moment."}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
            >
              <RefreshCw size={16} />
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Bookings Table */}
      {filteredBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Event Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Seats & Pricing
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Order Details */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900 mb-1">
                          Buyer: {booking.buyerId?.name || "Unknown"}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Order: ...{booking._id?.slice(-8)}
                        </div>
                        {booking.paymentIntentId && (
                          <div className="text-gray-500 text-xs">
                            Payment: ...{booking.paymentIntentId.slice(-8)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Event */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900 mb-1">
                          {booking.eventId?.title || "Unknown Event"}
                        </div>
                        <div className="text-gray-500 text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(booking.eventId?.date)}
                        </div>
                      </div>
                    </td>

                    {/* Seats */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900 mb-1">
                          {booking.seats?.length || 0} seat(s)
                        </div>
                        <div className="text-lg font-bold text-green-600 mb-1">
                          ${booking.totalAmount?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            booking.status === "success"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.status || "Unknown"}
                        </span>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            booking.paymentStatus === "success"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.paymentStatus === "success" ? "Paid" : "Unpaid"}
                        </span>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            booking.ticketStatus === "unused"
                              ? "bg-green-100 text-green-800"
                              : booking.ticketStatus === "used"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.ticketStatus || "Unknown"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => viewBookingDetails(booking)}
                          className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        {/* Only show cancel button for refundable bookings */}
                        {booking.paymentStatus === "success" && 
                         booking.status === "success" && 
                         booking.ticketStatus === "unused" && 
                         booking.paymentIntentId ? (
                          <button
                            onClick={() => {
                              console.log("=== CANCEL BUTTON CLICKED ===");
                              console.log("Booking:", booking);
                              showCancelConfirmation(booking);
                            }}
                            className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs hover:bg-red-100 transition-colors cursor-pointer"
                            disabled={cancelLoading}
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1 bg-gray-50 text-gray-400 px-3 py-2 rounded-lg text-xs cursor-not-allowed"
                            disabled={true}
                            title={`Cannot cancel: ${
                              booking.paymentStatus !== "success" ? "Payment not successful" :
                              booking.status !== "success" ? "Order not successful" :
                              booking.ticketStatus !== "unused" ? "Ticket already used" :
                              !booking.paymentIntentId ? "No payment information" :
                              "Not refundable"
                            }`}
                          >
                            <X size={14} />
                            Cannot Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredBookings.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredBookings.length}</span>{" "}
                  results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                          currentPage === pageNum
                            ? "bg-red-500 text-white border-red-500"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && bookingToCancel && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <AlertTriangle size={24} />
                Cancel Order & Process Refund
              </h3>
              <button
                onClick={closeCancelModal}
                className="text-white hover:text-red-200 cursor-pointer transition-colors"
                disabled={cancelLoading}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Are you sure you want to cancel this order and process a refund?
                </h4>

                <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order ID:</span>
                    <span className="text-sm font-medium text-gray-800">
                      ...{bookingToCancel._id?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Booking ID:</span>
                    <span className="text-sm font-medium text-gray-800">
                      ...{bookingToCancel.bookingId?.slice(-8) || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Event:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {bookingToCancel.eventId?.title || "Unknown Event"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Event Date:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatDate(bookingToCancel.eventId?.date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Seats:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {bookingToCancel.seats?.length || 0} seat(s)
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm font-semibold text-gray-800">
                      Total Amount:
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ${bookingToCancel.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>

                  {bookingToCancel.seats &&
                    bookingToCancel.seats.length > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <span className="text-sm font-medium text-gray-600">
                          Seat Details:
                        </span>
                        <div className="mt-2 space-y-1">
                          {bookingToCancel.seats.map((seat, index) => (
                            <div
                              key={seat._id || index}
                              className="text-xs text-gray-500 bg-white p-2 rounded"
                            >
                              Section {seat.section}, Row {seat.row}, Seat{" "}
                              {seat.seatNumber} - ${seat.price}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex gap-3">
                    <AlertTriangle
                      size={20}
                      className="text-yellow-600 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        Important Notice
                      </p>
                      <p className="text-sm text-yellow-700">
                        This will cancel the entire order and automatically
                        process a full refund to the original payment method.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeCancelModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  disabled={cancelLoading}
                >
                  Keep Order
                </button>
                <button
                  onClick={() => cancelBooking(bookingToCancel)}
                  className={`inline-flex items-center gap-2 px-6 py-3 ${
                    cancelLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg cursor-pointer"
                  } text-white rounded-lg transition-all`}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <X size={18} />
                  )}
                  {cancelLoading
                    ? "Processing Refund..."
                    : "Yes, Cancel & Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Order Details
                </h3>
                <p className="text-sm text-red-100 mt-1">
                  {selectedBooking.eventId?.title || "Unknown Event"}
                </p>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-white hover:text-red-200 cursor-pointer transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${selectedBooking.totalAmount?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-blue-600">Total Amount</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedBooking.seats?.length || 0}
                  </div>
                  <div className="text-sm text-green-600">Seats Booked</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedBooking.paymentStatus === "success" ? "Paid" : "Unpaid"}
                  </div>
                  <div className="text-sm text-purple-600">Payment Status</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600 capitalize">
                    {selectedBooking.ticketStatus || "Unknown"}
                  </div>
                  <div className="text-sm text-orange-600">Ticket Status</div>
                </div>
              </div>

              {/* Detailed Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Basic Info */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-4 text-lg border-b pb-2">
                    Order Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order ID</p>
                      <p className="font-medium text-gray-800 break-all bg-gray-50 p-2 rounded text-sm">
                        {selectedBooking._id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Booking ID</p>
                      <p className="font-medium text-gray-800 break-all bg-gray-50 p-2 rounded text-sm">
                        {selectedBooking.bookingId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Payment Intent ID
                      </p>
                      <p className="font-medium text-gray-800 break-all bg-gray-50 p-2 rounded text-sm">
                        {selectedBooking.paymentIntentId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order Time</p>
                      <p className="font-medium text-gray-800">
                        {formatDateTime(selectedBooking.orderTime || selectedBooking.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buyer Info */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-4 text-lg border-b pb-2">
                    Buyer Information
                  </h4>
                  <div className="space-y-4">
                    {selectedBooking.buyerId ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Buyer Name
                          </p>
                          <p className="font-medium text-gray-800 flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            {selectedBooking.buyerId.name || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Buyer Email
                          </p>
                          <p className="font-medium text-gray-800 bg-gray-50 p-2 rounded text-sm">
                            {selectedBooking.buyerId.email ||
                              "No email provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Buyer ID</p>
                          <p className="font-medium text-gray-800 break-all bg-gray-50 p-2 rounded text-sm">
                            {selectedBooking.buyerId._id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Seller ID</p>
                          <p className="font-medium text-gray-800 break-all bg-gray-50 p-2 rounded text-sm">
                            {selectedBooking.sellerId || "N/A"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle
                            size={16}
                            className="text-yellow-600"
                          />
                          <p className="text-sm font-medium text-yellow-800">
                            Guest Purchase
                          </p>
                        </div>
                        <p className="text-sm text-yellow-700 mt-2">
                          This order was made without a registered account.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Info */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-4 text-lg border-b pb-2">
                    Event Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Event Title</p>
                      <p className="font-medium text-gray-800">
                        {selectedBooking.eventId?.title || "Unknown Event"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Event Date</p>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {formatDate(selectedBooking.eventId?.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Event ID</p>
                      <p className="font-medium text-gray-800 break-all bg-gray-50 p-2 rounded text-sm">
                        {selectedBooking.eventId?._id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <p className="font-medium text-gray-800">
                        {selectedBooking.quantity || 1} ticket(s)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seats Information */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-700 mb-4 text-lg border-b pb-2">
                  Seat Details
                </h4>
                <div className="bg-gray-50 rounded-xl p-6">
                  {selectedBooking.seats && selectedBooking.seats.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedBooking.seats.map((seat, index) => (
                          <div
                            key={seat._id || index}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Section
                                </p>
                                <p className="font-semibold text-gray-800">
                                  {seat.section}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Row
                                </p>
                                <p className="font-semibold text-gray-800">
                                  {seat.row}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Seat Number
                                </p>
                                <p className="font-semibold text-gray-800">
                                  {seat.seatNumber}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Price
                                </p>
                                <p className="font-bold text-green-600">
                                  ${seat.price?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg">
                          <span className="text-lg font-semibold text-gray-800">
                            Total Amount:
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            ${selectedBooking.totalAmount?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Ticket
                        size={48}
                        className="mx-auto text-gray-400 mb-3"
                      />
                      <p className="text-gray-500">
                        No seat information available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-700 mb-4 text-lg border-b pb-2">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Eye
                      size={20}
                      className={
                        selectedBooking.isUserVisible
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    />
                    <div>
                      <p className="text-sm text-gray-500">User Visible</p>
                      <p className="font-medium text-gray-800">
                        {selectedBooking.isUserVisible ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <DollarSign size={20} className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <p className="font-medium text-gray-800 capitalize">
                        {selectedBooking.paymentStatus || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Ticket size={20} className="text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Ticket Status</p>
                      <p className="font-medium text-gray-800 capitalize">
                        {selectedBooking.ticketStatus || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Close Details
                </button>

                <button
                  onClick={() => {
                    closeDetailsModal();
                    showCancelConfirmation(selectedBooking);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg cursor-pointer text-white rounded-lg transition-all"
                  disabled={cancelLoading}
                >
                  <X size={18} />
                  Cancel This Order & Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCancelTickets;