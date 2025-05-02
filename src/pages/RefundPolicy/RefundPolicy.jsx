import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCcw, 
  Info, 
  Mail, 
  FileText, 
  CheckCircle,
  Phone,
  ArrowUp
} from 'lucide-react';

const RefundPolicy = () => {
  const [animateIn, setAnimateIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef([]);

  useEffect(() => {
    // Trigger entrance animation
    setAnimateIn(true);
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Animate sections on scroll and handle scroll button visibility
    const handleScroll = () => {
      // Show/hide scroll button based on scroll position
      if (window.scrollY > 100) {
        setIsScrolled(true);
        setShowScrollTop(true);
      } else {
        setIsScrolled(false);
        setShowScrollTop(false);
      }
      
      // Animate sections when they come into view
      sectionRefs.current.forEach((ref) => {
        if (ref) {
          const top = ref.getBoundingClientRect().top;
          const windowHeight = window.innerHeight;
          
          if (top < windowHeight * 0.75) {
            ref.classList.add('animate-section-enter');
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen pt-6 pb-16 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-orange-200 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full bg-orange-300 opacity-20 blur-3xl"></div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`py-6 px-8 mb-10 bg-white rounded-2xl shadow-lg transform transition-all duration-300 ${
          animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="mr-4 p-3 bg-orange-100 rounded-full">
                <RefreshCcw size={28} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Returns & Refunds</h1>
                <p className="text-gray-600 mt-1">Last Updated: April 2025</p>
              </div>
            </div>
          </div>
        </div>
          
        {/* Content sections */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Introduction Section */}
            <div 
              ref={el => sectionRefs.current[0] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <Info size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Introduction</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  Thank you for shopping at Events N Tickets. We strive to provide the best possible customer experience.
                </p>
                <p>
                  If you are not completely satisfied with your purchase, we invite you to review our Return and Refund Policy.
                </p>
              </div>
            </div>
            
            {/* Order Cancellation Rights */}
            <div 
              ref={el => sectionRefs.current[1] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <RefreshCcw size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Order Cancellation Rights</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  You are entitled to cancel your order within 7 days without providing a reason.
                </p>
                <ul className="space-y-3 pl-6 mb-4">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Cancellation deadline: 7 days from receiving the goods</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>You can inform us of your decision by email at info@eventsntickets.com.au</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Reimbursement will be processed within 14 days of receiving the returned goods</div>
                  </li>
                </ul>
                <p className="text-sm italic text-orange-500">
                  We will use the same payment method as your original order.
                </p>
              </div>
            </div>
            
            {/* Return Conditions */}
            <div 
              ref={el => sectionRefs.current[2] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <FileText size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Return Conditions</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <h3 className="font-semibold text-xl text-orange-500 mb-3">Eligibility Criteria</h3>
                <ul className="space-y-3 pl-6 mb-4">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Goods must be purchased within the last 7 days</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Items must be in original packaging</div>
                  </li>
                </ul>
                
                <h3 className="font-semibold text-xl text-orange-500 mb-3">Non-Returnable Items</h3>
                <ul className="space-y-3 pl-6 mb-4">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Personalized or custom-made goods</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Perishable items</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Unsealed goods for health protection</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Items mixed with other products</div>
                  </li>
                </ul>
                <p className="text-sm italic text-orange-500">
                  Only regular-priced goods may be refunded.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Returning Goods */}
            <div 
              ref={el => sectionRefs.current[3] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <CheckCircle size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Returning Goods</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  You are responsible for the cost and risk of returning goods:
                </p>
                <ul className="space-y-3 pl-6 mb-4">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Return address: Sydney, Australia</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>We recommend using an insured and trackable mail service</div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>Refunds will only be issued upon receipt of goods</div>
                  </li>
                </ul>
                <p>
                  We cannot be held responsible for items damaged during return shipment.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div 
              ref={el => sectionRefs.current[4] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <Mail size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Contact Information</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  If you have any questions about our Returns and Refunds Policy, please contact us:
                </p>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div className="flex items-center mb-2">
                    <Mail size={20} className="mr-2 text-orange-500" />
                    <span className="font-semibold text-gray-700">Email</span>
                  </div>
                  <p className="text-gray-600">info@eventsntickets.com.au</p>
                </div>
              </div>
            </div>

            {/* Need Support Card */}
            <div 
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 p-8"
              ref={el => sectionRefs.current[5] = el}
            >
              <div className="flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Need Further Assistance?</h3>
                </div>
                <p className="text-gray-600 mb-6">Our support team is ready to help you with any questions.</p>
                
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors self-start"
                >
                  <span>Contact Support</span>
                  <svg 
                    className="w-5 h-5 ml-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Document version */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Policy Version: 2.0 | Effective Date: April 2025</p>
        </div>
      </div>

      {/* Scroll to top button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 bg-orange-500 text-white rounded-full shadow-lg z-50 transition-all duration-300 ${
          showScrollTop ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <ArrowUp size={24} />
      </button>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes sectionEnter {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-section-enter {
          animation: sectionEnter 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RefundPolicy;