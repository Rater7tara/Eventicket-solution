import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, FileText, Home, Phone, Mail, MapPin, Instagram, Facebook, Twitter, Music, Ticket, Heart, ChevronRight, Code } from 'lucide-react';
import logo from '../../../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-orange-100 via-orange-50 to-white pt-16 overflow-hidden relative">
      {/* Animated music notes decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="animate-float absolute top-20 left-10">
          <Music size={32} className="text-orange-600" />
        </div>
        <div className="animate-float-delayed absolute top-40 right-[10%]">
          <Music size={24} className="text-orange-500" />
        </div>
        <div className="animate-float-slow absolute bottom-40 left-[20%]">
          <Music size={28} className="text-orange-400" />
        </div>
        <div className="animate-float-delayed-slow absolute bottom-20 right-[25%]">
          <Music size={20} className="text-orange-300" />
        </div>
        <div className="animate-float absolute top-[30%] left-[30%]">
          <Music size={22} className="text-orange-400" />
        </div>
        <div className="animate-float-slow absolute top-[25%] right-[18%]">
          <Ticket size={28} className="text-orange-500" />
        </div>
        <div className="animate-float-delayed absolute bottom-[35%] left-[15%]">
          <Ticket size={24} className="text-orange-300" />
        </div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Column 1 - Logo and About */}
          <div className="space-y-6 md:col-span-2 lg:col-span-1">
            <div className="flex items-center p-1">
              <Link to="/" className="flex items-center">
                <div className="relative h-16">
                  <img 
                    src={logo} 
                    alt="Event n Ticket" 
                    className="h-full object-contain"
                  />
                </div>
              </Link>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Your premier destination for Event n tickets. Experience the thrill of live music with easy booking and secure transactions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center transform transition-transform duration-300 hover:scale-110 hover:bg-orange-600">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center transform transition-transform duration-300 hover:scale-110 hover:bg-orange-600">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center transform transition-transform duration-300 hover:scale-110 hover:bg-orange-600">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6 relative inline-block">
              Quick Links
              <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Events</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Blogs</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Contact Us</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Support */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6 relative inline-block">
              Support
              <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faqs" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>FAQs</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Terms & Conditions</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-gray-600 hover:text-orange-500 transition-colors flex items-center group">
                  <ChevronRight size={16} className="mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  <span>Disclaimer</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6 relative inline-block">
              Contact Us
              <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="text-orange-500 mt-1 flex-shrink-0" />
                <span className="text-gray-600">123 Music Avenue, Concert City, CS 12345</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={20} className="text-orange-500 flex-shrink-0" />
                <span className="text-gray-600">+6 (143) 324-0314</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="text-orange-500 flex-shrink-0" />
                <span className="text-gray-600">info@eventntickets.com</span>
              </li>
            </ul>
            
            {/* Newsletter Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Subscribe to our newsletter</h4>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-l-full border-2 border-orange-200 focus:border-orange-500 outline-none flex-1 text-sm"
                />
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-r-full transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="py-6 border-t border-orange-200">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Event n Tickets. All rights reserved.
          </p>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 text-sm mr-2">Developed By</span>
            <Code size={16} className="text-red-500 animate-pulse" />
            <span className="text-gray-500 text-sm ml-1">CodeClub It Solution</span>
          </div>
        </div>
      </div>
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes floatDelayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: floatDelayed 7s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed-slow {
          animation: floatDelayed 9s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </footer>
  );
};

export default Footer;