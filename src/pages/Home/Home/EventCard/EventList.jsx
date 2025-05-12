import React, { useEffect, useState } from 'react';
import EventCard from './EventCard';
import serverURL from '../../../../ServerConfig'; // adjust path as needed

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${serverURL.url}ticket/published-tickets`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                
                const data = await response.json();
                console.log("API Response:", data); // Log the response to see its structure
                
                // Check if the data is in the expected format
                if (data && Array.isArray(data.tickets)) {
                    setEvents(data.tickets);
                } else if (data && Array.isArray(data)) {
                    setEvents(data);
                } else {
                    console.warn("Unexpected API response format:", data);
                    // Try to extract events if the response is an object
                    const extractedEvents = data && typeof data === 'object' ? 
                        data.tickets || data.events || Object.values(data).find(arr => Array.isArray(arr)) : 
                        [];
                    
                    if (Array.isArray(extractedEvents) && extractedEvents.length > 0) {
                        setEvents(extractedEvents);
                    } else {
                        setEvents([]);
                        setError("No events found or invalid data format");
                    }
                }
            } catch (err) {
                console.error("Failed to fetch events:", err);
                setError("Failed to load events. Please try again later.");
                setEvents([]); // Ensure events is always an array
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px] bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[400px] bg-gray-900 text-white">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="mt-4 text-lg">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition duration-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Double check that events is an array before trying to map over it
    if (!Array.isArray(events)) {
        console.error("events is not an array:", events);
        return (
            <div className="flex justify-center items-center min-h-[400px] bg-gray-900 text-white">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="mt-4 text-lg">Invalid data format received from server</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition duration-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[400px] bg-gray-900 text-white">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-lg">No events available at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-gray-900">
            {events.map((event) => (
                <EventCard key={event._id} event={event} />
            ))}
        </div>
    );
};

export default EventList;