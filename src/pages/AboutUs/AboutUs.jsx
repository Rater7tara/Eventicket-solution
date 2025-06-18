import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Users, 
  Globe, 
  Award, 
  ArrowLeft, 
  Play 
} from 'lucide-react';

const AboutUs = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const pageTopRef = useRef(null);

  // Force scroll to top when page loads/reloads
  useEffect(() => {
    // Force immediate scroll to top without animation for reliability
    window.scrollTo(0, 0);
    
    // Add a secondary forced scroll with a slight delay to handle any dynamic content
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0; // For Safari
    }, 50);
  }, []);

  // Scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const teamMembers = [
    {
      name: "Miraz",
      // role: "Founder & Creative Director",
      icon: <Users size={24} className="text-orange-500" />,
      description: "One of the best ticketing websites. They made our event ticketing very easy. The check-in process was so smooth. Their team was always helping and response to any request we made. I will always use them as our ticketing partner."
    },
    {
      name: "Jewad",
      // role: "Music Curation Specialist",
      icon: <Music size={24} className="text-orange-500" />,
      description: "This guys are genuine and honest. They are very easy to deal with. Costing is fair and very interactive support. I never had an issue dealing with them. I highly recommend them, and I will use them for my next event for sure."
    },
    {
      name: "Shawn",
      // role: "Event Experience Designer",
      icon: <Globe size={24} className="text-orange-500" />,
      description: "Absolutely brilliant website and team. They are always up for support. They very professional to deal with. Our event ticketing was hassle free. Using barcode scanning machine made the check-in process brilliant."
    }
  ];

  return (
    <div className="min-h-screen pt-6 pb-16 relative" ref={pageTopRef}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-orange-200 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full bg-orange-300 opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">

        {/* Header */}
        <div className={`top-20 z-30 py-6 px-8 mb-10 bg-white rounded-2xl shadow-lg transform transition-all duration-300 ${
          isScrolled ? 'shadow-orange-100' : ''
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="mr-4 p-3 bg-orange-100 rounded-full">
                <Users size={28} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">About Events N Tickets</h1>
                <p className="text-gray-600 mt-1">Our Story, Our Passion</p>
              </div>
            </div>
          </div>
        </div>


   {/* Our Expertise Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 mb-12 overflow-hidden">
          <div className="relative">
            {/* Decorative Music Note Background */}
            <div className="absolute -top-20 -right-20 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FF6B00" d="M103.5 20.5C85.1 40.5 58.167 84.333 52.5 104.5c-7.5 26.5 10 47.5 25.5 42.5s30.5-22.5 30.5-47.5-13-45-20-45-20 10-20 45 13 47.5 20 47.5c11.5 0 16.5-30 16.5-30"/>
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center relative z-10">
              Our Expertise
              <div className="w-20 h-1 bg-orange-500 mx-auto mt-3 rounded"></div>
            </h2>

            <div className="relative z-10 mb-8">
              <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto">
                Welcome to our music event website! We are passionate about bringing people together through the power of music and providing unforgettable experiences for all who attend our events.
              </p>
            </div>
          
            <div className="grid md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <Music size={24} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Experienced Team</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Our team is made up of experienced event planners, music enthusiasts, and creatives who work tirelessly to curate lineups that cater to a diverse range of musical tastes.
                  </p>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <Award size={24} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Quality Artists</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    From up-and-coming indie artists to established icons, we strive to showcase the best of the best in the music industry.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <Globe size={24} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Inclusive Environment</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    We believe that music has the power to transcend barriers and bring people together, regardless of their backgrounds, cultures, or beliefs.
                  </p>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <Users size={24} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Safe & Welcoming</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Our events provide a safe and inclusive space for everyone to come together and enjoy live music in a welcoming and accepting environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Event Management
            <div className="w-20 h-1 bg-orange-500 mx-auto mt-3 rounded"></div>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-orange-100 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1h-3V4c0-.552-.448-1-1-1H7c-.552 0-1 .448-1 1v3H3c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1h3v3c0 .552.448 1 1 1h10c.552 0 1-.448 1-1v-3h3z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Safety First</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  At our events, we prioritize the safety and well-being of our attendees above all else. We work closely with local authorities and security teams to ensure that our events are as safe and secure as possible.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-orange-100 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                      <path d="M12 2L13.09 8.26L22 9L17 14L18.18 22L12 19L5.82 22L7 14L2 9L10.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Sustainable Practices</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  We also strive to minimize our environmental impact by implementing sustainable practices, such as using biodegradable products and reducing our carbon footprint.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
              Thank you for visiting our website, and we hope to see you at one of our events soon!
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl mb-4">
          <div className="max-w-3xl mx-auto text-center">
            <Award size={48} className="mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-lg opacity-90">
              At the heart of our mission is the belief that music transcends boundaries, bridging gaps between cultures, communities, and individuals. Our events are thoughtfully designed to foster a safe, inclusive, and welcoming space for all attendees.
            </p>
          </div>
        </div>

        {/* Team Members */}
        {/* <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Meet Our Team</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className="bg-orange-50 rounded-2xl p-6 text-center transform transition-all hover:shadow-lg hover:-translate-y-2"
              >
                <div className="mx-auto mb-4 p-3 bg-white rounded-full inline-block">
                  {member.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-orange-600 mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div> */}

        {/* Contact Section */}
        {/* <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Want to Learn More?</h3>
              <p className="opacity-90">Get in touch with our team for any inquiries.</p>
            </div>
            <a href="/contact" className="px-6 py-3 bg-white text-orange-600 rounded-full font-medium hover:bg-orange-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300">
              Contact Us
            </a>
          </div>
        </div> */}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        .animate-fade-in-delay {
          animation: fadeIn 1s ease-out 0.5s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default AboutUs;