import React, { useState, useEffect, useContext } from "react";
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
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [tokenAttempts, setTokenAttempts] = useState(0);

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
          // Ensure token is saved in localStorage for future use
          localStorage.setItem("auth-token", token.replace("Bearer ", ""));
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

  // Create payment intent
  useEffect(() => {
    // Skip if no grand total or payment already initiated
    if (grandTotal <= 0 || paymentInitiated || loading) {
      return;
    }

    const createPaymentIntent = async () => {
      setPaymentInitiated(true);

      try {
        // First, ensure we have the auth token
        const token = await ensureAuthToken();

        if (!token) {
          throw new Error(
            "Unable to authenticate. Please try logging in again."
          );
        }

        // Get userId from context or localStorage
        const userId =
          user?._id || JSON.parse(localStorage.getItem("userData") || "{}")._id;

        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        // Retrieve current order data
        const currentOrderId = localStorage.getItem("currentOrderId");

        // Get the bookingId directly from the component parameter or from localStorage
        // We access it directly (not from props) because we destructured it in the function parameters
        const bookingIdValue = bookingId || localStorage.getItem("bookingId");

        if (!bookingIdValue) {
          throw new Error("Booking ID not found. Please try again.");
        }

        // Prepare payment data according to API format
        const paymentData = {
          ticketId: event._id,
          quantity: selectedSeats.length || 1,
          userId: userId,
          orderId: currentOrderId || "temp-order-id",
          bookingId: bookingIdValue, // Use the bookingId value retrieved above
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

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              `Request failed with status ${response.status}`
          );
        }

        // Check for success and set client secret for Stripe
        if (responseData.success) {
          setClientSecret(responseData.clientSecret);
          setOrderId(responseData.orderId || currentOrderId);
        } else {
          throw new Error("Could not initialize payment. Please try again.");
        }
      } catch (err) {
        console.error("Payment request error:", err);

        // Show detailed error info
        setErrorDetails(
          JSON.stringify(
            {
              message: err.message,
              token: getAuthToken() ? "Token exists" : "No token",
              userId: user?._id || "No user ID",
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
    paymentInitiated,
    tokenAttempts,
  ]);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements || !clientSecret) {
      setProcessing(false);
      return;
    }

    // Get card element
    const cardElement = elements.getElement(CardElement);

    // Get user data for better billing details
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    // Set up billing details
    const billingDetails = {
      name: userData.name || "Guest Checkout",
      email: userData.email || "",
      address: {
        line1: userData.address || "",
        city: userData.city || "",
        postal_code: userData.postalCode || "",
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

        // Call confirm-payment endpoint
        const response = await fetch(
          `${API_BASE_URL}payments/confirm-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId }),
          }
        );

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("completedOrderId", orderId);
          setError(null);
          setSucceeded(true);
          onPaymentComplete(orderId);
        } else {
          // If backend confirmation fails but Stripe succeeded,
          // still consider it successful from user's perspective
          localStorage.setItem("completedOrderId", orderId);
          setError(null);
          setSucceeded(true);
          onPaymentComplete(orderId);
        }
      } catch (err) {
        console.error("Error confirming payment:", err);

        // Even if confirmation fails, Stripe processed the payment
        localStorage.setItem("completedOrderId", orderId);
        setError(null);
        setSucceeded(true);
        onPaymentComplete(orderId);
      }
    } else {
      setError(`Payment status: ${paymentIntent.status}. Please try again.`);
    }

    setProcessing(false);
  };

  // Handle manual payment retry
  const handleRetryPayment = () => {
    setPaymentInitiated(false);
    setError(null);
    setErrorDetails("");
    setTokenAttempts(tokenAttempts + 1); // Increment token attempts to trigger a retry
  };

  // Handle input change
  const handleChange = (event) => {
    setDisabled(event.empty);
    setError(event.error ? event.error.message : "");
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
            }}
            onChange={handleChange}
          />
        </div>
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

          <div className="mt-2">
            <button
              type="button"
              onClick={handleRetryPayment}
              className="text-orange-300 underline"
            >
              Retry Payment
            </button>
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

      <button
        type="submit"
        disabled={processing || disabled || succeeded || !clientSecret}
        className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all ${
          processing || disabled || !clientSecret
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg hover:shadow-xl"
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
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
          `Pay ${grandTotal.toLocaleString()} BDT`
        )}
      </button>
    </form>
  );
};

export default CheckoutForm;
