import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, MapPin, DollarSign, TicketIcon, Trash2, Edit, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../../providers/AuthProvider'; // Adjust path as needed

const MyEvents = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    // Load events from localStorage when component mounts
    useEffect(() => {
        const loadEvents = () => {
            setLoading(true);
            try {
                const storedEvents = localStorage.getItem('events');
                if (storedEvents) {
                    const parsedEvents = JSON.parse(storedEvents);
                    
                    // Filter events created by current user if user is available
                    if (user && user.email) {
                        const userEvents = parsedEvents.filter(event => 
                            event.createdBy === user.email
                        );
                        setEvents(userEvents);
                    } else {
                        // If no user, show all events (or none, depending on your preference)
                        setEvents(parsedEvents);
                    }
                }
            } catch (error) {
                console.error('Error loading events:', error);
                setStatusMessage('Failed to load events. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [user]);

    // Handle event deletion with confirmation
    const requestDeleteEvent = (eventId) => {
        setDeleteConfirmation(eventId);
    };

    const cancelDelete = () => {
        setDeleteConfirmation(null);
    };

    const confirmDelete = (eventId) => {
        try {
            // Get all events from localStorage
            const storedEvents = localStorage.getItem('events');
            if (storedEvents) {
                const allEvents = JSON.parse(storedEvents);
                
                // Filter out the event to delete
                const updatedEvents = allEvents.filter(event => event.id !== eventId);
                
                // Save updated events back to localStorage
                localStorage.setItem('events', JSON.stringify(updatedEvents));
                
                // Update state with user's events only
                if (user && user.email) {
                    const userEvents = updatedEvents.filter(event => 
                        event.createdBy === user.email
                    );
                    setEvents(userEvents);
                } else {
                    setEvents(updatedEvents);
                }
                
                setStatusMessage('Event deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            setStatusMessage('Failed to delete event. Please try again.');
        }
        
        // Clear confirmation state
        setDeleteConfirmation(null);
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
                <Link 
                    to="/dashboard/add-event" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all duration-200"
                >
                    <PlusCircle size={18} />
                    Add New Event
                </Link>
            </div>
            
            {/* Status message */}
            {statusMessage && (
                <div className="bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded mb-4">
                    {statusMessage}
                </div>
            )}
            
            {/* No events message */}
            {events.length === 0 && (
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
                    <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                        {/* Event image */}
                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                            {event.image ? (
                                <img 
                                    src={event.image} 
                                    alt={event.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/400x200?text=Event+Image';
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
                                    <Clock size={16} className="text-orange-500" />
                                    <span>{event.time}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin size={16} className="text-orange-500" />
                                    <span>{event.location}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-700">
                                    <TicketIcon size={16} className="text-orange-500" />
                                    <span>{event.ticketsAvailable} tickets available</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-xl font-bold text-orange-600">
                                    {event.price}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => requestDeleteEvent(event.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                                        title="Delete Event"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    
                                    <Link 
                                        to={`/dashboard/edit-event/${event.id}`}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
                                        title="Edit Event"
                                    >
                                        <Edit size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Delete confirmation modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
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
        </div>
    );
};

export default MyEvents;