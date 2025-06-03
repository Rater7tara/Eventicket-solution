import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../providers/AuthProvider";
import serverURL from "../../../../ServerConfig";

// Base URL for API calls
const API_BASE_URL = serverURL.url;

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

  // Get auth context
  const { user, loading, createUser, signIn } = useContext(AuthContext);

  // Function to convert time to 12-hour format
  const formatTo12Hour = (timeString) => {
    if (!timeString) return timeString;
    
    // Check if the time string contains date information
    const dateTimeRegex = /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})/;
    const timeOnlyRegex = /^(\d{1,2}):(\d{2})$/;
    
    let hours, minutes, datePort = '';
    
    if (dateTimeRegex.test(timeString)) {
      const match = timeString.match(dateTimeRegex);
      datePort = match[1] + ' ';
      hours = parseInt(match[2]);
      minutes = match[3];
    } else if (timeOnlyRegex.test(timeString)) {
      const match = timeString.match(timeOnlyRegex);
      hours = parseInt(match[1]);
      minutes = match[2];
    } else {
      // If format doesn't match expected patterns, return as is
      return timeString;
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${datePort}${displayHours}:${minutes} ${period}`;
  };

  // Check if we have the event data, if not redirect back to events
  useEffect(() => {
    if (!eventData) {
      navigate("/");
    }
  }, [eventData, navigate]);

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in:", user);
      // If we have seat data, go to checkout, otherwise go to seat selection
      if (selectedSeats && selectedSeats.length > 0) {
        navigate("/checkout", {
          state: {
            event: eventData,
            selectedSeats,
            totalPrice,
            serviceFee,
            grandTotal,
          },
        });
      } else {
        // MODIFIED: Changed from "/SeatBook" to "/SeatPlan" to match your component
        navigate("/SeatPlan", {
          state: {
            event: eventData,
            quantity: ticketQuantity,
            ticketType: singleTicketType,
          },
        });
      }
    }
  }, [user, navigate]);

  // Get existing user data from localStorage if available
  const savedUserData = JSON.parse(localStorage.getItem("userData") || "{}");

  // Form state
  const [formData, setFormData] = useState({
    name: savedUserData.name || "",
    email: savedUserData.email || "",
    password: savedUserData.password || "",
    phone: savedUserData.phone || "",
    address: savedUserData.address || "",
    city: savedUserData.city || "",
    postalCode: savedUserData.postalCode || "",
    role: "buyer", // Hard-code the role to 'buyer'
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
      role: "buyer", // Always keep role as 'buyer'
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\- ]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid";
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to check if user exists and authenticate
  const authenticateUser = async () => {
    try {
      // Try to sign in first
      console.log("Attempting to login with email:", formData.email);
      const userData = await signIn(formData.email, formData.password);
      console.log("Login successful:", userData);

      // Store the complete user data
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...formData,
          ...userData,
        })
      );

      return { success: true, data: userData, isNewUser: false };
    } catch (loginError) {
      console.log("Login failed, trying to register:", loginError.message);

      // If login fails, try to register
      try {
        console.log(
          "Registering new user with:",
          formData.name,
          formData.email
        );
        const userData = await createUser(
          formData.name,
          formData.email,
          formData.phone,
          formData.password
        );
        console.log("Registration successful:", userData);

        // Store the complete user data
        localStorage.setItem(
          "userData",
          JSON.stringify({
            ...formData,
            ...userData,
          })
        );

        return { success: true, data: userData, isNewUser: true };
      } catch (registerError) {
        console.error("Registration failed:", registerError.message);
        throw new Error(
          registerError.message || "Failed to register. Please try again."
        );
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitError("");

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        // Always ensure role is 'buyer' before proceeding
        const finalData = {
          ...formData,
          role: "buyer", // Force role to be 'buyer'
        };

        // Attempt authentication
        const authResult = await authenticateUser();
        console.log("Authentication result:", authResult);

        // Store additional data in localStorage that might not be in the auth response
        localStorage.setItem(
          "userData",
          JSON.stringify({
            ...finalData,
            ...authResult.data,
          })
        );

        // Determine where to navigate next based on whether we came from SeatPlan or EventDetails
        if (selectedSeats && selectedSeats.length > 0) {
          // If we have seat data, we came from SeatPlan, go to checkout
          navigate("/checkout", {
            state: {
              event: eventData,
              selectedSeats,
              totalPrice,
              serviceFee,
              grandTotal,
              userData: finalData, // Pass data with role: 'buyer'
            },
          });
        } else {
          // MODIFIED: Changed from "/SeatBook" to "/SeatPlan" to match your component name
          navigate("/SeatPlan", {
            state: {
              event: eventData,
              quantity: ticketQuantity,
              ticketType: singleTicketType,
              userData: finalData, // Pass data with role: 'buyer'
            },
          });
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setFormSubmitError(
          `Authentication failed: ${
            error.message || "Please check your credentials and try again."
          }`
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

// Replace the getSummaryContent function with this simplified version:

const getSummaryContent = () => {
  if (selectedSeats && selectedSeats.length > 0) {
    // We came from SeatPlan - keep full details
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Event:</span>
          <span className="font-medium text-white">{eventData.title}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Date & Time:</span>
          <span className="font-medium text-white">{formatTo12Hour(eventData.time)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Location:</span>
          <span className="font-medium text-white">{eventData.location}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Selected Seats:</span>
          <span className="font-medium text-white">
            {selectedSeats.length}
          </span>
        </div>
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Subtotal:</span>
            <span className="font-medium text-white">${totalPrice}</span>
          </div>
          {/* <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Service Fee:</span>
            <span className="font-medium text-white">{serviceFee} BDT</span>
          </div> */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-700">
            <span className="text-lg text-gray-300">Total:</span>
            <span className="text-lg font-bold text-orange-500">
              ${grandTotal}
            </span>
          </div>
        </div>
      </div>
    );
  } else {
    // We came from EventDetails - REMOVED ticket type, quantity, and total
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Event:</span>
          <span className="font-medium text-white">{eventData.title}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Date & Time:</span>
          <span className="font-medium text-white">{formatTo12Hour(eventData.time)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Location:</span>
          <span className="font-medium text-white">{eventData.location}</span>
        </div>
        {/* Removed Ticket Type, Quantity, and Total sections */}
      </div>
    );
  }
};

  // If user is already logged in or page is loading, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-orange-500 text-center">
          <svg
            className="animate-spin h-10 w-10 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Complete Your Booking
          </h1>
          <p className="mt-2 text-gray-300">
            Please provide your details to complete the booking for "
            {eventData.title}"
          </p>
          <p className="mt-1 text-sm text-orange-400">
            You're registering as a buyer
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
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Full Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-700 border ${
                    errors.name ? "border-red-500" : "border-gray-600"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-700 border ${
                    errors.email ? "border-red-500" : "border-gray-600"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Password*
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.password ? "border-red-500" : "border-gray-600"
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                          clipRule="evenodd"
                        />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Phone Number*
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-700 border ${
                    errors.phone ? "border-red-500" : "border-gray-600"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="+880 1XX XXX XXXX"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Address*
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-700 border ${
                    errors.address ? "border-red-500" : "border-gray-600"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="123 Main St, Apartment 4"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  City*
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-700 border ${
                    errors.city ? "border-red-500" : "border-gray-600"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="Dhaka"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              {/* Postal Code */}
              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
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

              {/* Role - Hidden field, explicitly set to 'buyer' */}
              <input type="hidden" name="role" value="buyer" />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-bold shadow-md cursor-pointer ${
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:shadow-lg transform transition-all duration-300 hover:translate-y-0 hover:scale-[1.02]"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : selectedSeats && selectedSeats.length > 0 ? (
                  "Continue to Checkout"
                ) : (
                  "Continue to Seat Selection"
                )}
              </button>
            </div>

            {/* Back button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-orange-400 hover:text-orange-300 text-sm cursor-pointer"
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