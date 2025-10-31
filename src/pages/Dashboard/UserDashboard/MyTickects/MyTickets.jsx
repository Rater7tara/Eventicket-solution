import React, { useState, useEffect, useContext, useRef } from "react";
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
import JsBarcode from "jsbarcode";
import serverURL from "../../../../ServerConfig";
import logo from "../../../../assets/logo.png";

const API_BASE_URL = serverURL.url;

const MyTickets = () => {
  const { user, refreshToken } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);

  // UPDATED BARCODE COMPONENT USING JSBARCODE
  const BarcodeDisplay = ({
    ticketCode,
    isCancelled = false,
    size = "normal",
  }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      if (canvasRef.current && ticketCode) {
        try {
          JsBarcode(canvasRef.current, ticketCode, {
            format: "CODE128",
            width: size === "large" ? 2 : 1.5,
            height: size === "large" ? 45 : 35,
            displayValue: false,
            background: "#ffffff",
            lineColor: isCancelled ? "#9ca3af" : "#000000",
            margin: 5,
          });
        } catch (err) {
          console.error("Error generating barcode:", err);
        }
      }
    }, [ticketCode, isCancelled, size]);

    const containerHeight = size === "large" ? "h-16" : "h-12";

    return (
      <div className="text-center">
        <div
          className={`bg-white p-3 rounded border ${containerHeight} flex items-center justify-center shadow-sm`}
        >
          <canvas ref={canvasRef}></canvas>
        </div>
        <div
          className={`text-center ${
            size === "large" ? "text-sm" : "text-xs"
          } mt-2 font-mono tracking-wider ${
            isCancelled ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {ticketCode || "000000000000"}
        </div>
      </div>
    );
  };

  // Function to generate unique ticket code for each ticket
  const generateUniqueTicketCode = (orderTicketCode, seatIndex) => {
    // If order has a ticket code, append seat index to make it unique
    if (orderTicketCode) {
      // Remove any existing seat suffix and add new one
      const baseCode = orderTicketCode.replace(/-S\d+$/, "");
      return `${baseCode}-S${seatIndex + 1}`;
    }
    
    // Fallback: generate a unique code based on timestamp and seat
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT${timestamp}${random}S${seatIndex + 1}`;
  };

  // Function to format time to 12-hour format
  const formatTime = (timeString) => {
    if (!timeString) return "Time TBA";

    try {
      let date;

      if (timeString.includes("T") || timeString.includes(" ")) {
        date = new Date(timeString);
      } else {
        const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
        const match = timeString.match(timeRegex);

        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          date = new Date();
          date.setHours(hours, minutes, 0, 0);
        } else {
          date = new Date(timeString);
        }
      }

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

        let event = null;

        if (eventData.success && eventData.event) {
          event = eventData.event;
        } else if (eventData.data) {
          event = eventData.data;
        } else if (eventData.success === false) {
          console.error("API returned error:", eventData.message);
          throw new Error(eventData.message || "Event not found");
        } else {
          event = eventData;
        }

        if (event && event.title) {
          console.log("Successfully fetched event:", event);
          return {
            title: event.title,
            name: event.title,
            date: event.date,
            time: event.time,
            location: event.location,
            venue: event.location,
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
      const ticketPurchasesString = localStorage.getItem("ticketPurchases");

      if (ticketPurchasesString) {
        const ticketPurchases = safelyParseJSON(ticketPurchasesString, []);

        if (Array.isArray(ticketPurchases) && ticketPurchases.length > 0) {
          setTickets(ticketPurchases);
          return true;
        } else if (
          ticketPurchases &&
          typeof ticketPurchases === "object" &&
          !Array.isArray(ticketPurchases)
        ) {
          setTickets([ticketPurchases]);
          return true;
        }
      }

      const currentOrderId = localStorage.getItem("currentOrderId");

      if (currentOrderId) {
        const allStorageKeys = Object.keys(localStorage);

        for (const key of allStorageKeys) {
          if (
            key.includes("ticket") ||
            key.includes("order") ||
            key.includes("purchase")
          ) {
            try {
              const value = safelyParseJSON(localStorage.getItem(key));

              if (
                value &&
                ((Array.isArray(value) &&
                  value.some((item) => item.orderId === currentOrderId)) ||
                  (typeof value === "object" &&
                    value.orderId === currentOrderId))
              ) {
                const ticketData = Array.isArray(value)
                  ? value.filter((item) => item.orderId === currentOrderId)
                  : [value];

                setTickets(ticketData);
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

  // Helper function to get ticket price with fallbacks
  const getTicketPrice = (ticket) => {
    const priceFields = [
      ticket.grandTotal,
      ticket.totalPrice,
      ticket.seat?.price,
      ticket.rawOrderData?.totalAmount,
      ticket.rawOrderData?.amount,
      ticket.rawOrderData?.price,
      ticket.rawOrderData?.total,
      ticket.rawOrderData?.cost,
    ];

    for (const price of priceFields) {
      if (price && price > 0) {
        return parseFloat(price);
      }
    }

    if (
      ticket.rawOrderData?.totalAmount &&
      ticket.rawOrderData?.seats?.length > 0
    ) {
      return (
        parseFloat(ticket.rawOrderData.totalAmount) /
        ticket.rawOrderData.seats.length
      );
    }

    return 0;
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
      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}orders/my-orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to fetch tickets (Status: ${response.status})`
        );
      }

      if (data.success && data.data && Array.isArray(data.data)) {
        console.log("Processing orders:", data.data);

        const individualTickets = convertOrdersToIndividualTickets(data.data);

        const uniqueEventIds = [
          ...new Set(
            individualTickets
              .map((ticket) => ticket.rawOrderData.eventId)
              .filter(Boolean)
          ),
        ];
        const eventDetailsMap = {};

        console.log("Fetching event details for events:", uniqueEventIds);

        for (const eventId of uniqueEventIds) {
          try {
            const eventDetails = await fetchEventDetails(eventId);
            eventDetailsMap[eventId] = eventDetails;
            console.log(
              `Event details loaded for ${eventId}:`,
              eventDetails?.title
            );
          } catch (error) {
            console.error(
              `Failed to fetch event details for ${eventId}:`,
              error
            );
            eventDetailsMap[eventId] = {
              title: `Event ${eventId.substring(0, 8)}...`,
              date: null,
              time: "19:00",
              location: "Location TBA",
              description: "Event details unavailable",
              _id: eventId,
              error: true,
            };
          }
        }

        const ticketsWithEventDetails = individualTickets.map((ticket) => {
          const eventId = ticket.rawOrderData.eventId;
          const eventDetails = eventDetailsMap[eventId];

          let finalEventDetails = eventDetails;

          if (!eventDetails || !eventDetails.title) {
            finalEventDetails = {
              title:
                ticket.rawOrderData.eventTitle ||
                ticket.rawOrderData.event?.title ||
                ticket.rawOrderData.event?.name ||
                `Event ${
                  eventId
                    ? eventId.substring(0, 8)
                    : ticket.originalOrderId.substring(0, 8)
                }...`,
              date:
                ticket.rawOrderData.eventDate ||
                ticket.rawOrderData.event?.date ||
                ticket.purchaseDate,
              time:
                ticket.rawOrderData.eventTime ||
                ticket.rawOrderData.event?.time ||
                "19:00",
              location:
                ticket.rawOrderData.eventLocation ||
                ticket.rawOrderData.event?.location ||
                ticket.rawOrderData.venue ||
                "Location TBA",
              description:
                ticket.rawOrderData.eventDescription ||
                ticket.rawOrderData.event?.description ||
                "Event details unavailable",
              _id: eventId,
              fallback: true,
            };
          }

          return {
            ...ticket,
            event: finalEventDetails,
          };
        });

        const sortedTickets = ticketsWithEventDetails.sort((a, b) => {
          const dateA = new Date(a.purchaseDate || a.createdAt || 0);
          const dateB = new Date(b.purchaseDate || b.createdAt || 0);

          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;

          return dateB.getTime() - dateA.getTime();
        });

        console.log("Final formatted individual tickets:", sortedTickets);
        setTickets(sortedTickets);
      } else if (data.success && data.data) {
        const order = data.data;
        console.log("Processing single order:", order);

        const individualTickets = convertOrdersToIndividualTickets([order]);

        if (order.eventId) {
          const eventDetails = await fetchEventDetails(order.eventId);
          individualTickets.forEach((ticket) => {
            ticket.event = eventDetails;
          });
        }

        setTickets(individualTickets);
      } else {
        const foundLocalTickets = loadLocalTickets();

        if (!foundLocalTickets) {
          setTickets([]);
        }
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(
        `${err.message} Please try refreshing or check your login status.`
      );

      loadLocalTickets();
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Enhanced Cancel Ticket Function with new API body structure
  const cancelTicket = async (ticket) => {
    setCancelLoading(true);
    setError("");

    try {
      if (ticket.isCancelled) {
        try {
          await fetchTickets();
        } catch (refreshError) {
          console.error("Failed to refresh tickets:", refreshError);
        }
        setShowCancelModal(false);
        setTicketToCancel(null);
        setCancelLoading(false);
        return;
      }

      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      let orderId = null;

      const possibleOrderIds = [
        ticket.originalOrderId,
        ticket.orderId,
        ticket.rawOrderData?._id,
        ticket.rawOrderData?.orderId,
        ticket._id.includes("_seat_")
          ? ticket._id.split("_seat_")[0]
          : ticket._id,
      ];

      for (const id of possibleOrderIds) {
        if (id && typeof id === "string" && id.trim() !== "") {
          orderId = id;
          break;
        }
      }

      console.log("Available order ID options:", possibleOrderIds);
      console.log("Using order ID:", orderId);

      if (!orderId) {
        throw new Error(
          `Order ID is missing. Cannot cancel this ticket. Please contact support with Order ID: ${
            ticket.originalOrderId || ticket.orderId || "Unknown"
          }`
        );
      }

      let seatToCancel = null;

      if (
        ticket.seat &&
        ticket.seat.section &&
        ticket.seat.row &&
        ticket.seat.number
      ) {
        let seatId = null;

        if (
          ticket.seatIndex !== undefined &&
          ticket.rawOrderData?.seats &&
          ticket.rawOrderData.seats[ticket.seatIndex]
        ) {
          const originalSeat = ticket.rawOrderData.seats[ticket.seatIndex];
          seatId = originalSeat._id || originalSeat.id;
        }

        seatToCancel = {
          section: ticket.seat.section,
          row: ticket.seat.row,
          seatNumber: parseInt(ticket.seat.number),
          price: ticket.seat.price || getTicketPrice(ticket),
        };

        if (seatId) {
          seatToCancel._id = seatId;
        }
      } else {
        seatToCancel = {
          section: ticket.seat?.section || "GA",
          row: ticket.seat?.row || "",
          seatNumber: ticket.seat?.number ? parseInt(ticket.seat.number) : 1,
          price: getTicketPrice(ticket),
        };
      }

      const requestBody = {
        orderId: orderId,
        seatToCancel: seatToCancel,
      };

      console.log("Cancelling ticket with new API structure:", requestBody);

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

      if (!response.ok) {
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

        const errorDetails = {
          status: response.status,
          message: data.message || "Unknown error",
          orderIdUsed: orderId,
          seatToCancel: seatToCancel,
          endpoint: `${API_BASE_URL}payments/booking/cancel`,
        };

        throw new Error(
          `Failed to cancel ticket: ${
            data.message || "Unknown error"
          } (Status: ${response.status}). Order ID used: ${orderId}`
        );
      }

      console.log("Ticket cancelled successfully - refreshing tickets...");
      try {
        await fetchTickets();
        console.log("Tickets refreshed successfully after cancellation");
      } catch (refreshError) {
        console.error(
          "Failed to refresh tickets after cancellation:",
          refreshError
        );
        setError(
          "Ticket cancelled but failed to refresh list. Please refresh the page manually."
        );
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

  // UPDATED: Better validation for showing cancel confirmation
  const showCancelConfirmation = (ticket) => {
    if (ticket.isCancelled) {
      return;
    }

    const possibleOrderIds = [
      ticket.originalOrderId,
      ticket.orderId,
      ticket.rawOrderData?._id,
      ticket.rawOrderData?.orderId,
      ticket._id.includes("_seat_")
        ? ticket._id.split("_seat_")[0]
        : ticket._id,
    ];

    const hasValidOrderId = possibleOrderIds.some(
      (id) => id && typeof id === "string" && id.trim() !== ""
    );

    if (!hasValidOrderId) {
      setError(
        `Cannot cancel this ticket - no valid order ID found. Please contact support with Order ID: ${
          ticket.originalOrderId || ticket.orderId || "Unknown"
        }`
      );
      return;
    }

    if (!ticket.seat || (!ticket.seat.section && !ticket.seat.name)) {
      setError(
        `Cannot cancel this ticket - seat information is missing. Please contact support with Order ID: ${
          ticket.originalOrderId || ticket.orderId || "Unknown"
        }`
      );
      return;
    }

    setTicketToCancel(ticket);
    setShowCancelModal(true);
  };

  // UPDATED: Convert orders to individual tickets with UNIQUE ticket codes
  const convertOrdersToIndividualTickets = (orders) => {
    const individualTickets = [];

    orders.forEach((order) => {
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

      const ensureBookingId = (order) => {
        return (
          order.bookingId ||
          order._id ||
          order.id ||
          order.orderId ||
          order.booking_id ||
          order.bookingReference ||
          order.transactionId
        );
      };

      // If there are seats, create individual tickets for each seat
      if (order.seats && order.seats.length > 0) {
        order.seats.forEach((seat, seatIndex) => {
          const seatPrice =
            seat.price ||
            seat.seatPrice ||
            seat.amount ||
            order.totalAmount / order.seats.length ||
            order.amount ||
            order.price ||
            0;

          // GENERATE UNIQUE TICKET CODE FOR EACH SEAT
          const uniqueTicketCode = generateUniqueTicketCode(
            order.ticketCode,
            seatIndex
          );

          individualTickets.push({
            _id: `${order._id}_seat_${seatIndex}`,
            orderId: order._id,
            bookingId: ensureBookingId(order),
            originalOrderId: order._id,
            seatIndex: seatIndex,
            event: null,
            seat: {
              section: seat.section,
              row: seat.row,
              number: seat.seatNumber,
              price: seatPrice,
              name: `${seat.section} ${seat.row}${seat.seatNumber}`,
            },
            quantity: 1,
            totalPrice: seatPrice,
            grandTotal: seatPrice,
            purchaseDate: order.orderTime || order.createdAt,
            createdAt: order.createdAt,
            paymentStatus: order.paymentStatus || "Unknown",
            isCancelled: isCancelled,
            ticketCode: uniqueTicketCode, // UNIQUE ticket code for each seat
            rawOrderData: order,
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
        // For general admission, still generate unique code
        const ticketPrice =
          order.totalAmount ||
          order.amount ||
          order.price ||
          order.grandTotal ||
          order.total ||
          order.cost ||
          0;

        const uniqueTicketCode = generateUniqueTicketCode(order.ticketCode, 0);

        individualTickets.push({
          _id: order._id,
          orderId: order._id,
          bookingId: ensureBookingId(order),
          originalOrderId: order._id,
          seatIndex: 0,
          event: null,
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
          isCancelled: isCancelled,
          ticketCode: uniqueTicketCode, // UNIQUE ticket code
          rawOrderData: order,
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

    console.log(
      "Generated tickets with UNIQUE ticket codes:",
      individualTickets.map((t) => ({
        ticketId: t._id,
        orderId: t.orderId,
        seatIndex: t.seatIndex,
        ticketCode: t.ticketCode,
      }))
    );

    return individualTickets;
  };

  // Force refresh function to update cancelled status
  const forceRefreshTickets = async () => {
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
      const localTicket = tickets.find(
        (ticket) => ticket._id === ticketId || ticket.orderId === ticketId
      );

      if (localTicket) {
        setSelectedTicket(localTicket);
        setDetailsLoading(false);
        return;
      }

      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const orderIdToFetch = ticketId.includes("_seat_")
        ? ticketId.split("_seat_")[0]
        : ticketId;

      const response = await fetch(
        `${API_BASE_URL}orders/my-orders/${orderIdToFetch}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch ticket details");
      }

      if (localTicket) {
        setSelectedTicket(localTicket);
      } else {
        throw new Error("No ticket data returned from server");
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      setError(`Failed to load ticket details: ${err.message}`);

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

  // IMPROVED PDF GENERATION WITH JSBARCODE
  const generateLocalTicketPDF = (ticketId) => {
    const ticket = tickets.find(
      (t) => t._id === ticketId || t.orderId === ticketId
    );

    if (!ticket) {
      setError("Could not find ticket data for local generation");
      return;
    }

    try {
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      const colors = {
        primary: [108, 117, 125],
        secondary: [73, 80, 87],
        dark: [45, 55, 72],
        light: [247, 250, 252],
        white: [255, 255, 255],
        success: [34, 197, 94],
        danger: [239, 68, 68],
        border: [229, 231, 235],
        accent: [224, 88, 41],
      };

      // Background
      doc.setFillColor(...colors.light);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Main ticket card
      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, margin, contentWidth, 240, 5, 5, "F");

      // Card border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(1);
      doc.roundedRect(margin, margin, contentWidth, 240, 5, 5, "S");

      // Header
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, margin, contentWidth, 35, 5, 5, "F");
      doc.rect(margin, margin + 30, contentWidth, 5, "F");

      // Logo
      try {
        doc.addImage(logo, "PNG", margin + 8, margin + 5, 24, 24);
      } catch (logoError) {
        console.log("Logo failed to load, using fallback");
        doc.setFillColor(...colors.white);
        doc.circle(margin + 20, margin + 17.5, 12, "F");
        doc.setTextColor(...colors.primary);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("LOGO", margin + 20, margin + 20, { align: "center" });
      }

      // Event name
      const title =
        ticket.event?.title ||
        ticket.rawOrderData?.eventTitle ||
        ticket.rawOrderData?.event?.title ||
        ticket.rawOrderData?.event?.name ||
        "Event";
      let displayTitle =
        title.length > 40 ? title.substring(0, 37) + "..." : title;

      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(displayTitle, margin + 40, margin + 18);

      // Badge
      doc.setFillColor(...colors.secondary);
      const badgeWidth = 30;
      doc.roundedRect(
        margin + contentWidth - badgeWidth - 5,
        margin + 8,
        badgeWidth,
        20,
        3,
        3,
        "F"
      );

      doc.setTextColor(...colors.white);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(
        "1 TICKET",
        margin + contentWidth - badgeWidth / 2 - 5,
        margin + 20,
        { align: "center" }
      );

      // Content area
      const contentY = margin + 50;
      const leftColWidth = contentWidth * 0.55;
      const rightColStart = margin + leftColWidth + 10;
      const rightColWidth = contentWidth * 0.4;

      // Left column
      let currentY = contentY;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("EVENT INFORMATION", margin + 5, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);

      const eventDate = formatDate(ticket.event?.date || ticket.purchaseDate);
      const eventTime = formatTime(ticket.event?.time);

      doc.text(`Date: ${eventDate}`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Time: ${eventTime}`, margin + 5, currentY);
      currentY += 6;
      doc.text(
        `Location: ${ticket.event?.location || "Location TBA"}`,
        margin + 5,
        currentY
      );
      currentY += 12;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("TICKET HOLDER", margin + 5, currentY);
      currentY += 8;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      doc.text(
        `Name: ${ticket.userInfo?.name || "Guest User"}`,
        margin + 5,
        currentY
      );
      currentY += 6;
      doc.text(
        `Email: ${ticket.userInfo?.email || "No email provided"}`,
        margin + 5,
        currentY
      );
      currentY += 12;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("SEAT ASSIGNMENT", margin + 5, currentY);
      currentY += 8;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);

      const seatInfo = ticket.seat?.name || "General Admission";
      doc.text(`Seat: ${seatInfo}`, margin + 5, currentY);
      currentY += 6;

      if (ticket.seat?.section && ticket.seat?.row && ticket.seat?.number) {
        doc.text(`Section: ${ticket.seat.section}`, margin + 5, currentY);
        currentY += 6;
        doc.text(`Row: ${ticket.seat.row}`, margin + 5, currentY);
        currentY += 6;
        doc.text(`Seat Number: ${ticket.seat.number}`, margin + 5, currentY);
        currentY += 6;
      }
      currentY += 6;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("ORDER DETAILS", margin + 5, currentY);
      currentY += 8;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      const orderIdDisplay = (
        ticket.originalOrderId ||
        ticket.orderId ||
        "N/A"
      ).substring(0, 20);
      doc.text(`Order ID: ${orderIdDisplay}`, margin + 5, currentY);
      currentY += 6;

      if (ticket.bookingId) {
        doc.text(
          `Booking ID: ${ticket.bookingId.substring(0, 20)}`,
          margin + 5,
          currentY
        );
        currentY += 6;
      }

      const purchaseDate = new Date(
        ticket.purchaseDate || ticket.createdAt || Date.now()
      );
      doc.text(
        `Purchased: ${purchaseDate.toLocaleDateString()}`,
        margin + 5,
        currentY
      );

      // Right column
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(
        rightColStart - 5,
        contentY - 10,
        rightColStart - 5,
        contentY + 120
      );

      let rightY = contentY;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("PAYMENT", rightColStart, rightY);
      rightY += 12;

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      const isValidTicket = !ticket.isCancelled;
      doc.setTextColor(...(isValidTicket ? colors.primary : colors.danger));
      const totalPrice = (ticket.grandTotal || ticket.totalPrice || 0).toFixed(
        2
      );
      doc.text(`${totalPrice}`, rightColStart, rightY);
      rightY += 15;

      // BARCODE SECTION USING JSBARCODE
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("VALIDATION", rightColStart, rightY);
      rightY += 10;

      const barcodeId = ticket.ticketCode || "000000000000";

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("BARCODE", rightColStart, rightY);
      rightY += 8;

      // Generate barcode using jsbarcode on a canvas
      try {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, barcodeId, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: ticket.isCancelled ? "#9ca3af" : "#000000",
        });

        // Convert canvas to image and add to PDF
        const barcodeImage = canvas.toDataURL("image/png");
        doc.addImage(
          barcodeImage,
          "PNG",
          rightColStart,
          rightY,
          rightColWidth - 5,
          20
        );
        rightY += 22;
      } catch (barcodeError) {
        console.error("Error generating barcode for PDF:", barcodeError);
        // Fallback text if barcode fails
        doc.setFontSize(8);
        doc.text("Barcode generation failed", rightColStart, rightY);
        rightY += 10;
      }

      // Barcode number
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      doc.text(barcodeId, rightColStart + (rightColWidth - 5) / 2, rightY, {
        align: "center",
      });

      // Footer
      const footerY = margin + 220;

      doc.setFillColor(...colors.light);
      doc.rect(margin, footerY, contentWidth, 35, "F");

      doc.setDrawColor(...colors.border);
      doc.line(margin, footerY, margin + contentWidth, footerY);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);

      const footerText1 =
        "This ticket is valid for entry to the specified event.";
      const footerText2 = isValidTicket
        ? "Present this ticket along with valid ID at the venue entrance."
        : "This ticket has been cancelled. Entry will be denied.";
      const footerText3 = "For support, contact: info@eventsntickets.com.au";

      doc.text(footerText1, margin + contentWidth / 2, footerY + 8, {
        align: "center",
      });
      doc.text(footerText2, margin + contentWidth / 2, footerY + 16, {
        align: "center",
      });
      doc.text(footerText3, margin + contentWidth / 2, footerY + 24, {
        align: "center",
      });

      // Watermark for cancelled tickets
      if (ticket.isCancelled) {
        doc.setFontSize(60);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38, 0.3);
        doc.text("CANCELLED", pageWidth / 2, pageHeight / 2, {
          align: "center",
        });
      }

      // Save PDF
      const shortId = (ticket._id || ticket.orderId || "ticket").substring(
        0,
        8
      );
      const userName = (ticket.userInfo?.name || "user").replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      const eventName = (ticket.event?.title || "event")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 20);
      const seatName = ticket.seat?.name
        ? ticket.seat.name.replace(/[^a-zA-Z0-9]/g, "_")
        : "seat";

      doc.save(`${eventName}_${seatName}_ticket_${userName}_${shortId}.pdf`);
    } catch (err) {
      console.error("Error generating enhanced PDF:", err);
      setError(`Failed to generate PDF: ${err.message}`);
    }
  };

  // Modified downloadTicket function
  const downloadTicket = async (ticketId) => {
    setDownloadLoading(true);
    setError("");

    try {
      console.log("Generating individual ticket PDF locally");
      generateLocalTicketPDF(ticketId);
      setDownloadLoading(false);
      return;
    } catch (err) {
      console.error("Error downloading ticket:", err);
      setError(`Failed to download ticket: ${err.message}`);

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

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
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

      {/* Individual Tickets list */}
      {tickets.length > 0 && (
        <div className="space-y-4 mt-6">
          {tickets.map((ticket, index) => (
            <div
              key={ticket._id || index}
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

              {/* Individual Ticket UI */}
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
                    {ticket.event?.title ||
                      ticket.rawOrderData?.eventTitle ||
                      ticket.rawOrderData?.event?.title ||
                      ticket.rawOrderData?.event?.name ||
                      "Event Details Loading..."}
                  </div>
                  <div
                    className={`text-sm ${
                      ticket.isCancelled
                        ? "bg-gray-800 bg-opacity-50"
                        : "bg-orange-900 bg-opacity-50"
                    } rounded px-2 py-1 text-white`}
                  >
                    Single Ticket
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

                    {/* Individual Seat section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-2">
                        Seat Assignment:
                      </h4>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                        <div className="font-bold text-orange-800 text-lg">
                          {ticket.seat?.name || "General Admission"}
                        </div>
                        {ticket.seat?.section &&
                          ticket.seat?.row &&
                          ticket.seat?.number && (
                            <div className="text-sm text-orange-600 mt-1">
                              Section {ticket.seat.section} • Row{" "}
                              {ticket.seat.row} • Seat {ticket.seat.number}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Order info */}
                    <div className="text-sm text-gray-500 mt-4 flex items-center gap-1">
                      <FileText size={16} />
                      <span>
                        Order ID:{" "}
                        {ticket.originalOrderId || ticket.orderId || "N/A"}
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

                    {/* Barcode Display */}
                    <div className="mt-4 mb-4 md:mb-0">
                      <BarcodeDisplay
                        ticketCode={ticket.ticketCode}
                        isCancelled={ticket.isCancelled}
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

                      {!ticket.isCancelled && (
                        <>
                          <button
                            onClick={() => downloadTicket(ticket._id)}
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

      {/* Cancel Confirmation Modal - REMOVED AS REQUESTED */}
      {showCancelModal && ticketToCancel && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
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
            <div
              className={`${
                selectedTicket.isCancelled
                  ? "bg-gradient-to-r from-gray-600 to-gray-500"
                  : "bg-gradient-to-r from-orange-700 to-orange-500"
              } p-4 flex justify-between items-center`}
            >
              <h3 className="text-xl font-bold text-white">
                Individual Ticket Details{" "}
                {selectedTicket.isCancelled && "(Cancelled)"}
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

            <div className="p-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                        {selectedTicket.seat?.section &&
                          selectedTicket.seat?.row &&
                          selectedTicket.seat?.number && (
                            <p className="text-sm text-gray-600">
                              Section {selectedTicket.seat.section} • Row{" "}
                              {selectedTicket.seat.row} • Seat{" "}
                              {selectedTicket.seat.number}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

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
                            ${getTicketPrice(selectedTicket).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 border-t border-gray-200 pt-6">
                <h4 className="font-bold text-gray-700 mb-3">Ticket Preview</h4>
                <div
                  className={`rounded-lg border border-gray-300 overflow-hidden shadow-md ${
                    selectedTicket.isCancelled
                      ? "opacity-60 grayscale"
                      : "bg-white"
                  }`}
                >
                  <div
                    className={`p-3 flex justify-between items-center ${
                      selectedTicket.isCancelled
                        ? "bg-gradient-to-r from-gray-600 to-gray-500"
                        : "bg-gradient-to-r from-orange-700 to-orange-500"
                    }`}
                  >
                    <div className="font-bold text-white truncate">
                      {selectedTicket.event?.title ||
                        selectedTicket.rawOrderData?.eventTitle ||
                        selectedTicket.rawOrderData?.event?.title ||
                        selectedTicket.rawOrderData?.event?.name ||
                        "Event Details Loading..."}
                    </div>
                    <div
                      className={`text-xs rounded px-2 py-1 text-white ${
                        selectedTicket.isCancelled
                          ? "bg-gray-800 bg-opacity-50"
                          : "bg-orange-900 bg-opacity-50"
                      }`}
                    >
                      Single Ticket
                    </div>
                  </div>

                  {selectedTicket.isCancelled && (
                    <div className="bg-red-500 text-white text-center py-1 text-xs font-bold">
                      CANCELLED
                    </div>
                  )}

                  <div className="p-4 flex justify-between">
                    <div className="w-2/3">
                      <div className="flex flex-col space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Event</div>
                          <div className="font-medium">
                            {selectedTicket.event?.title ||
                              selectedTicket.rawOrderData?.eventTitle ||
                              selectedTicket.rawOrderData?.event?.title ||
                              selectedTicket.rawOrderData?.event?.name ||
                              "Event Details Loading..."}
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

                        <div>
                          <div className="text-xs text-gray-500">Seat</div>
                          <div className="font-medium">
                            {selectedTicket.seat?.name || "General Admission"}
                          </div>
                        </div>
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
                          ${getTicketPrice(selectedTicket).toFixed(2)}
                        </div>
                      </div>

                      <div className="mt-2">
                        <BarcodeDisplay
                          ticketCode={selectedTicket.ticketCode}
                          isCancelled={selectedTicket.isCancelled}
                          size="large"
                        />
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
                      onClick={() => downloadTicket(selectedTicket._id)}
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