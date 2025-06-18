import React, { useState, useContext, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, Upload, FileText, CalendarIcon, Phone, Mail } from 'lucide-react';
import { AuthContext } from '../../../../providers/AuthProvider';
import serverURL from "../../../../ServerConfig";

const AddEvent = () => {
    const { user } = useContext(AuthContext);
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        image: '',
        price: '',
        priceRange: '',
        contactNumber: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    
    // Image handling states
    const [uploadedImage, setUploadedImage] = useState(null);
    
    // Calendar state variables
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    

    
    // Get auth token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem('auth-token');
    };

    // Handle outside click to close pickers
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.date-picker-container') && !e.target.closest('.date-input-container')) {
                setShowDatePicker(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    // Image handling functions
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create a preview URL
            const imageUrl = URL.createObjectURL(file);
            setUploadedImage(file);
            setEventData({ ...eventData, image: imageUrl });
        }
    };

    // Calendar functions
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDateSelect = (day) => {
        // Create date using local time to avoid timezone issues
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const selectedDate = new Date(year, month, day);
        
        // Format date as YYYY-MM-DD using local date components
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        setSelectedDate(selectedDate);
        setEventData({ ...eventData, date: formattedDate });
        setShowDatePicker(false);
    };

    const handleTimeChange = (e) => {
        const value = e.target.value;
        setEventData({ ...eventData, time: value });
    };

    // Form handling functions
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData({
            ...eventData,
            [name]: name === 'price' ? (value === '' ? '' : parseInt(value) || '') : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Reset messages
        setSuccessMessage('');
        setErrorMessage('');
        
        // Validate form
        if (!eventData.title || !eventData.description || !eventData.date || !eventData.time || 
            !eventData.location || !eventData.price || !eventData.priceRange || 
            !eventData.contactNumber || !eventData.email) {
            setErrorMessage('Please fill in all required fields');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(eventData.email)) {
            setErrorMessage('Please enter a valid email address');
            return;
        }
        
        // Check if image is required and uploaded
        if (!uploadedImage) {
            setErrorMessage('Please upload an event image');
            return;
        }
        
        try {
            setLoading(true);
            
            // Get auth token
            const token = getAuthToken();
            
            if (!token) {
                throw new Error('Authentication required. Please log in.');
            }
            
            // Create FormData for file upload
            const formData = new FormData();
            
            // Append all form fields
            formData.append('title', eventData.title);
            formData.append('description', eventData.description);
            formData.append('date', eventData.date);
            formData.append('time', eventData.time);
            formData.append('location', eventData.location);
            formData.append('price', parseInt(eventData.price));
            formData.append('priceRange', eventData.priceRange);
            formData.append('contactNumber', eventData.contactNumber);
            formData.append('email', eventData.email);
            formData.append('createdBy', user?.email || 'unknown_user');
            
            // Append the image file
            if (uploadedImage) {
                formData.append('image', uploadedImage);
            }
            
            // Send to API with authentication (Note: removed Content-Type header for FormData)
            const response = await fetch(`${serverURL.url}event/create-event`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type - let the browser set it for FormData
                },
                body: formData // Send FormData instead of JSON
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Error: ${response.status} - ${errorData.message || response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Event created:', result);
            
            setSuccessMessage('Event added successfully!');
            
            // Reset form
            setEventData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                image: '',
                price: '',
                priceRange: '',
                contactNumber: '',
                email: ''
            });
            setSelectedDate(null);
            setUploadedImage(null);
        } catch (error) {
            console.error('Error creating event:', error);
            setErrorMessage(error.message || 'Failed to save event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Calendar rendering
    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);
        
        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isSelected = selectedDate && 
                date.getDate() === selectedDate.getDate() && 
                date.getMonth() === selectedDate.getMonth() && 
                date.getFullYear() === selectedDate.getFullYear();
            
            const isToday = new Date().toDateString() === date.toDateString();
            
            days.push(
                <div 
                    key={`day-${day}`} 
                    onClick={() => handleDateSelect(day)}
                    className={`w-10 h-10 flex items-center justify-center cursor-pointer rounded-full text-sm font-medium
                    ${isSelected ? 'bg-orange-500 text-white' : ''}
                    ${!isSelected && isToday ? 'bg-orange-100 text-orange-800' : ''}
                    ${!isSelected && !isToday ? 'hover:bg-gray-100 text-gray-700' : ''}
                    `}
                >
                    {day}
                </div>
            );
        }
        
        return days;
    };

    // Format date for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        // Parse the date string directly to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    // Format time for display
    const formatTimeForDisplay = (timeString) => {
        if (!timeString) return '';
        
        // Parse time from HH:MM format
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        
        // Convert to 12-hour format
        let period = 'AM';
        let hours12 = hours;
        
        if (hours >= 12) {
            period = 'PM';
            hours12 = hours === 12 ? 12 : hours - 12;
        }
        
        if (hours12 === 0) {
            hours12 = 12;
        }
        
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Add New Event</h2>
                <div className="w-20 h-1 bg-orange-500 mt-2 rounded-full"></div>
                <p className="text-gray-600 mt-3">Create a new event for your audience</p>
            </div>
            
            {/* Success/Error messages */}
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
                    <div className="flex items-center">
                        <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p>{successMessage}</p>
                    </div>
                </div>
            )}
            
            {errorMessage && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                    <div className="flex items-center">
                        <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p>{errorMessage}</p>
                    </div>
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
                    {/* Date with Calendar Picker */}
                    <div className="space-y-2 relative">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <Calendar size={18} className="text-orange-500" />
                            Event Date *
                        </label>
                        
                        <div className="relative date-input-container">
                            <input
                                type="text"
                                name="date"
                                value={formatDateForDisplay(eventData.date)}
                                readOnly
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                placeholder="Select date"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                required
                            />
                            <CalendarIcon 
                                size={20} 
                                className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" 
                            />
                        </div>
                        
                        {/* Calendar Popover */}
                        {showDatePicker && (
                            <div className="absolute z-10 mt-1 date-picker-container">
                                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                                    {/* Calendar Header */}
                                    <div className="flex justify-between items-center mb-4">
                                        <button 
                                            type="button"
                                            onClick={goToPreviousMonth}
                                            className="p-1 rounded-full hover:bg-gray-100"
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        
                                        <div className="text-gray-800 font-medium">
                                            {currentMonth.toLocaleDateString('en-US', {
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        
                                        <button 
                                            type="button"
                                            onClick={goToNextMonth}
                                            className="p-1 rounded-full hover:bg-gray-100"
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    {/* Day Labels */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                            <div key={day} className="w-10 h-6 flex items-center justify-center text-xs font-medium text-gray-500">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Time with Clock Picker */}
                    <div className="space-y-2 relative">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <Clock size={18} className="text-orange-500" />
                            Event Time *
                        </label>
                        
                        <div className="relative time-input-container">
                            <input
                                type="time"
                                name="time"
                                value={eventData.time}
                                onChange={handleTimeChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
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
                        <Upload size={18} className="text-orange-500" />
                        Event Image *
                    </label>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            {uploadedImage ? (
                                <div className="space-y-2">
                                    <div className="text-green-600 font-medium">
                                        ✓ {uploadedImage.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Click to change image
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload size={32} className="mx-auto text-gray-400" />
                                    <div className="text-gray-600">
                                        Click to upload an image
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        PNG, JPG, GIF up to 10MB
                                    </div>
                                </div>
                            )}
                        </label>
                    </div>
                    
                    {/* Image Preview */}
                    {eventData.image && (
                        <div className="mt-2">
                            <img
                                src={eventData.image}
                                alt="Event preview"
                                className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                            />
                        </div>
                    )}
                </div>
                
                {/* Price and Price Range - 2 column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Price */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <DollarSign size={18} className="text-orange-500" />
                            Price *
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={eventData.price}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="500"
                            min="0"
                            required
                        />
                    </div>
                    
                    {/* Price Range */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <DollarSign size={18} className="text-orange-500" />
                            Price Range *
                        </label>
                        <input
                            type="text"
                            name="priceRange"
                            value={eventData.priceRange}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., $100 - $500"
                            required
                        />
                    </div>
                </div>
                
                {/* Contact Information - 2 column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Number */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <Phone size={18} className="text-orange-500" />
                            Contact Number *
                        </label>
                        <input
                            type="tel"
                            name="contactNumber"
                            value={eventData.contactNumber}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="+1 (555) 123-4567"
                            required
                        />
                    </div>
                    
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-700 font-medium">
                            <Mail size={18} className="text-orange-500" />
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={eventData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="contact@example.com"
                            required
                        />
                    </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`${
                            loading ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
                        } text-white font-medium px-8 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Create Event'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEvent;