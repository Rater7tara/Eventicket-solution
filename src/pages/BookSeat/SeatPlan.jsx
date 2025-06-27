import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import serverURL from "../../ServerConfig";
import authServiceInstance from "../../services/AuthService";
import { AuthContext } from "../../providers/AuthProvider";
import SeatPlanView from "./SeatPlanView";

const SeatPlan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  // State management
  const [selectedSeats, setSelectedSeats] = useState(
    location.state?.selectedSeats || []
  );
  const [activeSection, setActiveSection] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [timerActive, setTimerActive] = useState(true);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [bookedSeatsData, setBookedSeatsData] = useState([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [userData, setUserData] = useState(location.state?.userData || null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [timerStartTime, setTimerStartTime] = useState(null);

  // Props from location state
  const eventDetails = location.state?.event || {};
  const ticketType = location.state?.ticketType || {};
  const quantity = location.state?.quantity || 1;
  const mode = location.state?.mode || "book";
  const sellerId = location.state?.sellerId || null;

  // Timer persistence key (only used for cleanup on successful booking)
  const timerKey = `timer_${eventDetails._id || eventDetails.id}_${mode}`;

  // Event handlers
  const handleTimerExpire = () => {
    setTimerActive(false);
    setShowTimeoutModal(true);
    setSelectedSeats([]);
  };

  const handleTimeoutOk = () => {
    setShowTimeoutModal(false);
    navigate("/");
  };

  const handleExtendTime = () => {
    // This function is no longer used since we removed the "Try Again" button
    setShowTimeoutModal(false);
    setTimerActive(true);
  };

  // Clean up timer when booking is successful
  const cleanupTimer = () => {
    localStorage.removeItem(timerKey);
    setTimerActive(false);
  };

  // Initialize timer - ALWAYS start fresh when entering the page
  useEffect(() => {
    // Clear any existing timer data first
    localStorage.removeItem(timerKey);
    
    // Start fresh timer
    const startTime = Date.now();
    setTimerStartTime(startTime);
    setTimerActive(true);
    
    console.log('Fresh timer started for 10 minutes');

    // Cleanup function to clear timer when component unmounts
    return () => {
      console.log('Component unmounting - timer stopped');
      setTimerActive(false);
    };
  }, []); // Empty dependency array to run only on mount/unmount

  // Configuration
 const sections = [
  {
    id: "greenfield-vip-zone",
    name: "Greenfield VIP Zone",
    price: 200,
    color: "#FF0000",
    rows: 2,
    seatsPerRow: 20,
    columns: 2,
    requiresContact: true,
    description: "Premium VIP seating with the best view of the stage. Contact organizer for bookings.",
  },
  {
    id: "alfa-college-zone",
    name: "Alfa College Zone",
    price: 160,
    color: "#FF4500",
    rows: 3,
    seatsPerRow: 20,
    columns: 2,
    rowStart: 2,
  },
  {
    id: "luminedge-zone",
    name: "Luminedge Zone",
    price: 120,
    color: "#FF7F00",
    rows: 5,
    seatsPerRow: 20,
    columns: 2,
  },
  {
    id: "ample-accounting-zone",
    name: "Ample Accounting Zone",
    price: 80,
    color: "#9400D3",
    rows: 8,
    seatsPerRow: 30,
    columns: 2,
  },
  {
    id: "betawatt-zone",
    name: "BetaWatt Zone",
    price: 70,
    color: "#4169E1",
    rows: 8,
    seatsPerRow: 30,
    columns: 2,
  },
  {
    id: "gamma-college-zone",
    name: "Gamma College Zone",
    price: 60,
    color: "#8A2BE2",
    rows: 13,
    specialLayout: true,
    columnSeats: [
      { start: 1, end: 8 },
      { start: 9, end: 24 },
      { start: 25, end: 38 },
      { start: 39, end: 54 },
      { start: 55, end: 62 },
    ],
  },
];

  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  // Effect hooks
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!userData) {
      try {
        const storedUserData = JSON.parse(localStorage.getItem("userData"));
        if (!storedUserData) {
          const userInfo = JSON.parse(localStorage.getItem("user-info"));
          if (userInfo) {
            console.log("Loaded user data from user-info:", userInfo);
            setUserData(userInfo);
          }
        } else {
          console.log("Loaded user data from localStorage:", storedUserData);
          setUserData(storedUserData);
        }
      } catch (error) {
        console.error("Error loading user data from localStorage:", error);
      }
    }
  }, [userData]);

  useEffect(() => {
    fetchBookedSeats();
  }, [eventDetails._id, eventDetails.id]);

  useEffect(() => {
    if (!eventDetails || Object.keys(eventDetails).length === 0) {
      console.error("No event details found in location state");
      navigate("/");
    }
    if (userData) {
      console.log("User data in SeatPlan:", userData);
    }
  }, [eventDetails, userData, navigate]);

  useEffect(() => {
    if (bookedSeatsData.length > 0) {
      console.log("Booked seats loaded:", bookedSeatsData);
      console.log("Number of booked seats:", bookedSeatsData.length);
    }
  }, [bookedSeatsData]);

  // API functions
  const fetchBookedSeats = async () => {
    if (!eventDetails._id && !eventDetails.id) {
      setIsLoadingSeats(false);
      return;
    }

    try {
      setIsLoadingSeats(true);
      const token =
        authServiceInstance.getToken() ||
        (authContext && authContext.authToken) ||
        localStorage.getItem("auth-token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const eventId = eventDetails._id || eventDetails.id;
      const response = await fetch(
        `${serverURL.url}bookings/booked-seats/${eventId}`,
        {
          method: "GET",
          headers: headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch booked seats data");
      }

      const data = await response.json();
      console.log("Booked seats API response:", data);

      if (data.success && data.seats && data.seats.length > 0) {
        setBookedSeatsData(data.seats);
        console.log("Booked seats loaded:", data.seats);
        console.log("Total booked seats:", data.totalSeats || data.seats.length);

        data.seats.forEach((seat, index) => {
          console.log(`Booked seat ${index + 1}:`, {
            section: seat.section,
            row: seat.row,
            seatNumber: seat.seatNumber,
            id: seat._id,
          });
        });
      } else {
        console.log("No booked seats found for this event");
        setBookedSeatsData([]);
      }
    } catch (error) {
      console.error("Error fetching booked seats:", error);
      setBookedSeatsData([]);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  // Utility functions
  const formatEventDate = (dateString) => {
    if (!dateString) return "Date TBA";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatEventTime = (timeString) => {
    if (!timeString) return "Time TBA";
    try {
      let timeToFormat;
      if (timeString.includes("T")) {
        timeToFormat = new Date(timeString);
      } else {
        const [hours, minutes] = timeString.split(":");
        timeToFormat = new Date();
        timeToFormat.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      return timeToFormat.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  };

  const isSeatBooked = (section, row, seatNumber) => {
    if (isLoadingSeats) return false;

    return bookedSeatsData.some((bookedSeat) => {
      const bookedSeatNumber = parseInt(bookedSeat.seatNumber);
      const currentSeatNumber = parseInt(seatNumber);

      const matches =
        bookedSeat.section === section &&
        bookedSeat.row === row &&
        bookedSeatNumber === currentSeatNumber;

      if (matches) {
        console.log(`Seat ${section} ${row}${seatNumber} is booked:`, bookedSeat);
      }

      return matches;
    });
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const toggleSection = (sectionId) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  const toggleSeat = (seat) => {
    if (selectedSeats.some((s) => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleContactOrganizer = (section) => {
    navigate("/contact", {
      state: {
        subject: `VIP Seating inquiry for ${eventDetails.title || "the event"}`,
        message: `I'm interested in booking ${section.name} seats for ${
          eventDetails.title || "the event"
        }.`,
        organizer: eventDetails.organizer,
      },
    });
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) return;

    setIsReserving(true);
    setBookingError("");
    setTimerActive(false);

    try {
      const token =
        authServiceInstance.getToken() ||
        (authContext && authContext.authToken) ||
        localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token required. Please login again.");
      }

      const formattedSeats = selectedSeats.map((seat) => ({
        section: seat.section,
        row: seat.row,
        seatNumber: seat.number,
        price: seat.price
      }));

      const reserveData = {
        eventId: eventDetails._id || eventDetails.id,
        sellerId: sellerId || userData?._id || authContext?.user?._id,
        seats: formattedSeats,
      };

      console.log("Sending reserve seats request:", reserveData);

      const response = await fetch(`${serverURL.url}bookings/reserve-seats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reserveData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reserve seats");
      }

      console.log("Seats reserved successfully:", data);
      await fetchBookedSeats();
      setSelectedSeats([]);
      setReserveSuccess(true);
      
      // Clean up timer on successful reservation
      cleanupTimer();

      setTimeout(() => {
        navigate("/dashboard/my-tickets", {
          state: {
            message: `Successfully reserved ${formattedSeats.length} seats for your event.`,
          },
        });
      }, 3000);
    } catch (error) {
      console.error("Error reserving seats:", error);
      setBookingError(
        error.message || "Failed to reserve seats. Please try again."
      );
      setTimerActive(true);
    } finally {
      setIsReserving(false);
    }
  };

  const handleCheckout = async () => {
    if (selectedSeats.length === 0) return;

    // Both reserve and book modes now use the same paid booking process
    setTimerActive(false);
    setIsBooking(true);
    setBookingError("");

    try {
      const token = authServiceInstance.getToken() || 
                    (authContext && authContext.authToken) || 
                    localStorage.getItem("auth-token");

      console.log("🔐 Authentication check:", {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenStart: token ? token.substring(0, 10) + "..." : "No token"
      });

      if (!token) {
        throw new Error("Authentication token required. Please login again.");
      }

      let buyerId = userData?._id || authContext?.user?._id;
      
      if (!buyerId) {
        const storageKeys = ["userData", "user-info", "user", "currentUser"];
        for (const key of storageKeys) {
          try {
            const stored = JSON.parse(localStorage.getItem(key));
            if (stored?._id) {
              buyerId = stored._id;
              console.log(`✅ Found buyerId in ${key}:`, buyerId);
              break;
            }
          } catch (error) {
            console.log(`❌ Failed to parse ${key}:`, error.message);
          }
        }
      }

      console.log("👤 User identification:", {
        userDataId: userData?._id,
        contextUserId: authContext?.user?._id,
        finalBuyerId: buyerId,
        userDataExists: !!userData,
        contextExists: !!authContext?.user
      });

      if (!buyerId) {
        throw new Error("User ID required. Please login again.");
      }

      const eventId = eventDetails._id || eventDetails.id;
      if (!eventId) {
        throw new Error("Event ID is missing. Please refresh and try again.");
      }

      console.log("🔍 EVENT DATA DEBUG:");
      console.log("Original eventDetails:", JSON.stringify(eventDetails, null, 2));
      console.log("Event ID:", eventId);
      console.log("Event priceRange:", eventDetails.priceRange);

      // Updated seats formatting to match the new API structure
      const formattedSeats = selectedSeats.map((seat, index) => {
        console.log(`Seat ${index + 1}:`, seat);
        
        const seatNumber = typeof seat.number === 'string' ? 
                          parseInt(seat.number) : seat.number;
        
        if (!seat.section || !seat.row || !seatNumber || !seat.price) {
          throw new Error(`Invalid seat data at index ${index}: missing section, row, number, or price`);
        }

        return {
          section: seat.section,
          row: seat.row,
          seatNumber: seatNumber,
          price: seat.price
        };
      });

      // Simple booking data structure matching the new API requirements
      const bookingData = {
        eventId: eventId,
        buyerId: buyerId,
        seats: formattedSeats
      };

      console.log("📋 Complete booking data being sent:", JSON.stringify(bookingData, null, 2));
      console.log("🌐 API Endpoint:", `${serverURL.url}bookings/book`);

      const response = await fetch(`${serverURL.url}bookings/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      console.log("📡 Response details:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries([...response.headers.entries()])
      });

      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("📄 Response data:", data);
      } else {
        const textResponse = await response.text();
        console.log("⚠️ Non-JSON Response:", textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}...`);
      }

      if (!response.ok) {
        let errorMessage;
        switch (response.status) {
          case 400:
            errorMessage = data.message || "Invalid booking data. Please check your selection and try again.";
            break;
          case 401:
            errorMessage = "Authentication failed. Please login again.";
            localStorage.removeItem("auth-token");
            break;
          case 403:
            errorMessage = "You don't have permission to book these seats.";
            break;
          case 404:
            errorMessage = "Event or booking endpoint not found.";
            break;
          case 409:
            errorMessage = "Some seats are no longer available. Please refresh and try again.";
            await fetchBookedSeats();
            break;
          case 422:
            errorMessage = data.message || "Invalid data provided. Please check your selection.";
            break;
          case 500:
            errorMessage = data.message || "Server error. Please try again later.";
            console.error("🔥 Server Error Details:", data);
            break;
          default:
            errorMessage = data.message || `HTTP ${response.status}: Failed to book seats`;
        }
        
        console.error("❌ API Error:", {
          status: response.status,
          message: errorMessage,
          data: data,
          fullError: data.error
        });
        
        throw new Error(errorMessage);
      }

      console.log("🎉 Booking successful:", data);
      setSelectedSeats([]);
      
      // Clean up timer on successful booking
      cleanupTimer();

      navigate("/checkout", {
        state: {
          bookingId: data.bookingId || data._id || data.id,
          booking: data,
          event: eventDetails,
          selectedSeats: selectedSeats,
          totalPrice,
          grandTotal: totalPrice,
          quantity: selectedSeats.length,
          mode: mode, // Pass mode to checkout
          success: true
        },
      });

    } catch (error) {
      console.error("💥 Booking error:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let userMessage = error.message;
      
      if (error.message.includes("Authentication")) {
        userMessage = "Your session has expired. Please login again.";
      } else if (error.message.includes("User ID")) {
        userMessage = "User information is missing. Please refresh and login again.";
      } else if (error.message.includes("Event ID")) {
        userMessage = "Event information is missing. Please go back and try again.";
      } else if (error.message.includes("validation")) {
        userMessage = "Invalid booking data. Please refresh and try again.";
      } else if (!userMessage || userMessage === "Internal Server Error") {
        userMessage = "There was an error processing your booking. Please try again.";
      }
      
      setBookingError(userMessage);
      setTimerActive(true);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <SeatPlanView
      // State props
      selectedSeats={selectedSeats}
      activeSection={activeSection}
      isBooking={isBooking}
      bookingError={bookingError}
      timerActive={timerActive}
      showTimeoutModal={showTimeoutModal}
      isReserving={false} // No longer using separate reserve state
      reserveSuccess={false} // No longer using reserve success state
      bookedSeatsData={bookedSeatsData}
      isLoadingSeats={isLoadingSeats}
      userData={userData}
      timerStartTime={timerStartTime}
      
      // Event and config props
      eventDetails={eventDetails}
      ticketType={ticketType}
      quantity={quantity}
      mode={mode}
      sellerId={sellerId}
      sections={sections}
      rowLetters={rowLetters}
      totalPrice={totalPrice}
      
      // Handler functions
      handleTimerExpire={handleTimerExpire}
      handleTimeoutOk={handleTimeoutOk}
      handleExtendTime={handleExtendTime}
      handleGoBack={handleGoBack}
      toggleSection={toggleSection}
      toggleSeat={toggleSeat}
      handleCheckout={handleCheckout}
      handleContactOrganizer={handleContactOrganizer}
      formatEventDate={formatEventDate}
      formatEventTime={formatEventTime}
      isSeatBooked={isSeatBooked}
      setSelectedSeats={setSelectedSeats}
      navigate={navigate}
    />
  );
};

export default SeatPlan;