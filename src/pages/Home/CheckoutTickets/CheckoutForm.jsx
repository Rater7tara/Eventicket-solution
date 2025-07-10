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
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [confirmedBookingId, setConfirmedBookingId] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [tokenAttempts, setTokenAttempts] = useState(0);
  
  // New state for terms and privacy agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // CRITICAL FIX: Use refs to prevent duplicate API calls
  const paymentInProgressRef = useRef(false);
  const currentBookingIdRef = useRef(null);
  const lastGrandTotalRef = useRef(null);

  // Get auth context
  const { user, loading, token } = useContext(AuthContext);

  useEffect(() => {
    console.log("🔍 CHECKOUT FORM - Component received props:", {
      grandTotal,
      bookingId,
      appliedCoupon,
      discount,
      lastGrandTotal: lastGrandTotalRef.current
    });
    
    // Check if grandTotal changed (coupon was applied/removed)
    if (lastGrandTotalRef.current !== null && lastGrandTotalRef.current !== grandTotal) {
      console.log("💰 GRAND TOTAL CHANGED - Clearing payment cache:", {
        oldTotal: lastGrandTotalRef.current,
        newTotal: grandTotal
      });
      
      // Clear payment cache when total changes
      const currentBookingId = bookingId || sessionStorage.getItem("tempBookingId");
      if (currentBookingId) {
        sessionStorage.removeItem(`clientSecret_${currentBookingId}`);
        sessionStorage.removeItem(`paymentIntentId_${currentBookingId}`);
      }
      
      // Reset payment state
      setClientSecret("");
      setPaymentIntentId("");
      setPaymentInitiated(false);
      paymentInProgressRef.current = false;
      currentBookingIdRef.current = null;
    }
    
    lastGrandTotalRef.current = grandTotal;
  }, [grandTotal, bookingId, appliedCoupon, discount]);

  // Function to get the auth token from multiple possible sources
  const getAuthToken = () => {
    if (token) return token;

    const localToken = localStorage.getItem("auth-token");
    if (localToken) return localToken;

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (userData.token) return userData.token;

    const userInfo = JSON.parse(localStorage.getItem("user-info") || "{}");
    if (userInfo.token) return userInfo.token;

    const tempUserData = JSON.parse(sessionStorage.getItem("tempUserData") || "{}");
    if (tempUserData.token) return tempUserData.token;

    if (user && user.token) return user.token;

    return null;
  };

  // Function to ensure token is available and valid
  const ensureAuthToken = async () => {
    return new Promise((resolve) => {
      let attempts = 0;

      const checkToken = () => {
        const token = getAuthToken();

        if (token && (token.startsWith("eyJ") || token.startsWith("Bearer eyJ"))) {
          console.log("✅ Valid auth token found on attempt", attempts + 1);
          sessionStorage.setItem("temp-auth-token", token.replace("Bearer ", ""));
          resolve(token.replace("Bearer ", ""));
        } else if (attempts < MAX_TOKEN_ATTEMPTS) {
          attempts++;
          console.log("⏳ Valid auth token not found, attempt", attempts, "of", MAX_TOKEN_ATTEMPTS);
          setTimeout(checkToken, 1000);
        } else {
          console.log("❌ Max token check attempts reached, proceeding without token");
          resolve(null);
        }
      };

      checkToken();
    });
  };

  // Create payment intent - UPDATED TO PROPERLY HANDLE DISCOUNTED AMOUNT
  useEffect(() => {
    // Skip if conditions not met
    if (grandTotal <= 0 || loading || !bookingId) {
      console.log("⏭️ Skipping payment intent creation:", { grandTotal, loading, bookingId });
      return;
    }

    // CRITICAL: Prevent duplicate calls using refs
    const currentBookingId = bookingId || sessionStorage.getItem("tempBookingId");

    // If we already processed this booking ID with the same total, don't do it again
    if (
      paymentInProgressRef.current &&
      currentBookingIdRef.current === currentBookingId &&
      clientSecret // Only skip if we have a valid client secret
    ) {
      console.log("🔄 Payment already in progress for this booking, skipping...");
      return;
    }

    // Check if we have cached payment intent for this exact amount
    const cacheKey = `${currentBookingId}_${grandTotal}`;
    const existingClientSecret = sessionStorage.getItem(`clientSecret_${cacheKey}`);
    const existingPaymentIntentId = sessionStorage.getItem(`paymentIntentId_${cacheKey}`);

    if (existingClientSecret && existingPaymentIntentId) {
      console.log("📦 Using cached payment intent for exact amount:", grandTotal);
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

      console.log("🚀 Creating new payment intent for amount:", grandTotal);

      try {
        // First, ensure we have the auth token
        const token = await ensureAuthToken();

        if (!token) {
          throw new Error("Unable to authenticate. Please try logging in again.");
        }

        // Get userId from temporary data or context
        const tempUserData = JSON.parse(sessionStorage.getItem("tempUserData") || "{}");
        const userId = user?._id || tempUserData._id || JSON.parse(localStorage.getItem("userData") || "{}")._id;

        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        // CRITICAL: Send the EXACT discounted amount to backend
        const paymentData = {
          ticketId: event._id,
          quantity: selectedSeats.length || 1,
          userId: userId,
          bookingId: currentBookingId,
          
          // MOST IMPORTANT: Send the final discounted amount
          amount: grandTotal,
          finalAmount: grandTotal,
          
          // Original pricing information for reference
          originalAmount: appliedCoupon?.originalPrice || grandTotal,
          
          // Coupon information if applied
          ...(appliedCoupon && {
            couponId: appliedCoupon.id,
            couponCode: appliedCoupon.code,
            discountAmount: appliedCoupon.discountAmount || discount,
            hasCoupon: true,
            couponApplied: true,
          }),
        };

        console.log("📤 PAYMENT DATA BEING SENT TO BACKEND:", JSON.stringify(paymentData, null, 2));
        console.log("💰 AMOUNT TO BE CHARGED:", grandTotal);

        // Create headers with token
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // Call payment API
        const response = await fetch(`${API_BASE_URL}payments/create-payment`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(paymentData),
        });

        // Get JSON response
        const responseData = await response.json();
        console.log("📥 BACKEND RESPONSE:", JSON.stringify(responseData, null, 2));

        // Handle response according to your API structure
        if (!response.ok) {
          if (
            response.status === 400 &&
            responseData.message?.includes("Payment already initiated")
          ) {
            // If payment already exists, try to get existing client secret
            if (responseData.clientSecret) {
              console.log("♻️ Using existing payment intent from server");
              setClientSecret(responseData.clientSecret);
              setPaymentIntentId(responseData.paymentIntentId);
              setConfirmedBookingId(responseData.bookingId);

              // Cache with amount-specific key
              const cacheKey = `${currentBookingId}_${grandTotal}`;
              sessionStorage.setItem(`clientSecret_${cacheKey}`, responseData.clientSecret);
              sessionStorage.setItem(`paymentIntentId_${cacheKey}`, responseData.paymentIntentId);
              return;
            }
          }

          throw new Error(responseData.message || `Request failed with status ${response.status}`);
        }

        // Check for success and set payment data from your API response
        if (responseData.success) {
          setClientSecret(responseData.clientSecret);
          setPaymentIntentId(responseData.paymentIntentId);
          setConfirmedBookingId(responseData.bookingId);

          // Cache with amount-specific key to handle different totals
          const cacheKey = `${currentBookingId}_${grandTotal}`;
          sessionStorage.setItem(`clientSecret_${cacheKey}`, responseData.clientSecret);
          sessionStorage.setItem(`paymentIntentId_${cacheKey}`, responseData.paymentIntentId);

          console.log("✅ Payment intent created successfully for amount:", grandTotal);
          console.log("🔑 Client secret received:", responseData.clientSecret ? "YES" : "NO");
        } else {
          throw new Error("Could not initialize payment. Please try again.");
        }
      } catch (err) {
        console.error("❌ Payment request error:", err);

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
              grandTotal: grandTotal,
              appliedCoupon: appliedCoupon,
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
    const tempUserData = JSON.parse(sessionStorage.getItem("tempUserData") || "{}");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userDataToUse = Object.keys(tempUserData).length > 0 ? tempUserData : userData;

    // Set up billing details - REMOVED postal_code (ZIP code)
    const billingDetails = {
      name: userDataToUse.name || "Guest Checkout",
      email: userDataToUse.email || "",
      address: {
        line1: userDataToUse.address || "",
        city: userDataToUse.city || "",
      },
    };

    console.log("💳 Confirming payment with Stripe for amount:", grandTotal);
    console.log("🔐 Client secret:", clientSecret ? "Present" : "Missing");

    // Confirm payment with Stripe
    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: billingDetails,
      },
    });

    if (paymentError) {
      console.error("❌ Stripe payment error:", paymentError);
      setError(`Payment failed: ${paymentError.message}`);
      setProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      console.log("✅ Stripe payment succeeded!");
      console.log("💰 Amount charged by Stripe:", paymentIntent.amount / 100); // Stripe amounts are in cents
      console.log("💰 Expected amount:", grandTotal);
      
      // Verify the charged amount matches our expected amount
      const chargedAmount = paymentIntent.amount / 100;
      if (Math.abs(chargedAmount - grandTotal) > 0.01) { // Allow for small rounding differences
        console.warn("⚠️ WARNING: Charged amount doesn't match expected amount!", {
          charged: chargedAmount,
          expected: grandTotal,
          difference: Math.abs(chargedAmount - grandTotal)
        });
      }
      
      // Payment succeeded, now confirm with your backend
      try {
        const token = await ensureAuthToken();

        // UPDATED: Include all relevant information in confirmation
        const confirmationData = {
          paymentIntentId: paymentIntent.id,
          finalAmount: grandTotal, // Send the final discounted amount
          chargedAmount: chargedAmount, // What Stripe actually charged
          // Include coupon information if needed
          ...(appliedCoupon && {
            couponId: appliedCoupon.id,
            couponCode: appliedCoupon.code,
            discountApplied: appliedCoupon.discountAmount || discount,
            originalAmount: appliedCoupon.originalPrice,
          }),
        };

        console.log("📤 Sending confirmation data to backend:", confirmationData);

        // Call confirm-payment endpoint
        const response = await fetch(`${API_BASE_URL}payments/confirm-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(confirmationData),
        });

        const data = await response.json();
        console.log("📥 Backend confirmation response:", data);

        if (data.success) {
          // Clear cached payment data after successful completion
          const currentBookingId = bookingId || sessionStorage.getItem("tempBookingId");
          const cacheKey = `${currentBookingId}_${grandTotal}`;
          sessionStorage.removeItem(`clientSecret_${cacheKey}`);
          sessionStorage.removeItem(`paymentIntentId_${cacheKey}`);

          // Get order ID from backend response
          const orderId = data.orderId || data.order_id || paymentIntent.id;
          
          localStorage.setItem("completedOrderId", orderId);
          setError(null);
          setSucceeded(true);

          console.log("🎉 Payment completed successfully with order ID:", orderId);

          // Pass data to parent component with order ID from backend
          onPaymentComplete(orderId, {
            paymentIntentId: paymentIntent.id,
            bookingId: confirmedBookingId || bookingId,
            appliedCoupon,
            discount,
            finalAmount: grandTotal,
            chargedAmount: chargedAmount,
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
          
          console.log("⚠️ Backend confirmation failed, using fallback order ID:", fallbackOrderId);
          
          onPaymentComplete(fallbackOrderId, {
            paymentIntentId: paymentIntent.id,
            bookingId: confirmedBookingId || bookingId,
            appliedCoupon,
            discount,
            finalAmount: grandTotal,
            chargedAmount: chargedAmount,
            orderId: fallbackOrderId,
          });
        }
      } catch (err) {
        console.error("❌ Error confirming payment with backend:", err);

        // Even if confirmation fails, Stripe processed the payment
        // Use payment intent ID as fallback order ID
        const fallbackOrderId = paymentIntent.id;
        localStorage.setItem("completedOrderId", fallbackOrderId);
        setError(null);
        setSucceeded(true);
        
        console.log("⚠️ Backend error, using fallback order ID:", fallbackOrderId);
        
        onPaymentComplete(fallbackOrderId, {
          paymentIntentId: paymentIntent.id,
          bookingId: confirmedBookingId || bookingId,
          appliedCoupon,
          discount,
          finalAmount: grandTotal,
          chargedAmount: paymentIntent.amount / 100,
          orderId: fallbackOrderId,
        });
      }
    } else {
      console.error("❌ Payment failed with status:", paymentIntent.status);
      setError(`Payment status: ${paymentIntent.status}. Please try again.`);
    }

    setProcessing(false);
  };

  // Handle manual payment retry
  const handleRetryPayment = () => {
    // Clear all payment state and cached data
    const currentBookingId = bookingId || sessionStorage.getItem("tempBookingId");
    
    // Clear all cached data for this booking
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(currentBookingId)) {
        sessionStorage.removeItem(key);
      }
    });

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
    lastGrandTotalRef.current = null;

    // Force re-trigger of payment creation
    setTokenAttempts(tokenAttempts + 1);
  };

  // Handle booking restart
  const handleRestartBooking = () => {
    // Clear all payment and booking data
    const currentBookingId = bookingId || sessionStorage.getItem("tempBookingId");
    
    // Clear all cached data
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(currentBookingId) || key.includes("temp")) {
        sessionStorage.removeItem(key);
      }
    });

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
      {/* Debug Info - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-900 rounded-lg text-xs">
          <div className="text-blue-200 font-bold mb-2">Debug Info:</div>
          <div className="text-blue-100">
            <div>Grand Total: ${grandTotal}</div>
            <div>Applied Coupon: {appliedCoupon ? appliedCoupon.code : 'None'}</div>
            <div>Discount: ${discount}</div>
            <div>Client Secret: {clientSecret ? 'Present' : 'Missing'}</div>
            <div>Payment Initiated: {paymentInitiated ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )} */}

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
              href="/terms"
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
            {/* <button
              type="button"
              onClick={handleRetryPayment}
              className="text-orange-300 hover:text-orange-200 underline cursor-pointer text-sm"
            >
              Retry Payment
            </button> */}
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
          Initializing payment for ${grandTotal.toFixed(2)}...
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
          `Pay ${grandTotal.toFixed(2)}`
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