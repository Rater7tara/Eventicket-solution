import React, { useState, useEffect, useContext, useRef } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { AuthContext } from "../../../providers/AuthProvider";
import serverURL from "../../../ServerConfig";

// API base URL
const API_BASE_URL = serverURL.url;

// Maximum number of token check attempts
const MAX_TOKEN_ATTEMPTS = 5;

// Payment form component
const CheckoutForm = ({
  grandTotal,
  event,
  selectedSeats,
  onPaymentComplete,
  bookingId,
  appliedCoupon,
  discount,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState(""); // Changed from orderId to paymentIntentId
  const [confirmedBookingId, setConfirmedBookingId] = useState(""); // Store the confirmed booking ID
  const [errorDetails, setErrorDetails] = useState("");
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [tokenAttempts, setTokenAttempts] = useState(0);
  
  // New state for terms and privacy agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // CRITICAL FIX: Use refs to prevent duplicate API calls
  const paymentInProgressRef = useRef(false);
  const currentBookingIdRef = useRef(null);

  // Get auth context
  const { user, loading, token } = useContext(AuthContext);

  useEffect(() => {
    console.log("Checkout form received bookingId:", bookingId);
  }, [bookingId]);

  // Function to get the auth token from multiple possible sources
  const getAuthToken = () => {
    // First try from AuthContext
    if (token) {
      return token;
    }

    // Then try from localStorage
    const localToken = localStorage.getItem("auth-token");
    if (localToken) {
      return localToken;
    }

    // Then try from other possible localStorage keys
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (userData.token) {
      return userData.token;
    }

    // Try user info
    const userInfo = JSON.parse(localStorage.getItem("user-info") || "{}");
    if (userInfo.token) {
      return userInfo.token;
    }

    // Also check sessionStorage for temporary user data
    const tempUserData = JSON.parse(
      sessionStorage.getItem("tempUserData") || "{}"
    );
    if (tempUserData.token) {
      return tempUserData.token;
    }

    // As a last resort, check if the user object has a token
    if (user && user.token) {
      return user.token;
    }

    return null;
  };

  // Function to ensure token is available and valid
  const ensureAuthToken = async () => {
    return new Promise((resolve) => {
      let attempts = 0;

      const checkToken = () => {
        const token = getAuthToken();

        // Check if token exists and has valid format (JWT starts with eyJ)
        if (
          token &&
          (token.startsWith("eyJ") || token.startsWith("Bearer eyJ"))
        ) {
          console.log("Valid auth token found on attempt", attempts + 1);
          // Store token temporarily for this session
          sessionStorage.setItem(
            "temp-auth-token",
            token.replace("Bearer ", "")
          );
          resolve(token.replace("Bearer ", ""));
        } else if (attempts < MAX_TOKEN_ATTEMPTS) {
          attempts++;
          console.log(
            "Valid auth token not found, attempt",
            attempts,
            "of",
            MAX_TOKEN_ATTEMPTS
          );

          // Wait a bit longer between attempts
          setTimeout(checkToken, 1000);
        } else {
          console.log(
            "Max token check attempts reached, proceeding without token"
          );
          resolve(null);
        }
      };

      checkToken();
    });
  };

  // Remove the generateOrderIdFromPaymentIntent function since we're not generating order IDs

  // Create payment intent - UPDATED TO MATCH YOUR API RESPONSE
  useEffect(() => {
    // Skip if conditions not met
    if (grandTotal <= 0 || loading || !bookingId) {
      return;
    }

    // CRITICAL: Prevent duplicate calls using refs
    const currentBookingId =
      bookingId || sessionStorage.getItem("tempBookingId");

    // If we already processed this booking ID, don't do it again
    if (
      paymentInProgressRef.current &&
      currentBookingIdRef.current === currentBookingId
    ) {
      console.log("Payment already in progress for this booking, skipping...");
      return;
    }

    // Check if we already have a client secret for this booking
    const existingClientSecret = sessionStorage.getItem(
      `clientSecret_${currentBookingId}`
    );
    const existingPaymentIntentId = sessionStorage.getItem(
      `paymentIntentId_${currentBookingId}`
    );

    if (existingClientSecret && existingPaymentIntentId) {
      console.log("Using existing payment intent from session storage");
      setClientSecret(existingClientSecret);
      setPaymentIntentId(existingPaymentIntentId);
      setPaymentInitiated(true);
      return;
    }

    const createPaymentIntent = async () => {
      // Set flags to prevent duplicate calls
      paymentInProgressRef.current = true;
      currentBookingIdRef.current = currentBookingId;
      setPaymentInitiated(true);

      try {
        // First, ensure we have the auth token
        const token = await ensureAuthToken();

        if (!token) {
          throw new Error(
            "Unable to authenticate. Please try logging in again."
          );
        }

        // Get userId from temporary data or context
        const tempUserData = JSON.parse(
          sessionStorage.getItem("tempUserData") || "{}"
        );
        const userId =
          user?._id ||
          tempUserData._id ||
          JSON.parse(localStorage.getItem("userData") || "{}")._id;

        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        // UPDATED: Match your API structure - no orderId field needed
        const paymentData = {
          ticketId: event._id,
          quantity: selectedSeats.length || 1,
          userId: userId,
          bookingId: currentBookingId,
          // Add coupon information if applied
          ...(appliedCoupon && {
            couponId: appliedCoupon.id,
            couponCode: appliedCoupon.code,
            discountAmount: appliedCoupon.discountAmount || discount,
            originalAmount: appliedCoupon.originalPrice,
            finalAmount: grandTotal,
          }),
        };

        console.log("Payment data being sent:", paymentData);

        // Create headers with token
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        console.log("Making payment request with headers:", headers);

        // Call payment API
        const response = await fetch(`${API_BASE_URL}payments/create-payment`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(paymentData),
        });

        // Get JSON response
        const responseData = await response.json();
        console.log("API response:", responseData);

        // Handle response according to your API structure
        if (!response.ok) {
          if (
            response.status === 400 &&
            responseData.message?.includes("Payment already initiated")
          ) {
            // If payment already exists, try to get existing client secret
            if (responseData.clientSecret) {
              console.log("Using existing payment intent from server");
              setClientSecret(responseData.clientSecret);
              setPaymentIntentId(responseData.paymentIntentId);
              setConfirmedBookingId(responseData.bookingId);

              // Cache for future use
              sessionStorage.setItem(
                `clientSecret_${currentBookingId}`,
                responseData.clientSecret
              );
              sessionStorage.setItem(
                `paymentIntentId_${currentBookingId}`,
                responseData.paymentIntentId
              );
              return;
            }
          }

          throw new Error(
            responseData.message ||
              `Request failed with status ${response.status}`
          );
        }

        // Check for success and set payment data from your API response
        if (responseData.success) {
          setClientSecret(responseData.clientSecret);
          setPaymentIntentId(responseData.paymentIntentId);
          setConfirmedBookingId(responseData.bookingId);

          // Cache for future use
          sessionStorage.setItem(
            `clientSecret_${currentBookingId}`,
            responseData.clientSecret
          );
          sessionStorage.setItem(
            `paymentIntentId_${currentBookingId}`,
            responseData.paymentIntentId
          );
        } else {
          throw new Error("Could not initialize payment. Please try again.");
        }
      } catch (err) {
        console.error("Payment request error:", err);

        // Reset flags on error
        paymentInProgressRef.current = false;
        currentBookingIdRef.current = null;

        // Show detailed error info
        setErrorDetails(
          JSON.stringify(
            {
              message: err.message,
              token: getAuthToken() ? "Token exists" : "No token",
              userId: user?._id || "No user ID",
              bookingId: currentBookingId,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          )
        );

        setError(`Payment initialization failed: ${err.message}`);
        setPaymentInitiated(false); // Allow retry
      }
    };

    createPaymentIntent();
  }, [
    grandTotal,
    event,
    selectedSeats,
    user,
    loading,
    appliedCoupon,
    discount,
    bookingId,
  ]);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Check if user agreed to terms
    if (!agreedToTerms) {
      setError("Please agree to the Privacy Policy and Terms & Conditions to proceed.");
      return;
    }
    
    setProcessing(true);

    if (!stripe || !elements || !clientSecret) {
      setProcessing(false);
      return;
    }

    // Get card element
    const cardElement = elements.getElement(CardElement);

    // Get user data from temporary storage or localStorage
    const tempUserData = JSON.parse(
      sessionStorage.getItem("tempUserData") || "{}"
    );
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userDataToUse =
      Object.keys(tempUserData).length > 0 ? tempUserData : userData;

    // Set up billing details - REMOVED postal_code (ZIP code)
    const billingDetails = {
      name: userDataToUse.name || "Guest Checkout",
      email: userDataToUse.email || "",
      address: {
        line1: userDataToUse.address || "",
        city: userDataToUse.city || "",
        // Removed postal_code field
      },
    };

    // Confirm payment with Stripe
    const { error: paymentError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails,
        },
      });

    if (paymentError) {
      setError(`Payment failed: ${paymentError.message}`);
      setProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      // Payment succeeded, now confirm with your backend
      try {
        const token = await ensureAuthToken();

        // UPDATED: Match your API structure - only send paymentIntentId
        const confirmationData = {
          paymentIntentId: paymentIntent.id,
          // Include coupon information if needed
          ...(appliedCoupon && {
            couponId: appliedCoupon.id,
            couponCode: appliedCoupon.code,
            discountApplied: appliedCoupon.discountAmount || discount,
            finalAmount: grandTotal,
          }),
        };

        console.log("Sending confirmation data:", confirmationData);

        // Call confirm-payment endpoint
        const response = await fetch(
          `${API_BASE_URL}payments/confirm-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(confirmationData),
          }
        );

        const data = await response.json();
        console.log("Confirmation response:", data);

        if (data.success) {
          // Clear cached payment data after successful completion
          const currentBookingId =
            bookingId || sessionStorage.getItem("tempBookingId");
          sessionStorage.removeItem(`clientSecret_${currentBookingId}`);
          sessionStorage.removeItem(`paymentIntentId_${currentBookingId}`);

          // Get order ID from backend response
          const orderId = data.orderId || data.order_id || paymentIntent.id;
          
          localStorage.setItem("completedOrderId", orderId);
          setError(null);
          setSucceeded(true);

          // Pass data to parent component with order ID from backend
          onPaymentComplete(orderId, {
            paymentIntentId: paymentIntent.id,
            bookingId: confirmedBookingId || bookingId,
            appliedCoupon,
            discount,
            finalAmount: grandTotal,
            orderId: orderId,
            ...data, // Include all backend response data
          });
        } else {
          // If backend confirmation fails but Stripe succeeded,
          // use payment intent ID as fallback order ID
          const fallbackOrderId = paymentIntent.id;
          localStorage.setItem("completedOrderId", fallbackOrderId);
          setError(null);
          setSucceeded(true);
          onPaymentComplete(fallbackOrderId, {
            paymentIntentId: paymentIntent.id,
            bookingId: confirmedBookingId || bookingId,
            appliedCoupon,
            discount,
            finalAmount: grandTotal,
            orderId: fallbackOrderId,
          });
        }
      } catch (err) {
        console.error("Error confirming payment:", err);

        // Even if confirmation fails, Stripe processed the payment
        // Use payment intent ID as fallback order ID
        const fallbackOrderId = paymentIntent.id;
        localStorage.setItem("completedOrderId", fallbackOrderId);
        setError(null);
        setSucceeded(true);
        onPaymentComplete(fallbackOrderId, {
          paymentIntentId: paymentIntent.id,
          bookingId: confirmedBookingId || bookingId,
          appliedCoupon,
          discount,
          finalAmount: grandTotal,
          orderId: fallbackOrderId,
        });
      }
    } else {
      setError(`Payment status: ${paymentIntent.status}. Please try again.`);
    }

    setProcessing(false);
  };

  // Handle manual payment retry
  const handleRetryPayment = () => {
    // Clear all payment state and cached data
    const currentBookingId =
      bookingId || sessionStorage.getItem("tempBookingId");
    sessionStorage.removeItem(`clientSecret_${currentBookingId}`);
    sessionStorage.removeItem(`paymentIntentId_${currentBookingId}`);

    // Reset component state
    setPaymentInitiated(false);
    setError(null);
    setErrorDetails("");
    setClientSecret("");
    setPaymentIntentId("");
    setConfirmedBookingId("");

    // Reset refs
    paymentInProgressRef.current = false;
    currentBookingIdRef.current = null;

    // Force re-trigger of payment creation
    setTokenAttempts(tokenAttempts + 1);
  };

  // Handle booking restart
  const handleRestartBooking = () => {
    // Clear all payment and booking data
    const currentBookingId =
      bookingId || sessionStorage.getItem("tempBookingId");
    sessionStorage.removeItem(`clientSecret_${currentBookingId}`);
    sessionStorage.removeItem(`paymentIntentId_${currentBookingId}`);
    sessionStorage.removeItem("tempBookingId");
    sessionStorage.removeItem("tempUserData");
    sessionStorage.removeItem("temp-auth-token");

    // Navigate back to seat selection
    window.location.href = `/events/${event._id}`;
  };

  // Handle input change
  const handleChange = (event) => {
    setDisabled(event.empty);
    setError(event.error ? event.error.message : "");
  };

  // Handle terms agreement change
  const handleTermsChange = (e) => {
    setAgreedToTerms(e.target.checked);
    // Clear error if user agrees to terms
    if (e.target.checked && error && error.includes("Privacy Policy")) {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mt-6">
      <div className="mb-4">
        <label className="block text-orange-300 text-sm font-medium mb-2">
          Card Details
        </label>
        <div className="p-3 border border-gray-600 rounded-lg bg-gray-800">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#f3f4f6",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#ef4444",
                },
              },
              hidePostalCode: true, // This removes the ZIP code field
            }}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Terms and Privacy Policy Agreement */}
      <div className="mb-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={handleTermsChange}
            className="mt-1 h-4 w-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
          />
          <span className="text-sm text-gray-300 leading-relaxed">
            I agree to the{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="/terms-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Terms & Conditions
            </a>
          </span>
        </label>
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
          {errorDetails && (
            <details className="mt-2 text-xs bg-gray-900 p-2 rounded">
              <summary>Technical Details (for development)</summary>
              <pre className="whitespace-pre-wrap">{errorDetails}</pre>
            </details>
          )}

          <div className="mt-3 flex space-x-2">
            <button
              type="button"
              onClick={handleRetryPayment}
              className="text-orange-300 hover:text-orange-200 underline cursor-pointer text-sm"
            >
              Retry Payment
            </button>
            {error.includes("booking session has expired") && (
              <button
                type="button"
                onClick={handleRestartBooking}
                className="text-blue-300 hover:text-blue-200 underline cursor-pointer text-sm"
              >
                Start New Booking
              </button>
            )}
          </div>
        </div>
      )}

      {!clientSecret && !error && (
        <div className="text-orange-300 text-sm mb-4 flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-300"
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
          Initializing payment...
        </div>
      )}

      {/* Show applied coupon info on payment button */}
      {appliedCoupon && (
        <div className="text-green-400 text-sm mb-2 flex items-center">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Coupon "{appliedCoupon.code}" applied - Save $
          {(appliedCoupon.discountAmount || discount).toFixed(2)}
        </div>
      )}

      <button
        type="submit"
        disabled={processing || disabled || succeeded || !clientSecret || !agreedToTerms}
        className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all cursor-pointer ${
          processing || disabled || !clientSecret || !agreedToTerms
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg hover:shadow-xl"
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center ">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Processing...
          </span>
        ) : succeeded ? (
          "Payment Successful!"
        ) : (
          `Pay $${grandTotal.toLocaleString()}`
        )}
      </button>

      {/* Add payment security notice */}
      {appliedCoupon && (
        <div className="mt-2 text-xs text-center text-gray-400">
          Final amount after coupon discount: ${grandTotal.toFixed(2)}
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;