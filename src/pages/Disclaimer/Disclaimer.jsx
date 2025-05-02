import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Mail, 
  Phone, 
  Shield, 
  BookOpen, 
  Eye, 
  AlertOctagon,
  ArrowUp
} from 'lucide-react';

const Disclaimer = () => {
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
                <AlertTriangle size={28} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Disclaimer</h1>
                <p className="text-gray-600 mt-1">Last Updated: April 2023</p>
              </div>
            </div>
          </div>
        </div>
          
        {/* Content sections */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Interpretation and Definitions */}
            <div 
              ref={el => sectionRefs.current[0] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <BookOpen size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Interpretation and Definitions</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <h3 className="font-semibold text-xl text-orange-500 mb-3">Interpretation</h3>
                <p className="mb-4">
                  The words of which the initial letter is capitalized have meanings defined under the following conditions. 
                  The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                </p>
                <h3 className="font-semibold text-xl text-orange-500 mb-3">Definitions</h3>
                <p className="mb-4">For the purposes of this Disclaimer:</p>
                <ul className="space-y-3 pl-6 mb-4">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>
                      <span className="font-semibold text-gray-800">Company</span> (referred to as either "the Company", "We", "Us" or "Our" in this Disclaimer) refers to Events N Tickets, Sydney, Australia.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>
                      <span className="font-semibold text-gray-800">Service</span> refers to the Website.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>
                      <span className="font-semibold text-gray-800">You</span> means the individual accessing the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <div>
                      <span className="font-semibold text-gray-800">Website</span> refers to Events N Tickets, accessible from eventsntickets.com.au
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div 
              ref={el => sectionRefs.current[1] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <AlertTriangle size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Disclaimer</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  The information contained on the Service is for general information purposes only.
                </p>
                <p className="mb-4">
                  The Company assumes no responsibility for errors or omissions in the contents of the Service.
                </p>
                <p className="mb-4">
                  In no event shall the Company be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service. The Company reserves the right to make additions, deletions, or modifications to the contents on the Service at any time without prior notice.
                </p>
                <p>
                  The Company does not warrant that the Service is free of viruses or other harmful components.
                </p>
              </div>
            </div>
            
            {/* External Links Disclaimer */}
            <div 
              ref={el => sectionRefs.current[2] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <ExternalLink size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">External Links Disclaimer</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  The Service may contain links to external websites that are not provided or maintained by or in any way affiliated with the Company.
                </p>
                <p>
                  Please note that the Company does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
                </p>
              </div>
            </div>
            
            {/* Errors and Omissions Disclaimer */}
            <div 
              ref={el => sectionRefs.current[3] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <AlertOctagon size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Errors and Omissions Disclaimer</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  The information given by the Service is for general guidance on matters of interest only. Even if the Company takes every precaution to insure that the content of the Service is both current and accurate, errors can occur. Plus, given the changing nature of laws, rules and regulations, there may be delays, omissions or inaccuracies in the information contained on the Service.
                </p>
                <p>
                  The Company is not responsible for any errors or omissions, or for the results obtained from the use of this information.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Fair Use Disclaimer */}
            <div 
              ref={el => sectionRefs.current[4] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <CheckCircle size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Fair Use Disclaimer</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  The Company may use copyrighted material which has not always been specifically authorized by the copyright owner. The Company is making such material available for criticism, comment, news reporting, teaching, scholarship, or research.
                </p>
                <p className="mb-4">
                  The Company believes this constitutes a "fair use" of any such copyrighted material as provided for in Australian Copyright law.
                </p>
                <p>
                  If You wish to use copyrighted material from the Service for your own purposes that go beyond fair use, You must obtain permission from the copyright owner.
                </p>
              </div>
            </div>

            {/* Views Expressed Disclaimer */}
            <div 
              ref={el => sectionRefs.current[5] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <Eye size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Views Expressed Disclaimer</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  The Service may contain views and opinions which are those of the authors and do not necessarily reflect the official policy or position of any other author, agency, organization, employer or company, including the Company.
                </p>
                <p>
                  Comments published by users are their sole responsibility and the users will take full responsibility, liability and blame for any libel or litigation that results from something written in or as a direct result of something written in a comment. The Company is not liable for any comment published by users and reserves the right to delete any comment for any reason whatsoever.
                </p>
              </div>
            </div>

            {/* No Responsibility Disclaimer */}
            <div 
              ref={el => sectionRefs.current[6] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <Shield size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">No Responsibility Disclaimer</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  The information on the Service is provided with the understanding that the Company is not herein engaged in rendering legal, accounting, tax, or other professional advice and services. As such, it should not be used as a substitute for consultation with professional accounting, tax, legal or other competent advisers.
                </p>
                <p>
                  In no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever arising out of or in connection with your access or use or inability to access or use the Service.
                </p>
              </div>
            </div>

            {/* Use at Your Own Risk Disclaimer */}
            <div 
              ref={el => sectionRefs.current[7] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <AlertTriangle size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Use at Your Own Risk Disclaimer</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  All information in the Service is provided "as is", with no guarantee of completeness, accuracy, timeliness or of the results obtained from the use of this information, and without warranty of any kind, express or implied, including, but not limited to warranties of performance, merchantability and fitness for a particular purpose.
                </p>
                <p>
                  The Company will not be liable to You or anyone else for any decision made or action taken in reliance on the information given by the Service or for any consequential, special or similar damages, even if advised of the possibility of such damages.
                </p>
              </div>
            </div>

            {/* Contact Us */}
            <div 
              ref={el => sectionRefs.current[8] = el}
              className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-orange-50 border border-orange-100 transition-all duration-300"
            >
              <div className="px-8 py-6 flex items-center space-x-4 border-b border-orange-100">
                <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                  <Phone size={24} className="text-orange-500" />
                </div>
                <span className="text-xl font-medium text-gray-800">Contact Us</span>
              </div>
              <div className="px-8 py-6 bg-gray-50 text-gray-600">
                <p className="mb-4">
                  If you have any questions about this Disclaimer, You can contact Us:
                </p>
                <div className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <div className="flex items-center mb-2">
                      <ExternalLink size={20} className="mr-2 text-orange-500" />
                      <span className="font-semibold text-gray-700">Website</span>
                    </div>
                    <p className="text-gray-600">eventsntickets.com.au</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <div className="flex items-center mb-2">
                      <Phone size={20} className="mr-2 text-orange-500" />
                      <span className="font-semibold text-gray-700">Phone</span>
                    </div>
                    <p className="text-gray-600">+61433240314</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document version */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Disclaimer Version: 1.0 | Effective Date: April 2023</p>
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

export default Disclaimer;