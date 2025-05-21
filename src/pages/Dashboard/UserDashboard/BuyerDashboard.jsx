import React, { useState, useEffect, useContext } from 'react';
import { Ticket, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../providers/AuthProvider'; // Adjust path as needed
import serverURL from '../../../ServerConfig';

const BuyerDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        upcomingEvents: 0,
        ticketsPurchased: 0,
    });
    const [loading, setLoading] = useState(true);
    const [debug, setDebug] = useState({
        error: null,
        responseStatus: null,
        rawResponse: null,
        parsedResponse: null,
    });

    // Load user's ticket data from API
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                setLoading(true);
                
                console.log('Fetching tickets...');
                
                // Try multiple token sources
                let token = null;
                
                if (user?.token) {
                    console.log('Using token from user context');
                    token = user.token;
                } else if (localStorage.getItem('token')) {
                    console.log('Using token from localStorage');
                    token = localStorage.getItem('token');
                } else if (sessionStorage.getItem('token')) {
                    console.log('Using token from sessionStorage');
                    token = sessionStorage.getItem('token');
                } else {
                    console.log('No token found');
                }
                
                // Try with different authorization header formats
                let headers = {
                    'Content-Type': 'application/json',
                };
                
                if (token) {
                    // Try standard Bearer token format
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                console.log('Using headers:', headers);
                
                // First, let's try checking if the endpoint requires a different path
                // Try the exact path provided
                let apiUrl = `${serverURL.url}user/purchased-tickets`;
                console.log(`Trying API endpoint: ${apiUrl}`);
                
                let response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: headers,
                });
                
                console.log(`Response status: ${response.status}`);
                setDebug(prev => ({...prev, responseStatus: response.status}));
                
                if (!response.ok) {
                    // If the first attempt fails, try with /api prefix
                    if (response.status === 404) {
                        console.log('Endpoint not found, trying with /api prefix');
                        apiUrl = `${serverURL.url}user/purchased-tickets`;
                        console.log(`Trying alternate API endpoint: ${apiUrl}`);
                        
                        response = await fetch(apiUrl, {
                            method: 'GET',
                            headers: headers,
                        });
                        
                        console.log(`Response status (second attempt): ${response.status}`);
                        setDebug(prev => ({...prev, responseStatus: response.status}));
                    }
                }
                
                // Store the raw response text for debugging
                const responseText = await response.text();
                console.log('Raw response:', responseText);
                setDebug(prev => ({...prev, rawResponse: responseText}));
                
                // Try to parse as JSON
                let ticketData;
                try {
                    ticketData = JSON.parse(responseText);
                    console.log('Parsed ticket data:', ticketData);
                    setDebug(prev => ({...prev, parsedResponse: ticketData}));
                } catch (parseError) {
                    console.error('Error parsing response as JSON:', parseError);
                    setDebug(prev => ({...prev, error: `Error parsing JSON: ${parseError.message}`}));
                    throw new Error(`Could not parse response as JSON: ${parseError.message}`);
                }
                
                // Try multiple ways to extract ticket data from the response
                let tickets = [];
                
                console.log('Attempting to extract tickets from response...');
                
                // Check various possible response structures
                if (Array.isArray(ticketData)) {
                    console.log('Response is a direct array of tickets');
                    tickets = ticketData;
                } else if (ticketData.tickets && Array.isArray(ticketData.tickets)) {
                    console.log('Found tickets in ticketData.tickets');
                    tickets = ticketData.tickets;
                } else if (ticketData.data && Array.isArray(ticketData.data)) {
                    console.log('Found tickets in ticketData.data');
                    tickets = ticketData.data;
                } else if (ticketData.results && Array.isArray(ticketData.results)) {
                    console.log('Found tickets in ticketData.results');
                    tickets = ticketData.results;
                } else {
                    // Try to find any array in the response that might contain tickets
                    const findArrays = (obj, path = '') => {
                        if (!obj || typeof obj !== 'object') return [];
                        
                        let results = [];
                        for (const key in obj) {
                            const newPath = path ? `${path}.${key}` : key;
                            if (Array.isArray(obj[key])) {
                                results.push({ path: newPath, array: obj[key] });
                            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                                results = [...results, ...findArrays(obj[key], newPath)];
                            }
                        }
                        return results;
                    };
                    
                    const possibleArrays = findArrays(ticketData);
                    console.log('Potential ticket arrays found:', possibleArrays);
                    
                    if (possibleArrays.length > 0) {
                        // Use the largest array found as it's most likely to be the tickets list
                        const largestArray = possibleArrays.reduce((max, curr) => 
                            curr.array.length > max.array.length ? curr : max, possibleArrays[0]);
                        
                        console.log(`Using array at path ${largestArray.path} with ${largestArray.array.length} items`);
                        tickets = largestArray.array;
                    } else {
                        console.log('No arrays found in response');
                    }
                }
                
                console.log(`Found ${tickets.length} tickets`);
                
                // Count unique upcoming events (events with future dates)
                const currentDate = new Date();
                const uniqueEventIds = new Set();
                
                tickets.forEach(ticket => {
                    console.log('Processing ticket:', ticket);
                    
                    let eventDate = null;
                    let eventId = null;
                    
                    // Try various ways the event date might be stored
                    if (ticket.event && ticket.event.date) {
                        eventDate = new Date(ticket.event.date);
                        eventId = ticket.event.id || ticket.eventId;
                    } else if (ticket.eventDate) {
                        eventDate = new Date(ticket.eventDate);
                        eventId = ticket.eventId || ticket.id;
                    } else if (ticket.date) {
                        eventDate = new Date(ticket.date);
                        eventId = ticket.id;
                    } else if (ticket.event && ticket.event.startDate) {
                        eventDate = new Date(ticket.event.startDate);
                        eventId = ticket.event.id || ticket.eventId;
                    } else if (ticket.startDate) {
                        eventDate = new Date(ticket.startDate);
                        eventId = ticket.id;
                    }
                    
                    // If we found a date, check if it's in the future
                    if (eventDate && eventId) {
                        console.log(`Event date: ${eventDate}, Current date: ${currentDate}`);
                        if (eventDate > currentDate) {
                            uniqueEventIds.add(eventId);
                            console.log(`Added upcoming event: ${eventId}`);
                        }
                    }
                });
                
                const upcomingEventsCount = uniqueEventIds.size;
                console.log(`Upcoming events count: ${upcomingEventsCount}`);
                
                // Update the stats with our findings
                setStats({
                    upcomingEvents: upcomingEventsCount,
                    ticketsPurchased: tickets.length
                });
                
                setLoading(false);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                setDebug(prev => ({...prev, error: error.message}));
                setLoading(false);
                setStats({
                    upcomingEvents: 0,
                    ticketsPurchased: 0
                });
            }
        };
        
        fetchTickets();
    }, [user]);

    // Toggle debug information visibility
    const [showDebug, setShowDebug] = useState(false);
    
    // Show loading state
    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Loading your dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                    My Tickets Dashboard
                </h2>
                <p className="text-orange-100">Welcome back! Here's an overview of your tickets.</p>
                {/* Debug toggle button - REMOVE IN PRODUCTION */}
                <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs bg-orange-700 text-white px-2 py-1 rounded mt-2"
                >
                    {showDebug ? 'Hide' : 'Show'} Debug Info
                </button>
            </div>
            
            {/* Debug info panel - REMOVE IN PRODUCTION */}
            {showDebug && (
                <div className="bg-gray-100 p-4 rounded-xl mb-8 text-xs font-mono overflow-auto">
                    <h3 className="font-bold mb-2">Debug Information</h3>
                    <p><strong>Error:</strong> {debug.error || 'None'}</p>
                    <p><strong>Response Status:</strong> {debug.responseStatus || 'Unknown'}</p>
                    <div className="mt-2">
                        <p><strong>Raw Response:</strong></p>
                        <pre className="bg-gray-200 p-2 rounded mt-1 max-h-32 overflow-auto">
                            {debug.rawResponse || 'None'}
                        </pre>
                    </div>
                    <div className="mt-2">
                        <p><strong>Parsed Response:</strong></p>
                        <pre className="bg-gray-200 p-2 rounded mt-1 max-h-32 overflow-auto">
                            {debug.parsedResponse ? JSON.stringify(debug.parsedResponse, null, 2) : 'None'}
                        </pre>
                    </div>
                </div>
            )}
            
            {/* Stats Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-orange-600 font-medium">Upcoming Events</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.upcomingEvents || 0}</h3>
                            <p className="text-gray-500 text-sm mt-1">Events you're attending</p>
                        </div>
                        <div className="bg-orange-100 p-4 rounded-full">
                            <CalendarCheck size={28} className="text-orange-500" />
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link 
                            to="/dashboard/my-tickets"
                            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
                        >
                            View Calendar
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-purple-600 font-medium">Tickets Purchased</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.ticketsPurchased || 0}</h3>
                            <p className="text-gray-500 text-sm mt-1">Total tickets bought</p>
                        </div>
                        <div className="bg-purple-100 p-4 rounded-full">
                            <Ticket size={28} className="text-purple-500" />
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link 
                            to="/dashboard/my-tickets"
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
                        >
                            View All Tickets
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Rest of dashboard code remains the same */}
            {/* Quick Actions Section */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Link 
                        to="/events"
                        className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Browse Events</span>
                    </Link>
                    
                    <Link 
                        to="/dashboard/my-tickets"
                        className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">View My Tickets</span>
                    </Link>
                    
                    <Link 
                        to="/profile"
                        className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">My Profile</span>
                    </Link>
                </div>
            </div>

            {/* Recommended Events Content Placeholder */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Popular Events</h3>
                    <Link 
                        to="/events"
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
                    >
                        View All
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </Link>
                </div>
                
                <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Discover Great Events</h3>
                    <p className="text-gray-500 mb-4">Check out the latest events that match your interests</p>
                    <Link 
                        to="/events"
                        className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                        Explore Events
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BuyerDashboard;