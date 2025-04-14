import React from 'react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/events/${event.id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 max-w-sm"
        >
            <div className="h-48 w-full overflow-hidden rounded-t-2xl">
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="p-4 space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                <p className="text-gray-500 text-sm">{event.description}</p>
                <div className="flex flex-col justify-between text-sm text-gray-600 pt-2">
                    <span>🕒 {event.time}</span>
                    <span>📍 {event.location}</span>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
