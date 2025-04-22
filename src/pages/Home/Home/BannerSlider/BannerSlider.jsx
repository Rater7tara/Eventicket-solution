import React, { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import banner1 from "../../../../assets/banner/banner5.jpg";
import banner2 from "/src/assets/banner/banner2.jpg";
import banner3 from "/src/assets/banner/banner6.jpg";
import banner4 from "/src/assets/banner/banner7.jpg";


const slides = [
    {
        image: banner1,
        title: 'Unforgettable Music Nights',
        subtitle: 'Book your spot for the most electrifying shows in town!',
        category: 'CONCERTS',
        action: 'Book Now'
    },
    {
        image: banner2,
        title: 'Watch the Latest Films',
        subtitle: 'Experience cinema like never before – Dolby Atmos, 4K & more.',
        category: 'MOVIES',
        action: 'Get Tickets'
    },
    {
        image: banner3,
        title: 'All Events in One Place',
        subtitle: 'From concerts to movies, we bring them all to you.',
        category: 'EVENTS',
        action: 'Explore'
    },
    {
        image: banner4,
        title: 'Watch the Latest Films',
        subtitle: 'Experience cinema like never before – Dolby Atmos, 4K & more.',
        category: 'MOVIES',
        action: 'Get Tickets'
    },
];

const BannerSlider = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    
    // Custom arrow components
    const NextArrow = (props) => {
        const { onClick } = props;
        return (
            <button 
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-110"
                onClick={onClick}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        );
    };
    
    const PrevArrow = (props) => {
        const { onClick } = props;
        return (
            <button 
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-110"
                onClick={onClick}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>
        );
    };

    const settings = {
        dots: true,
        dotsClass: "slick-dots custom-dots",
        infinite: true,
        autoplay: true,
        speed: 1000,
        autoplaySpeed: 5000,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        beforeChange: (current, next) => setActiveSlide(next),
        fade: true,
        appendDots: dots => (
            <div className="absolute bottom-8 w-full">
                <ul className="flex justify-center items-center gap-2"> {dots} </ul>
            </div>
        ),
        customPaging: i => (
            <button className={`w-3 h-3 rounded-full transition-all duration-300 ${i === activeSlide ? 'bg-orange-500 w-8' : 'bg-white/50'}`} />
        ),
    };

    return (
        <div className="w-full relative overflow-hidden">
            {/* Logo overlay */}
            {/* <div className="absolute top-8 left-8 z-10">
                <div className="flex items-center">
                    <div className="bg-orange-500 text-white text-lg md:text-2xl font-bold py-2 px-4 rounded-l-lg shadow-lg">
                        EVENT
                    </div>
                    
                    <div className="bg-white text-orange-600 text-lg md:text-2xl font-bold py-2 px-4 rounded-r-lg shadow-lg">
                        n TICKETS
                    </div>
                </div>
            </div> */}
            
            <Slider {...settings} className="banner-slider">
                {slides.map((slide, index) => (
                    <div key={index} className="relative h-[70vh] md:h-[85vh] w-full">
                        {/* Image with gradient overlay */}
                        <div className="absolute inset-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10"></div>
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        
                        {/* Content positioned to the side */}
                        <div className="absolute inset-0 z-20 flex flex-col justify-center max-w-5xl mx-auto px-8 md:px-12">
                            <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
                                <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-sm mb-4 font-medium tracking-wider">
                                    {slide.category}
                                </span>
                                
                                <h2 className="text-4xl md:text-6xl font-bold mb-4 text-white leading-tight">
                                    {slide.title}
                                </h2>
                                
                                <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-6">
                                    {slide.subtitle}
                                </p>
                                
                                <div className="flex space-x-4">
                                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                                        {slide.action}
                                    </button>
                                    <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium text-lg transition-all duration-300">
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute bottom-0 right-0 bg-orange-500/20 backdrop-blur-sm w-64 h-64 rounded-full -mr-32 -mb-32 z-0"></div>
                        <div className="absolute top-1/4 left-1/3 bg-orange-500/10 backdrop-blur-sm w-32 h-32 rounded-full z-0"></div>
                    </div>
                ))}
            </Slider>
            
            {/* Add this CSS to your global styles or component */}
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 1s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Fix for Slick Slider dots positioning */
                .banner-slider .slick-dots {
                    bottom: 30px;
                }
                
                .banner-slider .slick-dots li button:before {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default BannerSlider;