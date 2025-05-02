import React, { useState, useEffect, useRef } from 'react';
import { FileCheck, Book, Shield, AlertCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const pageTopRef = useRef(null);

  // Detect scroll position for sticky header effect
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

  // Scroll to top when page loads or reloads
  useEffect(() => {
    if (pageTopRef.current) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div ref={pageTopRef} className="min-h-screen pt-6 pb-16 relative animate-fade-in">
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
                <FileCheck size={28} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Terms & Conditions</h1>
                <p className="text-gray-600 mt-1">Last updated: April 2025</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 border border-orange-200 text-orange-600 rounded-full hover:bg-orange-50 transition-colors text-sm flex items-center">
                <Shield size={16} className="mr-2" />
                Privacy Policy
              </button>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors text-sm flex items-center" onClick={() => window.print()}>
                <FileCheck size={16} className="mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in">
          <div className="relative">
            {/* Decorative Document Background */}
            <div className="absolute -top-20 -right-20 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FF6B00" d="M40,40 v120 h120 v-120 z M50,50 h100 v20 h-100 z M50,80 h100 v5 h-100 z M50,95 h100 v5 h-100 z M50,110 h100 v5 h-100 z M50,125 h60 v5 h-60 z"/>
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-4 relative z-10">Welcome to Events N Tickets</h2>
            <p className="text-gray-600 mb-6 relative z-10">
              Please read these terms and conditions carefully before using our website. By accessing or using our service, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
            </p>
            <div className="flex items-center p-4 bg-orange-50 rounded-xl relative z-10">
              <AlertCircle size={24} className="text-orange-500 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                If you have any questions about these Terms & Conditions, please contact us at <span className="text-orange-600 font-medium">support@eventsntickets.com.au</span>
              </p>
            </div>
          </div>
        </div>

        {/* Terms Section Title */}
        <div className="mb-8 text-center animate-fade-in-delay">
          <h2 className="text-3xl font-bold text-orange-300 mb-3">Our Legal Terms</h2>
          <div className="w-20 h-1 bg-orange-500 mx-auto rounded"></div>
          <p className="text-orange-200 mt-4 max-w-2xl mx-auto">
            Our commitment to transparency means providing clear terms that protect both our users and our services.
          </p>
        </div>

        {/* Introduction & Acceptance */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <Book size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Introduction & Acceptance</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>Welcome to Events N Tickets!</p>
            <p>These terms and conditions outline the rules and regulations for the use of Events N Tickets's Website, located at eventsntickets.com.au</p>
            <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Events N Tickets if you do not agree to take all of the terms and conditions stated on this page.</p>
          </div>
        </div>

        {/* Cookies Policy */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <Shield size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Cookies Policy</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>We employ the use of cookies. By accessing Events N Tickets, you agreed to use cookies in agreement with the Events N Tickets's Privacy Policy.</p>
            <p>Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.</p>
          </div>
        </div>

        {/* Intellectual Property Rights */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <FileCheck size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Intellectual Property Rights</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>Unless otherwise stated, Events N Tickets and/or its licensors own the intellectual property rights for all material on Events N Tickets. All intellectual property rights are reserved. You may access this from Events N Tickets for your own personal use subjected to restrictions set in these terms and conditions.</p>
            <p>You must not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Republish material from Events N Tickets</li>
              <li>Sell, rent or sub-license material from Events N Tickets</li>
              <li>Reproduce, duplicate or copy material from Events N Tickets</li>
              <li>Redistribute content from Events N Tickets</li>
            </ul>
            <p>This Agreement shall begin on the date hereof.</p>
          </div>
        </div>

        {/* User Comments */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <AlertCircle size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">User Comments</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. Events N Tickets does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of Events N Tickets, its agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and opinions.</p>
            <p>To the extent permitted by applicable laws, Events N Tickets shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.</p>
            <p>Events N Tickets reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.</p>
            <p>You warrant and represent that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;</li>
              <li>The Comments do not invade any intellectual property right, including without limitation copyright, patent or trademark of any third party;</li>
              <li>The Comments do not contain any defamatory, libelous, offensive, indecent or otherwise unlawful material which is an invasion of privacy</li>
              <li>The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity.</li>
            </ul>
            <p>You hereby grant Events N Tickets a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and edit any of your Comments in any and all forms, formats or media.</p>
          </div>
        </div>

        {/* Hyperlinking to our Content */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <FileCheck size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Hyperlinking to our Content</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>The following organizations may link to our Website without prior written approval:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Government agencies;</li>
              <li>Search engines;</li>
              <li>News organizations;</li>
              <li>Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses; and</li>
              <li>System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Web site.</li>
            </ul>
            <p>These organizations may link to our home page, to publications or to other Website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products and/or services; and (c) fits within the context of the linking party's site.</p>
            <div className="bg-orange-50 p-4 rounded-xl my-6">
              <p className="text-gray-700 font-medium">We may consider and approve other link requests from various organizations.</p>
            </div>
            <p>Approved organizations may hyperlink to our Website as follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>By use of our corporate name; or</li>
              <li>By use of the uniform resource locator being linked to; or</li>
              <li>By use of any other description of our Website being linked to that makes sense within the context and format of content on the linking party's site.</li>
            </ul>
            <p>No use of Events N Tickets's logo or other artwork will be allowed for linking absent a trademark license agreement.</p>
          </div>
        </div>

        {/* iFrames & Content Liability */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <AlertCircle size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">iFrames & Content Liability</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.</p>
            <p>We shall not be hold responsible for any content that appears on your Website. You agree to protect and defend us against all claims that is rising on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.</p>
          </div>
        </div>

        {/* Your Privacy & Reservation of Rights */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <Shield size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Your Privacy & Reservation of Rights</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>Please read our Privacy Policy for complete information about how we handle your data.</p>
            <div className="bg-orange-50 p-4 rounded-xl my-6">
              <p className="text-gray-700 font-medium">Your privacy is important to us, and we are committed to protecting your personal information.</p>
            </div>
            <p>We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amend these terms and conditions and its linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.</p>
            <p className="font-medium text-gray-700 mt-6">Removal of links from our website</p>
            <p>If you find any link on our Website that is offensive for any reason, you are free to contact and inform us any moment. We will consider requests to remove links but we are not obligated to or so or to respond to you directly.</p>
            <p>We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy; nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.</p>
          </div>
        </div>

        {/* Disclaimer & Limitations */}
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100 animate-fade-in-delay">
          <div className="flex items-center mb-4">
            <div className="mr-4 p-3 bg-orange-100 rounded-full">
              <AlertCircle size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Disclaimer & Limitations</h3>
          </div>
          <div className="pl-14 text-gray-600 space-y-4">
            <p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>limit or exclude our or your liability for death or personal injury;</li>
              <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
              <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
              <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
            </ul>
            <p>The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty.</p>
            <p>As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.</p>
          </div>
        </div>

        {/* Key Points Summary */}
        <div className="mt-12 bg-orange-50 rounded-2xl p-8 shadow-lg border border-orange-100 animate-fade-in-delay">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Summary of Key Points</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-md flex items-start transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="p-2 bg-orange-100 rounded-full mr-4 mt-1">
                <FileCheck size={20} className="text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Content Ownership</h4>
                <p className="text-sm text-gray-600">All content on this website is the property of Events N Tickets and protected by copyright laws.</p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md flex items-start transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="p-2 bg-orange-100 rounded-full mr-4 mt-1">
                <Shield size={20} className="text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Data Protection</h4>
                <p className="text-sm text-gray-600">Your personal information is handled according to our Privacy Policy and relevant data protection laws.</p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md flex items-start transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="p-2 bg-orange-100 rounded-full mr-4 mt-1">
                <Users size={20} className="text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">User Responsibilities</h4>
                <p className="text-sm text-gray-600">Users must not misuse the website or engage in any activity that could harm the platform or other users.</p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md flex items-start transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="p-2 bg-orange-100 rounded-full mr-4 mt-1">
                <AlertCircle size={20} className="text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Limitation of Liability</h4>
                <p className="text-sm text-gray-600">Events N Tickets cannot be held liable for indirect damages resulting from the use of our services.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact section */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl animate-fade-in-delay">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Questions about our terms?</h3>
              <p className="opacity-90">We're here to help with any questions you might have.</p>
            </div>
            <Link to="/contact" className="px-6 py-3 bg-white text-orange-600 rounded-full font-medium hover:bg-orange-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300">
              Contact Us
            </Link>
          </div>
        </div>

        {/* Document version */}
        <div className="mt-12 text-center text-gray-500 text-sm animate-fade-in-delay">
          <p>Document version: 2.1 | Effective Date: April 15, 2025</p>
        </div>

        {/* Back to top button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 ${
              isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </button>
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

export default TermsAndConditions;