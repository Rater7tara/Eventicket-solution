import React, { useState, useEffect, useContext } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Download,
  Eye,
  FileText,
  User,
  X,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../../providers/AuthProvider";
import { jsPDF } from "jspdf";
import serverURL from "../../../../ServerConfig";

const API_BASE_URL = serverURL.url;

const MyTickets = () => {
  const { user, refreshToken } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);

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

  // Load tickets from localStorage
  const loadLocalTickets = () => {
    try {
      // Check for ticketPurchases in localStorage
      const ticketPurchasesString = localStorage.getItem("ticketPurchases");

      if (ticketPurchasesString) {
        const ticketPurchases = safelyParseJSON(ticketPurchasesString, []);

        // If ticketPurchases is an array, use it directly
        if (Array.isArray(ticketPurchases) && ticketPurchases.length > 0) {
          setTickets(ticketPurchases);
          setStatusMessage("Your tickets have been loaded successfully.");
          return true;
        }
        // If it's an object (single purchase), wrap it in an array
        else if (
          ticketPurchases &&
          typeof ticketPurchases === "object" &&
          !Array.isArray(ticketPurchases)
        ) {
          setTickets([ticketPurchases]);
          setStatusMessage("Your ticket has been loaded successfully.");
          return true;
        }
      }

      // Check if there's a currentOrderId in localStorage
      const currentOrderId = localStorage.getItem("currentOrderId");

      if (currentOrderId) {
        // Try to find this specific order in localStorage
        const allStorageKeys = Object.keys(localStorage);

        for (const key of allStorageKeys) {
          if (
            key.includes("ticket") ||
            key.includes("order") ||
            key.includes("purchase")
          ) {
            try {
              const value = safelyParseJSON(localStorage.getItem(key));

              // Check if this data contains our order ID
              if (
                value &&
                ((Array.isArray(value) &&
                  value.some((item) => item.orderId === currentOrderId)) ||
                  (typeof value === "object" &&
                    value.orderId === currentOrderId))
              ) {
                // Found matching ticket data
                const ticketData = Array.isArray(value)
                  ? value.filter((item) => item.orderId === currentOrderId)
                  : [value];

                setTickets(ticketData);
                setStatusMessage("Your ticket has been loaded successfully.");
                return true;
              }
            } catch (err) {
              console.error(`Error parsing localStorage key "${key}":`, err);
            }
          }
        }
      }

      return false;
    } catch (err) {
      console.error("Error loading local tickets:", err);
      return false;
    }
  };

  // Load tickets when component mounts
  useEffect(() => {
    fetchTickets();
  }, [user]);

  // Function to fetch tickets from API
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

        // Map the API data to match our component's expected format
        const formattedTickets = await Promise.all(
          data.data.map(async (order, index) => {
            console.log(`Processing order ${index + 1}:`, order);

            // Fetch event details for each order
            let eventDetails = {
              title: `Order ${index + 1}`,
              date: order.orderTime || order.createdAt,
              time: order.eventTime || order.time || "19:00",
              location: "Loading venue...",
              description: "Loading event details...",
            };

            if (order.eventId) {
              console.log(`Fetching details for eventId: ${order.eventId}`);
              const fetchedEventDetails = await fetchEventDetails(
                order.eventId
              );
              eventDetails = {
                title:
                  fetchedEventDetails.title ||
                  fetchedEventDetails.name ||
                  `Event ${order.eventId.substring(0, 8)}`,
                name:
                  fetchedEventDetails.name ||
                  fetchedEventDetails.title ||
                  `Event ${order.eventId.substring(0, 8)}`,
                date:
                  fetchedEventDetails.date ||
                  order.orderTime ||
                  order.createdAt,
                time:
                  fetchedEventDetails.time ||
                  order.eventTime ||
                  order.time ||
                  "19:00",
                location:
                  fetchedEventDetails.location ||
                  fetchedEventDetails.venue ||
                  "Venue details unavailable",
                venue:
                  fetchedEventDetails.venue ||
                  fetchedEventDetails.location ||
                  "Venue details unavailable",
                description:
                  fetchedEventDetails.description || "No description available",
                _id: order.eventId,
              };
              console.log("Final event details:", eventDetails);
            } else {
              console.warn("No eventId found in order:", order);
              eventDetails.title = `Order #${
                order._id?.substring(0, 8) || index + 1
              }`;
            }

            // ENHANCED CANCELLED STATUS DETECTION
            // Check multiple possible fields and values that indicate cancellation
            const isCancelled =
              // Check status field
              order.status === "cancelled" ||
              order.status === "canceled" ||
              order.status === "CANCELLED" ||
              order.status === "CANCELED" ||
              // Check paymentStatus field
              order.paymentStatus === "cancelled" ||
              order.paymentStatus === "canceled" ||
              order.paymentStatus === "CANCELLED" ||
              order.paymentStatus === "CANCELED" ||
              order.paymentStatus === "refunded" ||
              order.paymentStatus === "REFUNDED" ||
              order.paymentStatus === "failed" ||
              order.paymentStatus === "FAILED" ||
              // Check orderStatus field
              order.orderStatus === "cancelled" ||
              order.orderStatus === "canceled" ||
              order.orderStatus === "CANCELLED" ||
              order.orderStatus === "CANCELED" ||
              // Check booking status if available
              order.bookingStatus === "cancelled" ||
              order.bookingStatus === "canceled" ||
              order.bookingStatus === "CANCELLED" ||
              order.bookingStatus === "CANCELED" ||
              // Check if there's a cancellation date
              order.cancellationDate ||
              order.cancelledAt ||
              order.cancelled_at ||
              // Check if refund amount exists (indicates cancellation)
              order.refundAmount > 0 ||
              order.refund_amount > 0;

            console.log(`Order ${index + 1} cancellation status:`, {
              orderId: order._id,
              status: order.status,
              paymentStatus: order.paymentStatus,
              orderStatus: order.orderStatus,
              bookingStatus: order.bookingStatus,
              isCancelled: isCancelled,
              cancellationDate: order.cancellationDate,
              cancelledAt: order.cancelledAt,
              refundAmount: order.refundAmount,
            });

            return {
              _id: order._id,
              orderId: order._id,
              bookingId: order.bookingId,
              event: eventDetails,
              selectedSeats:
                order.seats?.map((seat) => ({
                  section: seat.section,
                  row: seat.row,
                  number: seat.seatNumber,
                  price: seat.price,
                  name: `${seat.section} ${seat.row}${seat.seatNumber}`,
                })) || [],
              quantity: order.quantity || 1,
              totalPrice: order.totalAmount || 0,
              grandTotal: order.totalAmount || 0,
              purchaseDate: order.orderTime || order.createdAt,
              createdAt: order.createdAt,
              paymentStatus: order.paymentStatus || "Unknown",
              isCancelled: isCancelled,
              // Store raw order data for debugging
              rawOrderData: order,
              // Add user info
              userInfo: {
                name:
                  user?.name ||
                  user?.firstName + " " + user?.lastName ||
                  "Guest User",
                email: user?.email || "No email provided",
              },
            };
          })
        );

        console.log("Final formatted tickets:", formattedTickets);
        setTickets(formattedTickets);
        setStatusMessage("Your tickets have been loaded successfully.");
      } else if (data.success && data.data) {
        // Handle single ticket response (same logic as above for single order)
        const order = data.data;
        console.log("Processing single order:", order);

        // Fetch event details
        let eventDetails = {
          title: "Single Event",
          date: order.orderTime || order.createdAt,
          time: order.eventTime || order.time || "19:00",
          location: "Loading venue...",
          description: "Loading event details...",
        };

        if (order.eventId) {
          const fetchedEventDetails = await fetchEventDetails(order.eventId);
          eventDetails = {
            title:
              fetchedEventDetails.title ||
              fetchedEventDetails.name ||
              `Event ${order.eventId.substring(0, 8)}`,
            name:
              fetchedEventDetails.name ||
              fetchedEventDetails.title ||
              `Event ${order.eventId.substring(0, 8)}`,
            date:
              fetchedEventDetails.date || order.orderTime || order.createdAt,
            time:
              fetchedEventDetails.time ||
              order.eventTime ||
              order.time ||
              "19:00",
            location:
              fetchedEventDetails.location ||
              fetchedEventDetails.venue ||
              "Venue details unavailable",
            venue:
              fetchedEventDetails.venue ||
              fetchedEventDetails.location ||
              "Venue details unavailable",
            description:
              fetchedEventDetails.description || "No description available",
            _id: order.eventId,
          };
        }

        // Same enhanced cancellation detection for single order
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
          order.refund_amount > 0;

        const formattedTicket = {
          _id: order._id,
          orderId: order._id,
          bookingId: order.bookingId,
          event: eventDetails,
          selectedSeats:
            order.seats?.map((seat) => ({
              section: seat.section,
              row: seat.row,
              number: seat.seatNumber,
              price: seat.price,
              name: `${seat.section} ${seat.row}${seat.seatNumber}`,
            })) || [],
          quantity: order.quantity || 1,
          totalPrice: order.totalAmount || 0,
          grandTotal: order.totalAmount || 0,
          purchaseDate: order.orderTime || order.createdAt,
          createdAt: order.createdAt,
          paymentStatus: order.paymentStatus || "Unknown",
          isCancelled: isCancelled,
          rawOrderData: order,
          // Add user info
          userInfo: {
            name:
              user?.name ||
              user?.firstName + " " + user?.lastName ||
              "Guest User",
            email: user?.email || "No email provided",
          },
        };

        setTickets([formattedTicket]);
        setStatusMessage("Your ticket has been loaded successfully.");
      } else {
        // If API returns empty or incorrect data, try localStorage as fallback
        const foundLocalTickets = loadLocalTickets();

        if (!foundLocalTickets) {
          setTickets([]);
          setStatusMessage(
            "No tickets found. Purchase tickets to see them here."
          );
        }
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(
        `${err.message} Please try refreshing or check your login status.`
      );

      // Try to load from localStorage as fallback
      loadLocalTickets();
    } finally {
      setLoading(false);
    }
  };

  const cancelTicket = async (ticket) => {
    setCancelLoading(true);
    setError("");

    try {
      // Check if ticket is already cancelled
      if (ticket.isCancelled) {
        setStatusMessage("This ticket is already cancelled.");
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

      // Validate bookingId exists
      if (!ticket.bookingId) {
        throw new Error("Booking ID is missing. Cannot cancel this ticket.");
      }

      // Updated request body to only include bookingId
      const requestBody = {
        bookingId: ticket.bookingId,
      };

      console.log("Cancelling ticket with body:", requestBody);

      // Call the cancel ticket API
      const response = await fetch(`${API_BASE_URL}payments/booking/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Cancel API response:", data);

      if (!response.ok) {
        // Check if the error is about booking already being cancelled
        if (response.status === 400 && data.message) {
          const errorMessage = data.message.toLowerCase();

          if (
            errorMessage.includes("already cancelled") ||
            errorMessage.includes("already canceled") ||
            errorMessage.includes("booking already cancelled") ||
            errorMessage.includes("booking already canceled")
          ) {
            // If booking is already cancelled, update the local state to reflect this
            setTickets((prevTickets) =>
              prevTickets.map((t) =>
                t._id === ticket._id ||
                t.orderId === ticket.orderId ||
                t.bookingId === ticket.bookingId
                  ? { ...t, isCancelled: true, paymentStatus: "cancelled" }
                  : t
              )
            );
            setStatusMessage(
              "This ticket was already cancelled on the server. The display has been updated."
            );
            setShowCancelModal(false);
            setTicketToCancel(null);
            return; // Exit the function early
          }
        }

        // For other errors, throw them
        throw new Error(
          data.message || `Failed to cancel ticket (Status: ${response.status})`
        );
      }

      // If cancellation was successful, update the ticket status in the local state
      setTickets((prevTickets) =>
        prevTickets.map((t) =>
          t._id === ticket._id ||
          t.orderId === ticket.orderId ||
          t.bookingId === ticket.bookingId
            ? { ...t, isCancelled: true, paymentStatus: "cancelled" }
            : t
        )
      );

      setStatusMessage(
        "Ticket cancelled successfully. Refund will be processed shortly."
      );
      setShowCancelModal(false);
      setTicketToCancel(null);
    } catch (err) {
      console.error("Error cancelling ticket:", err);
      setError(`Failed to cancel ticket: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Function to show cancel confirmation modal
  const showCancelConfirmation = (ticket) => {
    // Check if ticket is already cancelled
    if (ticket.isCancelled) {
      setStatusMessage("This ticket has already been cancelled.");
      return;
    }

    // Check if bookingId exists
    if (!ticket.bookingId) {
      setError("Cannot cancel this ticket - booking ID is missing.");
      return;
    }

    setTicketToCancel(ticket);
    setShowCancelModal(true);
  };

  // 4. Force refresh function to update cancelled status
  const forceRefreshTickets = async () => {
    setStatusMessage("");
    setError("");
    await fetchTickets();
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
      // First check if we have this ticket in our state already
      const localTicket = tickets.find(
        (ticket) => ticket.orderId === ticketId || ticket._id === ticketId
      );

      if (localTicket) {
        setSelectedTicket(localTicket);
        setDetailsLoading(false);
        return;
      }

      // If not in local state, try to fetch from API
      // Ensure we have a valid token
      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      // Get token from localStorage
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Call the ticket details API with the correct endpoint
      const response = await fetch(
        `${API_BASE_URL}orders/my-orders/${ticketId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Parse the response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch ticket details");
      }

      // Set selected ticket in state based on the API structure
      if (data.success && data.data) {
        const order = data.data;

        // Fetch event details
        let eventDetails = {
          title: "Event Details Loading...",
          date: order.orderTime || order.createdAt,
          time: order.eventTime || order.time || "19:00",
          location: "Event Venue",
          description: "Loading event details...",
        };

        if (order.eventId) {
          const fetchedEventDetails = await fetchEventDetails(order.eventId);
          eventDetails = {
            title:
              fetchedEventDetails.title ||
              fetchedEventDetails.name ||
              "Untitled Event",
            date:
              fetchedEventDetails.date || order.orderTime || order.createdAt,
            time:
              fetchedEventDetails.time ||
              order.eventTime ||
              order.time ||
              "19:00",
            location:
              fetchedEventDetails.location ||
              fetchedEventDetails.venue ||
              "Event Venue",
            description:
              fetchedEventDetails.description || "No description available",
          };
        }

        const formattedTicket = {
          _id: order._id,
          orderId: order._id,
          bookingId: order.bookingId,
          event: eventDetails,
          selectedSeats: order.seats.map((seat) => ({
            section: seat.section,
            row: seat.row,
            number: seat.seatNumber,
            price: seat.price,
            name: `${seat.section} ${seat.row}${seat.seatNumber}`,
          })),
          quantity: order.quantity,
          totalPrice: order.totalAmount,
          grandTotal: order.totalAmount,
          purchaseDate: order.orderTime || order.createdAt,
          createdAt: order.createdAt,
          paymentStatus: order.paymentStatus,
          isCancelled:
            order.status === "cancelled" || order.paymentStatus === "cancelled",
          // Add user info
          userInfo: {
            name:
              user?.name ||
              user?.firstName + " " + user?.lastName ||
              "Guest User",
            email: user?.email || "No email provided",
          },
        };

        setSelectedTicket(formattedTicket);
      } else {
        throw new Error("No ticket data returned from server");
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      setError(`Failed to load ticket details: ${err.message}`);

      // Try to find ticket in local state again as a last resort
      const possibleTicket = tickets.find(
        (ticket) =>
          (ticket.orderId && ticket.orderId.includes(ticketId)) ||
          (ticket._id && ticket._id.includes(ticketId))
      );

      if (possibleTicket) {
        setSelectedTicket(possibleTicket);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  // Simplified PDF generator with reliable fonts
  const generateLocalTicketPDF = (ticketId) => {
    // Find the ticket in our state
    const ticket = tickets.find(
      (t) => t._id === ticketId || t.orderId === ticketId
    );

    if (!ticket) {
      setError("Could not find ticket data for local generation");
      return;
    }

    try {
      // Create new PDF document
      const doc = new jsPDF();

      // Set up dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // ----- TICKET CARD STYLING -----

      // Card background
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, margin, contentWidth, 200, 3, 3, "F");

      // Card border
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, margin, contentWidth, 200, 3, 3, "S");

      // ----- HEADER SECTION -----

      // Orange gradient header
      doc.setFillColor(224, 88, 41); // Close to your orange color
      doc.rect(margin, margin, contentWidth, 25, "F");

      // Event title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");

      // Truncate long event titles
      const title = ticket.event?.title || "Untitled Event";
      let displayTitle = title;
      if (title.length > 40) {
        displayTitle = title.substring(0, 37) + "...";
      }

      doc.text(displayTitle, margin + 5, margin + 15);

      // Ticket count badge
      const ticketCount = ticket.quantity || ticket.selectedSeats?.length || 1;
      const ticketText = `${ticketCount} Ticket${ticketCount !== 1 ? "s" : ""}`;

      // Draw badge
      doc.setFillColor(180, 71, 35, 0.5);
      const badgeWidth =
        (doc.getStringUnitWidth(ticketText) * 10) / doc.internal.scaleFactor +
        10;
      doc.roundedRect(
        margin + contentWidth - badgeWidth - 5,
        margin + 7,
        badgeWidth,
        12,
        2,
        2,
        "F"
      );

      // Badge text
      doc.setFontSize(10);
      doc.text(
        ticketText,
        margin + contentWidth - badgeWidth / 2 - 5,
        margin + 15,
        { align: "center" }
      );

      // ----- TICKET BODY -----

      // Set up layout
      const bodyTop = margin + 35;
      const leftColWidth = contentWidth * 0.65;
      const rightColStart = margin + leftColWidth + 5;

      // Body text styling
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      // ----- LEFT COLUMN -----
      let currentY = bodyTop + 10;

      // User Info
      doc.setFont("helvetica", "bold");
      doc.setTextColor(224, 88, 41);
      doc.text("• ", margin + 5, currentY);
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Ticket Holder: ${ticket.userInfo?.name || "Guest User"}`,
        margin + 12,
        currentY
      );
      currentY += 15;

      // Date
      doc.setFont("helvetica", "bold");
      doc.setTextColor(224, 88, 41);
      doc.text("• ", margin + 5, currentY);
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Date: ${formatDate(ticket.event?.date || ticket.purchaseDate)}`,
        margin + 12,
        currentY
      );
      currentY += 15;

      // Time
      doc.setFont("helvetica", "bold");
      doc.setTextColor(224, 88, 41);
      doc.text("• ", margin + 5, currentY);
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Time: ${formatTime(ticket.event?.time)}`,
        margin + 12,
        currentY
      );
      currentY += 15;

      // Location
      doc.setFont("helvetica", "bold");
      doc.setTextColor(224, 88, 41);
      doc.text("• ", margin + 5, currentY);
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Location: ${ticket.event?.location || "Location TBA"}`,
        margin + 12,
        currentY
      );
      currentY += 20;

      // Seats section (if available)
      if (ticket.selectedSeats && ticket.selectedSeats.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Selected Seats:", margin + 5, currentY);
        currentY += 10;

        // Reset to normal style for seats
        doc.setFont("helvetica", "normal");

        // Show seats in a list format
        const maxSeatsToShow = Math.min(4, ticket.selectedSeats.length);

        for (let i = 0; i < maxSeatsToShow; i++) {
          const seat = ticket.selectedSeats[i];
          const seatName = seat.name || `Seat ${i + 1}`;
          doc.text(`- ${seatName}`, margin + 10, currentY);
          currentY += 7;
        }

        // Add "more" indicator if needed
        if (ticket.selectedSeats.length > 4) {
          doc.text(
            `+ ${ticket.selectedSeats.length - 4} more seats`,
            margin + 10,
            currentY
          );
          currentY += 7;
        }

        currentY += 5;
      }

      // Order info
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(224, 88, 41);
      doc.text("• ", margin + 5, currentY);
      doc.setTextColor(70, 70, 70);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Order ID: ${ticket._id || ticket.orderId || "N/A"}`,
        margin + 12,
        currentY
      );

      // ----- RIGHT COLUMN -----

      // Add right column border
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(rightColStart - 5, bodyTop, rightColStart - 5, bodyTop + 130);

      // Price info
      currentY = bodyTop + 15;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(224, 88, 41);
      doc.text(
        `$${(ticket.grandTotal || ticket.totalPrice || 0).toFixed(2)}`,
        rightColStart + 10,
        currentY
      );

      // Purchase date
      currentY += 15;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Purchased on ${new Date(
          ticket.purchaseDate || ticket.createdAt || Date.now()
        ).toLocaleDateString()}`,
        rightColStart + 10,
        currentY
      );

      // Payment status
      currentY += 12;
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94); // Green color for paid status
      doc.text(
        `Status: ${ticket.paymentStatus || "Paid"}`,
        rightColStart + 10,
        currentY
      );

      // Barcode
      currentY += 25;
      doc.setFillColor(229, 231, 235);
      doc.rect(rightColStart + 10, currentY, contentWidth * 0.25, 15, "F");

      // Draw barcode lines
      doc.setFillColor(17, 24, 39);

      for (let i = 0; i < 30; i++) {
        const barX = rightColStart + 10 + i * 1.5;
        const barHeight = 6 + Math.random() * 14;
        doc.setFillColor(17, 24, 39);
        doc.rect(barX, currentY + (15 - barHeight) / 2, 0.5, barHeight, "F");
      }

      // Barcode ID
      currentY += 20;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      const ticketNumber = ticket.orderId
        ? ticket.orderId.substring(0, 12)
        : `TIX-${Math.floor(Math.random() * 1000000)}`;
      doc.text(
        ticketNumber,
        rightColStart + 10 + (contentWidth * 0.25) / 2,
        currentY,
        { align: "center" }
      );

      // ----- FOOTER -----
      const footerY = margin + 175;

      // Footer text
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, footerY, contentWidth, 20, "F");

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, margin + contentWidth, footerY);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "This ticket is valid for entry. Please present this at the event.",
        margin + contentWidth / 2,
        footerY + 12,
        { align: "center" }
      );

      // Save the PDF
      const shortId = (ticket._id || ticket.orderId || "ticket").substring(
        0,
        8
      );
      const userName = ticket.userInfo?.name?.replace(/\s+/g, "_") || "user";
      doc.save(`ticket-${userName}-${shortId}.pdf`);

      setStatusMessage("Ticket PDF generated successfully!");
    } catch (err) {
      console.error("Error generating PDF:", err);

      // Fallback to simple text file
      try {
        const ticketText = `TICKET DETAILS
Event: ${ticket.event?.title || "Untitled Event"}
Ticket Holder: ${ticket.userInfo?.name || "Guest User"}
Email: ${ticket.userInfo?.email || "No email provided"}
Date: ${formatDate(ticket.event?.date || ticket.purchaseDate)}
Time: ${formatTime(ticket.event?.time)}
Location: ${ticket.event?.location || "Location TBA"}
Order ID: ${ticket._id || ticket.orderId || "N/A"}
Purchased: ${new Date(
          ticket.purchaseDate || ticket.createdAt || Date.now()
        ).toLocaleString()}
Total Price: ${(ticket.grandTotal || ticket.totalPrice || 0).toFixed(2)}
Payment Status: ${ticket.paymentStatus || "Paid"}

This is a locally generated ticket file as the PDF generation failed.
`;

        // Create a Blob containing the ticket text
        const blob = new Blob([ticketText], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);

        // Create and click a download link
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `ticket-${ticketId}.txt`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setStatusMessage("Ticket text file created as fallback");
      } catch (fallbackErr) {
        console.error("Error in text fallback:", fallbackErr);
        setError("Failed to generate ticket file");
      }
    }
  };

  // Modified downloadTicket function that prioritizes local generation
  const downloadTicket = async (ticketId) => {
    setDownloadLoading(true);
    setError("");

    try {
      // Generate the PDF locally first to avoid API errors
      console.log("Generating ticket PDF locally");
      generateLocalTicketPDF(ticketId);
      setDownloadLoading(false);
      return;
    } catch (err) {
      console.error("Error downloading ticket:", err);
      setError(`Failed to download ticket: ${err.message}`);

      // Try the fallback local generation method
      try {
        console.log(
          "Attempting local ticket generation as fallback after error"
        );
        generateLocalTicketPDF(ticketId);
      } catch (fallbackErr) {
        console.error("Fallback generation also failed:", fallbackErr);
      }
    } finally {
      setDownloadLoading(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Tickets</h2>
        <div className="flex gap-2">
          <button
            onClick={forceRefreshTickets}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {loading ? "Syncing..." : "Sync Status"}
          </button>

          <button
            onClick={fetchTickets}
            className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Status/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {statusMessage && !error && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {statusMessage}
        </div>
      )}

      {/* No tickets message */}
      {!loading && tickets.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Ticket size={48} className="mx-auto text-orange-500 mb-3" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No Tickets Found
          </h3>
          <p className="text-gray-600 mb-6">
            You haven't purchased any tickets yet.
          </p>
          <Link
            to="/event-list"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Calendar size={18} />
            Browse Events
          </Link>
        </div>
      )}

      {/* Tickets list */}
      {tickets.length > 0 && (
        <div className="space-y-6 mt-6">
          {tickets.map((ticket, index) => (
            <div
              key={ticket._id || ticket.orderId || index}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200 ${
                ticket.isCancelled ? "opacity-60 grayscale" : ""
              }`}
            >
              {/* Cancelled Banner */}
              {ticket.isCancelled && (
                <div className="bg-red-500 text-white text-center py-2 px-4 text-sm font-medium">
                  ❌ CANCELLED - Refund Processing
                </div>
              )}

              {/* Ticket UI inspired by checkout tickets */}
              <div className="ticket-card relative overflow-hidden">
                {/* Ticket Header */}
                <div
                  className={`${
                    ticket.isCancelled
                      ? "bg-gradient-to-r from-gray-600 to-gray-500"
                      : "bg-gradient-to-r from-orange-700 to-orange-500"
                  } p-4 flex justify-between items-center`}
                >
                  <div className="font-bold text-white text-lg truncate">
                    {ticket.event?.title || "Event Title Loading..."}
                  </div>
                  <div
                    className={`text-sm ${
                      ticket.isCancelled
                        ? "bg-gray-800 bg-opacity-50"
                        : "bg-orange-900 bg-opacity-50"
                    } rounded px-2 py-1 text-white`}
                  >
                    {ticket.quantity || ticket.selectedSeats?.length || 1}{" "}
                    Ticket
                    {(ticket.quantity || ticket.selectedSeats?.length || 1) !==
                    1
                      ? "s"
                      : ""}
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
                        <Calendar
                          size={18}
                          className={
                            ticket.isCancelled
                              ? "text-gray-400"
                              : "text-orange-500"
                          }
                        />
                        <span>
                          {formatDate(
                            ticket.event?.date || ticket.purchaseDate
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock
                          size={18}
                          className={
                            ticket.isCancelled
                              ? "text-gray-400"
                              : "text-orange-500"
                          }
                        />
                        <span>{formatTime(ticket.event?.time)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin
                          size={18}
                          className={
                            ticket.isCancelled
                              ? "text-gray-400"
                              : "text-orange-500"
                          }
                        />
                        <span>{ticket.event?.location || "Location TBA"}</span>
                      </div>
                    </div>

                    {/* Seats section */}
                    {ticket.selectedSeats &&
                      ticket.selectedSeats.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">
                            Selected Seats:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {ticket.selectedSeats
                              .slice(0, 4)
                              .map((seat, idx) => (
                                <div
                                  key={idx}
                                  className="inline-block bg-gray-100 rounded px-2 py-1 text-sm"
                                >
                                  {seat.name || `Seat ${idx + 1}`}
                                </div>
                              ))}
                            {ticket.selectedSeats.length > 4 && (
                              <div className="inline-block bg-gray-100 rounded px-2 py-1 text-sm">
                                +{ticket.selectedSeats.length - 4} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Order info */}
                    <div className="text-sm text-gray-500 mt-4 flex items-center gap-1">
                      <FileText size={16} />
                      <span>
                        Order ID: {ticket._id || ticket.orderId || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="md:w-1/3 mt-4 md:mt-0 md:border-l md:border-gray-200 md:pl-6 flex flex-col justify-between">
                    <div>
                      <div
                        className={`text-2xl font-bold mb-2 ${
                          ticket.isCancelled
                            ? "text-gray-500 line-through"
                            : "text-orange-600"
                        }`}
                      >
                        $
                        {(ticket.grandTotal || ticket.totalPrice || 0).toFixed(
                          2
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        Total Amount
                      </div>
                      <div className="text-sm text-gray-500">
                        Purchased on{" "}
                        {new Date(
                          ticket.purchaseDate || ticket.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </div>
                      <div
                        className={`text-sm font-medium mt-1 ${
                          ticket.isCancelled ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        Status:{" "}
                        {ticket.isCancelled
                          ? "Cancelled"
                          : ticket.paymentStatus || "Paid"}
                      </div>
                    </div>

                    {/* Barcode */}
                    <div className="mt-4 mb-4 md:mb-0">
                      <div className="bg-gray-200 p-1 rounded">
                        <div className="flex space-x-0.5">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-0.5 ${
                                ticket.isCancelled
                                  ? "bg-gray-400"
                                  : "bg-gray-900"
                              }`}
                              style={{
                                height: `${6 + Math.random() * 14}px`,
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="text-center text-xs mt-1 text-gray-400">
                        {/* Generate a ticket ID based on order ID */}
                        {ticket.orderId
                          ? ticket.orderId.substring(0, 12)
                          : `TIX-${Math.floor(Math.random() * 1000000)}`}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() =>
                          viewTicketDetails(ticket._id || ticket.orderId)
                        }
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

                      {!ticket.isCancelled && (
                        <>
                          <button
                            onClick={() =>
                              downloadTicket(ticket._id || ticket.orderId)
                            }
                            className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                            disabled={downloadLoading}
                          >
                            {downloadLoading ? (
                              <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full mr-1"></div>
                            ) : (
                              <Download size={18} />
                            )}
                            Download
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
                        </>
                      )}

                      {ticket.isCancelled && (
                        <div className="text-xs text-gray-500 italic mt-2">
                          Ticket cancelled - Refund will be processed within 5-7
                          business days
                        </div>
                      )}
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
                    {ticketToCancel.event?.title || "Event Title"}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Date:</strong>{" "}
                    {formatDate(
                      ticketToCancel.event?.date || ticketToCancel.purchaseDate
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Tickets:</strong>{" "}
                    {ticketToCancel.quantity ||
                      ticketToCancel.selectedSeats?.length ||
                      1}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Total Amount:</strong> $
                    {(
                      ticketToCancel.grandTotal ||
                      ticketToCancel.totalPrice ||
                      0
                    ).toFixed(2)}
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
            <div
              className={`${
                selectedTicket.isCancelled
                  ? "bg-gradient-to-r from-gray-600 to-gray-500"
                  : "bg-gradient-to-r from-orange-700 to-orange-500"
              } p-4 flex justify-between items-center`}
            >
              <h3 className="text-xl font-bold text-white">
                Ticket Details {selectedTicket.isCancelled && "(Cancelled)"}
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-orange-200 cursor-pointer"
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

            {/* Cancelled Notice in Modal */}
            {selectedTicket.isCancelled && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex items-center">
                  <AlertTriangle className="text-red-500 mr-2" size={20} />
                  <p className="text-red-700 font-medium">
                    This ticket has been cancelled. Refund will be processed
                    within 5-7 business days.
                  </p>
                </div>
              </div>
            )}

            {/* Ticket content */}
            <div className="p-6">
              {/* Event info */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedTicket.event?.title || "Event Title Loading..."}
                </h4>
                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar
                      size={18}
                      className={
                        selectedTicket.isCancelled
                          ? "text-gray-400"
                          : "text-orange-500"
                      }
                    />
                    <span>
                      {formatDate(
                        selectedTicket.event?.date ||
                          selectedTicket.purchaseDate
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock
                      size={18}
                      className={
                        selectedTicket.isCancelled
                          ? "text-gray-400"
                          : "text-orange-500"
                      }
                    />
                    <span>{formatTime(selectedTicket.event?.time)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin
                      size={18}
                      className={
                        selectedTicket.isCancelled
                          ? "text-gray-400"
                          : "text-orange-500"
                      }
                    />
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
                  <div
                    className={`p-4 rounded-lg ${
                      selectedTicket.isCancelled ? "bg-gray-50" : "bg-orange-50"
                    }`}
                  >
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
                          {selectedTicket._id ||
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
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium text-gray-800">
                          {selectedTicket.quantity ||
                            selectedTicket.selectedSeats?.length ||
                            1}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Status</p>
                        <p
                          className={`font-medium ${
                            selectedTicket.isCancelled
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {selectedTicket.isCancelled
                            ? "Cancelled"
                            : selectedTicket.paymentStatus || "Paid"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price details */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">
                    Price Details
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>
                            Total{" "}
                            {selectedTicket.isCancelled ? "Refunded" : "Paid"}
                          </span>
                          <span
                            className={
                              selectedTicket.isCancelled
                                ? "text-gray-500 line-through"
                                : "text-orange-600"
                            }
                          >
                            $
                            {(
                              selectedTicket.grandTotal ||
                              selectedTicket.totalPrice ||
                              0
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat selection */}
              {selectedTicket.selectedSeats &&
                selectedTicket.selectedSeats.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-700 mb-3">
                      Selected Seats
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {selectedTicket.selectedSeats.map((seat, idx) => (
                          <div
                            key={idx}
                            className={`border border-gray-200 rounded-md p-3 text-center ${
                              selectedTicket.isCancelled
                                ? "bg-gray-100"
                                : "bg-white"
                            }`}
                          >
                            <div className="font-bold text-gray-800">
                              {seat.name || `Seat ${idx + 1}`}
                            </div>
                            {seat.section && (
                              <div className="text-xs text-gray-500">
                                {seat.section}, Row {seat.row}, Seat{" "}
                                {seat.number}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Ticket visualization */}
              <div className="mb-6 border-t border-gray-200 pt-6">
                <h4 className="font-bold text-gray-700 mb-3">Ticket Preview</h4>
                <div
                  className={`rounded-lg border border-gray-300 overflow-hidden shadow-md ${
                    selectedTicket.isCancelled
                      ? "opacity-60 grayscale"
                      : "bg-white"
                  }`}
                >
                  {/* Ticket header */}
                  <div
                    className={`p-3 flex justify-between items-center ${
                      selectedTicket.isCancelled
                        ? "bg-gradient-to-r from-gray-600 to-gray-500"
                        : "bg-gradient-to-r from-orange-700 to-orange-500"
                    }`}
                  >
                    <div className="font-bold text-white truncate">
                      {selectedTicket.event?.title || "Event Title Loading..."}
                    </div>
                    <div
                      className={`text-xs rounded px-2 py-1 text-white ${
                        selectedTicket.isCancelled
                          ? "bg-gray-800 bg-opacity-50"
                          : "bg-orange-900 bg-opacity-50"
                      }`}
                    >
                      Admit{" "}
                      {selectedTicket.quantity ||
                        selectedTicket.selectedSeats?.length ||
                        1}
                    </div>
                  </div>

                  {/* Cancelled overlay for ticket preview */}
                  {selectedTicket.isCancelled && (
                    <div className="bg-red-500 text-white text-center py-1 text-xs font-bold">
                      CANCELLED
                    </div>
                  )}

                  {/* Ticket body */}
                  <div className="p-4 flex justify-between">
                    <div className="w-2/3">
                      <div className="flex flex-col space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Event</div>
                          <div className="font-medium">
                            {selectedTicket.event?.title ||
                              "Event Title Loading..."}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">
                            Ticket Holder
                          </div>
                          <div className="font-medium">
                            {selectedTicket.userInfo?.name ||
                              user?.name ||
                              user?.firstName + " " + user?.lastName ||
                              "Guest User"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">
                            Date & Time
                          </div>
                          <div className="font-medium">
                            {formatDate(
                              selectedTicket.event?.date ||
                                selectedTicket.purchaseDate
                            )}
                          </div>
                          <div className="font-medium">
                            {formatTime(selectedTicket.event?.time)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">Location</div>
                          <div className="font-medium">
                            {selectedTicket.event?.location || "Location TBA"}
                          </div>
                        </div>

                        {selectedTicket.selectedSeats &&
                          selectedTicket.selectedSeats[0] && (
                            <div>
                              <div className="text-xs text-gray-500">Seat</div>
                              <div className="font-medium">
                                {selectedTicket.selectedSeats[0].name ||
                                  "General Admission"}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="w-1/3 flex flex-col items-end justify-between">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total</div>
                        <div
                          className={`font-bold ${
                            selectedTicket.isCancelled
                              ? "text-gray-500 line-through"
                              : "text-orange-600"
                          }`}
                        >
                          $
                          {(
                            selectedTicket.grandTotal ||
                            selectedTicket.totalPrice ||
                            0
                          ).toFixed(2)}
                        </div>
                      </div>

                      {/* Barcode */}
                      <div className="mt-2">
                        <div className="bg-gray-200 p-1 rounded">
                          <div className="flex space-x-0.5">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-0.5 ${
                                  selectedTicket.isCancelled
                                    ? "bg-gray-400"
                                    : "bg-gray-900"
                                }`}
                                style={{
                                  height: `${6 + Math.random() * 14}px`,
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>
                        <div className="text-center text-xs mt-1 text-gray-400">
                          {/* Generate ticket ID based on order ID */}
                          {selectedTicket.orderId
                            ? selectedTicket.orderId.substring(0, 12)
                            : `TIX-${Math.floor(Math.random() * 1000000)}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-2 text-center text-xs border-t border-gray-300 ${
                      selectedTicket.isCancelled
                        ? "bg-gray-100 text-gray-500"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {selectedTicket.isCancelled
                      ? "This ticket has been cancelled and is no longer valid for entry."
                      : "This ticket is valid for entry. Please present this at the event."}
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

                {!selectedTicket.isCancelled && (
                  <>
                    <button
                      onClick={() =>
                        downloadTicket(
                          selectedTicket._id || selectedTicket.orderId
                        )
                      }
                      className={`inline-flex items-center gap-2 px-4 py-2 ${
                        downloadLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg cursor-pointer"
                      } text-white rounded-lg transition-all`}
                      disabled={downloadLoading}
                    >
                      {downloadLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Download size={18} />
                      )}
                      Download Ticket
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
                      Cancel Ticket
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
