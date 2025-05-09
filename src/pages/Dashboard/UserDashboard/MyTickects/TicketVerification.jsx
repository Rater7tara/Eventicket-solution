import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import serverURL from '../../../ServerConfig';

const TicketVerification = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);
  
  // Start scanning
  const handleStartScan = () => {
    setScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      setScanning(false);
      // For demo purposes, we'll assume the scan is successful
      verifyTicket(ticketId || 'DEMO-TICKET-ID');
    }, 2000);
  };
  
  // Verify ticket with backend
  const verifyTicket = async (scannedId) => {
    try {
      // This would be your actual verification endpoint
      const response = await axios.post(`${serverURL}/verify-ticket`, {
        ticketId: scannedId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // For demo, we'll simulate a successful response
      setTicketData({
        valid: true,
        event: {
          title: "Summer Music Festival 2024",
          date: "2024-07-15T19:00:00",
          time: "7:00 PM",
          location: "Central Park Amphitheater"
        },
        seat: {
          section: "Orchestra",
          row: "C",
          number: "12"
        },
        attendeeName: "John Doe",
        verificationTime: new Date().toISOString()
      });
      
      setScanResult({
        success: true,
        message: "Ticket verified successfully!"
      });
      
    } catch (err) {
      console.error('Error verifying ticket:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.message || "Failed to verify ticket."
      });
      setError("Ticket verification failed. Please try again.");
    }
  };
  
  // Format date
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
  
  // Reset scan
  const handleReset = () => {
    setScanResult(null);
    setTicketData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 rounded-t-xl mb-1">
          <h1 className="text-xl md:text-2xl font-bold text-center">Ticket Verification</h1>
        </div>
        
        {/* Main Content */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-b-xl shadow-2xl p-6 border border-orange-500 border-opacity-30">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-50 text-white p-4 rounded-lg mb-6">
              <p className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}
          
          {ticketData ? (
            /* Verification Result */
            <div>
              <div className={`text-center p-4 rounded-lg mb-6 ${ticketData.valid ? 'bg-green-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'}`}>
                <div className={`inline-flex items-center justify-center w-16 h-16 ${ticketData.valid ? 'bg-green-500' : 'bg-red-500'} rounded-full mb-3`}>
                  {ticketData.valid ? (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1">
                  {ticketData.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                </h2>
                <p className="text-sm">
                  {ticketData.valid 
                    ? 'Ticket has been verified and checked in.' 
                    : 'This ticket is invalid or has already been used.'}
                </p>
              </div>
              
              {ticketData.valid && (
                <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                  <h3 className="font-bold text-orange-300 mb-3">Ticket Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-400">Event</div>
                      <div className="font-medium">{ticketData.event?.title}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-400">Date</div>
                        <div>{formatDate(ticketData.event?.date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Time</div>
                        <div>{ticketData.event?.time}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Location</div>
                      <div>{ticketData.event?.location}</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs text-gray-400">Section</div>
                        <div className="font-medium">{ticketData.seat?.section}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Row</div>
                        <div className="font-medium">{ticketData.seat?.row}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Seat</div>
                        <div className="font-medium">{ticketData.seat?.number}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Attendee</div>
                      <div>{ticketData.attendeeName}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Verified At</div>
                      <div className="font-mono text-xs">
                        {new Date(ticketData.verificationTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-center"
                >
                  Scan Another
                </button>
                
                {ticketData.valid && (
                  <button
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 rounded-lg text-white text-center flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Admit Guest
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Scanner Interface */
            <div>
              <div className="text-center mb-6">
                <p className="text-gray-300 mb-4">
                  {scanning 
                    ? 'Scanning QR code...' 
                    : 'Scan a ticket QR code to verify its authenticity and check in the attendee.'}
                </p>
                
                {/* QR Scanner UI */}
                <div className="relative w-64 h-64 mx-auto mb-6 rounded-lg overflow-hidden border-2 border-orange-500">
                  {scanning ? (
                    <div className="absolute inset-0 bg-black">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse text-orange-500 w-10 h-10">
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Scanning animation */}
                      <div className="h-0.5 bg-orange-500 animate-scan absolute left-0 right-0"></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-900">
                      <div className="text-gray-600">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <p className="text-sm">Camera view will appear here</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Viewfinder corners */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-orange-400"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-orange-400"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-orange-400"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-orange-400"></div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleStartScan}
                  disabled={scanning}
                  className={`py-3 px-8 rounded-lg ${
                    scanning
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400'
                  } text-white font-medium shadow-lg transition-all flex items-center`}
                >
                  {scanning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Start Scanning
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  You can also enter the ticket ID manually below
                </p>
                <div className="mt-2 flex">
                  <input
                    type="text"
                    placeholder="Enter ticket ID (e.g. TIX-123456)"
                    className="flex-1 py-2 px-3 bg-gray-900 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 rounded-r-lg"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-700 pt-4 mt-8">
            <p>For staff use only. Contact technical support if you encounter any issues.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketVerification;