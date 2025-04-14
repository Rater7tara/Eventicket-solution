import React from 'react';
import BannerSlider from './BannerSlider/BannerSlider';
import EventCard from './EventCard/EventCard';
import EventList from './EventCard/EventList';

const Home = () => {
    return (
        <div>
           <BannerSlider></BannerSlider>
           <EventList></EventList>
        </div>
    );
};

export default Home;