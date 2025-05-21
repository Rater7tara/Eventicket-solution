import React, { useEffect, useState } from "react";
import EventCard from "./EventCard";
import serverURL from "../../../../ServerConfig"; // adjust path as needed

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${serverURL.url}event/events`);

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
          const extractedEvents =
            data && typeof data === "object"
              ? data.tickets ||
                data.events ||
                Object.values(data).find((arr) => Array.isArray(arr))
              : [];

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

  // Attractive header component
  const EventsHeader = () => (
    <div className="relative py-12 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1200/400')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500"></div>
      <div className="absolute -left-10 top-10 w-40 h-40 rounded-full bg-orange-500 opacity-10 blur-3xl"></div>
      <div className="absolute -right-10 bottom-0 w-40 h-40 rounded-full bg-yellow-400 opacity-10 blur-3xl"></div>
      
      <div className="relative container mx-auto px-6 text-center z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-500">
          Upcoming Events
        </h1>
        <div className="w-24 h-1 bg-orange-500 mx-auto my-4 rounded-full"></div>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Discover and book your tickets for the most exciting events happening near you
        </p>
      </div>
      
      {/* Bottom wave effect */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-0">
        <svg className="relative block w-full h-6" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-gray-900"></path>
        </svg>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <EventsHeader />
        <div className="flex justify-center items-center min-h-[400px] bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <EventsHeader />
        <div className="flex justify-center items-center min-h-[400px] bg-gray-900 text-white">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
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
      </>
    );
  }

  // Double check that events is an array before trying to map over it
  if (!Array.isArray(events)) {
    console.error("events is not an array:", events);
    return (
      <>
        <EventsHeader />
        <div className="flex justify-center items-center min-h-[400px] bg-gray-900 text-white">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-4 text-lg">
              Invalid data format received from server
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  if (events.length === 0) {
    return (
      <>
        <EventsHeader />
        <div className="flex justify-center items-center min-h-[400px] bg-gray-900 text-white">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-4 text-lg">No events available at the moment.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <EventsHeader />
      <div className="bg-gray-900">
        <div className="mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default EventList;