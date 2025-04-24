import React, { useState, useEffect } from 'react';
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
      name: "Emily Rodriguez",
      role: "Founder & Creative Director",
      icon: <Users size={24} className="text-orange-500" />,
      description: "A visionary leader with 15 years of experience in music event management."
    },
    {
      name: "Alex Chen",
      role: "Music Curation Specialist",
      icon: <Music size={24} className="text-orange-500" />,
      description: "Passionate about discovering and showcasing emerging musical talents."
    },
    {
      name: "Sarah Thompson",
      role: "Event Experience Designer",
      icon: <Globe size={24} className="text-orange-500" />,
      description: "Expert in creating immersive and inclusive event environments."
    }
  ];

  return (
    <div className="min-h-screen pt-6 pb-16 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-orange-200 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full bg-orange-300 opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Back button */}
        <div className="mb-8">
          <a href="/" className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Home</span>
          </a>
        </div>

        {/* Header */}
        <div className={`sticky top-20 z-30 py-6 px-8 mb-10 bg-white rounded-2xl shadow-lg transform transition-all duration-300 ${
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
          
            <div className="grid md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Passion Driven</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Welcome to our official music event website — where passion for music meets exceptional event experiences.
                  </p>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                        <path d="M12 4V2m0 18v2m8-10h2M2 12h2m16.364 4.364l1.414 1.414M4.222 19.778l1.414-1.414m0-12.728L4.222 4.222m15.556 0l-1.414 1.414M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Universal Connection</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    We are dedicated to uniting people through the universal language of music by delivering unforgettable live performances.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Professional Curation</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Our team comprises seasoned event professionals, music aficionados, and creative minds committed to curating diverse and dynamic lineups.
                  </p>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl shadow-md transform transition-all hover:shadow-lg hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Genre Diversity</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    From rising indie talents to renowned industry legends, we aim to highlight excellence across all musical genres.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <Award size={48} className="mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-lg opacity-90">
              At the heart of our mission is the belief that music transcends boundaries, bridging gaps between cultures, communities, and individuals. Our events are thoughtfully designed to foster a safe, inclusive, and welcoming space for all attendees.
            </p>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
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
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Want to Learn More?</h3>
              <p className="opacity-90">Get in touch with our team for any inquiries.</p>
            </div>
            <a href="/contact" className="px-6 py-3 bg-white text-orange-600 rounded-full font-medium hover:bg-orange-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300">
              Contact Us
            </a>
          </div>
        </div>

        {/* Document version */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Last Updated: April 2025</p>
        </div>
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