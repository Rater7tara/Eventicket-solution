import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import serverURL from "../../../../ServerConfig"; // adjust path as needed

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // We can also try to get the event from navigation state if it was passed
  const eventFromState = location.state?.event;

  const [event, setEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date to show date with year (e.g., "25 May 2024")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time to 12-hour format (e.g., "2:30 PM")
  const formatTime = (timeString) => {
    // If timeString is already in 12-hour format, return as is
    if (timeString && (timeString.includes('AM') || timeString.includes('PM'))) {
      return timeString;
    }
    
    // If it's a time string like "14:30", convert to 12-hour format
    if (timeString && timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }
    
    return timeString;
  };

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
        const response = await fetch(`${serverURL.url}event/events/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched event data:", data);

        // Check if we got an event or an array of events
        const eventData = data.event || data;

        if (eventData) {
          console.log("Event data before preparation:", eventData);
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
    // Make a copy of the data to avoid modifying the original directly
    const preparedData = { ...eventData };

    // Set default ticket types if not provided
    if (!preparedData.ticketTypes || preparedData.ticketTypes.length === 0) {
      preparedData.ticketTypes = [
        {
          id: 1,
          name: "Regular",
          price: preparedData.price || "800",
          contactOnly: false,
        },
        { id: 2, name: "VIP", price: "0", contactOnly: true },
      ];
    }

    // Set default organizer if not provided - using API structure
    if (!preparedData.organizer) {
      preparedData.organizer = {
        name: "Event Organizer",
        phone: preparedData.contactNumber || "+880 1XX XXX XXXX",
        email: preparedData.email || "contact@eventorganizer.com",
      };
    }

    // Set default values for other potential undefined properties
    preparedData.title = preparedData.title || "Event";
    preparedData.image =
      preparedData.image || "https://placehold.co/600x400?text=Event+Image";
    preparedData.description =
      preparedData.description || "No description available.";
    preparedData.time = preparedData.time || "TBD";
    preparedData.date = preparedData.date || new Date().toISOString();
    preparedData.location = preparedData.location || "TBD";
    preparedData.price = preparedData.price || "0";
    preparedData.createdAt = preparedData.createdAt || new Date().toISOString();

    setEvent(preparedData);
    console.log("Prepared event data:", preparedData);
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const handleBookNow = () => {
    // Navigate to user details form page instead of SeatPlan
    navigate("/user-Details", {
      state: {
        event,
        ticketType: event.ticketTypes[selectedTicketType],
      },
    });
  };

  const handleContactOrganizer = () => {
    // Navigate to your contact page or show contact info
    navigate("/contact", {
      state: {
        subject: `Regarding ${event.title}`,
        organizer: event.organizer,
      },
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
        <p className="text-gray-300 mb-4">
          Sorry, we couldn't find the event you're looking for.
        </p>
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

  // Defensive check before rendering
  if (
    event &&
    (!event.ticketTypes ||
      !Array.isArray(event.ticketTypes) ||
      event.ticketTypes.length === 0)
  ) {
    console.error("Event is missing ticket types after preparation:", event);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
        <h2 className="text-2xl font-bold mb-4">Error Loading Event</h2>
        <p className="text-gray-300 mb-4">
          The event data is incomplete. Missing ticket information.
        </p>
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

  const isContactOnly =
    event.ticketTypes[selectedTicketType]?.contactOnly || false;

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
              style={{ minHeight: "300px", maxHeight: "500px" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

            {/* Floating event info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-1 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {event.time ? formatTime(event.time) : 'TBD'}
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-1 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {event.location}
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-1 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {event.date ? formatDate(event.date) : 'TBD'}
                </div>
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
            {/* Event description */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-4">
                Event Details
              </h2>
              <div className="prose max-w-none text-gray-300">
                <p className="mb-4">{event.description}</p>
                <p>
                  {event.longDescription ||
                    "Join us for an unforgettable experience at this exciting event. Don't miss out on the opportunity to be part of something special."}
                </p>
              </div>

              {/* Organizer information */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Event Organizer
                </h3>
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="font-medium text-white">
                    {event.organizer.name}
                  </div>
                  <div className="text-gray-300 mt-2">
                    <div className="flex items-center mb-1">
                      <svg
                        className="w-4 h-4 mr-2 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {event.organizer.phone}
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
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
                    Book your spot now!
                  </p>
                </div>

                <div className="p-4">
                  {/* Ticket types */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Available Seating Sections
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 border border-red-500 bg-gray-700 rounded-lg">
                        <div className="font-medium text-white text-sm">Greenfield VIP Zone</div>
                        <div className="text-xs text-gray-400">$150</div>
                      </div>
                      
                      <div className="p-3 border border-orange-500 bg-gray-700 rounded-lg">
                        <div className="font-medium text-white text-sm">Alfa College Zone</div>
                        <div className="text-xs text-gray-400">$120</div>
                      </div>
                      
                      <div className="p-3 border border-orange-300 bg-gray-700 rounded-lg">
                        <div className="font-medium text-white text-sm">Luminedge Zone</div>
                        <div className="text-xs text-gray-400">$100</div>
                      </div>
                      
                      <div className="p-3 border border-purple-500 bg-gray-700 rounded-lg">
                        <div className="font-medium text-white text-sm">Ample Accounting Zone</div>
                        <div className="text-xs text-gray-400">$80</div>
                      </div>
                      
                      <div className="p-3 border border-blue-500 bg-gray-700 rounded-lg">
                        <div className="font-medium text-white text-sm">BetaWatt Zone</div>
                        <div className="text-xs text-gray-400">$70</div>
                      </div>
                      
                      <div className="p-3 border border-purple-700 bg-gray-700 rounded-lg">
                        <div className="font-medium text-white text-sm">Gamma College Zone</div>
                        <div className="text-xs text-gray-400">$60</div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3">
                    {!isContactOnly ? (
                      <button
                        onClick={handleBookNow}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg transform transition-all duration-300 hover:translate-y-0 hover:scale-105"
                      >
                        Book Now
                      </button>
                    ) : (
                      <button
                        onClick={handleContactOrganizer}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg transform transition-all duration-300 hover:translate-y-0 hover:scale-105"
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