import React, { useState, useEffect, useContext } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import serverURL from '../../../ServerConfig';
import { AuthContext } from '../../../providers/AuthProvider';


// API base URL
const API_BASE_URL = serverURL.url;

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
  const [authAttempted, setAuthAttempted] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  
  // Get auth context
  const authContext = useContext(AuthContext);

  // First, handle authentication separately before payment
  useEffect(() => {
    const handleAuthentication = async () => {
      // Skip if already authenticated or if we've already completed auth
      if (authContext.user || authCompleted) {
        setAuthCompleted(true);
        return;
      }
      
      if (authAttempted) {
        return;
      }
      
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!userData.email || !userData.password) {
          console.log('No user credentials in localStorage, continuing as guest');
          setAuthAttempted(true);
          setAuthCompleted(true);
          return;
        }
        
        console.log('Attempting authentication with stored credentials');
        setAuthAttempted(true);
        
        try {
          // Try to sign in first - this is more likely to succeed
          const user = await authContext.signIn(userData.email, userData.password);
          console.log('User signed in during checkout:', user);
          
          // Wait a short delay to ensure token is stored in localStorage
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setAuthCompleted(true);
        } catch (signInError) {
          // If sign-in fails, try to register
          console.log('Sign-in failed, attempting registration:', signInError);
          try {
            const newUser = await authContext.createUser(userData.email, userData.password);
            console.log('User registered during checkout:', newUser);
            
            // Wait a short delay to ensure token is stored in localStorage
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setAuthCompleted(true);
          } catch (regError) {
            console.log('Registration failed:', regError);
            setAuthCompleted(true);
          }
        }
      } catch (error) {
        console.error('Authentication handling error:', error);
        setAuthCompleted(true);
      }
    };
    
    handleAuthentication();
  }, [authContext, authAttempted, authCompleted]);

  // Create payment intent after auth is fully completed
  useEffect(() => {
    const createPaymentIntent = async () => {
      // Only proceed if auth is completed and payment hasn't been initiated yet
      if (!authCompleted || paymentInitiated) {
        return;
      }
      
      setPaymentInitiated(true);
      
      try {
        // Hard-code a valid ticket ID for testing
        // In production, you would get this from your ticket selection flow
        const ticketId = "681652014cb89220d5d0b698"; // Use the actual MongoDB ID from your example
        
        // Prepare payment data according to your API format
        const paymentData = {
          ticketId: ticketId,
          quantity: selectedSeats.length || 2, // Use the number of seats or fallback to 2
          userId: authContext.user?._id || null
        };

        console.log('Payment data being sent:', paymentData);

        // Get token from localStorage AFTER authentication is complete
        const token = localStorage.getItem('auth-token');
        console.log('Auth token being used:', token ? 'Token exists' : 'No token found');
        
        // Make API request with token in headers
        try {
          // Direct fetch with proper authorization
          const headers = {
            'Content-Type': 'application/json'
          };
          
          // Add auth token if available
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          console.log('Making payment request with headers:', headers);
          
          const response = await fetch(`${API_BASE_URL}payments/create-ticket-payment`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(paymentData),
          });
          
          // Get response body regardless of status code
          const responseBody = await response.json();
          console.log('API response:', responseBody);
          
          if (!response.ok) {
            throw new Error(responseBody.message || responseBody.error || `Request failed with status ${response.status}`);
          }
          
          if (responseBody.success) {
            setClientSecret(responseBody.clientSecret);
            setOrderId(responseBody.orderId || responseBody._id);
          } else {
            setError('Could not initialize payment. Please try again.');
          }
        } catch (err) {
          console.error('Payment request error:', err);
          setErrorDetails(JSON.stringify({
            message: err.message,
            status: err.status || 'unknown'
          }, null, 2));
          setError(`Payment initialization failed: ${err.message}`);
        }
      } catch (err) {
        console.error('Error creating payment:', err);
        setErrorDetails(JSON.stringify({
          message: err.message
        }, null, 2));
        setError(`Payment initialization failed: ${err.message}`);
      }
    };

    if (grandTotal > 0) {
      createPaymentIntent();
    }
  }, [grandTotal, event, selectedSeats, authContext.user, authCompleted, paymentInitiated]);

  // Reset payment if authentication status changes
  useEffect(() => {
    if (authContext.user && !paymentInitiated) {
      setAuthCompleted(true);
    }
  }, [authContext.user, paymentInitiated]);

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

    // Confirm payment with Stripe
    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: userData.name || '',
          email: userData.email || '',
          address: {
            line1: userData.address || '',
            city: userData.city || '',
            postal_code: userData.postalCode || ''
          }
        },
      }
    });

    if (paymentError) {
      setError(`Payment failed: ${paymentError.message}`);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Payment succeeded, now confirm with your backend
      try {
        // Get token for authorization
        const token = localStorage.getItem('auth-token');
        
        // Set up headers with authorization
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Call confirm-payment endpoint
        const response = await fetch(`${API_BASE_URL}payments/confirm-payment`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ orderId }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setError(null);
          setSucceeded(true);
          onPaymentComplete(orderId);
        } else {
          setError('Payment was processed but could not be confirmed. Please contact support.');
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
        setError(`Payment confirmation failed: ${err.message}`);
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
          
          {error.includes('Unauthorized') && (
            <div className="mt-2">
              <button 
                type="button"
                onClick={handleRetryPayment}
                className="text-orange-300 underline"
              >
                Retry Payment
              </button>
            </div>
          )}
        </div>
      )}
      
      {!clientSecret && !error && (
        <div className="text-orange-300 text-sm mb-4 flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {!authCompleted 
            ? "Authenticating..." 
            : "Initializing payment..."}
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