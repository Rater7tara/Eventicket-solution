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
} from "lucide-react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../../providers/AuthProvider";
import serverURL from "../../../../ServerConfig";
import TicketSyncUtil, { useTicketSync } from "./TicketSyncUtil"; // Import the sync utility
import { useContext, useEffect, useState } from "react";

const API_BASE_URL = serverURL.url;

const CancelTicket = () => {
  const { user, refreshToken } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);

  // Use the ticket sync utility
  const { notifyTicketCancelled, notifyTicketsRefresh, isTicketCancelled } = useTicketSync((event) => {
    if (event.type === 'TICKET_CANCELLED') {
      // Remove the cancelled ticket from local state
      setTickets(prevTickets => 
        prevTickets.filter(t => t._id !== event.ticketId && t.orderId !== event.orderId)
      );
    } else if (event.type === 'TICKETS_REFRESH') {
      // Refresh tickets from server
      fetchTickets();
    }
  });

  // IMPROVED BARCODE GENERATION - Consistent and realistic
  const generateBarcode = (ticketId, seatInfo = "") => {
    // Create a consistent seed from ticketId and seat info
    const baseString = `${ticketId || 'DEFAULT'}${seatInfo || 'SEAT'}`;
    
    // Simple hash function to create consistent number from string
    let hash = 0;
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and create barcode
    const positiveHash = Math.abs(hash);
    const barcodeNumber = positiveHash.toString().padStart(12, '0').substring(0, 12);
    
    return `${barcodeNumber}`;
  };

  // ENHANCED REALISTIC BARCODE COMPONENT
  const BarcodeDisplay = ({ ticketId, seatInfo, isCancelled = false, size = "normal" }) => {
    const barcodeId = generateBarcode(ticketId, seatInfo);
    const containerHeight = size === "large" ? "h-16" : "h-12";
    
    // Generate REALISTIC Code 128 style barcode pattern
    const generateRealisticBarcode = (data) => {
      const bars = [];
      
      // Start pattern for Code 128
      bars.push({ type: 'bar', width: 2 });
      bars.push({ type: 'space', width: 1 });
      bars.push({ type: 'bar', width: 1 });
      bars.push({ type: 'space', width: 1 });
      bars.push({ type: 'bar', width: 1 });
      bars.push({ type: 'space', width: 1 });
      
      // Data pattern based on barcode ID
      for (let i = 0; i < data.length; i++) {
        const digit = parseInt(data[i]) || 0;
        
        // Create realistic barcode pattern based on digit value
        switch (digit % 4) {
          case 0:
            bars.push({ type: 'bar', width: 1 });
            bars.push({ type: 'space', width: 1 });
            bars.push({ type: 'bar', width: 3 });
            bars.push({ type: 'space', width: 2 });
            break;
          case 1:
            bars.push({ type: 'bar', width: 2 });
            bars.push({ type: 'space', width: 1 });
            bars.push({ type: 'bar', width: 1 });
            bars.push({ type: 'space', width: 3 });
            break;
          case 2:
            bars.push({ type: 'bar', width: 1 });
            bars.push({ type: 'space', width: 2 });
            bars.push({ type: 'bar', width: 2 });
            bars.push({ type: 'space', width: 1 });
            break;
          case 3:
            bars.push({ type: 'bar', width: 3 });
            bars.push({ type: 'space', width: 1 });
            bars.push({ type: 'bar', width: 1 });
            bars.push({ type: 'space', width: 2 });
            break;
        }
      }
      
      // End pattern for Code 128
      bars.push({ type: 'bar', width: 2 });
      bars.push({ type: 'space', width: 1 });
      bars.push({ type: 'bar', width: 1 });
      bars.push({ type: 'space', width: 1 });
      bars.push({ type: 'bar', width: 1 });
      bars.push({ type: 'space', width: 1 });
      bars.push({ type: 'bar', width: 2 });
      
      return bars;
    };
    
    const barPattern = generateRealisticBarcode(barcodeId);
    
    return (
      <div className="text-center">
        <div className={`bg-white p-3 rounded border ${containerHeight} flex items-center justify-center shadow-sm`}>
          <div className="flex items-end">
            {barPattern.map((element, i) => {
              if (element.type === 'space') {
                return <div key={i} style={{ width: `${element.width}px` }} />;
              }
              
              const height = size === "large" ? 45 : 35;
              
              return (
                <div
                  key={i}
                  className={`${isCancelled ? "bg-gray-400" : "bg-black"}`}
                  style={{ 
                    width: `${element.width}px`, 
                    height: `${height}px`
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className={`text-center ${size === "large" ? "text-sm" : "text-xs"} mt-2 font-mono tracking-wider ${
          isCancelled ? "text-gray-400" : "text-gray-700"
        }`}>
          {barcodeId}
        </div>
      </div>
    );
  };

  // Function to format time to 12-hour format
  const formatTime = (timeString) => {
    if (!timeString) return "Time TBA";

    try {
      // Handle different time formats
      let date;

      // If it's a full datetime string
      if (timeString.includes("T") || timeString.includes(" ")) {
        date = new Date(timeString);
      } else {
        // If it's just a time string (HH:MM format)
        const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
        const match = timeString.match(timeRegex);

        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          date = new Date();
          date.setHours(hours, minutes, 0, 0);
        } else {
          // Try to parse as date
          date = new Date(timeString);
        }
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return timeString; // Return original if can't parse
      }

      // Format to 12-hour time
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeString; // Return original if error
    }
  };

  // Function to safely parse localStorage data
  const safelyParseJSON = (jsonString, defaultValue = []) => {
    try {
      if (!jsonString) return defaultValue;
      const parsed = JSON.parse(jsonString);
      return parsed || defaultValue;
    } catch (err) {
      console.error("JSON parsing error:", err);
      return defaultValue;
    }
  };

  // Function to fetch event details by eventId
  const fetchEventDetails = async (eventId) => {
    try {
      const token = localStorage.getItem("auth-token");

      console.log(`Fetching event details for eventId: ${eventId}`);

      const response = await fetch(`${API_BASE_URL}event/events/${eventId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`Event API response status: ${response.status}`);

      if (response.ok) {
        const eventData = await response.json();
        console.log("Event API response data:", eventData);

        // Handle your specific API response structure
        let event = null;

        if (eventData.success && eventData.event) {
          // Your API structure: { success: true, message: "...", event: { ... } }
          event = eventData.event;
        } else if (eventData.data) {
          // Fallback: { data: { ... } }
          event = eventData.data;
        } else if (eventData.success === false) {
          // Handle API error response
          console.error("API returned error:", eventData.message);
          throw new Error(eventData.message || "Event not found");
        } else {
          // Direct event object
          event = eventData;
        }

        if (event && event.title) {
          console.log("Successfully fetched event:", event);
          return {
            title: event.title,
            name: event.title, // Use title as name as well
            date: event.date,
            time: event.time,
            location: event.location,
            venue: event.location, // Use location as venue
            description: event.description || "No description available",
            price: event.price,
            image: event.image,
            _id: event._id || eventId,
            sellerId: event.sellerId,
            ticketsAvailable: event.ticketsAvailable,
            ticketSold: event.ticketSold,
          };
        } else {
          console.warn("Event data structure unexpected:", event);
          throw new Error("Invalid event data structure - no title found");
        }
      } else {
        console.error(`API request failed with status: ${response.status}`);
        const errorData = await response.text();
        console.error("Error response:", errorData);
        throw new Error(`Failed to fetch event: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);

      // Return fallback data with event ID only as last resort
      return {
        title: `Event ${eventId.substring(0, 8)}...`,
        name: `Event ${eventId.substring(0, 8)}...`,
        date: null,
        time: "19:00",
        location: "Venue information unavailable",
        venue: "Venue information unavailable",
        description: `Unable to load event details: ${error.message}`,
        _id: eventId,
        error: true,
      };
    }
  };

  // Helper function to get ticket price with fallbacks
  const getTicketPrice = (ticket) => {
    // Try multiple price fields in order of preference
    const priceFields = [
      ticket.grandTotal,
      ticket.totalPrice,
      ticket.seat?.price,
      ticket.rawOrderData?.totalAmount,
      ticket.rawOrderData?.amount,
      ticket.rawOrderData?.price,
      ticket.rawOrderData?.total,
      ticket.rawOrderData?.cost
    ];
    
    for (const price of priceFields) {
      if (price && price > 0) {
        return parseFloat(price);
      }
    }
    
    // If no valid price found, try to calculate from order total and seat count
    if (ticket.rawOrderData?.totalAmount && ticket.rawOrderData?.seats?.length > 0) {
      return parseFloat(ticket.rawOrderData.totalAmount) / ticket.rawOrderData.seats.length;
    }
    
    return 0;
  };

  // Load tickets when component mounts
  useEffect(() => {
    fetchTickets();
  }, [user]);

  // Function to fetch tickets from API - only NON-CANCELLED tickets
  const fetchTickets = async () => {
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

      // Call the purchased tickets API
      const response = await fetch(`${API_BASE_URL}orders/my-orders`, {
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
          data.message || `Failed to fetch tickets (Status: ${response.status})`
        );
      }

      // Check if the data structure matches what we expect
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log("Processing orders:", data.data);

        // Convert orders to individual tickets
        const individualTickets = convertOrdersToIndividualTickets(data.data);

        // Filter tickets using multiple methods
        const activeTickets = individualTickets.filter(ticket => {
          // Check local cancelled list first
          if (isTicketCancelled(ticket._id, ticket.orderId)) {
            console.log(`Ticket ${ticket._id} found in local cancelled list`);
            return false;
          }

          // Multiple checks to ensure ticket is truly active
          const isDefinitelyActive = !ticket.isCancelled && 
                                   ticket.rawOrderData?.status !== "cancelled" &&
                                   ticket.rawOrderData?.status !== "canceled" &&
                                   ticket.rawOrderData?.paymentStatus !== "cancelled" &&
                                   ticket.rawOrderData?.paymentStatus !== "canceled" &&
                                   ticket.rawOrderData?.paymentStatus !== "refunded" &&
                                   !ticket.rawOrderData?.cancellationDate &&
                                   !ticket.rawOrderData?.cancelledAt;
          
          console.log(`Ticket ${ticket._id}: isCancelled=${ticket.isCancelled}, status=${ticket.rawOrderData?.status}, paymentStatus=${ticket.rawOrderData?.paymentStatus}, isActive=${isDefinitelyActive}`);
          
          return isDefinitelyActive;
        });

        console.log("Active tickets after strict filtering:", activeTickets);

        // If no active tickets, set empty array and return
        if (activeTickets.length === 0) {
          setTickets([]);
          setLoading(false);
          return;
        }

        // Fetch event details for each unique event
        const uniqueEventIds = [...new Set(activeTickets.map(ticket => ticket.rawOrderData.eventId).filter(Boolean))];
        const eventDetailsMap = {};

        console.log("Fetching event details for events:", uniqueEventIds);

        for (const eventId of uniqueEventIds) {
          try {
            const eventDetails = await fetchEventDetails(eventId);
            eventDetailsMap[eventId] = eventDetails;
            console.log(`Event details loaded for ${eventId}:`, eventDetails?.title);
          } catch (error) {
            console.error(`Failed to fetch event details for ${eventId}:`, error);
            // Set fallback event data
            eventDetailsMap[eventId] = {
              title: `Event ${eventId.substring(0, 8)}...`,
              date: null,
              time: "19:00", 
              location: "Location TBA",
              description: "Event details unavailable",
              _id: eventId,
              error: true
            };
          }
        }

        // Update tickets with event details
        const ticketsWithEventDetails = activeTickets.map(ticket => {
          const eventId = ticket.rawOrderData.eventId;
          const eventDetails = eventDetailsMap[eventId];

          // Enhanced fallback for missing event details
          let finalEventDetails = eventDetails;
          
          if (!eventDetails || !eventDetails.title) {
            finalEventDetails = {
              title: ticket.rawOrderData.eventTitle || 
                     ticket.rawOrderData.event?.title || 
                     ticket.rawOrderData.event?.name ||
                     `Event ${eventId ? eventId.substring(0, 8) : ticket.originalOrderId.substring(0, 8)}...`,
              date: ticket.rawOrderData.eventDate || 
                    ticket.rawOrderData.event?.date || 
                    ticket.purchaseDate,
              time: ticket.rawOrderData.eventTime || 
                    ticket.rawOrderData.event?.time || 
                    "19:00",
              location: ticket.rawOrderData.eventLocation || 
                       ticket.rawOrderData.event?.location || 
                       ticket.rawOrderData.venue ||
                       "Location TBA",
              description: ticket.rawOrderData.eventDescription || 
                          ticket.rawOrderData.event?.description ||
                          "Event details unavailable",
              _id: eventId,
              fallback: true
            };
          }

          return {
            ...ticket,
            event: finalEventDetails,
          };
        });

        // Sort tickets by purchase date (newest first) - ensure proper date comparison
        const sortedTickets = ticketsWithEventDetails.sort((a, b) => {
          const dateA = new Date(a.purchaseDate || a.createdAt || 0);
          const dateB = new Date(b.purchaseDate || b.createdAt || 0);
          
          // If dates are invalid, put them at the end
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          return dateB.getTime() - dateA.getTime(); // Newest first (descending order)
        });

        console.log("Final formatted individual tickets (active only):", sortedTickets);
        setTickets(sortedTickets);
      } else if (data.success && data.data) {
        // Handle single order response
        const order = data.data;
        console.log("Processing single order:", order);

        const individualTickets = convertOrdersToIndividualTickets([order]);
        
        // STRICT FILTERING for single order too
        const activeTickets = individualTickets.filter(ticket => {
          return !ticket.isCancelled && 
                 ticket.rawOrderData?.status !== "cancelled" &&
                 ticket.rawOrderData?.status !== "canceled" &&
                 ticket.rawOrderData?.paymentStatus !== "cancelled" &&
                 ticket.rawOrderData?.paymentStatus !== "canceled" &&
                 ticket.rawOrderData?.paymentStatus !== "refunded" &&
                 !ticket.rawOrderData?.cancellationDate &&
                 !ticket.rawOrderData?.cancelledAt;
        });

        // Fetch event details if available
        if (order.eventId && activeTickets.length > 0) {
          const eventDetails = await fetchEventDetails(order.eventId);
          activeTickets.forEach(ticket => {
            ticket.event = eventDetails;
          });
        }

        setTickets(activeTickets);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(
        `${err.message} Please try refreshing or check your login status.`
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Enhanced Cancel Ticket Function
  const cancelTicket = async (ticket) => {
    setCancelLoading(true);
    setError("");

    try {
      // Check if ticket is already cancelled
      if (ticket.isCancelled) {
        setError("This ticket has already been cancelled.");
        setShowCancelModal(false);
        setTicketToCancel(null);
        setCancelLoading(false);
        return;
      }

      // Check if refreshToken function is available
      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      // Get token from localStorage
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Get orderId - try different sources
      let orderId = null;
      
      const possibleOrderIds = [
        ticket.originalOrderId,
        ticket.orderId,
        ticket.rawOrderData?._id,
        ticket.rawOrderData?.orderId,
        ticket._id.includes('_seat_') ? ticket._id.split('_seat_')[0] : ticket._id
      ];

      // Find the first valid order ID
      for (const id of possibleOrderIds) {
        if (id && typeof id === 'string' && id.trim() !== '') {
          orderId = id;
          break;
        }
      }

      console.log("Available order ID options:", possibleOrderIds);
      console.log("Using order ID:", orderId);

      // Validate that we have an order ID
      if (!orderId) {
        throw new Error(
          `Order ID is missing. Cannot cancel this ticket. Please contact support with Order ID: ${ticket.originalOrderId || ticket.orderId || 'Unknown'}`
        );
      }

      // Build seatToCancel object from ticket data
      let seatToCancel = null;

      if (ticket.seat && ticket.seat.section && ticket.seat.row && ticket.seat.number) {
        // Try to get the seat _id from rawOrderData
        let seatId = null;
        
        // If we have seat index, try to get the original seat data
        if (ticket.seatIndex !== undefined && ticket.rawOrderData?.seats && ticket.rawOrderData.seats[ticket.seatIndex]) {
          const originalSeat = ticket.rawOrderData.seats[ticket.seatIndex];
          seatId = originalSeat._id || originalSeat.id;
        }

        seatToCancel = {
          section: ticket.seat.section,
          row: ticket.seat.row,
          seatNumber: parseInt(ticket.seat.number),
          price: ticket.seat.price || getTicketPrice(ticket)
        };

        // Add seat _id if available
        if (seatId) {
          seatToCancel._id = seatId;
        }
      } else {
        // For general admission tickets, create a basic seat object
        seatToCancel = {
          section: ticket.seat?.section || "GA",
          row: ticket.seat?.row || "",
          seatNumber: ticket.seat?.number ? parseInt(ticket.seat.number) : 1,
          price: getTicketPrice(ticket)
        };
      }

      // Prepare request body
      const requestBody = {
        orderId: orderId,
        seatToCancel: seatToCancel
      };

      console.log("Cancelling ticket with API structure:", requestBody);

      // Call the cancel API
      const response = await fetch(`${API_BASE_URL}payments/booking/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      let data = await response.json();
      console.log("Cancel API response:", { status: response.status, data });

      // Handle the response
      if (!response.ok) {
        // Check if the error is about booking already being cancelled
        if (response.status === 400 && data.message) {
          const errorMessage = data.message.toLowerCase();

          if (
            errorMessage.includes("already cancelled") ||
            errorMessage.includes("already canceled") ||
            errorMessage.includes("booking already cancelled") ||
            errorMessage.includes("booking already canceled") ||
            errorMessage.includes("not found") ||
            errorMessage.includes("does not exist")
          ) {
            // If booking is already cancelled, immediately remove from state and notify
            console.log("Ticket already cancelled - removing from state and notifying");
            
            // Remove this ticket from state immediately
            setTickets(prevTickets => prevTickets.filter(t => t._id !== ticket._id));
            
            // Notify other components
            notifyTicketCancelled(ticket._id, ticket.orderId || ticket.originalOrderId);
            
            // Also refresh to get fresh data
            try {
              await fetchTickets();
            } catch (refreshError) {
              console.error("Failed to refresh tickets:", refreshError);
            }
            
            setShowCancelModal(false);
            setTicketToCancel(null);
            return;
          }
        }

        // For other errors, provide detailed error message
        throw new Error(
          `Failed to cancel ticket: ${data.message || 'Unknown error'} (Status: ${response.status}). Order ID used: ${orderId}`
        );
      }

      // If cancellation was successful, immediately remove from state and notify other components
      console.log("Ticket cancelled successfully - removing from state and notifying...");
      
      // Immediately remove the cancelled ticket from state
      setTickets(prevTickets => prevTickets.filter(t => t._id !== ticket._id));
      
      // Notify other components about the cancellation
      notifyTicketCancelled(ticket._id, ticket.orderId || ticket.originalOrderId);
      
      // Also refresh to get most up-to-date data from server
      try {
        await fetchTickets();
        console.log("Tickets refreshed successfully after cancellation");
      } catch (refreshError) {
        console.error("Failed to refresh tickets after cancellation:", refreshError);
        // Don't show error since we already removed from state
      }
      
      setShowCancelModal(false);
      setTicketToCancel(null);
      
    } catch (err) {
      console.error("Error cancelling ticket:", err);
      setError(`Failed to cancel ticket: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Show cancel confirmation
  const showCancelConfirmation = (ticket) => {
    // Check if ticket is already cancelled
    if (ticket.isCancelled) {
      setError("This ticket has already been cancelled.");
      return;
    }

    // Check for orderId with multiple fallbacks
    const possibleOrderIds = [
      ticket.originalOrderId,
      ticket.orderId,
      ticket.rawOrderData?._id,
      ticket.rawOrderData?.orderId,
      ticket._id.includes('_seat_') ? ticket._id.split('_seat_')[0] : ticket._id
    ];

    const hasValidOrderId = possibleOrderIds.some(id => id && typeof id === 'string' && id.trim() !== '');

    if (!hasValidOrderId) {
      setError(
        `Cannot cancel this ticket - no valid order ID found. Please contact support with Order ID: ${ticket.originalOrderId || ticket.orderId || 'Unknown'}`
      );
      return;
    }

    // Check if we have valid seat information
    if (!ticket.seat || (!ticket.seat.section && !ticket.seat.name)) {
      setError(
        `Cannot cancel this ticket - seat information is missing. Please contact support with Order ID: ${ticket.originalOrderId || ticket.orderId || 'Unknown'}`
      );
      return;
    }

    setTicketToCancel(ticket);
    setShowCancelModal(true);
  };

  // Convert orders to individual tickets - with ENHANCED cancellation detection
  const convertOrdersToIndividualTickets = (orders) => {
    const individualTickets = [];

    orders.forEach((order) => {
      // ENHANCED CANCELLED STATUS DETECTION - Multiple checks
      const isCancelled =
        order.status === "cancelled" ||
        order.status === "canceled" ||
        order.status === "CANCELLED" ||
        order.status === "CANCELED" ||
        order.paymentStatus === "cancelled" ||
        order.paymentStatus === "canceled" ||
        order.paymentStatus === "CANCELLED" ||
        order.paymentStatus === "CANCELED" ||
        order.paymentStatus === "refunded" ||
        order.paymentStatus === "REFUNDED" ||
        order.paymentStatus === "failed" ||
        order.paymentStatus === "FAILED" ||
        order.orderStatus === "cancelled" ||
        order.orderStatus === "canceled" ||
        order.orderStatus === "CANCELLED" ||
        order.orderStatus === "CANCELED" ||
        order.bookingStatus === "cancelled" ||
        order.bookingStatus === "canceled" ||
        order.bookingStatus === "CANCELLED" ||
        order.bookingStatus === "CANCELED" ||
        order.cancellationDate ||
        order.cancelledAt ||
        order.cancelled_at ||
        order.refundAmount > 0 ||
        order.refund_amount > 0 ||
        order.isRefunded ||
        order.is_refunded ||
        // Additional checks for seat-level cancellation
        (order.seats && order.seats.some(seat => 
          seat.status === "cancelled" || 
          seat.status === "canceled" ||
          seat.isCancelled ||
          seat.is_cancelled
        ));

      // Log the cancellation status for debugging
      console.log(`Order ${order._id} cancellation status:`, {
        isCancelled,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        bookingStatus: order.bookingStatus,
        cancellationDate: order.cancellationDate,
        cancelledAt: order.cancelledAt,
        refundAmount: order.refundAmount
      });

      // SKIP CANCELLED ORDERS ENTIRELY - don't create tickets for them
      if (isCancelled) {
        console.log(`Skipping cancelled order: ${order._id}`);
        return; // Skip this order completely
      }

      // Ensure we capture the booking ID properly
      const ensureBookingId = (order) => {
        return order.bookingId || 
               order._id || 
               order.id || 
               order.orderId || 
               order.booking_id ||
               order.bookingReference ||
               order.transactionId;
      };

      // If there are seats, create individual tickets for each seat
      if (order.seats && order.seats.length > 0) {
        order.seats.forEach((seat, seatIndex) => {
          // Check if this specific seat is cancelled
          const seatCancelled = seat.status === "cancelled" || 
                               seat.status === "canceled" ||
                               seat.isCancelled ||
                               seat.is_cancelled;

          // Skip cancelled seats
          if (seatCancelled) {
            console.log(`Skipping cancelled seat: ${order._id}_seat_${seatIndex}`);
            return;
          }

          // Enhanced price calculation for individual seats
          const seatPrice = seat.price || seat.seatPrice || seat.amount || 
                           (order.totalAmount / order.seats.length) || 
                           order.amount || order.price || 0;
          
          individualTickets.push({
            _id: `${order._id}_seat_${seatIndex}`,
            orderId: order._id,
            bookingId: ensureBookingId(order),
            originalOrderId: order._id,
            seatIndex: seatIndex,
            event: null, // Will be populated later
            seat: {
              section: seat.section,
              row: seat.row,
              number: seat.seatNumber,
              price: seatPrice,
              name: `${seat.section} ${seat.row}${seat.seatNumber}`,
            },
            quantity: 1, // Each ticket is for one seat
            totalPrice: seatPrice,
            grandTotal: seatPrice,
            purchaseDate: order.orderTime || order.createdAt,
            createdAt: order.createdAt,
            paymentStatus: order.paymentStatus || "Unknown",
            isCancelled: false, // We already filtered out cancelled ones
            rawOrderData: order, // Store complete order data for debugging
            userInfo: {
              name:
                user?.name ||
                user?.firstName + " " + user?.lastName ||
                "Guest User",
              email: user?.email || "No email provided",
            },
          });
        });
      } else {
        // If no seats, create a general admission ticket
        const ticketPrice = order.totalAmount || order.amount || order.price || 
                           order.grandTotal || order.total || order.cost || 0;
        
        individualTickets.push({
          _id: order._id,
          orderId: order._id,
          bookingId: ensureBookingId(order),
          originalOrderId: order._id,
          seatIndex: 0,
          event: null, // Will be populated later
          seat: {
            name: "General Admission",
            section: "GA",
            row: "",
            number: "",
            price: ticketPrice,
          },
          quantity: order.quantity || 1,
          totalPrice: ticketPrice,
          grandTotal: ticketPrice,
          purchaseDate: order.orderTime || order.createdAt,
          createdAt: order.createdAt,
          paymentStatus: order.paymentStatus || "Unknown",
          isCancelled: false, // We already filtered out cancelled ones
          rawOrderData: order, // Store complete order data for debugging
          userInfo: {
            name:
              user?.name ||
              user?.firstName + " " + user?.lastName ||
              "Guest User",
            email: user?.email || "No email provided",
          },
        });
      }
    });

    console.log(`Created ${individualTickets.length} active tickets from ${orders.length} orders`);
    return individualTickets;
  };

  // Function to close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setTicketToCancel(null);
  };

  // Function to view ticket details
  const viewTicketDetails = async (ticketId) => {
    setDetailsLoading(true);
    setError("");

    try {
      // Find the ticket in our state
      const localTicket = tickets.find(
        (ticket) => ticket._id === ticketId || ticket.orderId === ticketId
      );

      if (localTicket) {
        setSelectedTicket(localTicket);
        setDetailsLoading(false);
        return;
      }

      // If not found, show error
      throw new Error("Ticket not found in current list");
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      setError(`Failed to load ticket details: ${err.message}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Function to close modal
  const closeModal = () => {
    setSelectedTicket(null);
  };

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cancel Tickets</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchTickets}
            className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
            ) : (
              <RefreshCw size={20} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* No active tickets message */}
      {!loading && tickets.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Ticket size={48} className="mx-auto text-red-500 mb-3" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No Active Tickets Found
          </h3>
          <p className="text-gray-600 mb-6">
            You don't have any active tickets that can be cancelled.
          </p>
          <Link
            to="/dashboard/my-tickets"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Ticket size={18} />
            View All Tickets
          </Link>
        </div>
      )}

      {/* Active Tickets list for cancellation */}
      {tickets.length > 0 && (
        <div className="space-y-4 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              <p className="text-yellow-800 font-medium">
                Important: Only active tickets are shown here. Once cancelled, tickets cannot be recovered.
              </p>
            </div>
          </div>

          {tickets.map((ticket, index) => (
            <div
              key={ticket._id || index}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200"
            >
              {/* Individual Ticket UI */}
              <div className="ticket-card relative overflow-hidden">
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-red-700 to-red-500 p-4 flex justify-between items-center">
                  <div className="font-bold text-white text-lg truncate">
                    {ticket.event?.title || 
                     ticket.rawOrderData?.eventTitle ||
                     ticket.rawOrderData?.event?.title ||
                     ticket.rawOrderData?.event?.name ||
                     "Event Details Loading..."}
                  </div>
                  <div className="text-sm bg-red-900 bg-opacity-50 rounded px-2 py-1 text-white">
                    Active Ticket
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row">
                  {/* Left content */}
                  <div className="md:w-2/3">
                    {/* User Info */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                          Ticket Holder
                        </span>
                      </div>
                      <div className="text-gray-800 font-medium">
                        {ticket.userInfo?.name ||
                          user?.name ||
                          user?.firstName + " " + user?.lastName ||
                          "Guest User"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {ticket.userInfo?.email ||
                          user?.email ||
                          "No email provided"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar size={18} className="text-red-500" />
                        <span>
                          {formatDate(
                            ticket.event?.date || ticket.purchaseDate
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock size={18} className="text-red-500" />
                        <span>{formatTime(ticket.event?.time)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin size={18} className="text-red-500" />
                        <span>{ticket.event?.location || "Location TBA"}</span>
                      </div>
                    </div>

                    {/* Individual Seat section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-2">
                        Seat Assignment:
                      </h4>
                      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
                        <div className="font-bold text-red-800 text-lg">
                          {ticket.seat?.name || "General Admission"}
                        </div>
                        {ticket.seat?.section && ticket.seat?.row && ticket.seat?.number && (
                          <div className="text-sm text-red-600 mt-1">
                            Section {ticket.seat.section} • Row {ticket.seat.row} • Seat {ticket.seat.number}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order info */}
                    <div className="text-sm text-gray-500 mt-4 flex items-center gap-1">
                      <FileText size={16} />
                      <span>
                        Order ID: {ticket.originalOrderId || ticket.orderId || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="md:w-1/3 mt-4 md:mt-0 md:border-l md:border-gray-200 md:pl-6 flex flex-col justify-between">
                    <div>
                      <div className="text-2xl font-bold mb-2 text-red-600">
                        ${getTicketPrice(ticket).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        Individual Ticket Price
                      </div>
                      <div className="text-sm text-gray-500">
                        Purchased on{" "}
                        {new Date(
                          ticket.purchaseDate || ticket.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Enhanced Barcode */}
                    <div className="mt-4 mb-4 md:mb-0">
                      <BarcodeDisplay 
                        ticketId={ticket._id}
                        seatInfo={ticket.seat?.name}
                        isCancelled={false}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => viewTicketDetails(ticket._id)}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        disabled={detailsLoading}
                      >
                        {detailsLoading ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          <Eye size={18} />
                        )}
                        View Details
                      </button>

                      <button
                        onClick={() => showCancelConfirmation(ticket)}
                        className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? (
                          <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          <X size={18} />
                        )}
                        Cancel Ticket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && ticketToCancel && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            {/* Modal header */}
            <div className="bg-red-500 p-4 flex justify-between items-center rounded-t-lg">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={24} />
                Cancel Ticket
              </h3>
              <button
                onClick={closeCancelModal}
                className="text-white hover:text-red-200 cursor-pointer"
                disabled={cancelLoading}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Are you sure you want to cancel this ticket?
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Event:</strong>{" "}
                    {ticketToCancel.event?.title || 
                     ticketToCancel.rawOrderData?.eventTitle ||
                     ticketToCancel.rawOrderData?.event?.title ||
                     ticketToCancel.rawOrderData?.event?.name ||
                     "Event Details Loading..."}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Date:</strong>{" "}
                    {formatDate(
                      ticketToCancel.event?.date || ticketToCancel.purchaseDate
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Seat:</strong>{" "}
                    {ticketToCancel.seat?.name || "General Admission"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Price:</strong> $
                    {getTicketPrice(ticketToCancel).toFixed(2)}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Important:</strong> Once cancelled, this action
                    cannot be undone. A refund will be processed within 5-7
                    business days.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeCancelModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
                  disabled={cancelLoading}
                >
                  Keep Ticket
                </button>
                <button
                  onClick={() => cancelTicket(ticketToCancel)}
                  className={`inline-flex items-center gap-2 px-4 py-2 ${
                    cancelLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 cursor-pointer"
                  } text-white rounded-lg transition-all`}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <X size={18} />
                  )}
                  {cancelLoading ? "Cancelling..." : "Yes, Cancel Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket details modal */}
      {selectedTicket && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-red-700 to-red-500 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Ticket Details - Cancel Preview
                <br />
                <span className="text-sm font-normal opacity-90">
                  {selectedTicket.event?.title || 
                   selectedTicket.rawOrderData?.eventTitle ||
                   selectedTicket.rawOrderData?.event?.title ||
                   selectedTicket.rawOrderData?.event?.name ||
                   "Event Details Loading..."}
                </span>
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-red-200 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Ticket content */}
            <div className="p-6">
              {/* Event info */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedTicket.event?.title || 
                   selectedTicket.rawOrderData?.eventTitle ||
                   selectedTicket.rawOrderData?.event?.title ||
                   selectedTicket.rawOrderData?.event?.name ||
                   "Event Details Loading..."}
                </h4>
                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar size={18} className="text-red-500" />
                    <span>
                      {formatDate(
                        selectedTicket.event?.date ||
                          selectedTicket.purchaseDate
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={18} className="text-red-500" />
                    <span>{formatTime(selectedTicket.event?.time)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin size={18} className="text-red-500" />
                    <span>
                      {selectedTicket.event?.location || "Location TBA"}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600">
                  {selectedTicket.event?.description ||
                    "No description available"}
                </p>
              </div>

              {/* Ticket breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Ticket info */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">
                    Ticket Information
                  </h4>
                  <div className="p-4 rounded-lg bg-red-50">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Ticket Holder</p>
                        <p className="font-medium text-gray-800">
                          {selectedTicket.userInfo?.name ||
                            user?.name ||
                            user?.firstName + " " + user?.lastName ||
                            "Guest User"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-800">
                          {selectedTicket.userInfo?.email ||
                            user?.email ||
                            "No email provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-medium text-gray-800 break-all">
                          {selectedTicket.originalOrderId ||
                            selectedTicket.orderId ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Purchase Date</p>
                        <p className="font-medium text-gray-800">
                          {new Date(
                            selectedTicket.purchaseDate ||
                              selectedTicket.createdAt ||
                              Date.now()
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Seat Assignment</p>
                        <p className="font-medium text-gray-800">
                          {selectedTicket.seat?.name || "General Admission"}
                        </p>
                        {selectedTicket.seat?.section && selectedTicket.seat?.row && selectedTicket.seat?.number && (
                          <p className="text-sm text-gray-600">
                            Section {selectedTicket.seat.section} • Row {selectedTicket.seat.row} • Seat {selectedTicket.seat.number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price details */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">
                    Refund Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Refund Amount</span>
                          <span className="text-red-600">
                            ${getTicketPrice(selectedTicket).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Refund will be processed within 5-7 business days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => showCancelConfirmation(selectedTicket)}
                  className={`inline-flex items-center gap-2 px-4 py-2 ${
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
                  Cancel This Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelTicket;