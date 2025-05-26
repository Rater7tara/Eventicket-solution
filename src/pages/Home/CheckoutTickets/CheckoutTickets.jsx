import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { paymentService } from "../../../services/api"; // Import the payment service
import serverURL from "../../../ServerConfig";
import CheckoutForm from "./CheckoutForm"; // Make sure to import the CheckoutForm component
import { AuthContext } from "../../../providers/AuthProvider";
import axios from "axios";
import CountdownTimer from "../../Dashboard/UserDashboard/CountdownTimer/CountdownTimer";

// Replace with your Stripe publishable key
const stripePromise = loadStripe(
  "pk_test_51RMBsVPPhrKgTwpcPcorStmAPBALn5dtB3xrqJ5bn3xfHKRYM1BPXBLyO8HkVtkk7Hhq1HZs9UaJpjR4lqxgnCvu00MVzStYrv"
);

// Main Checkout Page
const CheckoutTickets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [authenticationAttempted, setAuthenticationAttempted] = useState(false);
  const authContext = useContext(AuthContext);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const [timerActive, setTimerActive] = useState(true); // Timer state
  const [showTimeoutModal, setShowTimeoutModal] = useState(false); // Modal for timeout

  

  // Get data from location state (removed serviceFee and grandTotal)
  const { event, selectedSeats, totalPrice, userData } =
    location.state || {};

  // Calculate final total whenever grandTotal or discount changes
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.finalPrice) {
      // Use the finalPrice from API response
      setFinalTotal(appliedCoupon.finalPrice);
    } else {
      // Use original total price (no service fee)
      setFinalTotal(totalPrice || 0);
    }
  }, [totalPrice, appliedCoupon]);

   // Handle timer expiration
  const handleTimerExpire = () => {
    setTimerActive(false);
    setShowTimeoutModal(true);
    // Clear any applied coupons
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    setCouponError("");
    setCouponSuccess("");
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

  // Get auth headers for API requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth-token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

     if (!timerActive) {
      setCouponError("Session expired. Please restart your booking.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const response = await axios.post(
        `${serverURL.url}coupons/apply-coupon`,
        {
          code: couponCode.toUpperCase(),
          eventId: event?._id,
          totalAmount: totalPrice // Use totalPrice instead of grandTotal
        },
        getAuthHeaders()
      );

      console.log("Coupon apply response:", response.data);

      if (response.data.success) {
        const discountAmount = response.data.discountAmount || 0;
        const finalPrice = response.data.finalPrice || totalPrice;
        const couponId = response.data.couponId;
        
        // Create coupon object with the data we need
        const appliedCouponData = {
          id: couponId,
          code: couponCode.toUpperCase(),
          discountAmount: discountAmount,
          finalPrice: finalPrice,
          originalPrice: totalPrice
        };
        
        setAppliedCoupon(appliedCouponData);
        setDiscount(discountAmount);
        setCouponSuccess(`Coupon applied! You saved ${discountAmount.toFixed(2)}`);
        setCouponCode(""); // Clear the input
      } else {
        setCouponError(response.data.message || "Failed to apply coupon");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError(
        error.response?.data?.message || 
        "Failed to apply coupon. Please try again."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    setCouponError("");
    setCouponSuccess("");
  };

  // Handle coupon input change
  const handleCouponChange = (e) => {
    setCouponCode(e.target.value.toUpperCase());
    setCouponError("");
    setCouponSuccess("");
  };

  // Handle Enter key press in coupon input
  const handleCouponKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyCoupon();
    }
  };

  // Store userData in localStorage for CheckoutForm to access
  useEffect(() => {
    if (userData && !authenticationAttempted) {
      // Store user data for later use in checkout form
      localStorage.setItem("userData", JSON.stringify(userData));

      // If we have userData but no auth, attempt to sign in or create user automatically
      const attemptAuthentication = async () => {
        setAuthenticationAttempted(true);
        if (!authContext.user && userData.email) {
          try {
            // Try signing in first
            console.log("Attempting to sign in with:", userData.email);
            const user = await authContext.signIn(
              userData.email,
              userData.password
            );

            // Verify authentication was successful
            const token = localStorage.getItem("auth-token");
            console.log(
              "Auth token after sign in:",
              token ? "Present" : "Missing"
            );

            if (!token && user) {
              // If token is missing but user object exists, manually set token
              console.log("Token missing after sign in, manually setting it");
              localStorage.setItem("auth-token", "forced-token-after-signin");
            }
          } catch (error) {
            // If sign in fails, try to create the user
            try {
              console.log(
                "Sign in failed, attempting to create user:",
                userData.email
              );
              const newUser = await authContext.createUser(
                userData.email,
                userData.password
              );

              // Verify token was saved after user creation
              const token = localStorage.getItem("auth-token");
              console.log(
                "Auth token after user creation:",
                token ? "Present" : "Missing"
              );

              if (!token && newUser) {
                // If token is missing but user object exists, manually set token
                console.log(
                  "Token missing after user creation, manually setting it"
                );
                localStorage.setItem(
                  "auth-token",
                  "forced-token-after-creation"
                );
              }
            } catch (createError) {
              console.error("Failed to create user:", createError);
            }
          }

          // Add delay to ensure localStorage operations complete
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      };

      attemptAuthentication();
    }
  }, [userData, authContext, authenticationAttempted]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);

    if (location.state?.bookingId) {
      localStorage.setItem("bookingId", location.state.bookingId);
    }

    // Generate a random confirmation number if not set
    if (!confirmationNumber) {
      const random = Math.floor(100000 + Math.random() * 900000);
      const timestamp = new Date().getTime().toString().slice(-4);
      setConfirmationNumber(`TKT-${random}-${timestamp}`);
    }

    // Check if we have the required data - if in development mode, don't redirect
    if (!event || !selectedSeats || selectedSeats.length === 0) {
      if (process.env.NODE_ENV !== "development") {
        navigate("/");
      } else {
        console.warn(
          "Missing event data in development mode - would redirect in production"
        );
      }
    }
  }, [confirmationNumber, navigate, event, selectedSeats, location.state]);

  // Handle payment completion
  const handlePaymentComplete = async (orderId) => {
     // Stop the timer when payment is successful
    setTimerActive(false);

    setPaymentComplete(true);
    setOrderData({ orderId });

    // Save the order ID to localStorage
    localStorage.setItem("completedOrderId", orderId);
    console.log("Order ID saved to localStorage:", orderId);

    // Scroll to the confirmation section
    setTimeout(() => {
      document
        .getElementById("confirmation")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 500);
  };

  // Handle go back
  const handleGoBack = () => {
    navigate(-1);
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

  // Handle completion and redirect to tickets
  const handleViewTickets = () => {
    const savedOrderId =
      localStorage.getItem("completedOrderId") || orderData?.orderId;

    navigate("/dashboard/my-tickets", {
      state: {
        event,
        selectedSeats,
        totalPrice,
        grandTotal: finalTotal, // Use final total after coupon
        confirmationNumber,
        purchaseDate: new Date().toISOString(),
        orderId: savedOrderId,
        appliedCoupon,
        discount
      },
    });
  };

  // Verify that auth token is available
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = localStorage.getItem("auth-token");
      if (!token && authContext.user) {
        console.warn(
          "Auth token is missing but user is authenticated, recreating token"
        );
        // Force token to be saved if missing (this is a workaround)
        localStorage.setItem("auth-token", "forced-token-from-verification");

        // Wait for localStorage operation to complete
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    };

    checkAuthToken();
  }, [authContext.user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
            {/* Timer Component - Only show if payment is not complete */}
      {!paymentComplete && (
        <CountdownTimer
          initialMinutes={5}
          onExpire={handleTimerExpire}
          isActive={timerActive}
          showWarning={true}
          position="fixed"
        />
      )}

      {/* Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-red-500 max-w-md mx-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Session Expired</h3>
              <p className="text-gray-300 mb-6">
                Your checkout session has expired. Please restart your booking process.
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 rounded-t-xl flex items-center justify-between mb-1">
          <button
            onClick={handleGoBack}
            className="flex items-center text-white hover:text-orange-200 transition-colors"
            disabled={paymentComplete}
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
          <h1 className="text-xl md:text-2xl font-bold">
            Complete Your Purchase
          </h1>
          <div className="w-12"></div> {/* Spacer for balance */}
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-b-xl shadow-2xl p-6 border border-orange-500 border-opacity-30">
          {/* Order Summary */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-orange-300 mb-4">
              Order Summary
            </h2>

            {/* Event Details */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="text-md font-bold">{event?.title || "Event"}</h3>
              <div className="text-sm text-gray-300 mt-1">
                <div className="flex items-center mb-1">
                  <svg
                    className="w-4 h-4 mr-2 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(event?.date)}
                </div>
                <div className="flex items-center mb-1">
                  <svg
                    className="w-4 h-4 mr-2 text-orange-400"
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
                  {event?.time || "Time TBA"}
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-orange-400"
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
                  {event?.location || "Location TBA"}
                </div>
              </div>
            </div>

            {/* Ticket Display */}
            <div className="space-y-4 mb-6">
              <h3 className="text-md font-bold text-orange-300">
                Your Tickets
              </h3>

              {selectedSeats?.map((seat, index) => (
                <div
                  key={seat.id || index}
                  className="relative overflow-hidden"
                >
                  {/* Ticket UI */}
                  <div className="ticket-card bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-orange-500 border-opacity-40 shadow-lg overflow-hidden">
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                      <div className="font-bold truncate">
                        {event?.title || "Event"}
                      </div>
                      <div className="text-sm bg-orange-900 bg-opacity-50 rounded px-2 py-1">
                        Seat {seat.row}
                        {seat.number}
                      </div>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-4 flex justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col space-y-2">
                          <div className="text-xs text-gray-400">Section</div>
                          <div className="font-medium">
                            {seat.name?.split(" ")[0] || "Section"}{" "}
                            {seat.name?.split(" ")[1] || ""}
                          </div>

                          <div className="text-xs text-gray-400 mt-1">
                            Date & Time
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1 text-orange-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-sm">
                              {formatDate(event?.date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1 text-orange-400"
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
                            <span className="text-sm">
                              {event?.time || "Time TBA"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col items-end justify-between">
                        <div className="flex flex-col items-end">
                          <div className="text-xs text-gray-400">Price</div>
                          <div className="font-bold text-orange-300">
                            ${seat.price?.toFixed(2) || "0.00"}
                          </div>
                        </div>

                        {/* Barcode */}
                        <div className="mt-3">
                          <div className="bg-gray-200 p-1 rounded">
                            <div className="flex space-x-0.5">
                              {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-0.5 bg-gray-900"
                                  style={{
                                    height: `${6 + Math.random() * 14}px`,
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                          <div className="text-center text-xs mt-1 text-gray-400">
                            {/* Ticket ID based on seat */}
                            TIX-
                            {seat.section?.substring(0, 3).toUpperCase() ||
                              "SEC"}
                            -{seat.row || "A"}
                            {seat.number || "1"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            {!paymentComplete && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 mb-6">
                <h3 className="text-md font-bold text-orange-300 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 19a2 2 0 01-2-2v-3a1 1 0 011-1h1a1 1 0 011 1v3a2 2 0 01-2 2H5z"
                    />
                  </svg>
                  Have a Coupon Code?
                </h3>

                {!appliedCoupon ? (
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={handleCouponChange}
                        onKeyPress={handleCouponKeyPress}
                        placeholder="Enter coupon code"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={couponLoading}
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        couponLoading || !couponCode.trim()
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {couponLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Applying...
                        </div>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-900 border border-green-600 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-400 mr-3"
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
                      <div>
                        <div className="text-green-400 font-medium">
                          Coupon "{appliedCoupon.code}" applied!
                        </div>
                        <div className="text-green-300 text-sm">
                          You saved ${appliedCoupon.discountAmount?.toFixed(2) || discount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove coupon"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Coupon Messages */}
                {couponError && (
                  <div className="mt-3 flex items-center text-red-400 text-sm">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {couponError}
                  </div>
                )}

                {couponSuccess && !appliedCoupon && (
                  <div className="mt-3 flex items-center text-green-400 text-sm">
                    <svg
                      className="w-4 h-4 mr-2"
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
                    {couponSuccess}
                  </div>
                )}
              </div>
            )}

            {/* Price Summary */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span>
                  Ticket{selectedSeats?.length > 1 ? "s" : ""} (
                  {selectedSeats?.length || 0})
                </span>
                <span>${totalPrice?.toFixed(2) || "0.00"}</span>
              </div>
              
              {/* Show discount if coupon is applied */}
              {appliedCoupon && discount > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-400">
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 19a2 2 0 01-2-2v-3a1 1 0 011-1h1a1 1 0 011 1v3a2 2 0 01-2 2H5z"
                      />
                    </svg>
                    Coupon Discount
                  </span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-gray-700 my-2 pt-2 flex justify-between items-center font-bold text-orange-300">
                <span>Total</span>
                <span className="flex flex-col items-end">
                  {appliedCoupon && discount > 0 && (
                    <span className="text-sm text-gray-400 line-through">
                      ${totalPrice?.toFixed(2) || "0.00"}
                    </span>
                  )}
                  <span>${finalTotal.toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section (conditional) */}
          {!paymentComplete ? (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-orange-300 mb-4">
                Payment Details
              </h2>

              <Elements stripe={stripePromise}>
                <CheckoutForm
                  grandTotal={finalTotal} // Use final total after coupon discount
                  event={event}
                  selectedSeats={selectedSeats || []}
                  onPaymentComplete={handlePaymentComplete}
                  bookingId={location.state?.bookingId} // Pass the bookingId from location state
                  appliedCoupon={appliedCoupon} // Pass coupon data to CheckoutForm
                  discount={discount} // Pass discount amount
                />
              </Elements>

              <div className="mt-4 text-xs text-center text-gray-400">
                <p>
                  Your payment is secure and encrypted. By proceeding, you agree
                  to our Terms of Service and Privacy Policy.
                </p>
                <div className="flex justify-center items-center mt-2 space-x-3">
                  <svg
                    className="h-8 w-auto opacity-70"
                    viewBox="0 0 60 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="60" height="40" rx="4" fill="#E6E6E6" />
                    <path d="M22 28H38V12H22V28Z" fill="#FF5F00" />
                    <path
                      d="M23 20C23 16.7 24.4 13.9 26.5 12C25.2 11 23.7 10.5 22 10.5C17.9 10.5 14.5 14.9 14.5 20C14.5 25.1 17.9 29.5 22 29.5C23.7 29.5 25.2 29 26.5 28C24.4 26.1 23 23.3 23 20Z"
                      fill="#EB001B"
                    />
                    <path
                      d="M45.5 20C45.5 25.1 42.1 29.5 38 29.5C36.3 29.5 34.8 29 33.5 28C35.6 26.1 37 23.3 37 20C37 16.7 35.6 13.9 33.5 12C34.8 11 36.3 10.5 38 10.5C42.1 10.5 45.5 14.9 45.5 20Z"
                      fill="#F79E1B"
                    />
                  </svg>
                  <svg
                    className="h-8 w-auto opacity-70"
                    viewBox="0 0 60 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="60" height="40" rx="4" fill="#E6E6E6" />
                    <path
                      d="M17 28.5H25.5L27 11.5H18.5L17 28.5Z"
                      fill="#00579F"
                    />
                    <path
                      d="M43 11.7C41.8 11.2 39.9 10.5 37.5 10.5C32.5 10.5 29 13.2 29 17C29 19.9 31.5 21.4 33.4 22.3C35.3 23.2 36 23.8 36 24.5C36 25.7 34.5 26.2 33.1 26.2C31 26.2 29.9 25.9 28.3 25.2L27.7 24.9L27 29.2C28.4 29.8 30.8 30.3 33.3 30.3C38.6 30.3 42 27.6 42 23.5C42 21.2 40.6 19.4 37.7 18C35.9 17.1 34.8 16.5 34.8 15.6C34.8 14.8 35.7 14 37.6 14C39.2 14 40.3 14.3 41.1 14.6L41.5 14.8L42.2 10.9L43 11.7Z"
                      fill="#00579F"
                    />
                    <path
                      d="M48 11.5H42.5C41.5 11.5 40.7 11.8 40.3 12.9L34 28.5H39.3L40.2 25.9H46.2L46.7 28.5H51.5L48 11.5ZM41.7 21.9C41.7 21.9 43.5 17 43.9 15.9C43.9 15.9 44.2 15.1 44.4 14.6L44.6 15.8C44.6 15.8 45.6 21 45.7 21.9H41.7Z"
                      fill="#00579F"
                    />
                  </svg>
                  <svg
                    className="h-8 w-auto opacity-70"
                    viewBox="0 0 60 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="60" height="40" rx="4" fill="#E6E6E6" />
                    <path
                      d="M22.2 20.7C22.2 24.9 25.6 28.2 29.8 28.2C34 28.2 37.4 24.9 37.4 20.7C37.4 16.5 34 13.2 29.8 13.2C25.6 13.2 22.2 16.5 22.2 20.7Z"
                      fill="#FFB600"
                    />
                    <path
                      d="M22.2 20.7C22.2 24.9 25.6 28.2 29.8 28.2C34 28.2 37.4 24.9 37.4 20.7H22.2Z"
                      fill="#F7981D"
                    />
                    <path
                      d="M29.8 28.2C34 28.2 37.4 24.9 37.4 20.7H22.2C22.2 24.9 25.6 28.2 29.8 28.2Z"
                      fill="#FF8500"
                    />
                    <path
                      d="M26.8 10H32.8L30.8 31H24.8L26.8 10Z"
                      fill="#FF5050"
                    />
                    <path
                      d="M40.3 10C38.8 10 37.5 10.8 37 12.1C37 12.1 37.8 10 39.9 10H47.3L45.8 31H39.8L40.8 17C40.8 15.3 40.6 14.3 39.8 13.5C39.1 12.8 38.1 12.5 36.8 12.5H34.2L32.3 31H26.3L28.3 10H40.3Z"
                      fill="#FF5050"
                    />
                    <path
                      d="M13.5 23.8L14.8 16.5L15.8 16.3H21.8L21.3 19.5H17.3L16.8 23.5H21.8L21.3 26.5H16.3L15.8 31H9.8L10.8 26.8C10.8 25.1 11.8 24.1 13.5 23.8Z"
                      fill="#FF5050"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            /* Confirmation Section */
            <div id="confirmation" className="mb-8">
              <div className="text-center py-6">
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
                <h2 className="text-xl font-bold text-green-400 mb-2">
                  Purchase Successful!
                </h2>
                <p className="text-gray-300 mb-4">
                  Thank you for your purchase. Your tickets are confirmed.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 max-w-md mx-auto border border-gray-700 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Confirmation #:</span>
                    <span className="font-mono">{confirmationNumber}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Purchase Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="font-mono text-sm">
                      {orderData?.orderId}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between mb-2 text-green-400">
                      <span className="text-gray-400">Coupon Applied:</span>
                      <span>{appliedCoupon.code} (-${(appliedCoupon.discountAmount || discount).toFixed(2)})</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="font-bold text-orange-300">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  A confirmation email has been sent to your registered email
                  address.
                </p>
                <button
                  onClick={handleViewTickets}
                  className="py-3 px-6 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  View My Tickets
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-700 pt-4">
            <p>
              Need assistance? Contact our support team at
              support@youreventsite.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutTickets;