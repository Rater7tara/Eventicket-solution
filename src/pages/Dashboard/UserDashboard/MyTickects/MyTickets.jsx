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
        const charCode = data.charCodeAt(i);
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
          return true;
        }
        // If it's an object (single purchase), wrap it in an array
        else if (
          ticketPurchases &&
          typeof ticketPurchases === "object" &&
          !Array.isArray(ticketPurchases)
        ) {
          setTickets([ticketPurchases]);
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

  // Function to convert orders to individual seat tickets
  // const convertOrdersToIndividualTickets = (orders) => {
  //   const individualTickets = [];

  //   orders.forEach((order) => {
  //     // ENHANCED CANCELLED STATUS DETECTION
  //     const isCancelled =
  //       order.status === "cancelled" ||
  //       order.status === "canceled" ||
  //       order.status === "CANCELLED" ||
  //       order.status === "CANCELED" ||
  //       order.paymentStatus === "cancelled" ||
  //       order.paymentStatus === "canceled" ||
  //       order.paymentStatus === "CANCELLED" ||
  //       order.paymentStatus === "CANCELED" ||
  //       order.paymentStatus === "refunded" ||
  //       order.paymentStatus === "REFUNDED" ||
  //       order.paymentStatus === "failed" ||
  //       order.paymentStatus === "FAILED" ||
  //       order.orderStatus === "cancelled" ||
  //       order.orderStatus === "canceled" ||
  //       order.orderStatus === "CANCELLED" ||
  //       order.orderStatus === "CANCELED" ||
  //       order.bookingStatus === "cancelled" ||
  //       order.bookingStatus === "canceled" ||
  //       order.bookingStatus === "CANCELLED" ||
  //       order.bookingStatus === "CANCELED" ||
  //       order.cancellationDate ||
  //       order.cancelledAt ||
  //       order.cancelled_at ||
  //       order.refundAmount > 0 ||
  //       order.refund_amount > 0;

  //     // If there are seats, create individual tickets for each seat
  //     if (order.seats && order.seats.length > 0) {
  //       order.seats.forEach((seat, seatIndex) => {
  //         // Enhanced price calculation for individual seats
  //         const seatPrice = seat.price || seat.seatPrice || seat.amount || 
  //                          (order.totalAmount / order.seats.length) || 
  //                          order.amount || order.price || 0;
          
  //         individualTickets.push({
  //           _id: `${order._id}_seat_${seatIndex}`,
  //           orderId: order._id,
  //           bookingId: order.bookingId,
  //           originalOrderId: order._id,
  //           seatIndex: seatIndex,
  //           event: null, // Will be populated later
  //           seat: {
  //             section: seat.section,
  //             row: seat.row,
  //             number: seat.seatNumber,
  //             price: seatPrice,
  //             name: `${seat.section} ${seat.row}${seat.seatNumber}`,
  //           },
  //           quantity: 1, // Each ticket is for one seat
  //           totalPrice: seatPrice,
  //           grandTotal: seatPrice,
  //           purchaseDate: order.orderTime || order.createdAt,
  //           createdAt: order.createdAt,
  //           paymentStatus: order.paymentStatus || "Unknown",
  //           isCancelled: isCancelled,
  //           rawOrderData: order,
  //           userInfo: {
  //             name:
  //               user?.name ||
  //               user?.firstName + " " + user?.lastName ||
  //               "Guest User",
  //             email: user?.email || "No email provided",
  //           },
  //         });
  //       });
  //     } else {
  //       // If no seats, create a general admission ticket
  //       // Enhanced price calculation for general admission
  //       const ticketPrice = order.totalAmount || order.amount || order.price || 
  //                          order.grandTotal || order.total || order.cost || 0;
        
  //       individualTickets.push({
  //         _id: order._id,
  //         orderId: order._id,
  //         bookingId: order.bookingId,
  //         originalOrderId: order._id,
  //         seatIndex: 0,
  //         event: null, // Will be populated later
  //         seat: {
  //           name: "General Admission",
  //           section: "GA",
  //           row: "",
  //           number: "",
  //           price: ticketPrice,
  //         },
  //         quantity: order.quantity || 1,
  //         totalPrice: ticketPrice,
  //         grandTotal: ticketPrice,
  //         purchaseDate: order.orderTime || order.createdAt,
  //         createdAt: order.createdAt,
  //         paymentStatus: order.paymentStatus || "Unknown",
  //         isCancelled: isCancelled,
  //         rawOrderData: order,
  //         userInfo: {
  //           name:
  //             user?.name ||
  //             user?.firstName + " " + user?.lastName ||
  //             "Guest User",
  //           email: user?.email || "No email provided",
  //         },
  //       });
  //     }
  //   });

  //   return individualTickets;
  // };

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

        // Convert orders to individual tickets
        const individualTickets = convertOrdersToIndividualTickets(data.data);

        // Fetch event details for each unique event
        const uniqueEventIds = [...new Set(individualTickets.map(ticket => ticket.rawOrderData.eventId).filter(Boolean))];
        const eventDetailsMap = {};

        for (const eventId of uniqueEventIds) {
          const eventDetails = await fetchEventDetails(eventId);
          eventDetailsMap[eventId] = eventDetails;
        }

        // Update tickets with event details
        const ticketsWithEventDetails = individualTickets.map(ticket => {
          const eventId = ticket.rawOrderData.eventId;
          const eventDetails = eventDetailsMap[eventId];

          return {
            ...ticket,
            event: eventDetails || {
              title: `Order ${ticket.originalOrderId.substring(0, 8)}`,
              date: ticket.purchaseDate,
              time: "19:00",
              location: "Venue details unavailable",
              description: "Event details unavailable",
            },
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

        console.log("Final formatted individual tickets:", sortedTickets);
        setTickets(sortedTickets);
      } else if (data.success && data.data) {
        // Handle single order response
        const order = data.data;
        console.log("Processing single order:", order);

        const individualTickets = convertOrdersToIndividualTickets([order]);

        // Fetch event details if available
        if (order.eventId) {
          const eventDetails = await fetchEventDetails(order.eventId);
          individualTickets.forEach(ticket => {
            ticket.event = eventDetails;
          });
        }

        setTickets(individualTickets);
      } else {
        // If API returns empty or incorrect data, try localStorage as fallback
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

      // Try to load from localStorage as fallback
      loadLocalTickets();
    } finally {
      setLoading(false);
    }
  };

// FIXED: Enhanced Cancel Ticket Function with better bookingId handling
const cancelTicket = async (ticket) => {
  setCancelLoading(true);
  setError("");

  try {
    // Check if ticket is already cancelled
    if (ticket.isCancelled) {
      // Remove already cancelled tickets from the list
      setTickets((prevTickets) =>
        prevTickets.filter((t) => 
          t._id !== ticket._id && 
          t.orderId !== ticket.orderId && 
          t.bookingId !== ticket.bookingId
        )
      );
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

    // ENHANCED: Multiple ways to find bookingId
    let bookingIdToUse = null;
    
    // Try different sources for bookingId
    const possibleBookingIds = [
      ticket.bookingId,
      ticket.rawOrderData?.bookingId,
      ticket.rawOrderData?._id,
      ticket.originalOrderId,
      ticket.orderId,
      ticket._id.includes('_seat_') ? ticket._id.split('_seat_')[0] : ticket._id
    ];

    // Find the first valid booking ID
    for (const id of possibleBookingIds) {
      if (id && typeof id === 'string' && id.trim() !== '') {
        bookingIdToUse = id;
        break;
      }
    }

    console.log("Available booking ID options:", possibleBookingIds);
    console.log("Using booking ID:", bookingIdToUse);

    // Validate that we have a booking ID
    if (!bookingIdToUse) {
      // Try to fetch the latest order data to get booking ID
      try {
        const orderIdToFetch = ticket.originalOrderId || ticket.orderId || ticket._id;
        const orderResponse = await fetch(`${API_BASE_URL}orders/my-orders/${orderIdToFetch}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          if (orderData.success && orderData.data) {
            bookingIdToUse = orderData.data.bookingId || orderData.data._id;
            console.log("Found booking ID from order fetch:", bookingIdToUse);
          }
        }
      } catch (fetchError) {
        console.error("Failed to fetch order for booking ID:", fetchError);
      }

      // If still no booking ID, show detailed error
      if (!bookingIdToUse) {
        const debugInfo = {
          ticketId: ticket._id,
          orderId: ticket.orderId,
          originalOrderId: ticket.originalOrderId,
          rawOrderData: ticket.rawOrderData ? Object.keys(ticket.rawOrderData) : 'No rawOrderData',
          allTicketKeys: Object.keys(ticket)
        };
        
        console.error("No valid booking ID found. Debug info:", debugInfo);
        throw new Error(
          `Booking ID is missing. Cannot cancel this ticket. Please contact support with Order ID: ${ticket.originalOrderId || ticket.orderId || 'Unknown'}`
        );
      }
    }

    // Prepare request body with multiple possible formats
    const requestBody = {
      bookingId: bookingIdToUse,
    };

    // Add alternative ID fields that the API might expect
    if (ticket.originalOrderId && ticket.originalOrderId !== bookingIdToUse) {
      requestBody.orderId = ticket.originalOrderId;
    }
    if (ticket.orderId && ticket.orderId !== bookingIdToUse) {
      requestBody.orderId = ticket.orderId;
    }

    console.log("Cancelling ticket with request body:", requestBody);

    // Try the primary cancel endpoint
    let response = await fetch(`${API_BASE_URL}payments/booking/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    let data = await response.json();
    console.log("Cancel API response:", { status: response.status, data });

    // If primary endpoint fails, try alternative endpoints
    if (!response.ok) {
      console.log("Primary cancel endpoint failed, trying alternatives...");
      
      // Try alternative endpoint 1: /orders/cancel
      try {
        response = await fetch(`${API_BASE_URL}orders/cancel`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        data = await response.json();
        console.log("Alternative endpoint 1 response:", { status: response.status, data });
      } catch (altError) {
        console.log("Alternative endpoint 1 failed:", altError);
      }

      // Try alternative endpoint 2: /bookings/cancel
      if (!response.ok) {
        try {
          response = await fetch(`${API_BASE_URL}bookings/cancel`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
          data = await response.json();
          console.log("Alternative endpoint 2 response:", { status: response.status, data });
        } catch (altError) {
          console.log("Alternative endpoint 2 failed:", altError);
        }
      }

      // Try alternative endpoint 3: DELETE method
      if (!response.ok) {
        try {
          response = await fetch(`${API_BASE_URL}payments/booking/${bookingIdToUse}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          data = await response.json();
          console.log("DELETE endpoint response:", { status: response.status, data });
        } catch (altError) {
          console.log("DELETE endpoint failed:", altError);
        }
      }
    }

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
          // If booking is already cancelled or not found, REMOVE the ticket from the list
          setTickets((prevTickets) =>
            prevTickets.filter((t) => 
              t._id !== ticket._id && 
              t.orderId !== ticket.orderId && 
              t.bookingId !== ticket.bookingId
            )
          );
          setShowCancelModal(false);
          setTicketToCancel(null);
          return; // Exit the function early
        }
      }

      // For other errors, provide detailed error message
      const errorDetails = {
        status: response.status,
        message: data.message || 'Unknown error',
        bookingIdUsed: bookingIdToUse,
        endpoint: `${API_BASE_URL}payments/booking/cancel`
      };
      
      throw new Error(
        `Failed to cancel ticket: ${data.message || 'Unknown error'} (Status: ${response.status}). Booking ID used: ${bookingIdToUse}`
      );
    }

    // If cancellation was successful, REMOVE the ticket from the list
    setTickets((prevTickets) =>
      prevTickets.filter((t) => 
        t._id !== ticket._id && 
        t.orderId !== ticket.orderId && 
        t.bookingId !== ticket.bookingId
      )
    );

    setShowCancelModal(false);
    setTicketToCancel(null);
    
    // Show success message
    console.log("Ticket cancelled successfully");
    
  } catch (err) {
    console.error("Error cancelling ticket:", err);
    setError(`Failed to cancel ticket: ${err.message}`);
  } finally {
    setCancelLoading(false);
  }
};

// ENHANCED: Better bookingId validation for showing cancel confirmation
const showCancelConfirmation = (ticket) => {
  // Check if ticket is already cancelled
  if (ticket.isCancelled) {
    return;
  }

  // Enhanced check for bookingId with multiple fallbacks
  const possibleBookingIds = [
    ticket.bookingId,
    ticket.rawOrderData?.bookingId,
    ticket.rawOrderData?._id,
    ticket.originalOrderId,
    ticket.orderId,
    ticket._id.includes('_seat_') ? ticket._id.split('_seat_')[0] : ticket._id
  ];

  const hasValidBookingId = possibleBookingIds.some(id => id && typeof id === 'string' && id.trim() !== '');

  if (!hasValidBookingId) {
    setError(
      `Cannot cancel this ticket - no valid booking ID found. Please contact support with Order ID: ${ticket.originalOrderId || ticket.orderId || 'Unknown'}`
    );
    return;
  }

  setTicketToCancel(ticket);
  setShowCancelModal(true);
};

// ENHANCED: Better error handling in convertOrdersToIndividualTickets
const convertOrdersToIndividualTickets = (orders) => {
  const individualTickets = [];

  orders.forEach((order) => {
    // ENHANCED CANCELLED STATUS DETECTION
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

    // ENHANCED: Ensure we capture the booking ID properly
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
        // Enhanced price calculation for individual seats
        const seatPrice = seat.price || seat.seatPrice || seat.amount || 
                         (order.totalAmount / order.seats.length) || 
                         order.amount || order.price || 0;
        
        individualTickets.push({
          _id: `${order._id}_seat_${seatIndex}`,
          orderId: order._id,
          bookingId: ensureBookingId(order), // ENHANCED booking ID
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
          isCancelled: isCancelled,
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
      // Enhanced price calculation for general admission
      const ticketPrice = order.totalAmount || order.amount || order.price || 
                         order.grandTotal || order.total || order.cost || 0;
      
      individualTickets.push({
        _id: order._id,
        orderId: order._id,
        bookingId: ensureBookingId(order), // ENHANCED booking ID
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
        isCancelled: isCancelled,
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

  // Debug: Log the booking IDs for verification
  console.log("Generated tickets with booking IDs:", 
    individualTickets.map(t => ({ 
      ticketId: t._id, 
      bookingId: t.bookingId, 
      orderId: t.orderId 
    }))
  );

  return individualTickets;
};

  // Function to show cancel confirmation modal
  // const showCancelConfirmation = (ticket) => {
  //   // Check if ticket is already cancelled
  //   if (ticket.isCancelled) {
  //     return;
  //   }

  //   // Check if bookingId exists
  //   if (!ticket.bookingId) {
  //     setError("Cannot cancel this ticket - booking ID is missing.");
  //     return;
  //   }

  //   setTicketToCancel(ticket);
  //   setShowCancelModal(true);
  // };

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
      // First check if we have this ticket in our state already
      const localTicket = tickets.find(
        (ticket) => ticket._id === ticketId || ticket.orderId === ticketId
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

      // Extract original order ID if this is an individual seat ticket
      const orderIdToFetch = ticketId.includes("_seat_") 
        ? ticketId.split("_seat_")[0] 
        : ticketId;

      // Call the ticket details API with the correct endpoint
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

      // Parse the response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch ticket details");
      }

      // Set selected ticket based on local ticket if available
      if (localTicket) {
        setSelectedTicket(localTicket);
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

  // IMPROVED PDF GENERATION WITH SAME BARCODE
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

      // Set up dimensions and colors
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      
      // Color palette (RGB values for jsPDF) - Updated with gray header
      const colors = {
        primary: [108, 117, 125],    // Gray for header background
        secondary: [73, 80, 87],     // Darker gray
        dark: [45, 55, 72],          // Dark gray
        light: [247, 250, 252],      // Light gray
        white: [255, 255, 255],
        success: [34, 197, 94],      // Green
        danger: [239, 68, 68],       // Red
        border: [229, 231, 235],     // Border gray
        accent: [224, 88, 41]        // Orange for accents
      };

      // ----- MAIN TICKET CONTAINER -----
      
      // Background with subtle gradient effect
      doc.setFillColor(...colors.light);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Main ticket card
      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, margin, contentWidth, 240, 5, 5, "F");
      
      // Card border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(1);
      doc.roundedRect(margin, margin, contentWidth, 240, 5, 5, "S");

      // ----- HEADER SECTION -----
      
      // Main header background
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, margin, contentWidth, 35, 5, 5, "F");
      
      // Header bottom rectangle to square off bottom corners
      doc.rect(margin, margin + 30, contentWidth, 5, "F");

      // Add your imported logo
      try {
        // Use your imported logo (supports PNG, JPG, JPEG)
        doc.addImage(logo, 'PNG', margin + 8, margin + 5, 24, 24);
      } catch (logoError) {
        console.log("Logo failed to load, using fallback");
        // Fallback to text logo if image fails
        doc.setFillColor(...colors.white);
        doc.circle(margin + 20, margin + 17.5, 12, "F");
        doc.setTextColor(...colors.primary);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("LOGO", margin + 20, margin + 20, { align: "center" });
      }
      
      // Event name in header
      const title = ticket.event?.title || "Untitled Event";
      let displayTitle = title.length > 40 ? title.substring(0, 37) + "..." : title;
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(displayTitle, margin + 40, margin + 18);
      
      // Single ticket badge
      doc.setFillColor(...colors.secondary);
      const badgeWidth = 30;
      doc.roundedRect(margin + contentWidth - badgeWidth - 5, margin + 8, badgeWidth, 20, 3, 3, "F");
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("1 TICKET", margin + contentWidth - badgeWidth/2 - 5, margin + 20, { align: "center" });

      // ----- MAIN CONTENT AREA -----
      
      const contentY = margin + 50; // Start content right after header
      const leftColWidth = contentWidth * 0.55;
      const rightColStart = margin + leftColWidth + 10;
      const rightColWidth = contentWidth * 0.4;

      // ----- LEFT COLUMN: EVENT & TICKET DETAILS -----
      
      let currentY = contentY;
      
      // Section: Event Information
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("EVENT INFORMATION", margin + 5, currentY);
      currentY += 8;
      
      // Date & Time
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      
      const eventDate = formatDate(ticket.event?.date || ticket.purchaseDate);
      const eventTime = formatTime(ticket.event?.time);
      
      doc.text(`Date: ${eventDate}`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Time: ${eventTime}`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Location: ${ticket.event?.location || "Location TBA"}`, margin + 5, currentY);
      currentY += 12;
      
      // Section: Ticket Holder Information
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("TICKET HOLDER", margin + 5, currentY);
      currentY += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      doc.text(`Name: ${ticket.userInfo?.name || "Guest User"}`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Email: ${ticket.userInfo?.email || "No email provided"}`, margin + 5, currentY);
      currentY += 12;
      
      // Section: Seat Information
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
      
      // Section: Order Information
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("ORDER DETAILS", margin + 5, currentY);
      currentY += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      const orderIdDisplay = (ticket.originalOrderId || ticket.orderId || "N/A").substring(0, 20);
      doc.text(`Order ID: ${orderIdDisplay}`, margin + 5, currentY);
      currentY += 6;
      
      if (ticket.bookingId) {
        doc.text(`Booking ID: ${ticket.bookingId.substring(0, 20)}`, margin + 5, currentY);
        currentY += 6;
      }
      
      const purchaseDate = new Date(ticket.purchaseDate || ticket.createdAt || Date.now());
      doc.text(`Purchased: ${purchaseDate.toLocaleDateString()}`, margin + 5, currentY);

      // ----- RIGHT COLUMN: PRICING & VALIDATION -----
      
      // Right column border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(rightColStart - 5, contentY - 10, rightColStart - 5, contentY + 120);
      
      let rightY = contentY;
      
      // Price section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("PAYMENT", rightColStart, rightY);
      rightY += 12;
      
      // Total price - larger and prominent
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      const isValidTicket = !ticket.isCancelled;
      doc.setTextColor(...(isValidTicket ? colors.primary : colors.danger));
      const totalPrice = (ticket.grandTotal || ticket.totalPrice || 0).toFixed(2);
      doc.text(`${totalPrice}`, rightColStart, rightY);
      rightY += 15;
      
      // Enhanced Barcode section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.accent);
      doc.text("VALIDATION", rightColStart, rightY);
      rightY += 10;
      
      // Generate the SAME barcode as display
      const barcodeId = generateBarcode(ticket._id, ticket.seat?.name);
      
      // Barcode
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("BARCODE", rightColStart, rightY);
      rightY += 8;
      
      // Generate IDENTICAL barcode pattern as in display component
      const generateRealisticBarcodePDF = (data) => {
        const bars = [];
        
        // Start pattern for Code 128 (same as display)
        bars.push({ type: 'bar', width: 2 });
        bars.push({ type: 'space', width: 1 });
        bars.push({ type: 'bar', width: 1 });
        bars.push({ type: 'space', width: 1 });
        bars.push({ type: 'bar', width: 1 });
        bars.push({ type: 'space', width: 1 });
        
        // Data pattern based on barcode ID (IDENTICAL to display)
        for (let i = 0; i < data.length; i++) {
          const digit = parseInt(data[i]) || 0;
          
          // Create realistic barcode pattern based on digit value (SAME LOGIC)
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
        
        // End pattern for Code 128 (same as display)
        bars.push({ type: 'bar', width: 2 });
        bars.push({ type: 'space', width: 1 });
        bars.push({ type: 'bar', width: 1 });
        bars.push({ type: 'space', width: 1 });
        bars.push({ type: 'bar', width: 1 });
        bars.push({ type: 'space', width: 1 });
        bars.push({ type: 'bar', width: 2 });
        
        return bars;
      };

      // Create barcode background
      doc.setFillColor(250, 250, 250);
      const barcodeHeight = 25;
      doc.rect(rightColStart, rightY, rightColWidth - 5, barcodeHeight, "F");
      
      // Generate the SAME barcode pattern as display
      const barPattern = generateRealisticBarcodePDF(barcodeId);
      doc.setFillColor(...colors.dark);
      
      let barX = rightColStart + 2;
      const barSpacing = (rightColWidth - 10) / barPattern.length;
      
      // Draw each bar with exact same pattern as display
      barPattern.forEach((element, i) => {
        if (element.type === 'bar') {
          const barWidth = element.width * 0.8; // Scale for PDF
          const barHeight = barcodeHeight * 0.8;
          const barY = rightY + (barcodeHeight - barHeight) / 2;
          
          doc.rect(barX, barY, barWidth, barHeight, "F");
        }
        barX += barSpacing;
      });
      
      rightY += barcodeHeight + 5;
      
      // Barcode number
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      doc.text(barcodeId, rightColStart + (rightColWidth - 5) / 2, rightY, { align: "center" });

      // ----- FOOTER SECTION -----
      
      const footerY = margin + 220;
      
      // Footer background
      doc.setFillColor(...colors.light);
      doc.rect(margin, footerY, contentWidth, 35, "F");
      
      // Footer border
      doc.setDrawColor(...colors.border);
      doc.line(margin, footerY, margin + contentWidth, footerY);
      
      // Terms and conditions
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.dark);
      
      const footerText1 = "This ticket is valid for entry to the specified event.";
      const footerText2 = isValidTicket 
        ? "Present this ticket along with valid ID at the venue entrance."
        : "This ticket has been cancelled. Entry will be denied.";
      const footerText3 = "For support, contact: info@eventsntickets.com.au";
      
      doc.text(footerText1, margin + contentWidth/2, footerY + 8, { align: "center" });
      doc.text(footerText2, margin + contentWidth/2, footerY + 16, { align: "center" });
      doc.text(footerText3, margin + contentWidth/2, footerY + 24, { align: "center" });
      
      // Watermark for cancelled tickets
      if (ticket.isCancelled) {
        doc.setFontSize(60);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38, 0.3);
        doc.text("CANCELLED", pageWidth/2, pageHeight/2, { 
          align: "center"
        });
      }

      // Save the PDF with descriptive filename
      const shortId = (ticket._id || ticket.orderId || "ticket").substring(0, 8);
      const userName = (ticket.userInfo?.name || "user").replace(/[^a-zA-Z0-9]/g, "_");
      const eventName = (ticket.event?.title || "event").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
      const seatName = ticket.seat?.name ? ticket.seat.name.replace(/[^a-zA-Z0-9]/g, "_") : "seat";
      
      doc.save(`${eventName}_${seatName}_ticket_${userName}_${shortId}.pdf`);
      
    } catch (err) {
      console.error("Error generating enhanced PDF:", err);
      setError(`Failed to generate PDF: ${err.message}`);
    }
  };

  // Modified downloadTicket function that prioritizes local generation
  const downloadTicket = async (ticketId) => {
    setDownloadLoading(true);
    setError("");

    try {
      // Generate the PDF locally first to avoid API errors
      console.log("Generating individual ticket PDF locally");
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

      {/* Error Messages Only - Removed Status Messages */}
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
                    {ticket.event?.title || "Event Title Loading..."}
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
                        {ticket.seat?.section && ticket.seat?.row && ticket.seat?.number && (
                          <div className="text-sm text-orange-600 mt-1">
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
                      <div
                        className={`text-2xl font-bold mb-2 ${
                          ticket.isCancelled
                            ? "text-gray-500 line-through"
                            : "text-orange-600"
                        }`}
                      >
                        $
                        {getTicketPrice(ticket).toFixed(2)}
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
                        isCancelled={ticket.isCancelled}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() =>
                          viewTicketDetails(ticket._id)
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
                              downloadTicket(ticket._id)
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
            <div
              className={`${
                selectedTicket.isCancelled
                  ? "bg-gradient-to-r from-gray-600 to-gray-500"
                  : "bg-gradient-to-r from-orange-700 to-orange-500"
              } p-4 flex justify-between items-center`}
            >
              <h3 className="text-xl font-bold text-white">
                Individual Ticket Details {selectedTicket.isCancelled && "(Cancelled)"}
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
                            {getTicketPrice(selectedTicket).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                      Single Ticket
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
                          $
                          {getTicketPrice(selectedTicket).toFixed(2)}
                        </div>
                      </div>

                      {/* Enhanced Barcode in preview */}
                      <div className="mt-2">
                        <BarcodeDisplay 
                          ticketId={selectedTicket._id}
                          seatInfo={selectedTicket.seat?.name}
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
                        downloadTicket(selectedTicket._id)
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