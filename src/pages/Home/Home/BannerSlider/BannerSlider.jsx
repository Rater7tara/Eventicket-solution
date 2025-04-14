import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import banner1 from "../../../../assets/banner/banner1.png";
import banner2 from "/src/assets/banner/banner2.png";
import banner3 from "/src/assets/banner/banner3.png";

const slides = [
    {
        image: banner1,
        title: 'Unforgettable Music Nights',
        subtitle: 'Book your spot for the most electrifying shows in town!',
    },
    {
        image: banner2,
        title: 'Watch the Latest Films',
        subtitle: 'Experience cinema like never before – Dolby Atmos, 4K & more.',
    },
    {
        image: banner3,
        title: 'All Events in One Place',
        subtitle: 'From concerts to movies, we bring them all to you.',
    },
];

const BannerSlider = () => {
    const settings = {
        dots: true,
        infinite: true,
        autoplay: true,
        speed: 1000,
        autoplaySpeed: 4000,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
    };

    return (
        <div className="w-full">
            <Slider {...settings}>
                {slides.map((slide, index) => (
                    <div key={index} className="relative h-[65vh] md:h-[80vh] w-full">
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                        />
                        {/* <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-center text-white px-4">
                            <h2 className="text-3xl md:text-5xl font-bold mb-2">{slide.title}</h2>
                            <p className="text-md md:text-xl text-orange-300">{slide.subtitle}</p>
                        </div> */}
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default BannerSlider;
