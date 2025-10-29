import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import axios from 'axios';
import serverURL from "../../../../ServerConfig";

// Fallback static banners (optional - remove if not needed)
const fallbackBanners = [
    {
        _id: 'fallback-1',
        imageUrl: '/src/assets/banner/banner5.jpg',
        size: '1200x600'
    },
    {
        _id: 'fallback-2',
        imageUrl: '/src/assets/banner/banner2.jpg',
        size: '1200x600'
    },
    {
        _id: 'fallback-3',
        imageUrl: '/src/assets/banner/banner6.jpg',
        size: '1200x600'
    },
    {
        _id: 'fallback-4',
        imageUrl: '/src/assets/banner/banner7.jpg',
        size: '1200x600'
    }
];

// Define the animation styles
const fadeInAnimation = {
    animation: 'fadeIn 1s ease-in-out'
};

const BannerSlider = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    // Get auth token (if available)
    const getAuthToken = () => {
        return localStorage.getItem("auth-token");
    };

    // Get auth headers (if token exists)
    const getAuthHeaders = () => {
        const token = getAuthToken();
        if (token) {
            return {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            };
        }
        return {}; // No headers if no token
    };

    // Fetch banners from API
    const fetchBanners = async () => {
        try {
            setLoading(true);
            
            // Try with auth headers first (if user is logged in)
            const authHeaders = getAuthHeaders();
            const response = await axios.get(`${serverURL.url}banner/banners`, authHeaders);
            
            if (response.data.success && response.data.banners) {
                setBanners(response.data.banners);
            } else {
                setError('Failed to load banners');
            }
        } catch (err) {
            console.error('Error fetching banners:', err);
            
            // If 401 error and no auth token, try without authentication
            if (err.response?.status === 401 && !getAuthToken()) {
                try {
                    // Try public endpoint (without auth headers)
                    const publicResponse = await axios.get(`${serverURL.url}banner/banners`);
                    if (publicResponse.data.success && publicResponse.data.banners) {
                        setBanners(publicResponse.data.banners);
                        return;
                    }
                } catch (publicErr) {
                    console.error('Public banner fetch also failed:', publicErr);
                }
            }
            
            // If API fails completely, use fallback banners
            console.warn('Using fallback banners due to API failure');
            setBanners(fallbackBanners);
            setUsingFallback(true);
            setError(null); // Clear error since we have fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    // Custom arrow components
    const NextArrow = (props) => {
        const { onClick } = props;
        return (
            <button 
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-110 cursor-pointer"
                onClick={onClick}
                disabled={loading || banners.length === 0}
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
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-110 cursor-pointer"
                onClick={onClick}
                disabled={loading || banners.length === 0}
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
        infinite: banners.length > 1,
        autoplay: banners.length > 1,
        speed: 1000,
        autoplaySpeed: 4000,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: banners.length > 1,
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

    // Loading state
    if (loading) {
        return (
            <div className="w-full relative overflow-hidden h-[70vh] md:h-[85vh] bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading banners...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="w-full relative overflow-hidden h-[70vh] md:h-[85vh] bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchBanners}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // No banners state
    if (banners.length === 0) {
        return (
            <div className="w-full relative overflow-hidden h-[70vh] md:h-[85vh] bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">No Banners Available</h2>
                    <p className="text-white/80">Banner images will appear here once uploaded</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative overflow-hidden">
            <Slider {...settings} className="banner-slider">
                {banners.map((banner, index) => (
                    <div key={banner._id} className="relative h-[70vh] md:h-[85vh] w-full">
                        {/* Image with gradient overlay */}
                        <div className="absolute inset-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10"></div>
                            <img
                                src={banner.imageUrl}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback image or placeholder if banner fails to load
                                    e.target.style.display = 'none';
                                    console.error('Failed to load banner image:', banner.imageUrl);
                                }}
                                onLoad={() => {
                                    // Optional: You can add loading success logic here
                                    console.log('Banner loaded successfully:', banner.imageUrl);
                                }}
                            />
                        </div>
                        
                        {/* Content positioned to the side */}
                        <div className="absolute inset-0 z-20 flex flex-col justify-center max-w-5xl mx-auto px-8 md:px-12">
                            <div style={{...fadeInAnimation, animationDelay: '0.3s'}}>
                                {/* You can add banner-specific content here if your API provides it */}
                                {/* For now, keeping it minimal as per your original design */}
                                <div className="flex space-x-4">
                                    {/* Add any action buttons or content here if needed */}
                                </div>
                            </div>
                        </div>
                        
                        {/* Optional: Show fallback indicator for development */}
                        {process.env.NODE_ENV === 'development' && usingFallback && (
                            <div className="absolute top-4 right-4 bg-yellow-500/70 text-white px-2 py-1 rounded text-xs z-30">
                                Fallback Banner
                            </div>
                        )}
                        
                        {/* Optional: Banner size indicator for admin/debugging */}
                        {process.env.NODE_ENV === 'development' && !usingFallback && (
                            <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs z-30">
                                {banner.size || 'Unknown size'}
                            </div>
                        )}
                    </div>
                ))}
            </Slider>
            
            {/* Add global CSS keyframes */}
            <style>
                {`
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

                    /* Hide dots when there's only one banner */
                    .banner-slider.single-banner .slick-dots {
                        display: none !important;
                    }

                    /* Ensure images cover properly */
                    .banner-slider .slick-slide img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                `}
            </style>
        </div>
    );
};

export default BannerSlider;