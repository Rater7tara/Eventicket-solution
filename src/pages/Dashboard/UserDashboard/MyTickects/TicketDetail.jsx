import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import serverURL from '../../../ServerConfig';

const TicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [error, setError] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({ loading: false, error: null });

  // Fetch ticket details when component mounts
  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  // Fetch ticket details
  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${serverURL}/user/buy-ticket/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTicketDetails(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError('Failed to load ticket details. Please try again later.');
      setTicketDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Download ticket as PDF
  const downloadTicket = async (seatIndex) => {
    setDownloadStatus({ loading: true, error: null });
    try {
      const response = await axios.get(`${serverURL}/user/download-tickets`, {
        params: { 
          ticketId: ticketId,
          seatIndex: typeof seatIndex === 'number' ? seatIndex : undefined
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticketId}${typeof seatIndex === 'number' ? `-seat-${seatIndex}` : ''}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setDownloadStatus({ loading: false, error: null });
    } catch (err) {
      console.error('Error downloading ticket:', err);
      setDownloadStatus({ 
        loading: false, 
        error: 'Failed to download ticket. Please try again later.' 
      });
    }
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

  // Handle navigation back to my tickets
  const handleGoBack = () => {
    navigate('/my-tickets');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 rounded-t-xl flex items-center justify-between mb-1">
          <button 
            onClick={handleGoBack}
            className="flex items-center text-white hover:text-orange-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Tickets
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Ticket Details</h1>
          <div className="w-12"></div> {/* Spacer for balance */}
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
          
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              {ticketDetails ? (
                <div>
                  {/* Event Info Card */}
                  <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                    <h3 className="text-md font-bold">{ticketDetails.event?.title || 'Event'}</h3>
                    <div className="text-sm text-gray-300 mt-2">
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(ticketDetails.event?.date)}
                      </div>
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {ticketDetails.event?.time || 'Time TBA'}
                      </div>
                      <div className="flex items-center mb-1">
                        <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ticketDetails.event?.location || 'Location TBA'}
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-400">Order ID:</span> 
                          <span className="font-mono ml-2 text-xs">{ticketDetails.orderId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Purchase Date:</span> 
                          <span className="ml-2">{formatDate(ticketDetails.purchaseDate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Order Total:</span> 
                          <span className="ml-2 text-orange-300 font-bold">${ticketDetails.totalAmount?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span> 
                          <span className="ml-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Confirmed
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Download All Button */}
                    <div className="mt-4">
                      <button
                        onClick={() => downloadTicket()}
                        className="bg-orange-600 hover:bg-orange-500 text-white py-2 px-4 rounded flex items-center"
                        disabled={downloadStatus.loading}
                      >
                        {downloadStatus.loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Downloading...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download All Tickets (PDF)
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Individual Tickets - Same styled as in Checkout */}
                  <div>
                    <h3 className="text-md font-bold text-orange-300 mb-4">Your Tickets</h3>
                    
                    {ticketDetails.seats?.map((seat, index) => (
                      <div key={seat.id || index} className="mb-8">
                        {/* Ticket Design */}
                        <div className="relative">
                          {/* Tear Perforations at the top */}
                          <div className="absolute top-0 left-0 right-0 flex justify-between px-1 z-10">
                            {Array.from({ length: 24 }).map((_, i) => (
                              <div key={i} className="w-1 h-2 bg-gray-900 rounded-b"></div>
                            ))}
                          </div>
                          
                          <div className="ticket-card mt-1 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-orange-500 border-opacity-40 shadow-lg overflow-hidden">
                            {/* Ticket Header */}
                            <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                              <div className="font-bold truncate">{ticketDetails.event?.title || 'Event'}</div>
                              <div className="text-sm bg-orange-900 bg-opacity-50 rounded px-2 py-1">
                                Seat {seat.row}{seat.number}
                              </div>
                            </div>
                            
                            {/* Ticket Body */}
                            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Left Column */}
                              <div className="md:col-span-2">
                                <div className="flex flex-col space-y-4">
                                  <div>
                                    <div className="text-xs text-gray-400">Section</div>
                                    <div className="font-medium">{seat.name?.split(' ')[0] || 'Section'} {seat.name?.split(' ')[1] || ''}</div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-400">Date & Time</div>
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-sm">{formatDate(ticketDetails.event?.date)}</span>
                                    </div>
                                    <div className="flex items-center mt-1">
                                      <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-sm">{ticketDetails.event?.time || 'Time TBA'}</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-400">Venue</div>
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span className="text-sm">{ticketDetails.event?.location || 'Location TBA'}</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-400">Instructions</div>
                                    <div className="text-sm mt-1">
                                      Please arrive 30 minutes before the event. Present this ticket at the entrance for scanning.
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right Column */}
                              <div className="flex flex-col justify-between items-end">
                                <div className="flex flex-col items-end">
                                  <div className="text-xs text-gray-400">Price</div>
                                  <div className="font-bold text-orange-300">${seat.price?.toFixed(2) || '0.00'}</div>
                                </div>
                                
                                {/* QR Code Placeholder (this would be a real QR in production) */}
                                <div className="mt-2 w-24 h-24 bg-white p-1">
                                  <div className="w-full h-full bg-black flex items-center justify-center">
                                    <div className="grid grid-cols-6 grid-rows-6 gap-0.5 w-20 h-20">
                                      {/* Simulated QR code pattern */}
                                      {Array.from({ length: 36 }).map((_, i) => (
                                        <div 
                                          key={i} 
                                          className={`${Math.random() > 0.7 ? 'bg-white' : 'bg-black'} ${i < 6 || i >= 30 || i % 6 === 0 || i % 6 === 5 ? 'bg-white' : ''}`}
                                        ></div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Ticket ID */}
                                <div className="text-center mt-2 text-xs text-gray-400">
                                  {/* Ticket ID based on seat and ticket ID */}
                                  <div className="font-mono">
                                    TIX-{ticketId.substring(0, 8)}-{index + 1}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Ticket Footer */}
                            <div className="bg-gray-900 p-3 border-t border-gray-700 flex justify-between items-center">
                              <div className="text-xs text-gray-400">
                                Order: #{ticketDetails.orderId?.substring(0, 8)}
                              </div>
                              
                              {/* Barcode */}
                              <div className="bg-gray-200 p-1 rounded inline-block">
                                <div className="flex space-x-0.5">
                                  {Array.from({ length: 20 }).map((_, i) => (
                                    <div 
                                      key={i}
                                      className="w-0.5 bg-gray-900"
                                      style={{ 
                                        height: `${6 + Math.random() * 12}px`,
                                      }}
                                    ></div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-400">
                                {formatDate(ticketDetails.purchaseDate).split(',')[0]}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Individual Download Button */}
                        <div className="mt-3 text-center">
                          <button
                            onClick={() => downloadTicket(index)}
                            className="text-sm bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-4 rounded-lg inline-flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download This Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Download Error Message */}
                  {downloadStatus.error && (
                    <div className="mt-4 bg-red-900 bg-opacity-50 text-white p-3 rounded-lg">
                      <p className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {downloadStatus.error}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m-6-8h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-xl font-semibold mb-2">Ticket Not Found</h2>
                  <p className="text-gray-400 mb-6">We couldn't find the ticket you're looking for.</p>
                  <button
                    onClick={handleGoBack}
                    className="py-2 px-6 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Back to My Tickets
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-700 pt-4 mt-8">
            <p>Need assistance? Contact our support team at support@youreventsite.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;