import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, MapPin, Ticket, Download, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../../providers/AuthProvider';
import serverURL from '../../../../ServerConfig';

const API_BASE_URL = serverURL.url;

const MyTickets = () => {
    const { user, refreshToken } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    // Function to safely parse localStorage data
    const safelyParseJSON = (jsonString, defaultValue = []) => {
        try {
            if (!jsonString) return defaultValue;
            const parsed = JSON.parse(jsonString);
            return parsed || defaultValue;
        } catch (err) {
            console.error('JSON parsing error:', err);
            return defaultValue;
        }
    };

    // Load tickets from localStorage
    const loadLocalTickets = () => {
        try {
            // Check for ticketPurchases in localStorage
            const ticketPurchasesString = localStorage.getItem('ticketPurchases');
            
            if (ticketPurchasesString) {
                const ticketPurchases = safelyParseJSON(ticketPurchasesString, []);
                
                // If ticketPurchases is an array, use it directly
                if (Array.isArray(ticketPurchases) && ticketPurchases.length > 0) {
                    setTickets(ticketPurchases);
                    setStatusMessage('Your tickets have been loaded successfully.');
                    return true;
                } 
                // If it's an object (single purchase), wrap it in an array
                else if (ticketPurchases && typeof ticketPurchases === 'object' && !Array.isArray(ticketPurchases)) {
                    setTickets([ticketPurchases]);
                    setStatusMessage('Your ticket has been loaded successfully.');
                    return true;
                }
            }
            
            // Check if there's a currentOrderId in localStorage
            const currentOrderId = localStorage.getItem('currentOrderId');
            
            if (currentOrderId) {
                // Try to find this specific order in localStorage
                const allStorageKeys = Object.keys(localStorage);
                
                for (const key of allStorageKeys) {
                    if (key.includes('ticket') || key.includes('order') || key.includes('purchase')) {
                        try {
                            const value = safelyParseJSON(localStorage.getItem(key));
                            
                            // Check if this data contains our order ID
                            if (value && (
                                (Array.isArray(value) && value.some(item => item.orderId === currentOrderId)) ||
                                (typeof value === 'object' && value.orderId === currentOrderId)
                            )) {
                                // Found matching ticket data
                                const ticketData = Array.isArray(value) 
                                    ? value.filter(item => item.orderId === currentOrderId)
                                    : [value];
                                
                                setTickets(ticketData);
                                setStatusMessage('Your ticket has been loaded successfully.');
                                return true;
                            }
                        } catch (err) {
                            console.error(`Error parsing localStorage key "${key}":`, err);
                        }
                    }
                }
            }
            
            return false;
        } catch (err) {
            console.error('Error loading local tickets:', err);
            return false;
        }
    };

    // Load tickets when component mounts
    useEffect(() => {
        fetchTickets();
    }, [user]);

    // Function to fetch tickets from API
    const fetchTickets = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Check if refreshToken function is available
            if (typeof refreshToken === 'function') {
                await refreshToken();
            }
            
            // Get token from localStorage
            const token = localStorage.getItem('auth-token');
            
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }
            
            // Call the purchased tickets API
            const response = await fetch(`${API_BASE_URL}user/purchased-tickets`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Parse the response
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `Failed to fetch tickets (Status: ${response.status})`);
            }
            
            // Check if tickets array exists and has items
            if (data.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
                setTickets(data.tickets);
                setStatusMessage('Your tickets have been loaded successfully.');
            } else {
                // If API returns empty array, try localStorage as fallback
                const foundLocalTickets = loadLocalTickets();
                
                if (!foundLocalTickets) {
                    setTickets([]);
                    setStatusMessage('No tickets found. Purchase tickets to see them here.');
                }
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError(`${err.message} Please try refreshing or check your login status.`);
            
            // Try to load from localStorage as fallback
            loadLocalTickets();
        } finally {
            setLoading(false);
        }
    };

    // Function to view ticket details
    const viewTicketDetails = async (ticketId) => {
        setDetailsLoading(true);
        setError('');
        
        try {
            // First check if we have this ticket in our state already
            const localTicket = tickets.find(ticket => 
                (ticket.orderId === ticketId) || (ticket._id === ticketId)
            );
            
            if (localTicket) {
                setSelectedTicket(localTicket);
                setDetailsLoading(false);
                return;
            }
            
            // If not in local state, try to fetch from API
            // Ensure we have a valid token
            if (typeof refreshToken === 'function') {
                await refreshToken();
            }
            
            // Get token from localStorage
            const token = localStorage.getItem('auth-token');
            
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }
            
            // Call the ticket details API
            const response = await fetch(`${API_BASE_URL}user/buy-ticket/${ticketId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Parse the response
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch ticket details');
            }
            
            // Set selected ticket in state
            if (data.ticket) {
                setSelectedTicket(data.ticket);
            } else {
                throw new Error('No ticket data returned from server');
            }
        } catch (err) {
            console.error('Error fetching ticket details:', err);
            setError(`Failed to load ticket details: ${err.message}`);
            
            // Try to find ticket in local state again as a last resort
            const possibleTicket = tickets.find(ticket => 
                (ticket.orderId && ticket.orderId.includes(ticketId)) || 
                (ticket._id && ticket._id.includes(ticketId))
            );
            
            if (possibleTicket) {
                setSelectedTicket(possibleTicket);
            }
        } finally {
            setDetailsLoading(false);
        }
    };

    // Function to download ticket as PDF
    const downloadTicket = async (ticketId) => {
        setDownloadLoading(true);
        setError('');
        
        try {
            // Ensure we have a valid token
            if (typeof refreshToken === 'function') {
                await refreshToken();
            }
            
            // Get token from localStorage
            const token = localStorage.getItem('auth-token');
            
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }
            
            // Call the download ticket API
            const response = await fetch(`${API_BASE_URL}user/download-tickets?ticketId=${ticketId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to download ticket');
            }
            
            // Convert response to blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `ticket-${ticketId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            setStatusMessage('Ticket downloaded successfully!');
        } catch (err) {
            console.error('Error downloading ticket:', err);
            setError(`Failed to download ticket: ${err.message}`);
        } finally {
            setDownloadLoading(false);
        }
    };

    // Function to close modal
    const closeModal = () => {
        setSelectedTicket(null);
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

    // Render loading spinner
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Tickets</h2>
                <button 
                    onClick={fetchTickets}
                    className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Refresh
                </button>
            </div>
            
            {/* Status message */}
            {/* {statusMessage && (
                <div className="bg-blue-50 border border-blue-500 text-blue-700 px-4 py-3 rounded mb-4 flex items-start">
                    <div className="mr-2 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>{statusMessage}</div>
                </div>
            )} */}
            
            {/* Error message */}
            {/* {error && (
                <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>{error}</div>
                </div>
            )} */}
            
            {/* No tickets message */}
            {!loading && tickets.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <Ticket size={48} className="mx-auto text-orange-500 mb-3" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No Tickets Found</h3>
                    <p className="text-gray-600 mb-6">You haven't purchased any tickets yet.</p>
                    <Link 
                        to="/events" 
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all duration-200"
                    >
                        <Calendar size={18} />
                        Browse Events
                    </Link>
                </div>
            )}
            
            {/* Tickets list */}
            {tickets.length > 0 && (
                <div className="space-y-6 mt-6">
                    {tickets.map((ticket, index) => (
                        <div key={ticket._id || ticket.orderId || index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                            {/* Ticket UI inspired by checkout tickets */}
                            <div className="ticket-card relative overflow-hidden">
                                {/* Ticket Header */}
                                <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-4 flex justify-between items-center">
                                    <div className="font-bold text-white text-lg truncate">
                                        {ticket.event?.title || 'Untitled Event'}
                                    </div>
                                    <div className="text-sm bg-orange-900 bg-opacity-50 rounded px-2 py-1 text-white">
                                        {ticket.quantity || ticket.selectedSeats?.length || 1} Ticket{(ticket.quantity || ticket.selectedSeats?.length || 1) !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                
                                {/* Ticket Body */}
                                <div className="p-4 md:p-6 flex flex-col md:flex-row">
                                    {/* Left content */}
                                    <div className="md:w-2/3">
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Calendar size={18} className="text-orange-500" />
                                                <span>{formatDate(ticket.event?.date || ticket.purchaseDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Clock size={18} className="text-orange-500" />
                                                <span>{ticket.event?.time || 'Time TBA'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <MapPin size={18} className="text-orange-500" />
                                                <span>{ticket.event?.location || 'Location TBA'}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Seats section */}
                                        {ticket.selectedSeats && ticket.selectedSeats.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-gray-500 mb-2">Selected Seats:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {ticket.selectedSeats.slice(0, 4).map((seat, idx) => (
                                                        <div key={idx} className="inline-block bg-gray-100 rounded px-2 py-1 text-sm">
                                                            {seat.name || `Seat ${idx + 1}`}
                                                        </div>
                                                    ))}
                                                    {ticket.selectedSeats.length > 4 && (
                                                        <div className="inline-block bg-gray-100 rounded px-2 py-1 text-sm">
                                                            +{ticket.selectedSeats.length - 4} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Order info */}
                                        <div className="text-sm text-gray-500 mt-4 flex items-center gap-1">
                                            <FileText size={16} />
                                            <span>Order ID: {ticket._id || ticket.orderId || 'N/A'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Right content */}
                                    <div className="md:w-1/3 mt-4 md:mt-0 md:border-l md:border-gray-200 md:pl-6 flex flex-col justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-orange-600 mb-2">
                                                ${ticket.grandTotal || ticket.totalPrice || 0}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Purchased on {new Date(ticket.purchaseDate || ticket.createdAt || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                        
                                        {/* Barcode */}
                                        <div className="mt-4 mb-4 md:mb-0">
                                            <div className="bg-gray-200 p-1 rounded">
                                                <div className="flex space-x-0.5">
                                                    {Array.from({ length: 30 }).map((_, i) => (
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
                                                {/* Generate a ticket ID based on order ID */}
                                                {ticket.orderId ? ticket.orderId.substring(0, 12) : `TIX-${Math.floor(Math.random() * 1000000)}`}
                                            </div>
                                        </div>
                                        
                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <button 
                                                onClick={() => viewTicketDetails(ticket._id || ticket.orderId)}
                                                className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <Eye size={18} />
                                                View Details
                                            </button>
                                            <button 
                                                onClick={() => downloadTicket(ticket._id || ticket.orderId)}
                                                className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                                                disabled={downloadLoading}
                                            >
                                                {downloadLoading ? (
                                                    <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full mr-1"></div>
                                                ) : (
                                                    <Download size={18} />
                                                )}
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Ticket details modal */}
            {selectedTicket && (
              <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal header */}
                        <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Ticket Details</h3>
                            <button 
                                onClick={closeModal}
                                className="text-white hover:text-orange-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Ticket content */}
                        <div className="p-6">
                            {/* Event info */}
                            <div className="border-b border-gray-200 pb-4 mb-6">
                                <h4 className="text-2xl font-bold text-gray-800 mb-2">
                                    {selectedTicket.event?.title || 'Untitled Event'}
                                </h4>
                                <div className="flex flex-wrap gap-4 mb-3">
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Calendar size={18} className="text-orange-500" />
                                        <span>{formatDate(selectedTicket.event?.date || selectedTicket.purchaseDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Clock size={18} className="text-orange-500" />
                                        <span>{selectedTicket.event?.time || 'Time TBA'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <MapPin size={18} className="text-orange-500" />
                                        <span>{selectedTicket.event?.location || 'Location TBA'}</span>
                                    </div>
                                </div>
                                <p className="text-gray-600">
                                    {selectedTicket.event?.description || 'No description available'}
                                </p>
                            </div>
                            
                            {/* Ticket breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Ticket info */}
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-3">Ticket Information</h4>
                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Order ID</p>
                                                <p className="font-medium text-gray-800 break-all">{selectedTicket._id || selectedTicket.orderId || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Purchase Date</p>
                                                <p className="font-medium text-gray-800">
                                                    {new Date(selectedTicket.purchaseDate || selectedTicket.createdAt || Date.now()).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Ticket Type</p>
                                                <p className="font-medium text-gray-800">{selectedTicket.ticketType?.name || 'Regular'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Quantity</p>
                                                <p className="font-medium text-gray-800">{selectedTicket.quantity || selectedTicket.selectedSeats?.length || 1}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Price details */}
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-3">Price Details</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium">${selectedTicket.totalPrice || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Service Fee</span>
                                                <span className="font-medium">${selectedTicket.serviceFee || 0}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-2 mt-2">
                                                <div className="flex justify-between font-bold">
                                                    <span>Total</span>
                                                    <span className="text-orange-600">${selectedTicket.grandTotal || selectedTicket.totalPrice || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Seat selection */}
                            {selectedTicket.selectedSeats && selectedTicket.selectedSeats.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-gray-700 mb-3">Selected Seats</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {selectedTicket.selectedSeats.map((seat, idx) => (
                                                <div key={idx} className="bg-white border border-gray-200 rounded-md p-3 text-center">
                                                    <div className="font-bold text-gray-800">{seat.name || `Seat ${idx + 1}`}</div>
                                                    {seat.section && (
                                                        <div className="text-xs text-gray-500">
                                                            {seat.section}, Row {seat.row}, Seat {seat.number}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Ticket visualization */}
                            <div className="mb-6 border-t border-gray-200 pt-6">
                                <h4 className="font-bold text-gray-700 mb-3">Ticket Preview</h4>
                                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-md">
                                    {/* Ticket header */}
                                    <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                                        <div className="font-bold text-white truncate">{selectedTicket.event?.title || 'Event'}</div>
                                        <div className="text-xs bg-orange-900 bg-opacity-50 rounded px-2 py-1 text-white">
                                            Admit {selectedTicket.quantity || selectedTicket.selectedSeats?.length || 1}
                                        </div>
                                    </div>
                                    
                                    {/* Ticket body */}
                                    <div className="p-4 flex justify-between">
                                        <div className="w-2/3">
                                            <div className="flex flex-col space-y-3">
                                                <div>
                                                    <div className="text-xs text-gray-500">Event</div>
                                                    <div className="font-medium">{selectedTicket.event?.title || 'Untitled Event'}</div></div>
                                                
                                                <div>
                                                    <div className="text-xs text-gray-500">Date & Time</div>
                                                    <div className="font-medium">
                                                        {formatDate(selectedTicket.event?.date || selectedTicket.purchaseDate)}
                                                    </div>
                                                    <div className="font-medium">
                                                        {selectedTicket.event?.time || 'Time TBA'}
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <div className="text-xs text-gray-500">Location</div>
                                                    <div className="font-medium">
                                                        {selectedTicket.event?.location || 'Location TBA'}
                                                    </div>
                                                </div>
                                                
                                                {selectedTicket.selectedSeats && selectedTicket.selectedSeats[0] && (
                                                    <div>
                                                        <div className="text-xs text-gray-500">Seat</div>
                                                        <div className="font-medium">
                                                            {selectedTicket.selectedSeats[0].name || 'General Admission'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="w-1/3 flex flex-col items-end justify-between">
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Price</div>
                                                <div className="font-bold text-orange-600">
                                                    ${(selectedTicket.grandTotal || selectedTicket.totalPrice || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            
                                            {/* Barcode */}
                                            <div className="mt-2">
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
                                                    {/* Generate ticket ID based on order ID */}
                                                    {selectedTicket.orderId ? selectedTicket.orderId.substring(0, 12) : `TIX-${Math.floor(Math.random() * 1000000)}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-100 p-2 text-center text-xs text-gray-500 border-t border-gray-300">
                                        This ticket is valid for entry. Please present this at the event.
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => downloadTicket(selectedTicket._id || selectedTicket.orderId)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 ${
                                        downloadLoading 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg'
                                    } text-white rounded-lg transition-all`}
                                    disabled={downloadLoading}
                                >
                                    {downloadLoading ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        <Download size={18} />
                                    )}
                                    Download Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTickets;