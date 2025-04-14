import React, { useEffect, useState } from 'react';
import EventCard from './EventCard';
import eventData from '../../../../../public/data.json'; // adjust path as needed

const EventList = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        setEvents(eventData);
    }, []);

    return (
        <div className="px-4 py-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
};

export default EventList;