import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, MapPin, DollarSign, TicketIcon, Trash2, Edit, PlusCircle, AlertCircle, X, Save, ImageIcon, Ticket, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../providers/AuthProvider';
import serverURL from "../../../../ServerConfig";
import axios from 'axios';

const MyEvents = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [updatedEventData, setUpdatedEventData] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);

    // Get auth token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem('auth-token');
    };

    // Set up axios headers with authentication
    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    // Load events from API when component mounts
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setErrorMessage('');
            try {
                // Get auth token
                const token = getAuthToken();
                
                if (!token) {
                    throw new Error('Authentication required. Please log in.');
                }
                
                // Make API request with auth headers
                const response = await axios.get(
                    `${serverURL.url}event/my-events`, 
                    getAuthHeaders()
                );
                
                console.log('My Events API response:', response.data);
                
                // Set events from API response
                if (response.data && response.data.events) {
                    setEvents(response.data.events);
                } else {
                    setEvents([]);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
                setErrorMessage(error.response?.data?.message || 'Failed to load events. Please try again.');
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchEvents();
        } else {
            setLoading(false);
            setEvents([]);
        }
    }, [user]);

    // Handle event deletion with confirmation
    const requestDeleteEvent = (eventId) => {
        setDeleteConfirmation(eventId);
    };

    const cancelDelete = () => {
        setDeleteConfirmation(null);
    };

    const confirmDelete = async (eventId) => {
        try {
            setStatusMessage('');
            setErrorMessage('');
            
            // Delete event via API using the correct endpoint
            await axios.delete(
                `${serverURL.url}event/delete/${eventId}`,
                getAuthHeaders()
            );
            
            // Update state by removing the deleted event
            setEvents(events.filter(event => event._id !== eventId));
            setStatusMessage('Event deleted successfully');
            
        } catch (error) {
            console.error('Error deleting event:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to delete event. Please try again.');
        }
        
        // Clear confirmation state
        setDeleteConfirmation(null);
    };

    // Handle event editing
    const openEditModal = (event) => {
        setEditingEvent(event);
        setUpdatedEventData({
            title: event.title || '',
            description: event.description || '',
            date: event.date ? event.date.split('T')[0] : '', // Format date for date input
            time: event.time || '',
            location: event.location || '',
            image: event.image || '',
            price: event.price || 0,
            ticketsAvailable: event.ticketsAvailable || 0
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingEvent(null);
        setUpdatedEventData({});
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setUpdatedEventData({
            ...updatedEventData,
            [name]: name === 'ticketsAvailable' || name === 'price' 
                ? parseInt(value) || 0 
                : value
        });
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        
        if (!editingEvent || !editingEvent._id) {
            setErrorMessage('Event data is missing');
            return;
        }
        
        try {
            setUpdateLoading(true);
            setStatusMessage('');
            setErrorMessage('');
            
            // Create a function to attempt multiple endpoint patterns
            const attemptUpdateWithMultipleEndpoints = async () => {
                const possibleEndpoints = [
                    `${serverURL.url}event/update/${editingEvent._id}`,
                    `${serverURL.url}event/update-event/${editingEvent._id}`,
                    `${serverURL.url}event-update/${editingEvent._id}`
                ];
                
                const methods = ['patch', 'put'];
                
                let lastError = null;
                
                // Try each endpoint with each method
                for (const endpoint of possibleEndpoints) {
                    for (const method of methods) {
                        try {
                            console.log(`Attempting ${method.toUpperCase()} request to: ${endpoint}`);
                            
                            let response;
                            if (method === 'patch') {
                                response = await axios.patch(endpoint, updatedEventData, getAuthHeaders());
                            } else {
                                response = await axios.put(endpoint, updatedEventData, getAuthHeaders());
                            }
                            
                            console.log('Update successful with response:', response.data);
                            return response; // Return on first success
                        } catch (err) {
                            console.log(`${method.toUpperCase()} to ${endpoint} failed:`, err.message);
                            lastError = err;
                            // Continue to next attempt
                        }
                    }
                }
                
                // If we get here, all attempts failed
                throw lastError || new Error('All update attempts failed');
            };
            
            // Attempt update with multiple endpoint patterns
            const response = await attemptUpdateWithMultipleEndpoints();
            
            // Update the event in the local state
            setEvents(events.map(event => 
                event._id === editingEvent._id 
                    ? { ...event, ...updatedEventData } 
                    : event
            ));
            
            setStatusMessage('Event updated successfully');
            closeEditModal();
            
        } catch (error) {
            console.error('Error updating event:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to update event. Please try again.');
        } finally {
            setUpdateLoading(false);
        }
    };

    // Navigate to coupons page with event filter
    const handleManageCoupons = (eventId = null) => {
        if (eventId) {
            navigate(`/dashboard/coupons?eventId=${eventId}`);
        } else {
            navigate('/dashboard/coupons');
        }
    };

    // Navigate to seat plan page for booking seats
    const handleBookSeats = (eventId) => {
        // Find the event details from the events state
        const eventDetails = events.find(event => event._id === eventId);
        
        if (!eventDetails) {
            setErrorMessage('Event details not found');
            return;
        }
        
        // Navigate to SeatPlan page with event details in state and query parameters
        navigate('/SeatPlan', {
            state: {
                event: eventDetails,
                mode: 'reserve',
                sellerId: user?.id || user?._id
            }
        });
    };

    // Format date for display
    const formatEventDate = (dateString) => {
        if (!dateString) return 'Date not specified';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

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
                <h2 className="text-2xl font-bold text-gray-800">My Events</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleManageCoupons()}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all duration-200"
                    >
                        <Ticket size={18} />
                        Manage Coupons
                    </button>
                    <Link 
                        to="/dashboard/add-event" 
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all duration-200"
                    >
                        <PlusCircle size={18} />
                        Add New Event
                    </Link>
                </div>
            </div>
            
            {/* Status message */}
            {statusMessage && (
                <div className="bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
                    <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{statusMessage}</span>
                </div>
            )}
            
            {/* Error message */}
            {errorMessage && (
                <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                    <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                    <span>{errorMessage}</span>
                </div>
            )}
            
            {/* No events message */}
            {!loading && events.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <Calendar size={48} className="mx-auto text-orange-500 mb-3" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No Events Found</h3>
                    <p className="text-gray-600 mb-6">You haven't created any events yet.</p>
                    <Link 
                        to="/dashboard/add-event" 
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all duration-200"
                    >
                        <PlusCircle size={18} />
                        Create Your First Event
                    </Link>
                </div>
            )}
            
            {/* Events grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {events.map(event => (
                    <div key={event._id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                        {/* Event image */}
                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                            {event.image ? (
                                <img 
                                    src={event.image} 
                                    alt={event.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/400x200/orange/white?text=Event+Image';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-orange-100">
                                    <Calendar size={48} className="text-orange-300" />
                                </div>
                            )}
                        </div>
                        
                        {/* Event details */}
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                            
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar size={16} className="text-orange-500" />
                                    <span>{formatEventDate(event.date)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Clock size={16} className="text-orange-500" />
                                    <span>{event.time || 'Time not specified'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin size={16} className="text-orange-500" />
                                    <span>{event.location || 'Location not specified'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-700">
                                    <TicketIcon size={16} className="text-orange-500" />
                                    <span>{event.ticketsAvailable} tickets available</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-xl font-bold text-orange-600">
                                    ৳{event.price}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleBookSeats(event._id)}
                                        className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors duration-200"
                                        title="Book Seats for Personal Guests"
                                    >
                                        <Users size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleManageCoupons(event._id)}
                                        className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors duration-200"
                                        title="Manage Coupons for this Event"
                                    >
                                        <Ticket size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => requestDeleteEvent(event._id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                                        title="Delete Event"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => openEditModal(event)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
                                        title="Edit Event"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Book Seats Button - Full width below action buttons */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => handleBookSeats(event._id)}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-lg shadow hover:shadow-lg transition-all duration-200 font-medium"
                                >
                                    <Users size={18} />
                                    Book Seats for Personal Guests
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Delete confirmation modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this event? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmDelete(deleteConfirmation)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Edit Event Modal */}
            {isEditModalOpen && editingEvent && (
                <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">Edit Event</h3>
                            <button 
                                onClick={closeEditModal}
                                className="p-1 rounded-full hover:bg-gray-100"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6">
                            {/* Event Title */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-700 font-medium">
                                    Event Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={updatedEventData.title}
                                    onChange={handleUpdateChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter event title"
                                    required
                                />
                            </div>
                            
                            {/* Event Description */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-700 font-medium">
                                    Event Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={updatedEventData.description}
                                    onChange={handleUpdateChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-32"
                                    placeholder="Describe your event"
                                    required
                                ></textarea>
                            </div>
                            
                            {/* Event Date and Time - 2 column layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Date with Calendar Styling */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                                        <Calendar size={18} className="text-orange-500" />
                                        Event Date *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="date"
                                            value={updatedEventData.date}
                                            onChange={handleUpdateChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                                            required
                                        />
                                        <Calendar 
                                            size={18} 
                                            className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" 
                                        />
                                    </div>
                                </div>
                                
                                {/* Time with Better Styling */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                                        <Clock size={18} className="text-orange-500" />
                                        Event Time *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            name="time"
                                            value={updatedEventData.time}
                                            onChange={handleUpdateChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                                            required
                                        />
                                        <Clock 
                                            size={18} 
                                            className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Event Location */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-700 font-medium">
                                    <MapPin size={18} className="text-orange-500" />
                                    Event Location *
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={updatedEventData.location}
                                    onChange={handleUpdateChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Venue, City"
                                    required
                                />
                            </div>
                            
                            {/* Image URL */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-700 font-medium">
                                    <ImageIcon size={18} className="text-orange-500" />
                                    Image URL
                                </label>
                                <input
                                    type="text"
                                    name="image"
                                    value={updatedEventData.image}
                                    onChange={handleUpdateChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            
                            {/* Price and Tickets - 2 column layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Price */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                                        <DollarSign size={18} className="text-orange-500" />
                                        Price (BDT) *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={updatedEventData.price}
                                        onChange={handleUpdateChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="500"
                                        min="0"
                                        required
                                    />
                                </div>
                                
                                {/* Tickets Available */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                                        <TicketIcon size={18} className="text-orange-500" />
                                        Tickets Available *
                                    </label>
                                    <input
                                        type="number"
                                        name="ticketsAvailable"
                                        value={updatedEventData.ticketsAvailable}
                                        onChange={handleUpdateChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="100"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center ${
                                        updateLoading 
                                            ? 'bg-gray-400' 
                                            : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg'
                                    }`}
                                >
                                    {updateLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} className="mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyEvents;