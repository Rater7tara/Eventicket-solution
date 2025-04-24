import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCcw, 
  Info, 
  Mail, 
  FileText, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Phone,
  Shield
} from 'lucide-react';

const RefundPolicy = () => {
  const [activeSection, setActiveSection] = useState({
    0: true,  // Open first and last sections by default
    4: true
  });
  const [animateIn, setAnimateIn] = useState(false);
  const sectionRefs = useRef([]);

  useEffect(() => {
    // Trigger entrance animation
    setAnimateIn(true);
    
    // Add parallax effect to neural elements
    const handleMouseMove = (e) => {
      const neuralElements = document.querySelectorAll('.neural-dot');
      const moveX = (e.clientX - window.innerWidth / 2) / 50;
      const moveY = (e.clientY - window.innerHeight / 2) / 50;
      
      neuralElements.forEach(element => {
        const speedX = parseFloat(element.getAttribute('data-speed-x') || 1);
        const speedY = parseFloat(element.getAttribute('data-speed-y') || 1);
        element.style.transform = `translate(${moveX * speedX}px, ${moveY * speedY}px)`;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animate sections on scroll
    const handleScroll = () => {
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleSection = (index) => {
    setActiveSection(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Icons for each section
  const sectionIcons = {
    0: <Info className="h-6 w-6" />,
    1: <RefreshCcw className="h-6 w-6" />,
    2: <FileText className="h-6 w-6" />,
    3: <CheckCircle className="h-6 w-6" />,
    4: <Mail className="h-6 w-6" />
  };

  const policySections = [
    {
      title: "Introduction",
      column: 1,
      icon: <Info size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">
            Thank you for shopping at Events N Tickets. We strive to provide the best possible customer experience.
          </p>
          <p>
            If you are not completely satisfied with your purchase, we invite you to review our Return and Refund Policy.
          </p>
        </div>
      )
    },
    {
      title: "Order Cancellation Rights",
      column: 1,
      icon: <RefreshCcw size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">
            You are entitled to cancel your order within 7 days without providing a reason.
          </p>
          <ul className="space-y-3 pl-6 mb-4">
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Cancellation deadline: 7 days from receiving the goods</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>You can inform us of your decision by email at info@eventsntickets.com.au</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Reimbursement will be processed within 14 days of receiving the returned goods</div>
            </li>
          </ul>
          <p className="text-sm italic text-orange-300">
            We will use the same payment method as your original order.
          </p>
        </div>
      )
    },
    {
      title: "Return Conditions",
      column: 1,
      icon: <FileText size={24} className="text-orange-500" />,
      content: (
        <div>
          <h3 className="font-semibold text-xl text-orange-300 mb-3">Eligibility Criteria</h3>
          <ul className="space-y-3 pl-6 mb-4">
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Goods must be purchased within the last 7 days</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Items must be in original packaging</div>
            </li>
          </ul>
          
          <h3 className="font-semibold text-xl text-orange-300 mb-3">Non-Returnable Items</h3>
          <ul className="space-y-3 pl-6 mb-4">
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Personalized or custom-made goods</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Perishable items</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Unsealed goods for health protection</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Items mixed with other products</div>
            </li>
          </ul>
          <p className="text-sm italic text-orange-300">
            Only regular-priced goods may be refunded.
          </p>
        </div>
      )
    },
    {
      title: "Returning Goods",
      column: 2,
      icon: <RefreshCcw size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">
            You are responsible for the cost and risk of returning goods:
          </p>
          <ul className="space-y-3 pl-6 mb-4">
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Return address: Sydney, Australia</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>We recommend using an insured and trackable mail service</div>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <div>Refunds will only be issued upon receipt of goods</div>
            </li>
          </ul>
          <p>
            We cannot be held responsible for items damaged during return shipment.
          </p>
        </div>
      )
    },
    {
      title: "Contact Information",
      column: 2,
      icon: <Mail size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">
            If you have any questions about our Returns and Refunds Policy, please contact us:
          </p>
          <div className="bg-orange-500/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
            <div className="flex items-center mb-2">
              <Mail size={20} className="mr-2 text-orange-400" />
              <span className="font-semibold text-orange-300">Email</span>
            </div>
            <p>info@eventsntickets.com.au</p>
          </div>
        </div>
      )
    }
  ];

  // Generate neural network dots
  const neuralDots = [];
  for (let i = 0; i < 40; i++) {
    const size = Math.random() * 10 + 3;
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const opacity = Math.random() * 0.5 + 0.1;
    const speedX = Math.random() * 2 - 1;
    const speedY = Math.random() * 2 - 1;
    
    neuralDots.push(
      <div 
        key={i}
        className="absolute rounded-full neural-dot"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          background: `rgba(255, 126, 0, ${opacity})`,
          boxShadow: `0 0 ${size * 2}px rgba(255, 126, 0, ${opacity})`,
          zIndex: 0
        }}
        data-speed-x={speedX}
        data-speed-y={speedY}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {neuralDots}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent opacity-40" />
      </div>
      
      {/* Orange glow accent */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 rounded-full bg-orange-500 filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full bg-orange-500 filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4" />
      
      <div className={`container mx-auto px-4 py-16 relative z-10 transition-all duration-1000 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <div className="mb-8">
            <a href="/" className="inline-flex items-center text-gray-400 hover:text-orange-400 transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              <span>Back to Home</span>
            </a>
          </div>

          {/* Header with glowing effect */}
          <div className="text-center mb-16">
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-orange-500 opacity-50 blur-xl rounded-full"></div>
              <div className="relative flex items-center justify-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg mr-4">
                  <RefreshCcw size={32} className="text-white" />
                </div>
                <h1 className="text-6xl font-bold relative mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-orange-500">
                  Returns & Refunds
                </h1>
              </div>
            </div>
            <p className="text-orange-200 text-xl mt-4">Last Updated: April 2025</p>
          </div>
          
          {/* Glass-morphism cards for sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* First Column */}
            <div className="space-y-6">
              {policySections.filter(section => section.column === 1).map((section, index) => (
                <div 
                  key={`col1-${index}`} 
                  ref={el => sectionRefs.current[policySections.indexOf(section)] = el}
                  className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-300 hover:bg-white/15"
                >
                  <button
                    onClick={() => toggleSection(policySections.indexOf(section))}
                    className="w-full px-8 py-6 flex items-center justify-between text-white focus:outline-none group transition-all duration-300 hover:bg-orange-500/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg text-white transition-transform duration-300 group-hover:scale-110">
                        {sectionIcons[policySections.indexOf(section)]}
                      </div>
                      <span className="text-xl font-medium">{section.title}</span>
                    </div>
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-orange-500/30 transition-transform duration-300 ${activeSection[policySections.indexOf(section)] ? 'rotate-180' : ''}`}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      activeSection[policySections.indexOf(section)] ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-8 py-6 bg-white/5 text-gray-100 border-t border-white/10">
                      {section.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Second Column */}
            <div className="space-y-6">
              {policySections.filter(section => section.column === 2).map((section, index) => (
                <div 
                  key={`col2-${index}`} 
                  ref={el => sectionRefs.current[policySections.indexOf(section)] = el}
                  className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-300 hover:bg-white/15"
                >
                  <button
                    onClick={() => toggleSection(policySections.indexOf(section))}
                    className="w-full px-8 py-6 flex items-center justify-between text-white focus:outline-none group transition-all duration-300 hover:bg-orange-500/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg text-white transition-transform duration-300 group-hover:scale-110">
                        {sectionIcons[policySections.indexOf(section)]}
                      </div>
                      <span className="text-xl font-medium">{section.title}</span>
                    </div>
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-orange-500/30 transition-transform duration-300 ${activeSection[policySections.indexOf(section)] ? 'rotate-180' : ''}`}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      activeSection[policySections.indexOf(section)] ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-8 py-6 bg-white/5 text-gray-100 border-t border-white/10">
                      {section.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Contact Support Card */}
              <div 
                className="bg-gradient-to-r from-orange-500/30 to-orange-600/30 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-300 p-8"
                ref={el => sectionRefs.current[policySections.length] = el}
              >
                <div className="flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg text-white mr-4">
                      <Phone className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Need Further Assistance?</h3>
                  </div>
                  <p className="text-gray-100 mb-6">Our support team is ready to help you with any questions.</p>
                  
                  <div className="inline-block relative self-start group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
                    <a 
                      href="/contact" 
                      className="relative flex items-center justify-center px-8 py-4 bg-black rounded-lg leading-none"
                    >
                      <span className="text-orange-400 group-hover:text-orange-300 transition duration-300">Contact Support</span>
                      <svg 
                        className="w-5 h-5 ml-3 text-orange-400 group-hover:text-orange-300 transition duration-300 group-hover:translate-x-1" 
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
          </div>
          
          {/* Print Policy button - floating at bottom */}
          {/* <div className="mt-12 text-center">
            <div className="inline-block relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
              <button 
                onClick={() => window.print()}
                className="relative flex items-center justify-center px-8 py-4 bg-black rounded-lg leading-none"
              >
                <FileText className="w-5 h-5 mr-2 text-orange-400 group-hover:text-orange-300 transition duration-300" />
                <span className="text-orange-400 group-hover:text-orange-300 transition duration-300">Print Policy</span>
              </button>
            </div>
          </div> */}

          {/* Document version */}
          <div className="mt-16 text-center text-gray-500 text-sm">
            <p>Policy Version: 2.0 | Effective Date: April 2025</p>
          </div>
        </div>
      </div>
    

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