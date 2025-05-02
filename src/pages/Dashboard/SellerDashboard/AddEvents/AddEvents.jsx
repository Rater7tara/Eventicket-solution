import React, { useState, useContext, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, TicketIcon, ImageIcon, FileText } from 'lucide-react';
import { AuthContext } from '../../../../providers/AuthProvider'; // Adjust path as needed

const AddEvent = () => {
    const { user } = useContext(AuthContext);
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        time: '',
        location: '',
        image: '',
        price: '',
        ticketsAvailable: 0
    });
    const [existingEvents, setExistingEvents] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Load existing events from localStorage when component mounts
    useEffect(() => {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Reset messages
        setSuccessMessage('');
        setErrorMessage('');
        
        // Validate form
        if (!eventData.title || !eventData.description || !eventData.time || 
            !eventData.location || !eventData.price || !eventData.ticketsAvailable) {
            setErrorMessage('Please fill in all required fields');
            return;
        }
        
        try {
            // Create new event with unique ID
            const newEvent = {
                ...eventData,
                id: Date.now(), // Use timestamp as unique ID
                price: eventData.price.startsWith('$') ? eventData.price : `$${eventData.price}`,
                createdBy: user?.email || 'unknown_user'
            };
            
            // Add to existing events
            const updatedEvents = [...existingEvents, newEvent];
            
            // Save to localStorage
            localStorage.setItem('events', JSON.stringify(updatedEvents));
            
            // Update state
            setExistingEvents(updatedEvents);
            setSuccessMessage('Event added successfully!');
            
            // Reset form
            setEventData({
                title: '',
                description: '',
                time: '',
                location: '',
                image: '',
                price: '',
                ticketsAvailable: 0
            });
        } catch (error) {
            console.error('Error saving event:', error);
            setErrorMessage('Failed to save event. Please try again.');
        }
    };

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
                
                {/* Event Time */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                        <Clock size={18} className="text-orange-500" />
                        Event Time *
                    </label>
                    <input
                        type="text"
                        name="time"
                        value={eventData.time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., May 24, 2025 | 9:00 PM"
                        required
                    />
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
                        placeholder="../src/assets/cards/img11.jpg"
                    />
                </div>
                
                {/* Price and Tickets - 2 column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Price */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <DollarSign size={18} className="text-orange-500" />
                            Price *
                        </label>
                        <input
                            type="text"
                            name="price"
                            value={eventData.price}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="$45"
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
                            placeholder="100"
                            min="0"
                            required
                        />
                    </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Add Event
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

export default AddEvent;