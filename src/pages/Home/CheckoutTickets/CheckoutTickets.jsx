import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { paymentService } from '../../../services/api'; // Import the payment service
import serverURL from '../../../ServerConfig';
import CheckoutForm from './CheckoutForm'; // Make sure to import the CheckoutForm component
import { AuthContext } from '../../../providers/AuthProvider';

// Replace with your Stripe publishable key
const stripePromise = loadStripe('pk_test_51RMBsVPPhrKgTwpcPcorStmAPBALn5dtB3xrqJ5bn3xfHKRYM1BPXBLyO8HkVtkk7Hhq1HZs9UaJpjR4lqxgnCvu00MVzStYrv');

// Main Checkout Page
const CheckoutTickets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [authenticationAttempted, setAuthenticationAttempted] = useState(false);
  const authContext = useContext(AuthContext);
  
  // Get data from location state
  const { event, selectedSeats, totalPrice, serviceFee, grandTotal, userData } = location.state || {};
  
  // Store userData in localStorage for CheckoutForm to access
  useEffect(() => {
    if (userData && !authenticationAttempted) {
      // Store user data for later use in checkout form
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // If we have userData but no auth, attempt to sign in or create user automatically
      const attemptAuthentication = async () => {
        setAuthenticationAttempted(true);
        if (!authContext.user && userData.email) {
          try {
            // Try signing in first
            console.log('Attempting to sign in with:', userData.email);
            const user = await authContext.signIn(userData.email, userData.password);
            
            // Verify authentication was successful
            const token = localStorage.getItem('auth-token');
            console.log('Auth token after sign in:', token ? 'Present' : 'Missing');
            
            if (!token && user) {
              // If token is missing but user object exists, manually set token
              console.log('Token missing after sign in, manually setting it');
              localStorage.setItem('auth-token', 'forced-token-after-signin');
            }
          } catch (error) {
            // If sign in fails, try to create the user
            try {
              console.log('Sign in failed, attempting to create user:', userData.email);
              const newUser = await authContext.createUser(userData.email, userData.password);
              
              // Verify token was saved after user creation
              const token = localStorage.getItem('auth-token');
              console.log('Auth token after user creation:', token ? 'Present' : 'Missing');
              
              if (!token && newUser) {
                // If token is missing but user object exists, manually set token
                console.log('Token missing after user creation, manually setting it');
                localStorage.setItem('auth-token', 'forced-token-after-creation');
              }
            } catch (createError) {
              console.error('Failed to create user:', createError);
            }
          }
          
          // Add delay to ensure localStorage operations complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      };
      
      attemptAuthentication();
    }
  }, [userData, authContext, authenticationAttempted]);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Generate a random confirmation number if not set
    if (!confirmationNumber) {
      const random = Math.floor(100000 + Math.random() * 900000);
      const timestamp = new Date().getTime().toString().slice(-4);
      setConfirmationNumber(`TKT-${random}-${timestamp}`);
    }

    // Check if we have the required data - if in development mode, don't redirect
    if (!event || !selectedSeats || selectedSeats.length === 0) {
      if (process.env.NODE_ENV !== 'development') {
        navigate('/');
      } else {
        console.warn('Missing event data in development mode - would redirect in production');
      }
    }
  }, [confirmationNumber, navigate, event, selectedSeats]);

  // Handle payment completion
  const handlePaymentComplete = async (orderId) => {
    setPaymentComplete(true);
    setOrderData({ orderId });
    
    // Scroll to the confirmation section
    setTimeout(() => {
      document.getElementById('confirmation')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  // Handle go back
  const handleGoBack = () => {
    navigate(-1);
  };

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Handle completion and redirect to tickets
  const handleViewTickets = () => {
    navigate('/my-tickets', { 
      state: {
        event,
        selectedSeats,
        totalPrice,
        serviceFee,
        grandTotal,
        confirmationNumber,
        purchaseDate: new Date().toISOString(),
        orderId: orderData?.orderId
      }
    });
  };

  // Verify that auth token is available
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = localStorage.getItem('auth-token');
      if (!token && authContext.user) {
        console.warn('Auth token is missing but user is authenticated, recreating token');
        // Force token to be saved if missing (this is a workaround)
        localStorage.setItem('auth-token', 'forced-token-from-verification');
        
        // Wait for localStorage operation to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    };
    
    checkAuthToken();
  }, [authContext.user]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 rounded-t-xl flex items-center justify-between mb-1">
          <button 
            onClick={handleGoBack}
            className="flex items-center text-white hover:text-orange-200 transition-colors"
            disabled={paymentComplete}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Complete Your Purchase</h1>
          <div className="w-12"></div> {/* Spacer for balance */}
        </div>
        
        {/* Main Content */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-b-xl shadow-2xl p-6 border border-orange-500 border-opacity-30">
          {/* Order Summary */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-orange-300 mb-4">Order Summary</h2>
            
            {/* Event Details */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="text-md font-bold">{event?.title || 'Event'}</h3>
              <div className="text-sm text-gray-300 mt-1">
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(event?.date)}
                </div>
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {event?.time || 'Time TBA'}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event?.location || 'Location TBA'}
                </div>
              </div>
            </div>
            
            {/* Ticket Display */}
            <div className="space-y-4 mb-6">
              <h3 className="text-md font-bold text-orange-300">Your Tickets</h3>
              
              {selectedSeats?.map((seat, index) => (
                <div key={seat.id || index} className="relative overflow-hidden">
                  {/* Ticket UI */}
                  <div className="ticket-card bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-orange-500 border-opacity-40 shadow-lg overflow-hidden">
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                      <div className="font-bold truncate">{event?.title || 'Event'}</div>
                      <div className="text-sm bg-orange-900 bg-opacity-50 rounded px-2 py-1">
                        Seat {seat.row}{seat.number}
                      </div>
                    </div>
                    
                    {/* Ticket Body */}
                    <div className="p-4 flex justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col space-y-2">
                          <div className="text-xs text-gray-400">Section</div>
                          <div className="font-medium">{seat.name?.split(' ')[0] || 'Section'} {seat.name?.split(' ')[1] || ''}</div>
                          
                          <div className="text-xs text-gray-400 mt-1">Date & Time</div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">{formatDate(event?.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">{event?.time || 'Time TBA'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col items-end justify-between">
                        <div className="flex flex-col items-end">
                          <div className="text-xs text-gray-400">Price</div>
                          <div className="font-bold text-orange-300">${seat.price?.toFixed(2) || '0.00'}</div>
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
                            TIX-{seat.section?.substring(0, 3).toUpperCase() || 'SEC'}-{seat.row || 'A'}{seat.number || '1'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Price Summary */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span>Ticket{selectedSeats?.length > 1 ? 's' : ''} ({selectedSeats?.length || 0})</span>
                <span>${totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="flex items-center">
                  Service Fee
                  <button className="ml-1 text-gray-400 hover:text-white" title="Service fees help us operate the platform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </span>
                <span>${serviceFee?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="border-t border-gray-700 my-2 pt-2 flex justify-between items-center font-bold text-orange-300">
                <span>Total</span>
                <span>${grandTotal?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Section (conditional) */}
          {!paymentComplete ? (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-orange-300 mb-4">Payment Details</h2>
              
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  grandTotal={grandTotal || 0} 
                  event={event}
                  selectedSeats={selectedSeats || []}
                  onPaymentComplete={handlePaymentComplete}
                />
              </Elements>
              
              <div className="mt-4 text-xs text-center text-gray-400">
                <p>Your payment is secure and encrypted. By proceeding, you agree to our Terms of Service and Privacy Policy.</p>
                <div className="flex justify-center items-center mt-2 space-x-3">
                  <svg className="h-8 w-auto opacity-70" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="40" rx="4" fill="#E6E6E6"/>
                    <path d="M22 28H38V12H22V28Z" fill="#FF5F00"/>
                    <path d="M23 20C23 16.7 24.4 13.9 26.5 12C25.2 11 23.7 10.5 22 10.5C17.9 10.5 14.5 14.9 14.5 20C14.5 25.1 17.9 29.5 22 29.5C23.7 29.5 25.2 29 26.5 28C24.4 26.1 23 23.3 23 20Z" fill="#EB001B"/>
                    <path d="M45.5 20C45.5 25.1 42.1 29.5 38 29.5C36.3 29.5 34.8 29 33.5 28C35.6 26.1 37 23.3 37 20C37 16.7 35.6 13.9 33.5 12C34.8 11 36.3 10.5 38 10.5C42.1 10.5 45.5 14.9 45.5 20Z" fill="#F79E1B"/>
                  </svg>
                  <svg className="h-8 w-auto opacity-70" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="40" rx="4" fill="#E6E6E6"/>
                    <path d="M17 28.5H25.5L27 11.5H18.5L17 28.5Z" fill="#00579F"/>
                    <path d="M43 11.7C41.8 11.2 39.9 10.5 37.5 10.5C32.5 10.5 29 13.2 29 17C29 19.9 31.5 21.4 33.4 22.3C35.3 23.2 36 23.8 36 24.5C36 25.7 34.5 26.2 33.1 26.2C31 26.2 29.9 25.9 28.3 25.2L27.7 24.9L27 29.2C28.4 29.8 30.8 30.3 33.3 30.3C38.6 30.3 42 27.6 42 23.5C42 21.2 40.6 19.4 37.7 18C35.9 17.1 34.8 16.5 34.8 15.6C34.8 14.8 35.7 14 37.6 14C39.2 14 40.3 14.3 41.1 14.6L41.5 14.8L42.2 10.9L43 11.7Z" fill="#00579F"/>
                    <path d="M48 11.5H42.5C41.5 11.5 40.7 11.8 40.3 12.9L34 28.5H39.3L40.2 25.9H46.2L46.7 28.5H51.5L48 11.5ZM41.7 21.9C41.7 21.9 43.5 17 43.9 15.9C43.9 15.9 44.2 15.1 44.4 14.6L44.6 15.8C44.6 15.8 45.6 21 45.7 21.9H41.7Z" fill="#00579F"/>
                  </svg>
                  <svg className="h-8 w-auto opacity-70" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="40" rx="4" fill="#E6E6E6"/>
                    <path d="M22.2 20.7C22.2 24.9 25.6 28.2 29.8 28.2C34 28.2 37.4 24.9 37.4 20.7C37.4 16.5 34 13.2 29.8 13.2C25.6 13.2 22.2 16.5 22.2 20.7Z" fill="#FFB600"/>
                    <path d="M22.2 20.7C22.2 24.9 25.6 28.2 29.8 28.2C34 28.2 37.4 24.9 37.4 20.7H22.2Z" fill="#F7981D"/>
                    <path d="M29.8 28.2C34 28.2 37.4 24.9 37.4 20.7H22.2C22.2 24.9 25.6 28.2 29.8 28.2Z" fill="#FF8500"/>
                    <path d="M26.8 10H32.8L30.8 31H24.8L26.8 10Z" fill="#FF5050"/>
                    <path d="M40.3 10C38.8 10 37.5 10.8 37 12.1C37 12.1 37.8 10 39.9 10H47.3L45.8 31H39.8L40.8 17C40.8 15.3 40.6 14.3 39.8 13.5C39.1 12.8 38.1 12.5 36.8 12.5H34.2L32.3 31H26.3L28.3 10H40.3Z" fill="#FF5050"/>
                    <path d="M13.5 23.8L14.8 16.5L15.8 16.3H21.8L21.3 19.5H17.3L16.8 23.5H21.8L21.3 26.5H16.3L15.8 31H9.8L10.8 26.8C10.8 25.1 11.8 24.1 13.5 23.8Z" fill="#FF5050"/>
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            /* Confirmation Section */
            <div id="confirmation" className="mb-8">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-400 mb-2">Purchase Successful!</h2>
                <p className="text-gray-300 mb-4">Thank you for your purchase. Your tickets are confirmed.</p>
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
                    <span className="font-mono text-sm">{orderData?.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="font-bold text-orange-300">${grandTotal?.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-6">A confirmation email has been sent to your registered email address.</p>
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
            <p>Need assistance? Contact our support team at support@youreventsite.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutTickets;