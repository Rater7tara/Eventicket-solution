import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Info, 
  FileText, 
  ArrowLeft,
  ArrowUp
} from 'lucide-react';

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll effect for sticky header and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
        setShowScrollTop(true);
      } else {
        setIsScrolled(false);
        setShowScrollTop(false);
      }
    };

    // Scroll to top on page load/reload
    window.scrollTo(0, 0);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleSection = (index) => {
    if (activeSection === index) {
      setActiveSection(null);
    } else {
      setActiveSection(index);
    }
  };

  const policySections = [
    {
      title: "Introduction",
      icon: <Info size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">Welcome to Events N Tickets' Privacy Policy. This document outlines how we collect, use, and protect your personal information.</p>
          <p>By using our service, you agree to the terms described in this Privacy Policy.</p>
        </div>
      )
    },
    {
      title: "Types of Data Collected",
      icon: <FileText size={24} className="text-orange-500" />,
      content: (
        <div>
          <h3 className="font-semibold mb-3 text-gray-700">Personal Data</h3>
          <p className="mb-4">We may collect the following personally identifiable information:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600">
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Phone number</li>
          </ul>
          
          <h3 className="font-semibold mb-3 text-gray-700">Usage Data</h3>
          <p className="mb-4">We automatically collect usage information including:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Pages visited</li>
            <li>Time and date of visit</li>
            <li>Device identifiers</li>
          </ul>
        </div>
      )
    },
    {
      title: "How We Use Your Data",
      icon: <Shield size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">We use your personal data for several purposes:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600">
            <li>Provide and maintain our service</li>
            <li>Manage your account</li>
            <li>Perform contract obligations</li>
            <li>Contact you about updates and services</li>
            <li>Analyze service usage and improve our offerings</li>
          </ul>
          <p className="text-sm text-gray-500 italic">We respect your privacy and will only use your data as described in this policy.</p>
        </div>
      )
    },
    {
      title: "Data Sharing and Transfers",
      icon: <Lock size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">We may share your personal information in the following situations:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600">
            <li>With service providers for analysis and support</li>
            <li>During business transfers or acquisitions</li>
            <li>With affiliated companies</li>
            <li>With business partners</li>
            <li>When required by law</li>
          </ul>
          <p className="text-sm text-gray-500 italic">We take steps to ensure your data is protected during any transfer.</p>
        </div>
      )
    },
    {
      title: "Your Data Rights",
      icon: <Lock size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">You have several rights regarding your personal data:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-600">
            <li>Right to access your personal data</li>
            <li>Right to correct inaccurate information</li>
            <li>Right to delete your personal data</li>
            <li>Right to restrict data processing</li>
            <li>Right to data portability</li>
          </ul>
          <p className="mb-4">To exercise these rights, please contact us using the details at the bottom of this policy.</p>
        </div>
      )
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
        {/* Header */}
        <div className={`top-20 z-30 py-6 px-8 mb-10 bg-white rounded-2xl shadow-lg transform transition-all duration-300 ${
          isScrolled ? 'shadow-orange-100' : ''
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="mr-4 p-3 bg-orange-100 rounded-full">
                <Shield size={28} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Privacy Policy</h1>
                <p className="text-gray-600 mt-1">Last Updated: April 2025</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors text-sm flex items-center" onClick={() => window.print()}>
                <FileText size={16} className="mr-2" />
                Print Policy
              </button>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Welcome to Events N Tickets
              <div className="w-20 h-1 bg-orange-500 mx-auto mt-3 rounded"></div>
            </h2>
            <p className="text-gray-600 mb-6">
              We are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
            </p>
            <div className="flex items-center p-4 bg-orange-50 rounded-xl">
              <Info size={24} className="text-orange-500 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                By using our service, you consent to the data practices described in this policy.
              </p>
            </div>
          </div>
          
          {/* Decorative Shield Background */}
          <div className="absolute -top-20 -right-20 w-64 h-64 opacity-10">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FF6B00" d="M50 5 L95 25 L95 60 C95 75 85 85 50 95 C15 85 5 75 5 60 L5 25 Z" />
            </svg>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-4">
          {policySections.map((section, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-orange-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <button 
                className="w-full px-8 py-6 flex items-center justify-between focus:outline-none"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center">
                  <div className="mr-4 p-3 bg-orange-100 rounded-full">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
                </div>
                <div className="text-orange-500">
                  {activeSection === index ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  )}
                </div>
              </button>
              
              <div 
                className={`px-8 pb-6 transition-all duration-300 overflow-hidden ${
                  activeSection === index ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pt-4 border-t border-orange-100 text-gray-600 leading-relaxed">
                  {section.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <Shield size={48} className="mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Our Commitment</h3>
            <p className="text-lg opacity-90">
              At Events N Tickets, we believe that trust is the foundation of any great relationship. We are dedicated to maintaining the highest standards of data protection and privacy for all our users.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-orange-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">How to Reach Us</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-orange-50 p-6 rounded-2xl">
              <p className="font-semibold text-gray-700">Website</p>
              <p className="text-gray-600">eventsntickets.com.au</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl">
              <p className="font-semibold text-gray-700">Phone</p>
              <p className="text-gray-600">+61 433 240 314</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Questions about our Privacy Policy?</h3>
              <p className="opacity-90">We're here to help clarify any concerns you might have.</p>
            </div>
            <a href="/contact" className="px-6 py-3 bg-white text-orange-600 rounded-full font-medium hover:bg-orange-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300">
              Contact Us
            </a>
          </div>
        </div>

        {/* Document version */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Privacy Policy Version: 2.0 | Effective Date: April 2025</p>
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

export default PrivacyPolicy;