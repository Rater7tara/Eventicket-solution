import React, { useState, useContext, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, DollarSign, TicketIcon, ImageIcon, FileText, Upload } from 'lucide-react';
import { AuthContext } from '../../../../providers/AuthProvider';
import serverURL from '../../../../ServerConfig';

const CreateEvent = () => {
    const { user } = useContext(AuthContext);
    const fileInputRef = useRef(null);
    
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        price: '',
        ticketsAvailable: 0
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create a preview URL for the selected image
            const fileReader = new FileReader();
            fileReader.onload = () => {
                setPreviewUrl(fileReader.result);
            };
            fileReader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
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

        if (!selectedFile) {
            setErrorMessage('Image file is required');
            return;
        }
        
        try {
            setIsLoading(true);
            
            // Prepare event data for API using FormData for file upload
            const formData = new FormData();
            
            // Add all the event data to FormData
            formData.append('title', eventData.title);
            formData.append('description', eventData.description);
            formData.append('date', eventData.date);
            formData.append('time', eventData.time);
            formData.append('location', eventData.location);
            formData.append('price', eventData.price.startsWith('$') ? eventData.price.substring(1) : eventData.price);
            formData.append('ticketsAvailable', eventData.ticketsAvailable);
            formData.append('createdBy', user?._id || user?.email || 'unknown_user');
            
            // Append the image file
            formData.append('image', selectedFile);
            
            // Get token from localStorage
            const token = localStorage.getItem('auth-token') || localStorage.getItem('access-token');
            
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }
            
            // Send data to server using fetch API with FormData
            const response = await fetch(`${serverURL.url}ticket/create-ticket`, {
                method: 'POST',
                headers: {
                    // Do not set Content-Type header when using FormData
                    // FormData automatically sets the appropriate Content-Type with boundary
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create event');
            }
            
            // Update local state with the returned event from server
            const createdEvent = data.event || {
                ...eventData,
                id: Date.now() // Fallback ID if server doesn't return one
            };
            
            // Add to existing events
            const updatedEvents = [...existingEvents, createdEvent];
            setExistingEvents(updatedEvents);
            
            // Store in localStorage for persistence
            localStorage.setItem('events', JSON.stringify(updatedEvents));
            
            // Show success message
            setSuccessMessage('Event created successfully!');
            
            // Reset form
            setEventData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                price: '',
                ticketsAvailable: 0
            });
            setSelectedFile(null);
            setPreviewUrl('');
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                
                {/* Image Upload */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-700 font-medium">
                        <ImageIcon size={18} className="text-orange-500" />
                        Event Image *
                    </label>
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                        onClick={triggerFileInput}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            ref={fileInputRef}
                            required
                        />
                        
                        {previewUrl ? (
                            <div className="space-y-4 w-full">
                                <img 
                                    src={previewUrl} 
                                    alt="Event preview" 
                                    className="max-h-48 mx-auto rounded-lg shadow-md" 
                                />
                                <p className="text-sm text-center text-gray-600">
                                    {selectedFile?.name} ({Math.round(selectedFile?.size / 1024)} KB)
                                </p>
                                <p className="text-sm text-center text-blue-600">Click to change image</p>
                            </div>
                        ) : (
                            <div className="space-y-2 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer rounded-md bg-white font-medium text-orange-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 hover:text-orange-500">
                                        <span>Upload a file</span>
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                    </div>
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