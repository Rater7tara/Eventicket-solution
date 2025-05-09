import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import serverURL from '../../../../ServerConfig';

const MyTickets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [error, setError] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState({ loading: false, error: null });

  // Load tickets when component mounts
  useEffect(() => {
    fetchTickets();
  }, []);

  // Fetch all purchased tickets
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${serverURL}/user/purchased-tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTickets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load your tickets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ticket details
  const fetchTicketDetails = async (ticketId) => {
    if (!ticketId) return;
    
    setSelectedTicket(ticketId);
    try {
      const response = await axios.get(`${serverURL}/user/buy-ticket/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTicketDetails(response.data);
      setError(null);
      
      // Scroll to the ticket details section
      setTimeout(() => {
        document.getElementById('ticket-details')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError('Failed to load ticket details. Please try again later.');
      setTicketDetails(null);
    }
  };

  // Download ticket as PDF
  const downloadTicket = async (ticketId) => {
    setDownloadStatus({ loading: true, error: null });
    try {
      const response = await axios.get(`${serverURL}/user/download-tickets`, {
        params: { ticketId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticketId}.pdf`);
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

  // Handle navigation back to events
  const handleGoToEvents = () => {
    navigate('/events');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 rounded-t-xl flex items-center justify-between mb-1">
          <button 
            onClick={handleGoToEvents}
            className="flex items-center text-white hover:text-orange-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse Events
          </button>
          <h1 className="text-xl md:text-2xl font-bold">My Tickets</h1>
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
              {/* No Tickets State */}
              {tickets.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m-6-8h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-xl font-semibold mb-2">No Tickets Found</h2>
                  <p className="text-gray-400 mb-6">You haven't purchased any tickets yet.</p>
                  <button
                    onClick={handleGoToEvents}
                    className="py-2 px-6 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Browse Events
                  </button>
                </div>
              ) : (
                <>
                  {/* Tickets List */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-orange-300 mb-4">Your Purchased Tickets</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tickets.map((ticket) => (
                        <div 
                          key={ticket._id} 
                          className={`ticket-card bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-orange-500 border-opacity-40 shadow-lg overflow-hidden cursor-pointer hover:border-orange-400 transition-all ${selectedTicket === ticket._id ? 'ring-2 ring-orange-400' : ''}`}
                          onClick={() => fetchTicketDetails(ticket._id)}
                        >
                          {/* Ticket Header */}
                          <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                            <div className="font-bold truncate">{ticket.event.title}</div>
                            <div className="text-sm bg-orange-900 bg-opacity-50 rounded px-2 py-1">
                              {ticket.seats.length} {ticket.seats.length === 1 ? 'Ticket' : 'Tickets'}
                            </div>
                          </div>
                          
                          {/* Ticket Preview */}
                          <div className="p-4 flex justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm">{formatDate(ticket.event.date)}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-sm truncate">{ticket.event.location}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-4 flex flex-col items-end justify-between">
                              <div className="flex flex-col items-end">
                                <div className="text-xs text-gray-400">Order ID</div>
                                <div className="font-mono text-xs">{ticket.orderId?.substring(0, 10)}...</div>
                              </div>
                              
                              <div className="mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadTicket(ticket._id);
                                  }}
                                  className="text-xs bg-orange-700 hover:bg-orange-600 text-white py-1 px-3 rounded flex items-center"
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
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      PDF
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Selected Ticket Details */}
                  {ticketDetails && (
                    <div id="ticket-details" className="mt-8 pt-6 border-t border-gray-700">
                      <h2 className="text-lg font-bold text-orange-300 mb-4">
                        Ticket Details: {ticketDetails.event?.title}
                      </h2>
                      
                      {/* Event Info Card */}
                      <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
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
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {ticketDetails.event?.location || 'Location TBA'}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-300">
                              <div className="mb-1">
                                <span className="text-gray-400">Order ID:</span> 
                                <span className="font-mono ml-2">{ticketDetails.orderId}</span>
                              </div>
                              <div className="mb-1">
                                <span className="text-gray-400">Purchase Date:</span> 
                                <span className="ml-2">{formatDate(ticketDetails.purchaseDate)}</span>
                              </div>
                              <div className="mb-1">
                                <span className="text-gray-400">Total Amount:</span> 
                                <span className="ml-2 text-orange-300 font-bold">${ticketDetails.totalAmount?.toFixed(2)}</span>
                              </div>
                              <div className="mt-3">
                                <button
                                  onClick={() => downloadTicket(ticketDetails._id)}
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
                          </div>
                        </div>
                      </div>
                      
                      {/* Individual Tickets */}
                      <div className="space-y-6">
                        <h3 className="text-md font-bold text-orange-300">Your Tickets</h3>
                        
                        {ticketDetails.seats?.map((seat, index) => (
                          <div key={seat.id || index} className="ticket-full">
                            {/* Ticket Design - Follows the same styling as in CheckoutTickets */}
                            <div className="relative overflow-hidden">
                              <div className="ticket-card bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-orange-500 border-opacity-40 shadow-lg overflow-hidden">
                                {/* Ticket Header */}
                                <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                                  <div className="font-bold truncate">{ticketDetails.event?.title || 'Event'}</div>
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
                                        <span className="text-sm">{formatDate(ticketDetails.event?.date)}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm">{ticketDetails.event?.time || 'Time TBA'}</span>
                                      </div>
                                      
                                      <div className="text-xs text-gray-400 mt-1">Venue</div>
                                      <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-sm">{ticketDetails.event?.location || 'Location TBA'}</span>
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
                                        {/* Ticket ID based on seat and a timestamp */}
                                        TIX-{seat.section?.substring(0, 3).toUpperCase() || 'SEC'}-{seat.row || 'A'}{seat.number || '1'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Ticket Footer with Additional Info */}
                                <div className="bg-gray-900 p-3 border-t border-gray-700 text-xs text-gray-400">
                                  <div className="flex justify-between">
                                    <div>Order: {ticketDetails.orderId?.substring(0, 8)}...</div>
                                    <div>Purchased: {new Date(ticketDetails.purchaseDate).toLocaleDateString()}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Individual Ticket Download Button */}
                            <div className="mt-2 text-center">
                              <button
                                onClick={() => downloadTicket(`${ticketDetails._id}-${index}`)}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded-full flex items-center mx-auto"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  )}
                </>
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

export default MyTickets;