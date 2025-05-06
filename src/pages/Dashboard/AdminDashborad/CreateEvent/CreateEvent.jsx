import React, { useState, useContext, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, TicketIcon, ImageIcon, FileText } from 'lucide-react';
import { AuthContext } from '../../../../providers/AuthProvider';
import serverURL from '../../../../ServerConfig';

const CreateEvent = () => {
    const { user } = useContext(AuthContext);
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        image: '',
        price: '',
        ticketsAvailable: 0
    });
    const [existingEvents, setExistingEvents] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Time options for dropdown (12-hour format with AM/PM)
    const timeOptions = [];
    for (let hour = 1; hour <= 12; hour++) {
        timeOptions.push(`${hour}:00 AM`);
        timeOptions.push(`${hour}:30 AM`);
    }
    for (let hour = 1; hour <= 12; hour++) {
        timeOptions.push(`${hour}:00 PM`);
        timeOptions.push(`${hour}:30 PM`);
    }

    // Load existing events from server when component mounts
    useEffect(() => {
        // You can add code here to fetch existing events from the server if needed
        const storedEvents = localStorage.getItem('events');
        if (storedEvents) {
            setExistingEvents(JSON.parse(storedEvents));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData({
            ...eventData,
            [name]: name === 'ticketsAvailable' ? parseInt(value) || 0 : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Reset messages
        setSuccessMessage('');
        setErrorMessage('');
        
        // Validate form
        if (!eventData.title || !eventData.description || !eventData.date || !eventData.time || 
            !eventData.location || !eventData.price || !eventData.ticketsAvailable) {
            setErrorMessage('Please fill in all required fields');
            return;
        }
        
        try {
            setIsLoading(true);
            
            // Prepare event data for API
            const formattedPrice = eventData.price.startsWith('$') ? eventData.price.substring(1) : eventData.price;
            
            const newEvent = {
                title: eventData.title,
                description: eventData.description,
                time: eventData.time,  // Already in the correct format (e.g., "7:00 AM")
                location: eventData.location,
                image: eventData.image,
                price: formattedPrice,
                ticketsAvailable: eventData.ticketsAvailable,
                createdBy: user?.email || 'unknown_user',
                // The date is handled separately in the form but not sent to API based on your data structure
            };
            
            // Send data to server using fetch API
            const response = await fetch(`${serverURL.url}ticket/create-ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                    ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
                },
                body: JSON.stringify(newEvent)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create event');
            }
            
            // Update local state with the returned event from server
            const createdEvent = data.event || {
                ...newEvent,
                id: Date.now() // Fallback ID if server doesn't return one
            };
            
            // Add to existing events
            const updatedEvents = [...existingEvents, createdEvent];
            setExistingEvents(updatedEvents);
            
            // Show success message
            setSuccessMessage('Event created successfully!');
            
            // Reset form
            setEventData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                image: '',
                price: '',
                ticketsAvailable: 0
            });
        } catch (error) {
            console.error('Error creating event:', error);
            setErrorMessage(error.message || 'Failed to create event. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get today's date in YYYY-MM-DD format for min attribute of date input
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Event</h2>
            
            {/* Success/Error messages */}
            {successMessage && (
                <div className="bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}
            
            {errorMessage && (
                <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4">
                    {errorMessage}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Title */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                        <FileText size={18} className="text-orange-500" />
                        Event Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={eventData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter event title"
                        required
                    />
                </div>
                
                {/* Event Description */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                        <FileText size={18} className="text-orange-500" />
                        Event Description *
                    </label>
                    <textarea
                        name="description"
                        value={eventData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-32"
                        placeholder="Describe your event"
                        required
                    ></textarea>
                </div>
                
                {/* Event Date and Time - 2 column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Date */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <Calendar size={18} className="text-orange-500" />
                            Event Date *
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={eventData.date}
                            onChange={handleChange}
                            min={today}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        />
                    </div>
                    
                    {/* Event Time */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <Clock size={18} className="text-orange-500" />
                            Event Time *
                        </label>
                        <select
                            name="time"
                            value={eventData.time}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        >
                            <option value="">Select a time</option>
                            {timeOptions.map((time, index) => (
                                <option key={index} value={time}>
                                    {time}
                                </option>
                            ))}
                        </select>
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
                        value={eventData.location}
                        onChange={handleChange}
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
                        value={eventData.image}
                        onChange={handleChange}
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
                            type="text"
                            name="price"
                            value={eventData.price}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="300"
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
                            value={eventData.ticketsAvailable}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="200"
                            min="1"
                            required
                        />
                    </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Add Event'}
                    </button>
                </div>
            </form>
            
            {/* Events Count */}
            <div className="mt-8 text-gray-600">
                <p>Total events: {existingEvents.length}</p>
            </div>
        </div>
    );
};

export default CreateEvent;