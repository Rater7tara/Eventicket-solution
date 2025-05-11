import React, { useState, useEffect, useContext } from 'react';
import { Ticket, CalendarCheck, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../providers/AuthProvider'; // Adjust path as needed
import serverURL from '../../../ServerConfig'; // Import the server URL

const BuyerDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        upcomingEvents: 0,
        ticketsPurchased: 0,
    });
    const [upcomingTickets, setUpcomingTickets] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch buyer dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get the token for API requests - make sure to use auth-token, not access-token
                const token = localStorage.getItem('auth-token');
                
                if (!token) {
                    console.warn('No auth token found for API requests');
                }
                
                // Fetch stats data
                try {
                    // Use the serverURL from your config
                    const statsResponse = await fetch(`${serverURL.url}user/stats`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    // Check if the response is JSON
                    const contentType = statsResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const statsData = await statsResponse.json();
                        if (statsResponse.ok) {
                            setStats(statsData);
                        } else {
                            console.warn('Stats API returned error:', statsData);
                        }
                    } else {
                        console.warn('Stats API did not return JSON, likely HTML error page');
                    }
                } catch (statsError) {
                    console.error('Error fetching stats:', statsError);
                    // Continue with default stats
                }
                
                // Fetch tickets data
                try {
                    const ticketsResponse = await fetch(`${serverURL.url}user/tickets`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    // Check if the response is JSON
                    const contentType = ticketsResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const ticketsData = await ticketsResponse.json();
                        if (ticketsResponse.ok) {
                            setUpcomingTickets(ticketsData);
                        } else {
                            console.warn('Tickets API returned error:', ticketsData);
                        }
                    } else {
                        console.warn('Tickets API did not return JSON, likely HTML error page');
                    }
                } catch (ticketsError) {
                    console.error('Error fetching tickets:', ticketsError);
                    // Continue with empty tickets
                }
                
                // Fetch recommended events
                try {
                    const recommendedResponse = await fetch(`${serverURL.url}events/recommended`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    // Check if the response is JSON
                    const contentType = recommendedResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const recommendedData = await recommendedResponse.json();
                        if (recommendedResponse.ok) {
                            setRecommendedEvents(recommendedData);
                        } else {
                            console.warn('Recommended events API returned error:', recommendedData);
                        }
                    } else {
                        console.warn('Recommended events API did not return JSON, likely HTML error page');
                    }
                } catch (recommendedError) {
                    console.error('Error fetching recommended events:', recommendedError);
                    // Continue with empty recommended events
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching buyer dashboard data:', error);
                setError('Failed to load dashboard data. Please try again later.');
                setLoading(false);
            }
        };

        // Only fetch data if user is logged in
        if (user) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Show loading state
    if (loading) {
        return (
            <div>
                <h2 className="text-xl font-semibold mb-6">My Tickets Dashboard</h2>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div>
                <h2 className="text-xl font-semibold mb-6">My Tickets Dashboard</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Get the appropriate dashboard title based on role
    const getDashboardTitle = () => {
        if (!user || !user.role) return 'My Tickets Dashboard';
        
        switch (user.role.toLowerCase()) {
            case 'admin':
                return 'Admin Tickets Dashboard';
            case 'seller':
                return 'Seller Tickets Dashboard';
            case 'buyer':
            case 'user':
                return 'My Tickets Dashboard';
            default:
                return 'My Tickets Dashboard';
        }
    };

    // Format user role for display - capitalize first letter
    const formatRole = (role) => {
        if (!role) return 'Buyer'; // Default to Buyer if no role
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">
                {getDashboardTitle()}
            </h2>
            
            {/* User role info */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p>Logged in as: <strong>{user?.name}</strong></p>
                <p>Role: <strong>{formatRole(user?.role)}</strong></p>
            </div>
            
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 shadow-sm border border-blue-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-blue-500 font-medium">Upcoming Events</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.upcomingEvents || 0}</h3>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <CalendarCheck size={24} className="text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 shadow-sm border border-purple-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-purple-500 font-medium">Tickets Purchased</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.ticketsPurchased || 0}</h3>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <Ticket size={24} className="text-purple-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Events Section */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">My Upcoming Events</h3>
                <div className="grid grid-cols-1 gap-4">
                    {upcomingTickets && upcomingTickets.length > 0 ? (
                        upcomingTickets.map(ticket => (
                            <div key={ticket.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                    <div>
                                        <h4 className="font-semibold text-lg">{ticket.event}</h4>
                                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                                            <CalendarCheck size={16} />
                                            <span className="text-sm">{ticket.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                                            <Clock size={16} />
                                            <span className="text-sm">{ticket.time}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                                            <MapPin size={16} />
                                            <span className="text-sm">{ticket.location}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            {ticket.ticketType}
                                        </span>
                                        <Link 
                                            to={`/dashboard/my-tickets/${ticket.id}`}
                                            className="block mt-2 text-center py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                        >
                                            View Ticket
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100 text-center">
                            <p className="text-yellow-700">You don't have any upcoming events.</p>
                            <Link 
                                to="/events"
                                className="inline-block mt-2 py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                            >
                                Browse Events
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Recommended Events Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
                {recommendedEvents && recommendedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendedEvents.map(event => (
                            <div key={event.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                <img 
                                    src={event.image || '/placeholder-event.jpg'} 
                                    alt={event.name} 
                                    className="w-full h-40 object-cover"
                                />
                                <div className="p-4">
                                    <h4 className="font-semibold text-lg">{event.name}</h4>
                                    <div className="flex items-center gap-1 text-gray-500 my-1">
                                        <CalendarCheck size={16} />
                                        <span className="text-sm">{event.date}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="font-semibold text-orange-600">${event.price}</span>
                                        <Link 
                                            to={`/events/${event.id}`}
                                            className="py-1 px-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 text-center">
                        <p className="text-blue-700">No recommended events at the moment.</p>
                        <Link 
                            to="/events"
                            className="inline-block mt-2 py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        >
                            Browse All Events
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuyerDashboard;