import React, { useState, useEffect } from 'react';
import { Ticket, CalendarCheck, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const BuyerDashboard = ({ userName }) => {
    const [stats, setStats] = useState({
        upcomingEvents: 0,
        ticketsPurchased: 0,
    });
    const [upcomingTickets, setUpcomingTickets] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch buyer dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('access-token');
                
                // In a real app, you would fetch this data from your API
                // For now, using mock data for demonstration
                
                // Mock data - replace with actual API calls
                setTimeout(() => {
                    setStats({
                        upcomingEvents: 3,
                        ticketsPurchased: 5,
                    });

                    setUpcomingTickets([
                        { 
                            id: 1, 
                            event: 'Summer Music Festival', 
                            date: 'June 15, 2025', 
                            time: '4:00 PM', 
                            location: 'Central Park',
                            ticketType: 'VIP Pass' 
                        },
                        { 
                            id: 2, 
                            event: 'Tech Conference 2025', 
                            date: 'July 10, 2025', 
                            time: '9:00 AM', 
                            location: 'Tech Hub Center',
                            ticketType: 'General Admission' 
                        },
                        { 
                            id: 3, 
                            event: 'Food & Wine Expo', 
                            date: 'Aug 22, 2025', 
                            time: '12:00 PM', 
                            location: 'Grand Hall',
                            ticketType: 'Weekend Pass' 
                        },
                    ]);

                    setRecommendedEvents([
                        { 
                            id: 1, 
                            name: 'Art Exhibition', 
                            date: 'June 20, 2025',
                            image: 'https://placehold.co/300x200',
                            price: 25 
                        },
                        { 
                            id: 2, 
                            name: 'Jazz Night', 
                            date: 'June 25, 2025',
                            image: 'https://placehold.co/300x200',
                            price: 35 
                        },
                        { 
                            id: 3, 
                            name: 'Cooking Workshop', 
                            date: 'July 5, 2025',
                            image: 'https://placehold.co/300x200',
                            price: 45 
                        },
                    ]);

                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error('Error fetching buyer dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">My Tickets Dashboard</h2>
            
            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Array(2).fill(0).map((_, index) => (
                        <div key={index} className="bg-gray-100 rounded-lg p-6 h-28 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-blue-50 rounded-lg p-6 shadow-sm border border-blue-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-blue-500 font-medium">Upcoming Events</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.upcomingEvents}</h3>
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
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.ticketsPurchased}</h3>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <Ticket size={24} className="text-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming Events */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">My Upcoming Events</h3>
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {Array(3).fill(0).map((_, index) => (
                            <div key={index} className="bg-gray-100 rounded-lg p-6 h-24 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {upcomingTickets.length > 0 ? (
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
                )}
            </div>

            {/* Recommended Events */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array(3).fill(0).map((_, index) => (
                            <div key={index} className="bg-gray-100 rounded-lg p-6 h-64 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendedEvents.map(event => (
                            <div key={event.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                <img 
                                    src={event.image} 
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
                )}
            </div>
        </div>
    );
};

export default BuyerDashboard;