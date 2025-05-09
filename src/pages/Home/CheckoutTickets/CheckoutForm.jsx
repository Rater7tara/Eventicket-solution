import React, { useState, useEffect, useContext } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import serverURL from '../../../ServerConfig';
import { AuthContext } from '../../../providers/AuthProvider';

// API base URL
const API_BASE_URL = serverURL.url;

// Maximum number of token check attempts
const MAX_TOKEN_ATTEMPTS = 5;

// Payment form component
const CheckoutForm = ({ grandTotal, event, selectedSeats, onPaymentComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [tokenAttempts, setTokenAttempts] = useState(0);
  
  // Get auth context
  const authContext = useContext(AuthContext);

  // Function to ensure token is available and valid
  const ensureAuthToken = async () => {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkToken = () => {
        const token = localStorage.getItem('auth-token');
        
        // Check if token exists and has valid format (JWT starts with eyJ)
        if (token && token.startsWith('eyJ')) {
          console.log('Valid auth token found on attempt', attempts + 1);
          resolve(token);
        } else if (attempts < MAX_TOKEN_ATTEMPTS) {
          attempts++;
          console.log('Valid auth token not found, attempt', attempts, 'of', MAX_TOKEN_ATTEMPTS);
          
          // Try to recover from backup if token is missing or invalid
          if (attempts > 2) {
            const backupToken = sessionStorage.getItem('auth-token-backup');
            if (backupToken && backupToken.startsWith('eyJ')) {
              console.log('Recovered token from backup');
              localStorage.setItem('auth-token', backupToken);
              resolve(backupToken);
              return;
            }
            
            // Try to use authContext to refresh the token
            if (authContext.refreshToken) {
              authContext.refreshToken();
            }
          }
          
          setTimeout(checkToken, 800); // Check again after 800ms
        } else {
          console.log('Max token check attempts reached, proceeding without token');
          resolve(null);
        }
      };
      
      checkToken();
    });
  };

  // Create payment intent
  useEffect(() => {
    const createPaymentIntent = async () => {
      // Only proceed if payment hasn't been initiated yet
      if (paymentInitiated) {
        return;
      }
      
      setPaymentInitiated(true);
      
      try {
        // First, ensure we have the auth token
        const token = await ensureAuthToken();
        
        // Get userId from authContext if available
        const userId = authContext.user?._id || null;
        
        // Retrieve ticket purchase data from localStorage
        const ticketPurchasesString = localStorage.getItem('ticketPurchases');
        const currentOrderId = localStorage.getItem('currentOrderId');
        
        if (!ticketPurchasesString || !currentOrderId) {
          throw new Error('Ticket purchase information not found in localStorage');
        }
        
        // Parse ticket purchases and find the current order
        let ticketPurchases;
        try {
          ticketPurchases = JSON.parse(ticketPurchasesString);
        } catch (err) {
          console.error('Error parsing ticketPurchases:', err);
          throw new Error('Invalid ticket purchase data in localStorage');
        }
        
        const currentOrder = Array.isArray(ticketPurchases) 
          ? ticketPurchases.find(order => order.orderId === currentOrderId)
          : ticketPurchases; // In case it's stored as a single object
        
        if (!currentOrder) {
          throw new Error('Current order not found in ticket purchases');
        }
        
        console.log('Current order from localStorage:', currentOrder);
        
        // Extract event ID from the order
        const eventId = currentOrder.event._id;
        
        if (!eventId) {
          throw new Error('Event ID not found in the current order');
        }
        
        // Prepare payment data according to your API format
        const paymentData = {
          ticketId: eventId, // Using event ID as the ticket ID
          quantity: currentOrder.quantity || currentOrder.selectedSeats.length || 1, // Number of tickets
          userId: userId, // Include userId if available
          orderId: currentOrderId // Include the order ID for reference
        };

        console.log('Payment data being sent:', paymentData);
        
        // Create headers with token if available
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('No auth token available for payment request');
        }
        
        console.log('Making payment request with headers:', headers);
        
        // Call your payment API
        const response = await fetch(`${API_BASE_URL}payments/create-ticket-payment`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(paymentData)
        });
        
        // Get JSON response
        const responseData = await response.json();
        console.log('API response:', responseData);
        
        if (!response.ok) {
          // Handle error with more useful info
          const errorMessage = responseData.message || responseData.error || `Request failed with status ${response.status}`;
          throw new Error(errorMessage);
        }
        
        // Check for success and set client secret for Stripe
        if (responseData.success) {
          setClientSecret(responseData.clientSecret);
          setOrderId(responseData.orderId || responseData._id || currentOrderId);
        } else {
          setError('Could not initialize payment. Please try again.');
        }
      } catch (err) {
        console.error('Payment request error:', err);
        
        // Show detailed error info
        setErrorDetails(JSON.stringify({
          message: err.message,
          status: err.status || 'unknown',
          tokenAttempts,
          tokenExists: !!localStorage.getItem('auth-token'),
          tokenFormat: localStorage.getItem('auth-token')?.substring(0, 10) + '...'
        }, null, 2));
        
        setError(`Payment initialization failed: ${err.message}`);
      }
    };

    if (grandTotal > 0) {
      createPaymentIntent();
    }
  }, [grandTotal, event, selectedSeats, authContext.user, paymentInitiated, tokenAttempts, authContext]);

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
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userInfo = JSON.parse(localStorage.getItem('user-info') || '{}');

    // Combine userData and userInfo for more complete billing details
    const billingDetails = {
      name: userData.name || userInfo.name || 'Guest Checkout',
      email: userData.email || userInfo.email || '',
      address: {
        line1: userData.address || '',
        city: userData.city || '',
        postal_code: userData.postalCode || ''
      }
    };

    // Ensure we have the auth token before proceeding
    await ensureAuthToken();

    // Confirm payment with Stripe
    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: billingDetails
      }
    });

    if (paymentError) {
      setError(`Payment failed: ${paymentError.message}`);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Payment succeeded, now confirm with your backend
      try {
        const token = await ensureAuthToken();
        
        // Set up headers
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('No auth token available for payment confirmation');
        }
        
        // Call confirm-payment endpoint with just the orderId as specified
        const response = await fetch(`${API_BASE_URL}payments/confirm-payment`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ orderId })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setError(null);
          setSucceeded(true);
          onPaymentComplete(orderId);
        } else {
          // If backend confirmation fails but Stripe succeeded,
          // still consider it successful from user's perspective
          console.log('Payment confirmation with backend failed, but Stripe processed payment successfully');
          setError(null);
          setSucceeded(true);
          onPaymentComplete(orderId);
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
        // Even if confirmation fails, Stripe processed the payment
        setError(null);
        setSucceeded(true);
        onPaymentComplete(orderId);
      }
      setProcessing(false);
    } else {
      setError(`Payment status: ${paymentIntent.status}. Please try again.`);
      setProcessing(false);
    }
  };

  // Handle manual payment retry
  const handleRetryPayment = () => {
    setPaymentInitiated(false);
    setError(null);
    setErrorDetails('');
    setTokenAttempts(tokenAttempts + 1); // Increment token attempts to trigger a retry
    
    // Try to refresh token using authContext if available
    if (authContext.refreshToken) {
      authContext.refreshToken()
        .then(success => {
          if (success) {
            console.log('Token refreshed successfully');
          } else {
            console.warn('Token refresh failed');
          }
        });
    }
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
                  fontSize: '16px',
                  color: '#f3f4f6',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
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
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Initializing payment...
        </div>
      )}
      
      <button
        type="submit"
        disabled={processing || disabled || succeeded || !clientSecret}
        className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all ${
          processing || disabled || !clientSecret
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg hover:shadow-xl'
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : succeeded ? (
          "Payment Successful!"
        ) : (
          `Pay $${grandTotal.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

export default CheckoutForm;