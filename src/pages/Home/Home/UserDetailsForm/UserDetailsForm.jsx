import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const UserDetailsForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Get data from location state
    const eventData = location.state?.event;
    const selectedSeats = location.state?.selectedSeats || [];
    const totalPrice = location.state?.totalPrice || 0;
    const serviceFee = location.state?.serviceFee || 0;
    const grandTotal = location.state?.grandTotal || 0;
    const ticketType = location.state?.ticketType;
    const quantity = location.state?.quantity || 1;
    
    // For direct navigation from EventDetails
    const ticketQuantity = location.state?.quantity || 1;
    const singleTicketType = location.state?.ticketType;

    // Check if we have the event data, if not redirect back to events
    useEffect(() => {
        if (!eventData) {
            navigate('/');
        }
    }, [eventData, navigate]);

    // Get existing user data from localStorage if available
    const savedUserData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Form state
    const [formData, setFormData] = useState({
        name: savedUserData.name || '',
        email: savedUserData.email || '',
        phone: savedUserData.phone || '',
        address: savedUserData.address || '',
        city: savedUserData.city || '',
        postalCode: savedUserData.postalCode || '',
    });

    // Validation state
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSubmitError, setFormSubmitError] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    // Validate the form
    const validateForm = () => {
        const newErrors = {};
        
        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9+\- ]{10,15}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number is invalid';
        }
        
        // Address validation
        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }
        
        // City validation
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitError('');
        
        if (validateForm()) {
            setIsSubmitting(true);
            
            try {
                // Store in localStorage
                localStorage.setItem('userData', JSON.stringify(formData));
                
                // Determine where to navigate next based on whether we came from SeatPlan or EventDetails
                if (selectedSeats && selectedSeats.length > 0) {
                    // If we have seat data, we came from SeatPlan, go to checkout
                    navigate('/checkout', { 
                        state: { 
                            event: eventData,
                            selectedSeats,
                            totalPrice,
                            serviceFee,
                            grandTotal,
                            userData: formData
                        } 
                    });
                } else {
                    // Otherwise, we came from EventDetails, go to SeatPlan
                    navigate('/SeatBook', { 
                        state: { 
                            event: eventData,
                            quantity: ticketQuantity,
                            ticketType: singleTicketType,
                            userData: formData
                        } 
                    });
                }
            } catch (error) {
                console.error('Error saving user data:', error);
                setFormSubmitError('Failed to save your information. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Get summary data based on where we came from
    const getSummaryContent = () => {
        if (selectedSeats && selectedSeats.length > 0) {
            // We came from SeatPlan
            return (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Event:</span>
                        <span className="font-medium text-white">{eventData.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Date & Time:</span>
                        <span className="font-medium text-white">{eventData.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Location:</span>
                        <span className="font-medium text-white">{eventData.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Selected Seats:</span>
                        <span className="font-medium text-white">{selectedSeats.length}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-3 mt-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-300">Subtotal:</span>
                            <span className="font-medium text-white">{totalPrice} BDT</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-300">Service Fee:</span>
                            <span className="font-medium text-white">{serviceFee} BDT</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                            <span className="text-lg text-gray-300">Total:</span>
                            <span className="text-lg font-bold text-orange-500">
                                {grandTotal} BDT
                            </span>
                        </div>
                    </div>
                </div>
            );
        } else {
            // We came from EventDetails
            return (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Event:</span>
                        <span className="font-medium text-white">{eventData.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Date & Time:</span>
                        <span className="font-medium text-white">{eventData.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Location:</span>
                        <span className="font-medium text-white">{eventData.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Ticket Type:</span>
                        <span className="font-medium text-white">{singleTicketType?.name || 'Regular'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Quantity:</span>
                        <span className="font-medium text-white">{ticketQuantity}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                        <span className="text-lg text-gray-300">Total:</span>
                        <span className="text-lg font-bold text-orange-500">
                            {singleTicketType?.price 
                                ? `${(singleTicketType.price * ticketQuantity).toLocaleString()} BDT` 
                                : `${eventData.price || '0'} BDT`}
                        </span>
                    </div>
                </div>
            );
        }
    };

    if (!eventData) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 text-white">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">Complete Your Booking</h1>
                    <p className="mt-2 text-gray-300">
                        Please provide your details to complete the booking for "{eventData.title}"
                    </p>
                </div>
                
                {/* Order Summary */}
                <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
                    {getSummaryContent()}
                </div>
                
                {/* User Details Form */}
                <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 text-white">
                        <h2 className="text-xl font-bold">Your Details</h2>
                        <p className="text-orange-100 text-sm">
                            Please fill in all required fields
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Show form error if any */}
                        {formSubmitError && (
                            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-md">
                                {formSubmitError}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                                    Full Name*
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                                        errors.name ? 'border-red-500' : 'border-gray-600'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                    placeholder="John Doe"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email Address*
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                                        errors.email ? 'border-red-500' : 'border-gray-600'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                    placeholder="john@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                                    Phone Number*
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                                        errors.phone ? 'border-red-500' : 'border-gray-600'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                    placeholder="+880 1XX XXX XXXX"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                                )}
                            </div>
                            
                            {/* Address */}
                            <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                                    Address*
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                                        errors.address ? 'border-red-500' : 'border-gray-600'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                    placeholder="123 Main St, Apartment 4"
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                                )}
                            </div>
                            
                            {/* City */}
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">
                                    City*
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                                        errors.city ? 'border-red-500' : 'border-gray-600'
                                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                    placeholder="Dhaka"
                                />
                                {errors.city && (
                                    <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                                )}
                            </div>
                            
                            {/* Postal Code */}
                            <div>
                                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-1">
                                    Postal Code
                                </label>
                                <input
                                    type="text"
                                    id="postalCode"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="1000"
                                />
                            </div>
                        </div>
                        
                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-bold shadow-md ${
                                    isSubmitting 
                                    ? 'opacity-70 cursor-not-allowed' 
                                    : 'hover:shadow-lg transform transition-all duration-300 hover:translate-y-0 hover:scale-[1.02]'
                                }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    selectedSeats && selectedSeats.length > 0 ? 
                                    'Continue to Checkout' : 
                                    'Continue to Seat Selection'
                                )}
                            </button>
                        </div>
                        
                        {/* Back button */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="text-orange-400 hover:text-orange-300 text-sm"
                            >
                                ← Back
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsForm;