import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { paymentService } from "../../../services/api";
import serverURL from "../../../ServerConfig";
import CheckoutForm from "./CheckoutForm";
import { AuthContext } from "../../../providers/AuthProvider";
import axios from "axios";
import CountdownTimer from "../../Dashboard/UserDashboard/CountdownTimer/CountdownTimer";
import visa from "../../../assets/payment/visa.png";
import master from "../../../assets/payment/master.png";

const stripePromise = loadStripe(
  "pk_test_51RMBsVPPhrKgTwpcPcorStmAPBALn5dtB3xrqJ5bn3xfHKRYM1BPXBLyO8HkVtkk7Hhq1HZs9UaJpjR4lqxgnCvu00MVzStYrv"
);

const CheckoutTickets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [authenticationAttempted, setAuthenticationAttempted] = useState(false);
  const [finalBookingId, setFinalBookingId] = useState(null); // Store final booking ID after payment
  const authContext = useContext(AuthContext);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  // Optional note states (only for admin/seller)
  const [optionalNote, setOptionalNote] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSuccess, setNoteSuccess] = useState("");

  const [timerActive, setTimerActive] = useState(true);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const { event, selectedSeats, totalPrice, userData } = location.state || {};

  // Check if user is admin or seller
  const isAdminOrSeller = () => {
    const user = authContext.user;
    const tempUserData = JSON.parse(
      sessionStorage.getItem("tempUserData") || "{}"
    );
    const currentUser = user || tempUserData;

    return currentUser?.role === "admin" || currentUser?.role === "seller";
  };

  // FIXED: Calculate final total properly - This is the key fix
  useEffect(() => {
    let calculatedTotal = totalPrice || 0;

    if (appliedCoupon) {
      // Use finalPrice from backend if available (this should be 0 for 100% coupons)
      if (appliedCoupon.finalPrice !== undefined) {
        calculatedTotal = appliedCoupon.finalPrice;
      } else {
        // Fallback calculation - subtract discount from original price
        const discountAmount = appliedCoupon.discountAmount || discount || 0;
        calculatedTotal = Math.max(0, calculatedTotal - discountAmount);
      }
    }

    // Ensure the total is never negative
    calculatedTotal = Math.max(0, calculatedTotal);

    setFinalTotal(calculatedTotal);
    console.log(
      "Final total calculated:",
      calculatedTotal,
      "Applied coupon:",
      appliedCoupon
    );
  }, [totalPrice, appliedCoupon, discount]);

  // Handle timer expiration
  const handleTimerExpire = () => {
    setTimerActive(false);
    setShowTimeoutModal(true);
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    setCouponError("");
    setCouponSuccess("");
    // Clear note fields on timeout
    setOptionalNote("");
    setRecipientEmail("");
    setNoteError("");
    setNoteSuccess("");
  };

  // Handle timeout modal actions
  const handleTimeoutOk = () => {
    setShowTimeoutModal(false);
    navigate("/");
  };

  const handleExtendTime = () => {
    setShowTimeoutModal(false);
    setTimerActive(true);
  };

  // Get auth headers for API requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Send optional note after successful payment
  const sendOptionalNote = async (bookingId) => {
    console.log("🔍 sendOptionalNote called with:", {
      bookingId,
      optionalNote: optionalNote.trim(),
      recipientEmail: recipientEmail.trim(),
      isAdminOrSeller: isAdminOrSeller(),
    });

    if (!optionalNote.trim() || !recipientEmail.trim() || !bookingId) {
      console.log("❌ Skipping note send - missing required fields:", {
        hasNote: !!optionalNote.trim(),
        hasEmail: !!recipientEmail.trim(),
        hasBookingId: !!bookingId,
      });
      return; // Skip if no note, email, or booking ID
    }

    setNoteLoading(true);
    setNoteError("");

    try {
      const token = localStorage.getItem("auth-token");

      console.log("🔐 Auth token check:", {
        tokenExists: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20),
      });

      if (!token) {
        throw new Error("Authentication required to send note");
      }

      // Prepare request data
      const noteData = {
        bookingId: bookingId,
        recipientEmail: recipientEmail.trim(),
        note: optionalNote.trim(),
      };

      console.log("📤 Sending optional note request:", {
        url: `${serverURL.url}bookings/optional-info`,
        data: noteData,
        headers: {
          Authorization: `Bearer ${token.substring(0, 20)}...`,
          "Content-Type": "application/json",
        },
      });

      const response = await axios.post(
        `${serverURL.url}bookings/optional-info`,
        noteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // Increase timeout
        }
      );

      console.log("✅ Note API response:", {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

      if (response.data.success) {
        setNoteSuccess("Note sent successfully!");
        console.log(
          "🎉 Optional note sent successfully to:",
          recipientEmail.trim()
        );

        // Clear the note fields after successful send
        setOptionalNote("");
        setRecipientEmail("");
      } else {
        const errorMsg = response.data.message || "Failed to send note";
        setNoteError(errorMsg);
        console.error("❌ Note send failed:", errorMsg);
      }
    } catch (error) {
      console.error("❌ Note sending error details:", {
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        requestUrl: error.config?.url,
        requestData: error.config?.data,
        fullError: error,
      });

      let errorMessage = "Failed to send note. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage =
          "Invalid request. Please check the booking ID and try again.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Booking not found. Please contact support.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please try again.";
      } else if (!error.response) {
        errorMessage = "Network error. Please check your connection.";
      }

      setNoteError(errorMessage);
    } finally {
      setNoteLoading(false);
    }
  };

  // Fixed applyCoupon function
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
      // Ensure we have the event ID
      const eventId = event?._id || event?.id;
      console.log("🔍 Debug Info:", {
        eventId,
        eventObject: event,
        totalPrice,
        couponCode: couponCode.trim(),
        timerActive,
      });

      if (!eventId) {
        throw new Error("Event ID is missing. Please refresh and try again.");
      }

      // Ensure we have a valid total price
      if (!totalPrice || totalPrice <= 0) {
        throw new Error("Invalid total price. Please refresh and try again.");
      }

      // Get auth token
      const token = localStorage.getItem("auth-token");
      console.log("🔐 Auth check:", {
        tokenExists: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20),
      });

      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Prepare request data to match your exact API format
      const requestData = {
        eventId: eventId,
        code: couponCode.toUpperCase().trim(),
        totalAmount: parseFloat(totalPrice),
      };

      console.log(
        "🎟️ Coupon request data:",
        JSON.stringify(requestData, null, 2)
      );
      console.log("📍 API Endpoint:", `${serverURL.url}coupons/apply-coupon`);

      // Make the API request with detailed headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      };

      console.log("📤 Request config:", {
        url: `${serverURL.url}coupons/apply-coupon`,
        method: "POST",
        headers: config.headers,
        data: requestData,
      });

      const response = await axios.post(
        `${serverURL.url}coupons/apply-coupon`,
        requestData,
        config
      );

      console.log("✅ Coupon response:", response.data);

      if (response.data.success) {
        const discountAmount = parseFloat(response.data.discountAmount) || 0;
        const finalPrice = parseFloat(response.data.finalPrice) || 0; // Changed: ensure it defaults to 0, not totalPrice
        const couponId = response.data.couponId;

        // Validate the response data
        if (finalPrice < 0) {
          throw new Error("Invalid discount amount. Coupon cannot be applied.");
        }

        const appliedCouponData = {
          id: couponId,
          code: couponCode.toUpperCase().trim(),
          discountAmount: discountAmount,
          finalPrice: finalPrice, // This should be 0 for 100% coupons
          originalPrice: totalPrice,
        };

        setAppliedCoupon(appliedCouponData);
        setDiscount(discountAmount);
        setCouponSuccess(
          `Coupon applied! You saved $${discountAmount.toFixed(2)}`
        );
        setCouponCode("");
      } else {
        setCouponError(response.data.message || "Failed to apply coupon");
      }
    } catch (error) {
      console.error("❌ Coupon error details:", {
        message: error.message,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        responseStatusText: error.response?.statusText,
        responseHeaders: error.response?.headers,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestData: error.config?.data,
        requestHeaders: error.config?.headers,
        fullError: error,
      });

      // Log the exact response body if available
      if (error.response?.data) {
        console.error("🚨 Backend Error Response:", error.response.data);
      }

      // Handle specific error cases - prioritize backend message
      let errorMessage = "Failed to apply coupon. Please try again.";

      if (error.response?.data?.message) {
        // Use the exact message from your backend
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage =
          "Invalid coupon code or request. Please check your input.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Coupon code not found or has expired.";
      } else if (error.response?.status === 409) {
        errorMessage =
          "Coupon has already been used or is not applicable to this event.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage =
          "Request timeout. Please check your connection and try again.";
      } else if (!error.response) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setCouponError(errorMessage);
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

  // Handle coupon input keypress
  const handleCouponKeyPress = (e) => {
    if (e.key === "Enter") {
      applyCoupon();
    }
  };

  // Handle note input changes
  const handleNoteChange = (e) => {
    setOptionalNote(e.target.value);
    setNoteError("");
    setNoteSuccess("");
  };

  const handleEmailChange = (e) => {
    setRecipientEmail(e.target.value);
    setNoteError("");
    setNoteSuccess("");
  };

  // Handle free checkout (when final total is $0)
  const handleFreeCheckout = async () => {
    console.log("Processing free checkout...");

    // Generate order ID
    const freeOrderId = `free_order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    console.log("Generated free order ID:", freeOrderId);

    // Mark payment as complete
    setPaymentComplete(true);
    setOrderData({
      orderId: freeOrderId,
      paymentIntentId: "free_checkout",
      appliedCoupon,
      discount,
      finalAmount: 0,
    });

    // Stop the timer
    setTimerActive(false);

    // Store booking data
    const tempBookingId = sessionStorage.getItem("tempBookingId");
    console.log("Free checkout - temp booking ID:", tempBookingId);

    if (tempBookingId) {
      setFinalBookingId(tempBookingId);

      // Send optional note if provided (for admin/seller only)
      if (isAdminOrSeller()) {
        console.log("Free checkout - User is admin/seller, sending note...");

        // Add a small delay to ensure all state updates are complete
        setTimeout(async () => {
          try {
            await sendOptionalNote(tempBookingId);
          } catch (error) {
            console.error(
              "Free checkout - Failed to send optional note:",
              error
            );
          }
        }, 1000);
      } else {
        console.log("Free checkout - User is not admin/seller, skipping note");
      }

      sessionStorage.removeItem("tempBookingId");
    } else {
      console.warn("Free checkout - No temp booking ID found!");
    }

    // Store completed order
    localStorage.setItem("completedOrderId", freeOrderId);

    // Scroll to confirmation
    setTimeout(() => {
      document
        .getElementById("confirmation")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 500);

    console.log("Free checkout completed with order ID:", freeOrderId);
  };

  // FIXED: Only store user data temporarily, don't trigger authentication until payment
  useEffect(() => {
    if (userData && !authenticationAttempted && paymentComplete) {
      // Only authenticate AFTER payment is complete
      const attemptAuthentication = async () => {
        setAuthenticationAttempted(true);

        // Store user data temporarily for payment processing
        sessionStorage.setItem("tempUserData", JSON.stringify(userData));

        if (!authContext.user && userData.email) {
          try {
            console.log("Attempting to sign in after payment:", userData.email);
            const user = await authContext.signIn(
              userData.email,
              userData.password
            );

            const token = localStorage.getItem("auth-token");
            if (!token && user) {
              localStorage.setItem("auth-token", "forced-token-after-signin");
            }
          } catch (error) {
            try {
              console.log("Creating user after payment:", userData.email);
              const newUser = await authContext.createUser(
                userData.email,
                userData.password
              );

              const token = localStorage.getItem("auth-token");
              if (!token && newUser) {
                localStorage.setItem(
                  "auth-token",
                  "forced-token-after-creation"
                );
              }
            } catch (createError) {
              console.error("Failed to create user:", createError);
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      };

      attemptAuthentication();
    } else if (userData && !paymentComplete) {
      // Store user data temporarily for payment processing (but don't authenticate yet)
      sessionStorage.setItem("tempUserData", JSON.stringify(userData));
    }
  }, [userData, authContext, authenticationAttempted, paymentComplete]); // Added paymentComplete dependency

  // FIXED: Don't store booking data until payment is complete
  useEffect(() => {
    window.scrollTo(0, 0);

    // FIXED: Handle page refresh - check if we have existing booking data
    const existingBookingId =
      sessionStorage.getItem("tempBookingId") ||
      localStorage.getItem("bookingId");

    if (location.state?.bookingId && !paymentComplete) {
      // Store temporarily for payment processing only
      sessionStorage.setItem("tempBookingId", location.state.bookingId);
    } else if (!existingBookingId && !paymentComplete) {
      // If no booking ID and not from location state, redirect to event page
      console.warn("No booking ID found, redirecting to event selection");
      if (event?._id) {
        navigate(`/events/${event._id}`);
        return;
      } else {
        navigate("/");
        return;
      }
    }

    if (!confirmationNumber) {
      const random = Math.floor(100000 + Math.random() * 900000);
      const timestamp = new Date().getTime().toString().slice(-4);
      setConfirmationNumber(`TKT-${random}-${timestamp}`);
    }

    if (!event || !selectedSeats || selectedSeats.length === 0) {
      if (process.env.NODE_ENV !== "development") {
        // Try to get event data from localStorage if available
        const savedEventData = localStorage.getItem("currentEventData");
        const savedSeatsData = localStorage.getItem("currentSeatsData");

        if (!savedEventData || !savedSeatsData) {
          navigate("/");
        }
      } else {
        console.warn(
          "Missing event data in development mode - would redirect in production"
        );
      }
    }
  }, [
    confirmationNumber,
    navigate,
    event,
    selectedSeats,
    location.state,
    paymentComplete,
  ]);




const handlePaymentComplete = async (orderId, paymentData) => {
  console.log("Payment completed, processing order:", orderId);
  console.log("Payment data received:", paymentData);

  // Use the order ID from backend response (passed from CheckoutForm)
  let finalOrderId = orderId;
  
  // If no order ID from backend, use payment intent ID as fallback
  if (!finalOrderId || finalOrderId === "undefined") {
    if (paymentData?.paymentIntentId) {
      finalOrderId = paymentData.paymentIntentId;
      console.log("Using payment intent ID as order ID:", finalOrderId);
    } else {
      console.error("No order ID or payment intent ID available!");
      // Handle this error case appropriately
      setError("Payment processed but order ID missing. Please contact support.");
      return;
    }
  }

  // Prevent duplicate processing
  const processedOrders = JSON.parse(
    sessionStorage.getItem("processedOrders") || "[]"
  );

  if (processedOrders.includes(finalOrderId)) {
    console.log("Order already processed:", finalOrderId);
    return;
  }

  // Check if this payment has already been processed using state
  if (
    orderData?.orderId === finalOrderId &&
    paymentComplete &&
    finalOrderId &&
    finalOrderId !== "undefined"
  ) {
    console.log("Payment already processed for this order:", finalOrderId);
    return;
  }

  // Stop the timer when payment is successful
  setTimerActive(false);
  setPaymentComplete(true);
  setOrderData({ 
    orderId: finalOrderId, 
    paymentIntentId: paymentData?.paymentIntentId,
    bookingId: paymentData?.bookingId,
    ...paymentData 
  });

  // Mark order as processed
  processedOrders.push(finalOrderId);
  sessionStorage.setItem("processedOrders", JSON.stringify(processedOrders));

  // Get the confirmed booking ID from payment data or use temp booking ID
  const tempBookingId = paymentData?.bookingId || sessionStorage.getItem("tempBookingId");
  
  console.log("Using booking ID:", tempBookingId);
  console.log("Final order ID being used:", finalOrderId);

  if (tempBookingId) {
    setFinalBookingId(tempBookingId);

    // Send optional note if provided (for admin/seller only)
    if (isAdminOrSeller()) {
      console.log("User is admin/seller, attempting to send note...");
      
      setTimeout(async () => {
        try {
          await sendOptionalNote(tempBookingId);
        } catch (error) {
          console.error("Failed to send optional note:", error);
        }
      }, 1000);
    }

    // Remove temp booking ID after processing
    sessionStorage.removeItem("tempBookingId");
  } else {
    console.warn("No booking ID found!");
  }

  // Store the completed order ID (from backend or payment intent ID)
  localStorage.setItem("completedOrderId", finalOrderId);

  console.log("Order processed successfully:", finalOrderId);

  // Scroll to confirmation
  setTimeout(() => {
    document
      .getElementById("confirmation")
      ?.scrollIntoView({ behavior: "smooth" });
  }, 500);
};

const handleViewTickets = () => {
  // Get order ID from state or localStorage (should be from backend now)
  let savedOrderId = orderData?.orderId || localStorage.getItem("completedOrderId");

  // Only generate if absolutely no order ID is available
  if (!savedOrderId || savedOrderId === "undefined") {
    console.warn("No order ID available for ticket view!");
    // You might want to redirect to an error page or show an error message
    setError("Order ID not found. Please contact support.");
    return;
  }

  // Ensure we have the final booking ID from successful payment
  const bookingIdToUse = finalBookingId || localStorage.getItem("bookingId");

  console.log("Navigating to tickets with:", {
    orderId: savedOrderId,
    bookingId: bookingIdToUse,
    finalTotal: finalTotal,
  });

  navigate("/dashboard/my-tickets", {
    state: {
      event,
      selectedSeats,
      totalPrice,
      grandTotal: finalTotal,
      confirmationNumber,
      purchaseDate: new Date().toISOString(),
      orderId: savedOrderId, // This should now be from your backend
      bookingId: bookingIdToUse,
      appliedCoupon,
      discount,
      paymentComplete: true,
    },
  });
};

  // Handle go back
  const handleGoBack = () => {
    // Clear any temporary data when going back
    sessionStorage.removeItem("tempBookingId");
    sessionStorage.removeItem("tempUserData");
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

  // // FIXED: Only navigate to tickets AFTER payment is complete
  // const handleViewTickets = () => {
  //   let savedOrderId =
  //     localStorage.getItem("completedOrderId") || orderData?.orderId;

  //   // Generate orderId if still missing
  //   if (!savedOrderId || savedOrderId === "undefined") {
  //     savedOrderId = `ticket_order_${Date.now()}_${Math.floor(
  //       Math.random() * 10000
  //     )}`;
  //     localStorage.setItem("completedOrderId", savedOrderId);
  //     console.log("Generated orderId for ticket view:", savedOrderId);
  //   }

  //   // Ensure we have the final booking ID from successful payment
  //   const bookingIdToUse = finalBookingId || localStorage.getItem("bookingId");

  //   console.log("Navigating to tickets with:", {
  //     orderId: savedOrderId,
  //     bookingId: bookingIdToUse,
  //     finalTotal: finalTotal,
  //   });

  //   navigate("/dashboard/my-tickets", {
  //     state: {
  //       event,
  //       selectedSeats,
  //       totalPrice,
  //       grandTotal: finalTotal,
  //       confirmationNumber,
  //       purchaseDate: new Date().toISOString(),
  //       orderId: savedOrderId,
  //       bookingId: bookingIdToUse, // Pass the confirmed booking ID
  //       appliedCoupon,
  //       discount,
  //       paymentComplete: true, // Explicitly indicate payment was completed
  //     },
  //   });
  // };

  // FIXED: Only verify auth token after payment completion
  useEffect(() => {
    if (paymentComplete) {
      const checkAuthToken = async () => {
        const token = localStorage.getItem("auth-token");
        if (!token && authContext.user) {
          console.warn(
            "Auth token is missing but user is authenticated, recreating token"
          );
          localStorage.setItem("auth-token", "forced-token-from-verification");
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      };

      checkAuthToken();
    }
  }, [authContext.user, paymentComplete]); // Only run after payment completion

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      {/* Timer Component - Only show if payment is not complete */}
      {!paymentComplete && (
        <CountdownTimer
          initialMinutes={10}
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
                Your checkout session has expired. Please restart your booking
                process.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleTimeoutOk}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Go to Home
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
            className="flex items-center text-white hover:text-orange-200 transition-colors cursor-pointer"
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
          <div className="w-12"></div>
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
                  <div className="ticket-card bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-orange-500 border-opacity-40 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                      <div className="font-bold truncate">
                        {event?.title || "Event"}
                      </div>
                      <div className="text-sm bg-orange-900 bg-opacity-50 rounded px-2 py-1">
                        Seat {seat.row}
                        {seat.number}
                      </div>
                    </div>

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
                      className={`px-6 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                        couponLoading || !couponCode.trim()
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {couponLoading ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Applying...
                        </div>
                      ) : (
                        "Apply"
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
                          You saved $
                          {appliedCoupon.discountAmount?.toFixed(2) ||
                            discount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
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

            {/* Optional Note Section - Only for Admin/Seller and before payment */}
            {!paymentComplete && isAdminOrSeller() && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 mb-6">
                <h3 className="text-md font-bold text-blue-300 mb-4 flex items-center">
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
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send Optional Note
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={handleEmailChange}
                      placeholder="Enter email address to send note"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={noteLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Note Message
                    </label>
                    <textarea
                      value={optionalNote}
                      onChange={handleNoteChange}
                      placeholder="Enter your note here (e.g., pickup instructions, special messages)"
                      rows="3"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={noteLoading}
                    />
                  </div>

                  {/* Note Messages */}
                  {noteError && (
                    <div className="flex items-center text-red-400 text-sm">
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
                      {noteError}
                    </div>
                  )}

                  {noteSuccess && (
                    <div className="flex items-center text-green-400 text-sm">
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
                      {noteSuccess}
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    <p>
                      <strong>Note:</strong> The note will be sent automatically
                      after successful payment. Both email and note fields are
                      optional - leave empty if you don't want to send a note.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Summary - FIXED: Now uses finalTotal for the total display */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span>
                  Ticket{selectedSeats?.length > 1 ? "s" : ""} (
                  {selectedSeats?.length || 0})
                </span>
                <span>${totalPrice?.toFixed(2) || "0.00"}</span>
              </div>

              {appliedCoupon &&
                (appliedCoupon.discountAmount > 0 || discount > 0) && (
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
                    <span>
                      -${(appliedCoupon.discountAmount || discount).toFixed(2)}
                    </span>
                  </div>
                )}

              <div className="border-t border-gray-700 my-2 pt-2 flex justify-between items-center font-bold text-orange-300">
                <span>Total</span>
                <span className="flex flex-col items-end">
                  {appliedCoupon &&
                    (appliedCoupon.discountAmount > 0 || discount > 0) && (
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
              {finalTotal > 0 ? (
                <>
                  <h2 className="text-lg font-bold text-orange-300 mb-4">
                    Payment Details
                  </h2>

                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      className="cursor-pointer"
                      grandTotal={finalTotal}
                      event={event}
                      selectedSeats={selectedSeats || []}
                      onPaymentComplete={handlePaymentComplete}
                      bookingId={sessionStorage.getItem("tempBookingId")} // Use temp booking ID for payment
                      appliedCoupon={appliedCoupon}
                      discount={discount}
                    />
                  </Elements>

                  <div className="mt-4 text-xs text-center text-gray-400">
                    <p>
                      Your payment is secure and encrypted. By proceeding, you
                      agree to our Terms of Service and Privacy Policy.
                    </p>
                    <div className="flex justify-center items-center mt-2 space-x-4">
                      {/* Visa Card Logo */}

                      <img className="w-14" src={visa} alt="" />
                      {/* Mastercard Logo */}
                      <img className="w-14" src={master} alt="" />
                    </div>
                  </div>
                </>
              ) : (
                /* Free Checkout Section */
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
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
                    Free Ticket - No Payment Required!
                  </h2>

                  <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-4">
                    <p className="text-green-100 text-center mb-4">
                      Great news! Your coupon covers the full amount. No payment
                      is required to complete your booking.
                    </p>
                  </div>

                  <button
                    onClick={handleFreeCheckout}
                    className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Complete Free Booking
                  </button>

                  <div className="mt-4 text-xs text-center text-gray-400">
                    <p>
                      By proceeding, you agree to our Terms of Service and
                      Privacy Policy.
                    </p>
                  </div>
                </div>
              )}
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
                  {finalTotal === 0
                    ? "Free Booking Confirmed!"
                    : "Purchase Successful!"}
                </h2>
                <p className="text-gray-300 mb-4">
                  Thank you for your {finalTotal === 0 ? "booking" : "purchase"}
                  . Your tickets are confirmed.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 max-w-md mx-auto border border-gray-700 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Confirmation #:</span>
                    <span className="font-mono">{confirmationNumber}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">
                      {finalTotal === 0 ? "Booking" : "Purchase"} Date:
                    </span>
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
                      <span>
                        {appliedCoupon.code} (-$
                        {(appliedCoupon.discountAmount || discount).toFixed(2)})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Amount {finalTotal === 0 ? "Due" : "Paid"}:
                    </span>
                    <span
                      className={`font-bold ${
                        finalTotal === 0 ? "text-green-300" : "text-orange-300"
                      }`}
                    >
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Show note status for admin/seller */}
                {isAdminOrSeller() &&
                  (optionalNote.trim() || recipientEmail.trim()) && (
                    <div className="bg-blue-900 border border-blue-600 rounded-lg p-3 max-w-md mx-auto mb-4">
                      <div className="text-blue-100 text-sm">
                        {noteLoading && (
                          <div className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-300"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending note...
                          </div>
                        )}
                        {noteSuccess && (
                          <div className="flex items-center text-green-300">
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
                            {noteSuccess}
                          </div>
                        )}
                        {noteError && (
                          <div className="flex items-center text-red-300">
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
                            {noteError}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                <p className="text-sm text-gray-400 mb-6">
                  A confirmation email has been sent to your registered email
                  address.
                </p>
                <button
                  onClick={handleViewTickets}
                  className="py-3 px-6 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer"
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
              info@eventsntickets.com.au
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutTickets;
