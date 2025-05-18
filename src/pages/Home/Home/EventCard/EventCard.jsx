import React from "react";
import { useNavigate } from "react-router-dom";

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/events/${String(event._id)}`, { state: { event } });
  };

  // Modify the button click handler to redirect to event details
  const handleGetTickets = (e) => {
    e.stopPropagation(); // Prevent the parent div's onClick from firing
    navigate(`/events/${String(event._id)}`, { state: { event } });
    console.log(
      "Navigating to event with ID:",
      event._id,
      "and full event:",
      event
    );
  };

  return (
    <div onClick={handleClick} className="w-80 h-full">
      {" "}
      {/* Added h-full for consistent height */}
      {/* Main card container with 3D-like effect */}
      <div className="group relative cursor-pointer transition-all duration-500 hover:rotate-1 transform perspective-1000">
        {/* Background gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 rounded-xl shadow-2xl opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

        {/* Main content */}
        <div className="relative p-2 rounded-xl overflow-hidden">
          <div className="bg-white rounded-lg overflow-hidden">
            {/* Image section with ticket count overlay */}
            <div className="relative">
              <div className="h-52 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
              </div>

              {/* Ticket count badge */}
              {/* <div className="absolute top-3 left-3">
                                <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                                    event.ticketsAvailable <= 0 
                                    ? 'bg-red-500 text-white' 
                                    : event.ticketsAvailable < 10 
                                    ? 'bg-amber-400 text-black' 
                                    : 'bg-green-500 text-white'
                                } shadow-md`}>
                                    {event.ticketsAvailable <= 0 
                                        ? 'SOLD OUT' 
                                        : `${event.ticketsAvailable} TICKETS`}
                                </div>
                            </div> */}

              {/* Date/Time badge */}
              <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-md text-xs font-semibold text-gray-800">
                {event.time}
              </div>

              {/* Price tag */}
              {/* <div className="absolute -top-2 -right-2 transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold px-6 py-2 rounded shadow-lg">
                                    {event.price ? `${event.price} BDT` : 'FREE'}
                                </div>
                            </div> */}
            </div>

            {/* Content section */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300 truncate">
                {event.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-9">
                {event.description}
              </p>

              {/* Location */}
              <div className="flex items-center text-sm text-gray-700 mb-4">
                <svg
                  className="w-4 h-4 text-orange-500 flex-shrink-0 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                <span className="truncate">{event.location}</span>
              </div>

              {/* Show appropriate button based on ticket availability */}
              <button
                onClick={handleGetTickets}
                disabled={event.ticketsAvailable <= 0}
                className={`w-full py-2.5 px-4 rounded-lg font-medium shadow-md hover:shadow-xl transform cursor-pointer group-hover:translate-y-0 translate-y-0 transition-all duration-300 ${
                  event.ticketsAvailable <= 0
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-red-600 text-white group-hover:scale-105"
                }`}
              >
                {event.ticketsAvailable <= 0 ? "Sold Out" : "Get Tickets"}
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-orange-300 rounded-full opacity-50 blur-lg"></div>
        <div className="absolute -top-2 -left-2 w-20 h-20 bg-yellow-400 rounded-full opacity-50 blur-lg"></div>
      </div>
    </div>
  );
};

export default EventCard;
