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
  const [groupedBookings, setGroupedBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [seatToCancel, setSeatToCancel] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [cancellingIds, setCancellingIds] = useState(new Set());

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

  // Group bookings when they change
  useEffect(() => {
    if (bookings.length > 0) {
      groupBookingsByEvent();
    }
  }, [bookings]);

  // Filter bookings when search term or filter changes
  useEffect(() => {
    filterBookings();
  }, [groupedBookings, searchTerm, statusFilter]);

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

  // Group bookings by event
  const groupBookingsByEvent = () => {
    const grouped = {};

    bookings.forEach((booking) => {
      const eventId = booking.eventId?._id || booking.eventId;
      const eventTitle =
        booking.eventId?.title || `Event ${String(eventId).slice(-8)}`;
      const eventDate = booking.eventId?.date;

      if (!grouped[eventId]) {
        grouped[eventId] = {
          eventId: eventId,
          eventTitle: eventTitle,
          eventDate: eventDate,
          bookings: [],
          totalSeats: 0,
          totalAmount: 0,
        };
      }

      grouped[eventId].bookings.push(booking);
      grouped[eventId].totalSeats += booking.seats?.length || 0;
      grouped[eventId].totalAmount += booking.totalAmount || 0;
    });

    setGroupedBookings(grouped);

    // Auto-expand if only one event
    if (Object.keys(grouped).length === 1) {
      setExpandedEvents(new Set([Object.keys(grouped)[0]]));
    }
  };

  // Function to filter bookings based on search and status
  const filterBookings = () => {
    let filtered = { ...groupedBookings };

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filtered).forEach((eventId) => {
        const eventGroup = filtered[eventId];
        eventGroup.bookings = eventGroup.bookings.filter(
          (booking) =>
            // Order ID (top-level _id)
            booking._id.toLowerCase().includes(searchLower) ||
            // Booking ID
            booking.bookingId?.toLowerCase().includes(searchLower) ||
            // Event name/title
            eventGroup.eventTitle.toLowerCase().includes(searchLower) ||
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

        // Remove events with no matching bookings
        if (eventGroup.bookings.length === 0) {
          delete filtered[eventId];
        } else {
          // Recalculate totals for filtered bookings
          eventGroup.totalSeats = eventGroup.bookings.reduce(
            (sum, booking) => sum + (booking.seats?.length || 0),
            0
          );
          eventGroup.totalAmount = eventGroup.bookings.reduce(
            (sum, booking) => sum + (booking.totalAmount || 0),
            0
          );
        }
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      Object.keys(filtered).forEach((eventId) => {
        const eventGroup = filtered[eventId];
        eventGroup.bookings = eventGroup.bookings.filter((booking) => {
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

        // Remove events with no matching bookings
        if (eventGroup.bookings.length === 0) {
          delete filtered[eventId];
        } else {
          // Recalculate totals for filtered bookings
          eventGroup.totalSeats = eventGroup.bookings.reduce(
            (sum, booking) => sum + (booking.seats?.length || 0),
            0
          );
          eventGroup.totalAmount = eventGroup.bookings.reduce(
            (sum, booking) => sum + (booking.totalAmount || 0),
            0
          );
        }
      });
    }

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Function to cancel a single seat/ticket using the refund API
  const cancelSingleTicket = async (booking, seat) => {
    const cancelId = `${booking._id}-${seat._id || seat.seatNumber}`;
    setCancellingIds((prev) => new Set(prev).add(cancelId));
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

      console.log("=== DEBUGGING CANCEL SINGLE TICKET ===");
      console.log("Full booking object:", booking);
      console.log("Seat to cancel:", seat);
      console.log("Order ID (booking._id):", booking._id);

      // Validate that we have required data
      if (!booking._id) {
        throw new Error(
          "Order ID (_id) is missing. Cannot process cancellation for this booking."
        );
      }

      if (!seat) {
        throw new Error(
          "Seat information is missing. Cannot process cancellation for this ticket."
        );
      }

      // Prepare request body with orderId and seat details
      const requestBody = {
        orderId: String(booking._id),
        seatToCancel: {
          section: String(seat.section),
          row: String(seat.row),
          seatNumber: Number(seat.seatNumber),
          price: Number(seat.price || 0),
        },
      };

      console.log("=== REQUEST BODY DETAILS ===");
      console.log("Full request body:", requestBody);

      // Call the refund API
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
        let errorMessage = "Unknown error";

        if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }

        // Provide more user-friendly error messages
        if (
          errorMessage.includes("does not have a successful charge to refund")
        ) {
          throw new Error(
            "This payment cannot be refunded. The payment may not have been completed successfully, or it may have already been refunded."
          );
        } else if (errorMessage.includes("PaymentIntent")) {
          throw new Error(
            "Payment processing error: " +
              errorMessage +
              ". Please check the payment details in Stripe."
          );
        } else {
          throw new Error(
            `Failed to cancel ticket: ${errorMessage} (Status: ${response.status})`
          );
        }
      }

      // If cancellation was successful
      console.log("Ticket cancelled successfully - updating booking state...");

      // Update the booking state to remove the cancelled seat
      setBookings(
        (prevBookings) =>
          prevBookings
            .map((b) => {
              if (b._id === booking._id) {
                const updatedSeats = b.seats.filter(
                  (s) =>
                    !(
                      s.section === seat.section &&
                      s.row === seat.row &&
                      s.seatNumber === seat.seatNumber
                    )
                );

                // If no seats left, remove the entire booking
                if (updatedSeats.length === 0) {
                  return null;
                }

                // Otherwise, update the booking with remaining seats and recalculate total
                const newTotalAmount = updatedSeats.reduce(
                  (sum, s) => sum + (s.price || 0),
                  0
                );
                return {
                  ...b,
                  seats: updatedSeats,
                  totalAmount: newTotalAmount,
                  quantity: updatedSeats.length,
                };
              }
              return b;
            })
            .filter(Boolean) // Remove null entries (fully cancelled bookings)
      );

      setShowCancelModal(false);
      setBookingToCancel(null);
      setSeatToCancel(null);

      // Refresh bookings to get most up-to-date data
      setTimeout(() => {
        fetchBookings();
      }, 500);
    } catch (err) {
      console.error("=== CANCEL TICKET ERROR ===");
      console.error("Error details:", err);
      setError(`Failed to cancel ticket: ${err.message}`);
    } finally {
      setCancellingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cancelId);
        return newSet;
      });
    }
  };

  // Show cancel confirmation for individual seat
  const showCancelConfirmation = (booking, seat) => {
    console.log("=== SHOWING CANCEL CONFIRMATION ===");
    console.log("Booking to cancel:", booking);
    console.log("Seat to cancel:", seat);

    // Validate if booking can be cancelled
    if (booking.paymentStatus !== "success") {
      setError(
        `Cannot cancel this ticket: Payment status is "${booking.paymentStatus}". Only successfully paid tickets can be cancelled.`
      );
      return;
    }

    if (booking.status !== "success") {
      setError(
        `Cannot cancel this ticket: Order status is "${booking.status}". Only successful orders can be cancelled.`
      );
      return;
    }

    if (booking.ticketStatus === "used") {
      setError(
        `Cannot cancel this ticket: Ticket has already been used. Used tickets cannot be refunded.`
      );
      return;
    }

    if (!booking.paymentIntentId) {
      setError(
        `Cannot cancel this ticket: No payment information found. This order may not have been processed through Stripe.`
      );
      return;
    }

    setBookingToCancel(booking);
    setSeatToCancel(seat);
    setShowCancelModal(true);
  };

  // Function to close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setBookingToCancel(null);
    setSeatToCancel(null);
  };

  // Toggle event expansion
  const toggleEventExpansion = (eventId) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Get total stats
  const getTotalStats = () => {
    const events = Object.keys(filteredBookings).length;
    const totalSeats = Object.values(filteredBookings).reduce(
      (sum, event) => sum + event.totalSeats,
      0
    );
    const totalAmount = Object.values(filteredBookings).reduce(
      (sum, event) => sum + event.totalAmount,
      0
    );
    return { events, totalSeats, totalAmount };
  };

  // Format section name
  const formatSectionName = (sectionId) => {
    return String(sectionId)
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-lg text-gray-400">
              Loading bookings...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4 rounded-xl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30 mb-6">
          <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-center">
              Admin - Cancel Tickets
            </h1>
            <p className="text-center text-orange-200 mt-2">
              Manage and cancel individual tickets with automatic refunds
            </p>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <XCircle size={20} className="mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by buyer name, order ID, event name, payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
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

            {/* Refresh Button */}
            <button
              onClick={fetchBookings}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <RefreshCw size={20} />
              )}
              <span className="ml-2">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {Object.keys(filteredBookings).length > 0 && (
          <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {stats.events}
                  </div>
                  <div className="text-sm text-gray-400">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {stats.totalSeats}
                  </div>
                  <div className="text-sm text-gray-400">Total Tickets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    ${stats.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Total Value</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {Object.keys(filteredBookings).length === 0 ? (
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 text-gray-400 mb-4">
                  <Ticket className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No Active Bookings Found
                </h3>
                <p className="text-gray-400 mb-6">
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
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <RefreshCw size={16} />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Event-wise Bookings
            Object.entries(filteredBookings).map(([eventId, eventData]) => (
              <div
                key={eventId}
                className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700"
              >
                {/* Event Header */}
                <div
                  className="bg-gradient-to-r from-purple-800 to-purple-600 p-4 cursor-pointer hover:from-purple-700 hover:to-purple-500 transition-all"
                  onClick={() => toggleEventExpansion(eventId)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {eventData.eventTitle}
                      </h3>
                      <div className="flex flex-col space-y-1">
                        <p className="text-purple-200 text-sm">
                          {eventData.totalSeats} ticket
                          {eventData.totalSeats !== 1 ? "s" : ""} •{" "}
                          {eventData.bookings.length} order
                          {eventData.bookings.length !== 1 ? "s" : ""} • $
                          {eventData.totalAmount.toFixed(2)}
                        </p>
                        {eventData.eventDate && (
                          <p className="text-purple-300 text-xs">
                            📅 {formatDate(eventData.eventDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-200 text-sm mr-2">
                        {expandedEvents.has(eventId) ? "Collapse" : "Expand"}
                      </span>
                      <svg
                        className={`w-6 h-6 text-purple-200 transform transition-transform ${
                          expandedEvents.has(eventId) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Event Content */}
                {expandedEvents.has(eventId) && (
                  <div className="p-6">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full table-auto">
                        <thead>
                          <tr className="bg-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Order Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Buyer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Seat Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {eventData.bookings.map((booking) =>
                            booking.seats?.map((seat, seatIndex) => {
                              const cancelId = `${booking._id}-${
                                seat._id || seat.seatNumber
                              }`;
                              const isCancelling = cancellingIds.has(cancelId);

                              return (
                                <tr
                                  key={`${booking._id}-${
                                    seat._id || seatIndex
                                  }`}
                                  className="hover:bg-gray-700 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <div className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                                      {booking._id.slice(-8)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <div className="font-medium">
                                      {booking.buyerId?.name || "Unknown"}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {booking.buyerId?.email || "No email"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <div className="flex items-center">
                                      <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold mr-2">
                                        {seat.row}
                                        {seat.seatNumber}
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {formatSectionName(seat.section)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          Row {seat.row}, Seat {seat.seatNumber}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <div className="font-bold text-green-400 text-lg">
                                      ${seat.price?.toFixed(2) || "0.00"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Active
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                      onClick={() =>
                                        showCancelConfirmation(booking, seat)
                                      }
                                      disabled={isCancelling}
                                      className={`${
                                        isCancelling
                                          ? "bg-gray-600 cursor-not-allowed"
                                          : "bg-red-600 hover:bg-red-700"
                                      } text-white px-3 py-1 rounded text-xs transition-colors`}
                                    >
                                      {isCancelling ? (
                                        <div className="flex items-center">
                                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                          Cancelling...
                                        </div>
                                      ) : (
                                        "Cancel Ticket"
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {eventData.bookings.map((booking) =>
                        booking.seats?.map((seat, seatIndex) => {
                          const cancelId = `${booking._id}-${
                            seat._id || seat.seatNumber
                          }`;
                          const isCancelling = cancellingIds.has(cancelId);

                          return (
                            <div
                              key={`${booking._id}-${seat._id || seatIndex}`}
                              className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="text-sm text-gray-400">
                                    Order ID
                                  </div>
                                  <div className="font-mono text-xs bg-gray-600 px-2 py-1 rounded inline-block">
                                    {booking._id.slice(-8)}
                                  </div>
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </span>
                              </div>

                              <div className="mb-3">
                                <div className="text-sm text-gray-400">
                                  Buyer
                                </div>
                                <div className="font-medium">
                                  {booking.buyerId?.name || "Unknown"}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {booking.buyerId?.email || "No email"}
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="text-sm text-gray-400">
                                  Seat Details
                                </div>
                                <div className="flex items-center">
                                  <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold mr-2">
                                    {seat.row}
                                    {seat.seatNumber}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {formatSectionName(seat.section)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Row {seat.row}, Seat {seat.seatNumber}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-4">
                                <div className="text-sm text-gray-400">
                                  Price
                                </div>
                                <div className="font-bold text-green-400 text-lg">
                                  ${seat.price?.toFixed(2) || "0.00"}
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  showCancelConfirmation(booking, seat)
                                }
                                disabled={isCancelling}
                                className={`w-full ${
                                  isCancelling
                                    ? "bg-gray-600 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700"
                                } text-white py-2 rounded transition-colors`}
                              >
                                {isCancelling ? (
                                  <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                                    Cancelling...
                                  </div>
                                ) : (
                                  "Cancel Ticket"
                                )}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && bookingToCancel && seatToCancel && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-700">
              {/* Modal header */}
              <div className="bg-gradient-to-r from-red-800 to-red-600 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Cancel Ticket
                </h3>
                <button
                  onClick={closeCancelModal}
                  className="text-white hover:text-red-200 cursor-pointer transition-colors"
                  disabled={cancelLoading}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal content */}
              <div className="p-4 text-white overflow-y-auto max-h-[calc(90vh-120px)]">
                <p className="text-sm text-gray-300 mb-4">
                  Are you sure you want to cancel this ticket and process a
                  refund?
                </p>

                <div className="bg-gray-700 p-3 rounded-lg mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Order ID:</span>
                    <span className="text-xs font-medium text-white">
                      ...{bookingToCancel._id?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Buyer:</span>
                    <span className="text-xs font-medium text-white">
                      {bookingToCancel.buyerId?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Event:</span>
                    <span className="text-xs font-medium text-white">
                      {bookingToCancel.eventId?.title || "Unknown Event"}
                    </span>
                  </div>
                </div>

                {/* Specific ticket details */}
                <div className="bg-gray-600 p-3 rounded-lg mb-3">
                  <div className="text-sm font-medium text-white mb-2">
                    Ticket Details:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Section:</span>
                      <div className="font-semibold text-white">
                        {formatSectionName(seatToCancel.section)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Row:</span>
                      <div className="font-semibold text-white">
                        {seatToCancel.row}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Seat:</span>
                      <div className="font-semibold text-white">
                        {seatToCancel.seatNumber}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Price:</span>
                      <div className="font-bold text-green-400">
                        ${seatToCancel.price?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-900 bg-opacity-30 p-3 rounded-lg mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">
                      Refund Amount:
                    </span>
                    <span className="text-lg font-bold text-green-400">
                      ${seatToCancel.price?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>

                {/* Show remaining tickets info */}
                {bookingToCancel.seats && bookingToCancel.seats.length > 1 && (
                  <div className="bg-blue-900 bg-opacity-30 p-3 rounded-lg mb-3">
                    <div className="text-xs text-blue-200">
                      <strong>Note:</strong> This order has{" "}
                      {bookingToCancel.seats.length} tickets. After cancelling,{" "}
                      {bookingToCancel.seats.length - 1} ticket(s) will remain
                      active.
                    </div>
                  </div>
                )}

                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-3 rounded-lg mb-4">
                  <div className="flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-yellow-400 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs font-medium text-yellow-300 mb-1">
                        Important Notice
                      </p>
                      <p className="text-xs text-yellow-200">
                        This will process a partial refund to the original
                        payment method. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={closeCancelModal}
                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors text-sm"
                    disabled={cancelLoading}
                  >
                    Keep Ticket
                  </button>
                  <button
                    onClick={() => {
                      setCancelLoading(true);
                      cancelSingleTicket(bookingToCancel, seatToCancel).finally(
                        () => {
                          setCancelLoading(false);
                        }
                      );
                    }}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 ${
                      cancelLoading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg cursor-pointer"
                    } text-white rounded-lg transition-all text-sm`}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <X size={16} />
                    )}
                    {cancelLoading ? "Processing..." : "Cancel & Refund"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCancelTickets;
