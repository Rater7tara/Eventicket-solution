import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, Mail, Phone, Shield, BookOpen, Eye, AlertOctagon } from 'lucide-react';

const Disclaimer = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  
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
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Icons for each section
  const sectionIcons = {
    'interpretation': <BookOpen className="h-6 w-6" />,
    'disclaimer': <AlertTriangle className="h-6 w-6" />,
    'external-links': <ExternalLink className="h-6 w-6" />,
    'errors': <AlertOctagon className="h-6 w-6" />,
    'fair-use': <CheckCircle className="h-6 w-6" />,
    'views-expressed': <Eye className="h-6 w-6" />,
    'no-responsibility': <Shield className="h-6 w-6" />,
    'own-risk': <AlertTriangle className="h-6 w-6" />,
    'contact': <Phone className="h-6 w-6" />
  };

  // Sections of the disclaimer
  const sections = [
    { id: 'interpretation', title: 'Interpretation and Definitions' },
    { id: 'disclaimer', title: 'Disclaimer' },
    { id: 'external-links', title: 'External Links Disclaimer' },
    { id: 'errors', title: 'Errors and Omissions Disclaimer' },
    { id: 'fair-use', title: 'Fair Use Disclaimer' },
    { id: 'views-expressed', title: 'Views Expressed Disclaimer' },
    { id: 'no-responsibility', title: 'No Responsibility Disclaimer' },
    { id: 'own-risk', title: 'Use at Your Own Risk Disclaimer' },
    { id: 'contact', title: 'Contact Us' }
  ];

  const toggleSection = (id) => {
    if (activeSection === id) {
      setActiveSection(null);
    } else {
      setActiveSection(id);
    }
  };

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
      
      {/* Main content container */}
      <div className={`container mx-auto px-4 py-16 relative z-10 transition-all duration-1000 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header with glowing effect */}
          <div className="text-center mb-16">
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-orange-500 opacity-50 blur-xl rounded-full"></div>
              <h1 className="text-6xl font-bold relative mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-orange-500">
                Disclaimer
              </h1>
            </div>
            <p className="text-orange-200 text-xl">Last updated: April 02, 2023</p>
          </div>
          
          {/* Glass-morphism card for content */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl mb-12">
            {sections.map((section, index) => (
              <div 
                key={section.id}
                className={`border-b border-white/10 ${index === sections.length - 1 ? 'border-b-0' : ''}`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-8 py-6 flex items-center justify-between text-white focus:outline-none group transition-all duration-300 hover:bg-orange-500/20"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg text-white transition-transform duration-300 group-hover:scale-110">
                      {sectionIcons[section.id]}
                    </div>
                    <span className="text-xl font-medium">{section.title}</span>
                  </div>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-orange-500/30 transition-transform duration-300 ${activeSection === section.id ? 'rotate-180' : ''}`}>
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
                    activeSection === section.id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 py-6 bg-white/5 text-gray-100 border-t border-white/10">
                    {section.id === 'interpretation' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-xl text-orange-300 mb-3">Interpretation</h3>
                        <p>
                          The words of which the initial letter is capitalized have meanings defined under the following conditions. 
                          The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                        </p>
                        <h3 className="font-semibold text-xl text-orange-300 mb-3">Definitions</h3>
                        <p>For the purposes of this Disclaimer:</p>
                        <ul className="space-y-3 pl-6 mt-3">
                          <li className="flex items-start">
                            <span className="text-orange-400 mr-2">•</span>
                            <div>
                              <span className="font-semibold text-orange-200">Company</span> (referred to as either "the Company", "We", "Us" or "Our" in this Disclaimer) refers to Events N Tickets, Sydney, Australia.
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-orange-400 mr-2">•</span>
                            <div>
                              <span className="font-semibold text-orange-200">Service</span> refers to the Website.
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-orange-400 mr-2">•</span>
                            <div>
                              <span className="font-semibold text-orange-200">You</span> means the individual accessing the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-orange-400 mr-2">•</span>
                            <div>
                              <span className="font-semibold text-orange-200">Website</span> refers to Events N Tickets, accessible from eventsntickets.com.au
                            </div>
                          </li>
                        </ul>
                      </div>
                    )}

                    {section.id === 'disclaimer' && (
                      <div className="space-y-4">
                        <p>
                          The information contained on the Service is for general information purposes only.
                        </p>
                        <p>
                          The Company assumes no responsibility for errors or omissions in the contents of the Service.
                        </p>
                        <p>
                          In no event shall the Company be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service. The Company reserves the right to make additions, deletions, or modifications to the contents on the Service at any time without prior notice.
                        </p>
                        <p>
                          The Company does not warrant that the Service is free of viruses or other harmful components.
                        </p>
                      </div>
                    )}

                    {section.id === 'external-links' && (
                      <div className="space-y-4">
                        <p>
                          The Service may contain links to external websites that are not provided or maintained by or in any way affiliated with the Company.
                        </p>
                        <p>
                          Please note that the Company does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
                        </p>
                      </div>
                    )}

                    {section.id === 'errors' && (
                      <div className="space-y-4">
                        <p>
                          The information given by the Service is for general guidance on matters of interest only. Even if the Company takes every precaution to insure that the content of the Service is both current and accurate, errors can occur. Plus, given the changing nature of laws, rules and regulations, there may be delays, omissions or inaccuracies in the information contained on the Service.
                        </p>
                        <p>
                          The Company is not responsible for any errors or omissions, or for the results obtained from the use of this information.
                        </p>
                      </div>
                    )}

                    {section.id === 'fair-use' && (
                      <div className="space-y-4">
                        <p>
                          The Company may use copyrighted material which has not always been specifically authorized by the copyright owner. The Company is making such material available for criticism, comment, news reporting, teaching, scholarship, or research.
                        </p>
                        <p>
                          The Company believes this constitutes a "fair use" of any such copyrighted material as provided for in Australian Copyright law.
                        </p>
                        <p>
                          If You wish to use copyrighted material from the Service for your own purposes that go beyond fair use, You must obtain permission from the copyright owner.
                        </p>
                      </div>
                    )}

                    {section.id === 'views-expressed' && (
                      <div className="space-y-4">
                        <p>
                          The Service may contain views and opinions which are those of the authors and do not necessarily reflect the official policy or position of any other author, agency, organization, employer or company, including the Company.
                        </p>
                        <p>
                          Comments published by users are their sole responsibility and the users will take full responsibility, liability and blame for any libel or litigation that results from something written in or as a direct result of something written in a comment. The Company is not liable for any comment published by users and reserves the right to delete any comment for any reason whatsoever.
                        </p>
                      </div>
                    )}

                    {section.id === 'no-responsibility' && (
                      <div className="space-y-4">
                        <p>
                          The information on the Service is provided with the understanding that the Company is not herein engaged in rendering legal, accounting, tax, or other professional advice and services. As such, it should not be used as a substitute for consultation with professional accounting, tax, legal or other competent advisers.
                        </p>
                        <p>
                          In no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever arising out of or in connection with your access or use or inability to access or use the Service.
                        </p>
                      </div>
                    )}

                    {section.id === 'own-risk' && (
                      <div className="space-y-4">
                        <p>
                          All information in the Service is provided "as is", with no guarantee of completeness, accuracy, timeliness or of the results obtained from the use of this information, and without warranty of any kind, express or implied, including, but not limited to warranties of performance, merchantability and fitness for a particular purpose.
                        </p>
                        <p>
                          The Company will not be liable to You or anyone else for any decision made or action taken in reliance on the information given by the Service or for any consequential, special or similar damages, even if advised of the possibility of such damages.
                        </p>
                      </div>
                    )}

                    {section.id === 'contact' && (
                      <div className="space-y-4">
                        <p>If you have any questions about this Disclaimer, You can contact Us:</p>
                        <div className="flex flex-col space-y-5 mt-4">
                          <a 
                            href="https://eventsntickets.com.au" 
                            className="group flex items-center px-4 py-3 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl hover:from-orange-500/30 hover:to-orange-600/30 transition-all duration-300"
                          >
                            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                              <ExternalLink className="h-5 w-5 text-white" />
                            </div>
                            <span>By visiting this page on our website: eventsntickets.com.au</span>
                          </a>
                          <a 
                            href="tel:+61433240314" 
                            className="group flex items-center px-4 py-3 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl hover:from-orange-500/30 hover:to-orange-600/30 transition-all duration-300"
                          >
                            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                              <Phone className="h-5 w-5 text-white" />
                            </div>
                            <span>By phone number: +61433240314</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer with glowing CTA button */}
          <div className="text-center mt-16 relative">
            <div className="inline-block relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
              <a 
                href="https://eventsntickets.com.au" 
                className="relative flex items-center justify-center px-8 py-4 bg-black rounded-lg leading-none"
              >
                <span className="text-orange-400 group-hover:text-orange-300 transition duration-300">Back to Events N Tickets</span>
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
  );
};

export default Disclaimer;