import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import serverURL from "../../ServerConfig";
import authServiceInstance from "../../services/AuthService";
import { AuthContext } from "../../providers/AuthProvider";
import CountdownTimer from "../Dashboard/UserDashboard/CountdownTimer/CountdownTimer";

const SeatPlan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [selectedSeats, setSelectedSeats] = useState(
    location.state?.selectedSeats || []
  );
  const [activeSection, setActiveSection] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [timerActive, setTimerActive] = useState(true); // Timer state
  const [showTimeoutModal, setShowTimeoutModal] = useState(false); // Modal for timeout
  const [isReserving, setIsReserving] = useState(false); // For reserve mode
  const [reserveSuccess, setReserveSuccess] = useState(false); // Reserve success state
  const [bookedSeatsData, setBookedSeatsData] = useState([]); // Store booked seats from API
  const [isLoadingSeats, setIsLoadingSeats] = useState(true); // Loading state for seats

  const eventDetails = location.state?.event || {};
  const ticketType = location.state?.ticketType || {};
  const quantity = location.state?.quantity || 1;
  const mode = location.state?.mode || "book"; // 'book' or 'reserve'
  const sellerId = location.state?.sellerId || null;

  // Get user data from location state or localStorage
  const [userData, setUserData] = useState(location.state?.userData || null);
  const [bookedSeats, setBookedSeats] = useState([]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load user data from localStorage if not available in location state
  useEffect(() => {
    if (!userData) {
      try {
        // Try to get userData from localStorage
        const storedUserData = JSON.parse(localStorage.getItem("userData"));

        // If no userData, try user-info
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

    // Updated API endpoint to use the new booked seats API
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

    // FIXED: The API returns 'seats' array, not 'bookedSeats'
    if (data.success && data.seats && data.seats.length > 0) {
      setBookedSeatsData(data.seats); // Use 'seats' instead of 'bookedSeats'
      console.log("Booked seats loaded:", data.seats);
      console.log("Total booked seats:", data.totalSeats || data.seats.length);
      
      // Log each booked seat for debugging
      data.seats.forEach((seat, index) => {
        console.log(`Booked seat ${index + 1}:`, {
          section: seat.section,
          row: seat.row,
          seatNumber: seat.seatNumber,
          id: seat._id
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


useEffect(() => {
  fetchBookedSeats();
}, [eventDetails._id, eventDetails.id]);


  useEffect(() => {
    if (!eventDetails || Object.keys(eventDetails).length === 0) {
      console.error("No event details found in location state");
      navigate("/");
    }

    // Log that we received userData if it exists
    if (userData) {
      console.log("User data in SeatPlan:", userData);
    }
  }, [eventDetails, userData, navigate]);

  // Format date function - show date, month, year
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

  // Format time function - 12 hour format
  const formatEventTime = (timeString) => {
    if (!timeString) return "Time TBA";

    try {
      // Handle both time formats (HH:MM and full datetime)
      let timeToFormat;
      if (timeString.includes("T")) {
        // If it's a full datetime string
        timeToFormat = new Date(timeString);
      } else {
        // If it's just time (HH:MM)
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

  // Handle timer expiration
  const handleTimerExpire = () => {
    setTimerActive(false);
    setShowTimeoutModal(true);
    // Clear any selected seats
    setSelectedSeats([]);
  };

  // Handle timeout modal actions
  const handleTimeoutOk = () => {
    setShowTimeoutModal(false);
    navigate("/"); // Redirect to home page
  };

  const handleExtendTime = () => {
    setShowTimeoutModal(false);
    setTimerActive(true); // Restart timer
  };

  // Define seating sections with their configurations
  const sections = [
    {
      id: "vip",
      name: "VIP Lounge",
      price: 200,
      color: "#FF0000", // Red for VIP
      rows: 2,
      seatsPerRow: 20,
      columns: 2,
      requiresContact: true,
      description:
        "Premium VIP seating with the best view of the stage. Contact organizer for bookings.",
    },
    {
      id: "energon-enclave",
      name: "Energon Enclave",
      price: 160,
      color: "#FF4500", // OrangeRed
      rows: 3,
      seatsPerRow: 20,
      columns: 2,
      rowStart: 2, // Starting from row C (index 2)
    },
    {
      id: "hdb-house",
      name: "HDB House",
      price: 120,
      color: "#FF7F00", // Orange
      rows: 5,
      seatsPerRow: 20,
      columns: 2,
    },
    {
      id: "ausdream-arena",
      name: "AusDream Arena",
      price: 80,
      color: "#9400D3", // Violet
      rows: 8,
      seatsPerRow: 30,
      columns: 2,
    },
    {
      id: "century-circle",
      name: "Century Circle",
      price: 70,
      color: "#4169E1", // Royal Blue
      rows: 8,
      seatsPerRow: 30,
      columns: 2,
    },
    {
      id: "gamma-gallery",
      name: "Gamma Gallery",
      price: 60,
      color: "#8A2BE2", // Deep purple
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

  // Row letters for seating
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  // Toggle section view
  const toggleSection = (sectionId) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  // Toggle seat selection - MODIFIED to allow unlimited selection
  const toggleSeat = (seat) => {
    if (selectedSeats.some((s) => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      // Add the seat to selection without any quantity limit
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate("/");
  };

  // Check if a seat is booked - UPDATED to use API data
  const isSeatBooked = (section, row, seatNumber) => {
    if (isLoadingSeats) return false;

    return bookedSeatsData.some((bookedSeat) => {
      // Handle both string and number seat numbers
      const bookedSeatNumber = parseInt(bookedSeat.seatNumber);
      const currentSeatNumber = parseInt(seatNumber);

      const matches =
        bookedSeat.section === section &&
        bookedSeat.row === row &&
        bookedSeatNumber === currentSeatNumber;

      if (matches) {
        console.log(
          `Seat ${section} ${row}${seatNumber} is booked:`,
          bookedSeat
        );
      }

      return matches;
    });
  };

  useEffect(() => {
    if (bookedSeatsData.length > 0) {
      console.log("Booked seats loaded:", bookedSeatsData);
      console.log("Number of booked seats:", bookedSeatsData.length);
    }
  }, [bookedSeatsData]);

  // Handle seat reservation (for organizers)
  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) return;

    setIsReserving(true);
    setBookingError("");
    setTimerActive(false);

    try {
      // Get authentication token
      const token =
        authServiceInstance.getToken() ||
        (authContext && authContext.authToken) ||
        localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token required. Please login again.");
      }

      // Format the selected seats for the reserve API
      const formattedSeats = selectedSeats.map((seat) => ({
        section: seat.section,
        row: seat.row,
        seatNumber: seat.number,
      }));

      // Prepare request payload for reserve API
      const reserveData = {
        eventId: eventDetails._id || eventDetails.id,
        sellerId: sellerId || userData?._id || authContext?.user?._id,
        seats: formattedSeats,
      };

      console.log("Sending reserve seats request:", reserveData);

      // Make API call to reserve seats
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

      // FIXED: Refetch from backend instead of manually updating local state
      await fetchBookedSeats();

      // Clear selection
      setSelectedSeats([]);

      // Show success state
      setReserveSuccess(true);

      // Auto-redirect after 3 seconds
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

  // If in reserve mode, call reserve function instead
  if (mode === "reserve") {
    return handleReserveSeats();
  }

  // Stop the timer when proceeding to checkout
  setTimerActive(false);
  setIsBooking(true);
  setBookingError("");

  try {
    // Get authentication token
    const token =
      authServiceInstance.getToken() ||
      (authContext && authContext.authToken) ||
      localStorage.getItem("auth-token");

    console.log("🔐 Token check:", {
      authServiceToken: authServiceInstance.getToken(),
      contextToken: authContext?.authToken,
      localStorageToken: localStorage.getItem("auth-token"),
      finalToken: token ? "✅ Token exists" : "❌ No token found"
    });

    if (!token) {
      throw new Error("Authentication token required. Please login again.");
    }

    // Get buyerId from userData, authContext, or localStorage
    let buyerId = userData?._id || authContext?.user?._id;
    
    if (!buyerId) {
      // Try to get from localStorage as fallback
      try {
        const storedUserData = JSON.parse(localStorage.getItem("userData")) || 
                              JSON.parse(localStorage.getItem("user-info"));
        buyerId = storedUserData?._id;
      } catch (error) {
        console.error("Error parsing stored user data:", error);
      }
    }

    console.log("👤 User ID sources:", {
      userDataId: userData?._id,
      contextUserId: authContext?.user?._id,
      localStorageUserData: (() => {
        try {
          return JSON.parse(localStorage.getItem("userData"))?._id;
        } catch { return null; }
      })(),
      localStorageUserInfo: (() => {
        try {
          return JSON.parse(localStorage.getItem("user-info"))?._id;
        } catch { return null; }
      })(),
      finalBuyerId: buyerId
    });

    if (!buyerId) {
      throw new Error("User ID required. Please login again.");
    }

    // Format the selected seats for the booking API
    const formattedSeats = selectedSeats.map((seat) => ({
      section: seat.section,
      row: seat.row,
      seatNumber: seat.number, // Make sure this is a number
    }));

    // Prepare booking data
    const bookingData = {
      eventId: eventDetails._id || eventDetails.id,
      buyerId: buyerId,
      totalAmount: totalPrice,
      seats: formattedSeats,
    };

    console.log("📋 Booking data being sent:", JSON.stringify(bookingData, null, 2));
    console.log("🌐 API Endpoint:", `${serverURL.url}bookings/book`);
    console.log("🔑 Request headers:", {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token.substring(0, 20)}...`
    });

    const response = await fetch(`${serverURL.url}bookings/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    console.log("📡 Response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is actually JSON
    const contentType = response.headers.get("content-type");
    console.log("📄 Content-Type:", contentType);

    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      console.log("✅ JSON Response data:", data);
    } else {
      const textResponse = await response.text();
      console.log("⚠️ Non-JSON Response:", textResponse);
      throw new Error(`Server returned non-JSON response: ${textResponse}`);
    }

    if (!response.ok) {
      console.error("❌ API Error Response:", data);
      throw new Error(data.message || `HTTP ${response.status}: Failed to book seats`);
    }

    console.log("🎉 Booking successful:", data);

    // Clear selection after booking
    setSelectedSeats([]);

    // Navigate to checkout with booking information
    navigate("/checkout", {
      state: {
        bookingId: data.bookingId,
        event: eventDetails,
        selectedSeats: selectedSeats,
        totalPrice,
        grandTotal: totalPrice,
        quantity: selectedSeats.length,
      },
    });

  } catch (error) {
    console.error("💥 Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    setBookingError(
      error.message ||
        "There was an error processing your booking. Please try again."
    );
    setTimerActive(true);
  } finally {
    setIsBooking(false);
  }
};

  // Handle contact organizer for VIP seats
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

  // Judges table component
  const JudgesTable = () => (
    <div className="flex flex-col items-center my-4">
      <div className="text-xs text-orange-300 mb-1">Judges Panel</div>
      <div className="flex flex-col items-center">
        {/* Table */}
        <div className="h-6 w-40 bg-gray-600 rounded-t-md flex items-center justify-center">
          {/* Laptops on the table */}
          <div className="flex justify-around w-full px-2">
            <div className="w-6 h-4 bg-gray-800 rounded"></div>
            <div className="w-6 h-4 bg-gray-800 rounded"></div>
            <div className="w-6 h-4 bg-gray-800 rounded"></div>
          </div>
        </div>
        {/* Chairs */}
        <div className="flex justify-around w-40 px-2">
          <div className="w-6 h-3 bg-gray-700 rounded-b-md"></div>
          <div className="w-6 h-3 bg-gray-700 rounded-b-md"></div>
          <div className="w-6 h-3 bg-gray-700 rounded-b-md"></div>
        </div>
      </div>
    </div>
  );

  // Entrance door component - Updated to be vertical with vertical text and gate
  const EntranceDoor = () => (
    <div className="absolute" style={{ left: "0px", top: "40%" }}>
      <div className="flex items-center">
        <div className="border-2 border-orange-500 rounded-md p-1 bg-gray-800 shadow-lg flex flex-col items-center">
          {/* Gate shape */}
          <div className="flex flex-col items-center"></div>
          <div
            className="text-xs text-orange-300 font-bold mt-1 writing-mode-vertical"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            ENTRANCE
          </div>
        </div>
      </div>
    </div>
  );

  // Success Modal for Reserve
  const ReserveSuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg border border-green-500 max-w-md mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-green-400 mb-2">
            Seats Reserved Successfully!
          </h3>
          <p className="text-gray-300 mb-6">
            You have successfully reserved {selectedSeats.length} seats for your
            personal guests. These seats are now blocked for free.
          </p>
          <p className="text-sm text-gray-400">
            Redirecting you back to your events...
          </p>
        </div>
      </div>
    </div>
  );

  // Loading component
  const LoadingSeats = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <span className="ml-2 text-gray-400">Loading seat availability...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      {/* Timer Component */}
      {mode !== "reserve" && (
        <CountdownTimer
          initialMinutes={5}
          onExpire={handleTimerExpire}
          isActive={timerActive}
          showWarning={true}
          position="fixed"
        />
      )}

      {/* Success Modal for Reserve */}
      {reserveSuccess && <ReserveSuccessModal />}

      {/* Timeout Modal */}
      {showTimeoutModal && (
        <div
          className="fixed left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: "88px" }}
        >
          <div className="bg-gray-800 p-6 rounded-lg border border-red-500 max-w-md mx-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">
                Session Expired
              </h3>
              <p className="text-gray-300 mb-6">
                Your seat selection session has expired. Your selected seats
                have been released.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleTimeoutOk}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Go to Home
                </button>
                <button
                  onClick={handleExtendTime}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30">
        {/* Header with event info */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleGoBack}
              className="flex items-center text-white hover:text-orange-200 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
            <h1 className="text-xl md:text-3xl font-bold text-center flex-1">
              {mode === "reserve"
                ? "Reserve Seats for Personal Guests"
                : "Select Your Seats"}
            </h1>
            <div className="w-12"></div> {/* Spacer for balance */}
          </div>

          <div className="text-center mb-2">
            <h2 className="text-lg md:text-2xl font-bold">
              {eventDetails.title || "Event"}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-1 text-orange-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatEventDate(eventDetails.date)}
            </div>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-1 text-orange-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatEventTime(eventDetails.time)}
            </div>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-1 text-orange-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {eventDetails.location || "Location TBA"}
            </div>
          </div>

          <div className="mt-2 text-center text-sm md:text-base bg-orange-900 bg-opacity-40 p-2 rounded-lg">
            <p>
              <span className="font-semibold">
                {mode === "reserve"
                  ? "Select seats to reserve for your personal guests (FREE)"
                  : "Select your seats below"}
              </span>
            </p>
          </div>
        </div>

        {/* Section Selection */}
        <div className="p-4">
          <div className="text-sm text-orange-300 mb-2">
            Choose a section to view:
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeSection === section.id
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => toggleSection(section.id)}
              >
                {section.name} - ${section.price}
              </button>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoadingSeats && <LoadingSeats />}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Seat Map Container */}
            <div className="lg:col-span-4 bg-gray-900 rounded-lg border border-gray-700 p-4 overflow-x-auto">
              {/* Stage */}
              <div className="w-full max-w-5xl mx-auto h-12 bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-xl flex items-center justify-center mb-8 sticky top-0 z-10">
                <span className="text-red-100 font-bold tracking-widest">
                  STAGE
                </span>
              </div>

              {/* Seating Layout Container */}
              <div className="w-full max-w-6xl mx-auto pb-4 overflow-x-auto">
                {/* VIP Section (Rows A-B) */}
                {(!activeSection || activeSection === "vip") && (
                  <div className="mb-8">
                    <h3
                      className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                      style={{ backgroundColor: sections[0].color }}
                    >
                      {sections[0].name} - ${sections[0].price}
                    </h3>

                    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center mr-3">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-red-300">
                            Premium VIP Section
                          </h4>
                          <p className="text-sm text-gray-300">
                            Rows A-B require direct booking with the event
                            organizer.
                          </p>
                        </div>
                        <button
                          onClick={() => handleContactOrganizer(sections[0])}
                          className="ml-auto bg-red-600 hover:bg-red-500 text-white cursor-pointer py-2 px-4 rounded-lg text-sm font-medium"
                        >
                          Contact for VIP Booking
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: 2 }).map((_, rowIndex) => (
                          <div
                            key={`vip-row-${rowIndex}`}
                            className="flex mb-1"
                          >
                            {/* Row Label */}
                            <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-red-400">
                              {rowLetters[rowIndex]}
                            </div>

                            {/* Generate columns */}
                            {Array.from({ length: sections[0].columns }).map(
                              (_, colIndex) => (
                                <div
                                  key={`vip-row-${rowIndex}-col-${colIndex}`}
                                  className="flex space-x-1 mr-4"
                                >
                                  {/* Generate seats for this column */}
                                  {Array.from({
                                    length: sections[0].seatsPerRow,
                                  }).map((_, seatIndex) => {
                                    const seatNumber =
                                      colIndex * sections[0].seatsPerRow +
                                      seatIndex +
                                      1;

                                    return (
                                      <button
                                        key={`vip-${rowIndex}-${colIndex}-${seatIndex}`}
                                        disabled={true}
                                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium bg-red-900 opacity-60 cursor-not-allowed"
                                        style={{ fontSize: "0.65rem" }}
                                      >
                                        {seatNumber}
                                      </button>
                                    );
                                  })}
                                </div>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Energon Enclave - Rows C-E */}
                {(!activeSection || activeSection === "energon-enclave") && (
                  <div className="mb-8">
                    <h3
                      className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                      style={{ backgroundColor: sections[1].color }}
                    >
                      {sections[1].name} - ${sections[1].price}
                    </h3>

                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: 3 }).map((_, idx) => {
                          const rowIndex = idx + 2;

                          return (
                            <div
                              key={`energon-row-${idx}`}
                              className="flex mb-1"
                            >
                              {/* Row Label */}
                              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-blue-400">
                                {rowLetters[rowIndex]}
                              </div>

                              {/* Generate columns */}
                              {Array.from({ length: sections[1].columns }).map(
                                (_, colIndex) => (
                                  <div
                                    key={`energon-row-${idx}-col-${colIndex}`}
                                    className="flex space-x-1 mr-4"
                                  >
                                    {/* Generate seats for this column */}
                                    {Array.from({
                                      length: sections[1].seatsPerRow,
                                    }).map((_, seatIndex) => {
                                      const seatNumber =
                                        colIndex * sections[1].seatsPerRow +
                                        seatIndex +
                                        1;
                                      const seatId = `energon-enclave_${idx}_${colIndex}_${seatIndex}`;

                                      // Check if seat is booked using API data
                                      const isBooked = isSeatBooked(
                                        sections[1].id,
                                        rowLetters[rowIndex],
                                        seatNumber
                                      );
                                      const isSelected = selectedSeats.some(
                                        (s) => s.id === seatId
                                      );

                                      return (
                                        <button
                                          key={seatId}
                                          disabled={isBooked}
                                          onClick={() =>
                                            !isBooked &&
                                            toggleSeat({
                                              id: seatId,
                                              name: `${sections[1].name} ${rowLetters[rowIndex]}${seatNumber}`,
                                              price: sections[1].price,
                                              section: sections[1].id,
                                              row: rowLetters[rowIndex],
                                              number: seatNumber,
                                            })
                                          }
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                                            isBooked
                                              ? "bg-gray-700 opacity-50 cursor-not-allowed"
                                              : isSelected
                                              ? "bg-yellow-400 text-gray-900 shadow-md transform scale-110"
                                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                          }`}
                                          style={{
                                            backgroundColor: isSelected
                                              ? "#FBBF24"
                                              : isBooked
                                              ? "#374151"
                                              : sections[1].color,
                                            fontSize: "0.65rem",
                                          }}
                                        >
                                          {seatNumber}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section separator */}
                <div className="w-full h-8 my-4 flex items-center justify-center text-xs text-orange-300">
                  <div className="w-4/5 border-b-2 border-dashed border-orange-500 relative">
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">
                      Main Walking Path
                    </span>
                  </div>
                </div>

                {/* HDB House */}
                {(!activeSection || activeSection === "hdb-house") && (
                  <div className="mb-8">
                    <h3
                      className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                      style={{ backgroundColor: sections[2].color }}
                    >
                      {sections[2].name} - ${sections[2].price}
                    </h3>

                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: sections[2].rows }).map(
                          (_, rowIndex) => (
                            <div
                              key={`${sections[2].id}-row-${rowIndex}`}
                              className="flex mb-1"
                            >
                              {/* Row Label */}
                              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-violet-400">
                                {rowLetters[rowIndex]}
                              </div>

                              {/* Generate columns */}
                              {Array.from({ length: sections[2].columns }).map(
                                (_, colIndex) => (
                                  <div
                                    key={`${sections[2].id}-row-${rowIndex}-col-${colIndex}`}
                                    className="flex space-x-1 mr-4"
                                  >
                                    {/* Generate seats for this column */}
                                    {Array.from({
                                      length: sections[2].seatsPerRow,
                                    }).map((_, seatIndex) => {
                                      const seatNumber =
                                        colIndex * sections[2].seatsPerRow +
                                        seatIndex +
                                        1;
                                      const seatId = `${sections[2].id}_${rowIndex}_${colIndex}_${seatIndex}`;

                                      // Check if seat is booked using API data
                                      const isBooked = isSeatBooked(
                                        sections[2].id,
                                        rowLetters[rowIndex],
                                        seatNumber
                                      );
                                      const isSelected = selectedSeats.some(
                                        (s) => s.id === seatId
                                      );

                                      return (
                                        <button
                                          key={seatId}
                                          disabled={isBooked}
                                          onClick={() =>
                                            !isBooked &&
                                            toggleSeat({
                                              id: seatId,
                                              name: `${sections[2].name} ${rowLetters[rowIndex]}${seatNumber}`,
                                              price: sections[2].price,
                                              section: sections[2].id,
                                              row: rowLetters[rowIndex],
                                              number: seatNumber,
                                            })
                                          }
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                                            isBooked
                                              ? "bg-gray-700 opacity-50 cursor-not-allowed"
                                              : isSelected
                                              ? "bg-yellow-400 text-gray-900 shadow-md transform scale-110"
                                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                          }`}
                                          style={{
                                            backgroundColor: isSelected
                                              ? "#FBBF24"
                                              : isBooked
                                              ? "#374151"
                                              : sections[2].color,
                                            fontSize: "0.65rem",
                                          }}
                                        >
                                          {seatNumber}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* AusDream Arena */}
                {(!activeSection || activeSection === "ausdream-arena") && (
                  <div className="mb-8">
                    <h3
                      className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                      style={{ backgroundColor: sections[3].color }}
                    >
                      {sections[3].name} - ${sections[3].price}
                    </h3>

                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: sections[3].rows }).map(
                          (_, rowIndex) => (
                            <div
                              key={`${sections[3].id}-row-${rowIndex}`}
                              className="flex mb-1"
                            >
                              {/* Row Label */}
                              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-orange-400">
                                {rowLetters[rowIndex]}
                              </div>

                              {/* Generate columns */}
                              {Array.from({ length: sections[3].columns }).map(
                                (_, colIndex) => (
                                  <div
                                    key={`${sections[3].id}-row-${rowIndex}-col-${colIndex}`}
                                    className="flex space-x-1 mr-4"
                                  >
                                    {/* Generate seats for this column */}
                                    {Array.from({
                                      length: sections[3].seatsPerRow,
                                    }).map((_, seatIndex) => {
                                      const seatNumber =
                                        colIndex * sections[3].seatsPerRow +
                                        seatIndex +
                                        1;
                                      const seatId = `${sections[3].id}_${rowIndex}_${colIndex}_${seatIndex}`;

                                      // Check if seat is booked using API data
                                      const isBooked = isSeatBooked(
                                        sections[3].id,
                                        rowLetters[rowIndex],
                                        seatNumber
                                      );
                                      const isSelected = selectedSeats.some(
                                        (s) => s.id === seatId
                                      );

                                      return (
                                        <button
                                          key={seatId}
                                          disabled={isBooked}
                                          onClick={() =>
                                            !isBooked &&
                                            toggleSeat({
                                              id: seatId,
                                              name: `${sections[3].name} ${rowLetters[rowIndex]}${seatNumber}`,
                                              price: sections[3].price,
                                              section: sections[3].id,
                                              row: rowLetters[rowIndex],
                                              number: seatNumber,
                                            })
                                          }
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                                            isBooked
                                              ? "bg-gray-700 opacity-50 cursor-not-allowed"
                                              : isSelected
                                              ? "bg-yellow-400 text-gray-900 shadow-md transform scale-110"
                                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                          }`}
                                          style={{
                                            backgroundColor: isSelected
                                              ? "#FBBF24"
                                              : isBooked
                                              ? "#374151"
                                              : sections[3].color,
                                            fontSize: "0.65rem",
                                          }}
                                        >
                                          {seatNumber}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Century Circle */}
                {(!activeSection || activeSection === "century-circle") && (
                  <div className="mb-8 relative pl-6">
                    <h3
                      className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                      style={{ backgroundColor: sections[4].color }}
                    >
                      {sections[4].name} - ${sections[4].price}
                    </h3>

                    <EntranceDoor />

                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: sections[4].rows }).map(
                          (_, rowIndex) => (
                            <div
                              key={`${sections[4].id}-row-${rowIndex}`}
                              className="flex mb-1"
                            >
                              {/* Row Label */}
                              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-orange-400">
                                {rowLetters[rowIndex]}
                              </div>

                              {/* Generate columns */}
                              {Array.from({ length: sections[4].columns }).map(
                                (_, colIndex) => (
                                  <div
                                    key={`${sections[4].id}-row-${rowIndex}-col-${colIndex}`}
                                    className="flex space-x-1 mr-4"
                                  >
                                    {/* Generate seats for this column */}
                                    {Array.from({
                                      length: sections[4].seatsPerRow,
                                    }).map((_, seatIndex) => {
                                      const seatNumber =
                                        colIndex * sections[4].seatsPerRow +
                                        seatIndex +
                                        1;
                                      const seatId = `${sections[4].id}_${rowIndex}_${colIndex}_${seatIndex}`;

                                      // Check if seat is booked using API data
                                      const isBooked = isSeatBooked(
                                        sections[4].id,
                                        rowLetters[rowIndex],
                                        seatNumber
                                      );
                                      const isSelected = selectedSeats.some(
                                        (s) => s.id === seatId
                                      );

                                      return (
                                        <button
                                          key={seatId}
                                          disabled={isBooked}
                                          onClick={() =>
                                            !isBooked &&
                                            toggleSeat({
                                              id: seatId,
                                              name: `${sections[4].name} ${rowLetters[rowIndex]}${seatNumber}`,
                                              price: sections[4].price,
                                              section: sections[4].id,
                                              row: rowLetters[rowIndex],
                                              number: seatNumber,
                                            })
                                          }
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                                            isBooked
                                              ? "bg-gray-700 opacity-50 cursor-not-allowed"
                                              : isSelected
                                              ? "bg-yellow-400 text-gray-900 shadow-md transform scale-110"
                                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                          }`}
                                          style={{
                                            backgroundColor: isSelected
                                              ? "#FBBF24"
                                              : isBooked
                                              ? "#374151"
                                              : sections[4].color,
                                            fontSize: "0.65rem",
                                          }}
                                        >
                                          {seatNumber}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Judges' Table */}
                <div className="mt-2 flex justify-center">
                  <JudgesTable />
                </div>

                {/* Gamma Gallery Section */}
                {(!activeSection || activeSection === "gamma-gallery") && (
                  <div className="mb-4">
                    <h3
                      className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                      style={{ backgroundColor: sections[5].color }}
                    >
                      {sections[5].name} - ${sections[5].price}
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: sections[5].rows }).map(
                          (_, rowIndex) => (
                            <div
                              key={`gamma-row-${rowIndex}`}
                              className="flex mb-1"
                            >
                              {/* Row Label */}
                              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-red-400">
                                {rowLetters[rowIndex]}
                              </div>

                              {/* Generate special column layout */}
                              {sections[5].columnSeats.map(
                                (column, colIndex) => (
                                  <div
                                    key={`gamma-row-${rowIndex}-col-${colIndex}`}
                                    className="flex space-x-1 mr-4"
                                  >
                                    {/* Generate seats for this column */}
                                    {Array.from({
                                      length: column.end - column.start + 1,
                                    }).map((_, seatIndex) => {
                                      const seatNumber =
                                        column.start + seatIndex;
                                      const seatId = `gamma-gallery_${rowIndex}_${colIndex}_${seatIndex}`;

                                      // Check if seat is booked using API data
                                      const isBooked = isSeatBooked(
                                        "gamma-gallery",
                                        rowLetters[rowIndex],
                                        seatNumber
                                      );
                                      const isSelected = selectedSeats.some(
                                        (s) => s.id === seatId
                                      );

                                      return (
                                        <button
                                          key={seatId}
                                          disabled={isBooked}
                                          onClick={() =>
                                            !isBooked &&
                                            toggleSeat({
                                              id: seatId,
                                              name: `Gamma Gallery ${rowLetters[rowIndex]}${seatNumber}`,
                                              price: sections[5].price,
                                              section: "gamma-gallery",
                                              row: rowLetters[rowIndex],
                                              number: seatNumber,
                                            })
                                          }
                                          className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                                            isBooked
                                              ? "bg-gray-700 opacity-50 cursor-not-allowed"
                                              : isSelected
                                              ? "bg-yellow-400 text-gray-900 shadow-md transform scale-110"
                                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                          }`}
                                          style={{
                                            backgroundColor: isSelected
                                              ? "#FBBF24"
                                              : isBooked
                                              ? "#374151"
                                              : sections[5].color,
                                            fontSize: "0.6rem",
                                          }}
                                        >
                                          {seatNumber}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="text-sm font-medium mb-2">Legend:</div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-900 opacity-60 rounded"></div>
                    <span className="text-xs text-gray-400">
                      VIP (Contact Organizer)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-700 opacity-50 rounded"></div>
                    <span className="text-xs text-gray-400">Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-xs text-gray-400">Selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="border-2 border-orange-500 rounded-sm p-px bg-gray-800"
                      style={{ width: "16px", height: "16px" }}
                    >
                      <svg
                        className="w-3 h-3 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-400">Entrance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <span className="text-xs text-gray-400">Judges' Table</span>
                  </div>
                  {sections.slice(1).map((section) => (
                    <div
                      key={`legend-${section.id}`}
                      className="flex items-center space-x-2"
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: section.color }}
                      ></div>
                      <span className="text-xs text-gray-400">
                        {section.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1 bg-gray-900 rounded-lg p-4 border border-gray-700 h-fit sticky top-4">
              <h2 className="text-xl font-bold mb-4">
                {mode === "reserve" ? "Reserve Selection" : "Your Selection"}
              </h2>

              {/* Error message for booking errors */}
              {bookingError && (
                <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 p-3 rounded-md mb-4">
                  <p className="text-sm">{bookingError}</p>
                </div>
              )}

              {selectedSeats.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
                    {selectedSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{seat.name}</div>
                          <div className="text-sm text-gray-400">
                            Row {seat.row}, Seat {seat.number}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {mode === "reserve" ? "FREE" : `${seat.price}`}
                          </div>
                          <button
                            onClick={() => toggleSeat(seat)}
                            className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {mode !== "reserve" && (
                    <div className="border-t border-gray-700 pt-4 mb-6">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <p className="text-purple-400">Total</p>
                        <p className="text-purple-400">
                          ${totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {mode === "reserve" && (
                    <div className="border-t border-gray-700 pt-4 mb-6">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <p className="text-green-400">Total Cost</p>
                        <p className="text-green-400">FREE</p>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        These seats will be reserved for your personal guests at
                        no cost.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={
                      selectedSeats.length === 0 || isBooking || isReserving
                    }
                    className={`w-full py-3 cursor-pointer ${
                      selectedSeats.length === 0 || isBooking || isReserving
                        ? "bg-gray-600 cursor-not-allowed"
                        : mode === "reserve"
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:shadow-green-500/30 transform hover:-translate-y-0.5"
                        : "bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-purple-500/30 transform hover:-translate-y-0.5"
                    } text-white font-bold rounded-lg shadow-lg transition-all duration-300`}
                  >
                    {isReserving
                      ? "Reserving Seats..."
                      : isBooking
                      ? "Processing..."
                      : selectedSeats.length === 0
                      ? "Select Seats"
                      : mode === "reserve"
                      ? "Reserve Seats (FREE)"
                      : "Proceed to Checkout"}
                  </button>

                  <button
                    onClick={() => setSelectedSeats([])}
                    disabled={isBooking || isReserving}
                    className="w-full mt-2 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear Selection
                  </button>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-purple-400 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-1">
                    No Seats Selected
                  </h3>
                  <p className="text-gray-400">
                    {mode === "reserve"
                      ? "Select seats to reserve for your personal guests."
                      : "Select seats from the seating chart."}
                  </p>

                  <div className="mt-6 text-sm text-gray-500">
                    <p>
                      Tip: Click on a section above to focus on that specific
                      seating area.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium mb-2">Need Help?</h3>
                <button
                  onClick={() =>
                    navigate("/contact", {
                      state: {
                        subject: `Seating inquiry for ${
                          eventDetails.title || "the event"
                        }`,
                        organizer: eventDetails.organizer,
                      },
                    })
                  }
                  className="w-full py-2 bg-transparent border border-purple-500 text-purple-400 rounded-lg text-sm hover:bg-purple-500/10 transition-colors cursor-pointer"
                >
                  Contact Event Organizer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatPlan;
