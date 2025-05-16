import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import serverURL from '../../../../ServerConfig'; // adjust path as needed

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // We can also try to get the event from navigation state if it was passed
    const eventFromState = location.state?.event;
    
    const [event, setEvent] = useState(null);
    const [ticketQuantity, setTicketQuantity] = useState(1);
    const [selectedTicketType, setSelectedTicketType] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        console.log("EventDetails: URL ID param:", id);
        console.log("EventDetails: Location state:", location.state);
        
        const fetchEventData = async () => {
            // First, try to use the event from navigation state if available
            if (eventFromState) {
                console.log("Using event from navigation state:", eventFromState);
                prepareEventData(eventFromState);
                setIsLoading(false);
                return;
            }
            
            // Otherwise, fetch from API
            try {
                const response = await fetch(`${serverURL.url}ticket/tickets/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch event: ${response.status}`);
                }
                
                const data = await response.json();
                console.log("Fetched event data:", data);
                
                // Check if we got an event or an array of events
                const eventData = data.ticket || data;
                
                if (eventData) {
                    prepareEventData(eventData);
                } else {
                    console.error("Event not found with ID:", id);
                    setError("Event not found");
                }
            } catch (err) {
                console.error("Error fetching event:", err);
                setError(err.message || "Failed to load event details");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchEventData();
    }, [id, eventFromState]);
    
    // Helper function to prepare event data with default values if needed
    const prepareEventData = (eventData) => {
        // Set default ticket types if not provided
        if (!eventData.ticketTypes) {
            eventData.ticketTypes = [
                { id: 1, name: "Regular", price: eventData.price || "800", contactOnly: false },
                { id: 2, name: "VIP", price: "0", contactOnly: true }
            ];
        }
        
        // Set default organizer if not provided
        if (!eventData.organizer) {
            eventData.organizer = {
                name: "Event Organizer",
                phone: "+880 1XX XXX XXXX",
                email: "contact@eventorganizer.com"
            };
        }
        
        setEvent(eventData);
    };

    const handleGoBack = () => {
        navigate('/');
    };

    const handleBookNow = () => {
        // Navigate to your seat booking page
        navigate('/SeatPlan', { 
            state: { 
                event,
                quantity: ticketQuantity,
                ticketType: event.ticketTypes[selectedTicketType] 
            } 
        });
    };

    const handleContactOrganizer = () => {
        // Navigate to your contact page or show contact info
        navigate('/contact', { 
            state: { 
                subject: `Regarding ${event.title}`,
                organizer: event.organizer 
            } 
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 border-opacity-50"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
                <h2 className="text-2xl font-bold mb-4">Error Loading Event</h2>
                <p className="text-gray-300 mb-4">{error}</p>
                <p className="text-gray-400 mb-8">Event ID from URL: {id}</p>
                <button 
                    onClick={handleGoBack}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-2.5 px-6 rounded-lg font-medium shadow-md"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
                <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
                <p className="text-gray-300 mb-4">Sorry, we couldn't find the event you're looking for.</p>
                <p className="text-gray-400 mb-8">Event ID from URL: {id}</p>
                <button 
                    onClick={handleGoBack}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-2.5 px-6 rounded-lg font-medium shadow-md"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Calculate the price based on selected ticket type
    const ticketPrice = event.ticketTypes[selectedTicketType].price;
    const totalPrice = ticketPrice * ticketQuantity;
    const isContactOnly = event.ticketTypes[selectedTicketType].contactOnly;

    return (
        <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 text-white">
            <div className="max-w-7xl mx-auto">
                {/* Main content */}
                <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                    {/* Hero section with image - FIXED HEIGHT ISSUE */}
                    <div className="relative">
                        <img 
                            src={event.image} 
                            alt={event.title} 
                            className="w-full object-cover"
                            style={{ minHeight: '300px', maxHeight: '500px' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        
                        {/* Floating event info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {event.time}
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {event.location}
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                    <span className="font-semibold">{event.price} BDT</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(event.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Content grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
                        {/* Event description */}
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold text-white mb-4">Event Details</h2>
                            <div className="prose max-w-none text-gray-300">
                                <p className="mb-4">{event.description}</p>
                                <p>{event.longDescription || "Join us for an unforgettable experience at this exciting event. Don't miss out on the opportunity to be part of something special."}</p>
                            </div>
                            
                            {/* Organizer information */}
                            <div className="mt-8">
                                <h3 className="text-xl font-semibold text-white mb-4">Event Organizer</h3>
                                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                                    <div className="font-medium text-white">{event.organizer.name}</div>
                                    <div className="text-gray-300 mt-2">
                                        <div className="flex items-center mb-1">
                                            <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {event.organizer.phone}
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {event.organizer.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Ticket booking section */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-md overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white">
                                    <h3 className="text-xl font-bold">Get Your Tickets</h3>
                                    <p className="text-orange-100 text-sm">
                                        {event.ticketsAvailable <= 0 
                                            ? 'Sold Out' 
                                            : `${event.ticketsAvailable} tickets available`}
                                    </p>
                                </div>
                                
                                <div className="p-4">
                                    {/* Ticket types */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Select Ticket Type
                                        </label>
                                        {event.ticketTypes.map((type, index) => (
                                            <div 
                                                key={type.id}
                                                className={`flex items-center justify-between p-3 border ${
                                                    selectedTicketType === index 
                                                    ? 'border-orange-500 bg-gray-700' 
                                                    : 'border-gray-700'
                                                } rounded-lg mb-2 hover:border-orange-400 cursor-pointer transition-colors`}
                                                onClick={() => setSelectedTicketType(index)}
                                            >
                                                <div>
                                                    <div className="font-medium text-white">{type.name}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {type.contactOnly 
                                                            ? 'Contact organizer for pricing'
                                                            : 'Includes all event access'}
                                                    </div>
                                                </div>
                                                <div className="font-bold text-orange-400">
                                                    {type.contactOnly 
                                                        ? 'Contact for price' 
                                                        : `${type.price} BDT`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Quantity selector for non-contact-only tickets */}
                                    {/* {!isContactOnly && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Number of Tickets
                                            </label>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                                                    className="bg-gray-700 text-white p-2 rounded-l-lg hover:bg-gray-600"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                    </svg>
                                                </button>
                                                <div className="bg-gray-700 text-white py-2 px-4 text-center w-20">
                                                    {ticketQuantity}
                                                </div>
                                                <button
                                                    onClick={() => setTicketQuantity(Math.min(event.ticketsAvailable, ticketQuantity + 1))}
                                                    disabled={ticketQuantity >= event.ticketsAvailable}
                                                    className="bg-gray-700 text-white p-2 rounded-r-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="mt-2 text-right text-sm text-orange-400 font-medium">
                                                Total: {totalPrice} BDT
                                            </div>
                                        </div>
                                    )} */}
                                    
                                    {/* Action buttons */}
                                    <div className="space-y-3">
                                        {!isContactOnly ? (
                                            <button 
                                                onClick={handleBookNow}
                                                disabled={event.ticketsAvailable <= 0}
                                                className={`w-full py-3 px-4 rounded-lg font-bold shadow-md text-center cursor-pointer ${
                                                    event.ticketsAvailable <= 0
                                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg transform transition-all duration-300 hover:translate-y-0 hover:scale-105'
                                                }`}
                                            >
                                                {event.ticketsAvailable <= 0 ? 'Sold Out' : 'Book Now'}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleContactOrganizer}
                                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg transform transition-all duration-300 hover:translate-y-0 hover:scale-105"
                                            >
                                                Contact Organizer
                                            </button>
                                        )}
                                        
                                        {!isContactOnly && (
                                            <button 
                                                onClick={handleContactOrganizer}
                                                className="w-full bg-transparent border-2 border-orange-500 text-orange-400 py-3 px-4 rounded-lg font-medium hover:bg-orange-500/10 transition-colors cursor-pointer"
                                            >
                                                Contact Organizer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;