import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  Facebook, 
  Twitter, 
  Instagram, 
  ArrowLeft 
} from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pageTopRef = useRef(null);

  // Scroll to top when page loads/reloads - using immediate scroll for reliability
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setIsSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen pt-6 pb-16 relative" ref={pageTopRef}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-orange-200 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full bg-orange-300 opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Back button */}
        {/* <div className="mb-8">
          <a href="/" className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Home</span>
          </a>
        </div> */}

        {/* Header */}
        <div className={`top-20 z-30 py-6 px-8 mb-10 bg-white rounded-2xl shadow-lg transform transition-all duration-300 ${
          isScrolled ? 'shadow-orange-100' : ''
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="mr-4 p-3 bg-orange-100 rounded-full">
                <Send size={28} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Contact Us</h1>
                <p className="text-gray-600 mt-1">We're here to help!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              {/* Phone */}
              {/* <div className="flex items-center">
                <div className="mr-4 p-3 bg-orange-100 rounded-full">
                  <Phone size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Phone</p>
                  <p className="text-gray-600">(+61) 123 456 7890</p>
                </div>
              </div> */}

              {/* Email */}
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-orange-100 rounded-full">
                  <Mail size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Email</p>
                  <p className="text-gray-600">support@eventsntickets.com.au</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-orange-100 rounded-full">
                  <MapPin size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Address</p>
                  <p className="text-gray-600">123 Events Street, Sydney, NSW 2000, Australia</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-8 flex space-x-4">
              <a href="https://www.facebook.com/share/1BUxxEVuy7/?mibextid=wwXIfr" className="text-gray-500 hover:text-orange-500 transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            
            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
                <Send size={48} className="mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-bold text-green-700 mb-2">Message Sent Successfully!</h3>
                <p className="text-green-600">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-gray-700 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-2">Your Message</label>
                  <textarea 
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    placeholder="Type your message here..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                >
                  <Send size={20} className="mr-2" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Google Maps Placeholder */}
        <div className="mt-12 bg-white rounded-2xl overflow-hidden shadow-lg border border-orange-100 h-96">
          <div className="aspect-w-16 aspect-h-8">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.71312937933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a47df06b185%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1623164983123!5m2!1sen!2sus"
              width="100%" 
              height="500" 
              style={{ border: 0 }}
              allowFullScreen="" 
              loading="lazy"
              className="w-full h-96"
            ></iframe>
          </div>
        </div>

        {/* Closing Section */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">We're Always Ready to Help</h3>
              <p className="opacity-90">Our support team is available 24/7 to assist you with any queries.</p>
            </div>
            <button className="px-6 py-3 bg-white text-orange-600 rounded-full font-medium hover:bg-orange-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300">
              Request Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;