import React, { useState, useEffect } from 'react';
import { FileCheck, Book, Shield, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const toggleSection = (index) => {
    if (activeSection === index) {
      setActiveSection(null);
    } else {
      setActiveSection(index);
    }
  };

  const sections = [
    {
      title: "Introduction & Acceptance",
      icon: <Book size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">Welcome to Events N Tickets!</p>
          <p className="mb-4">These terms and conditions outline the rules and regulations for the use of Events N Tickets's Website, located at eventsntickets.com.au</p>
          <p className="mb-4">By accessing this website we assume you accept these terms and conditions. Do not continue to use Events N Tickets if you do not agree to take all of the terms and conditions stated on this page.</p>
        </div>
      )
    },
    {
      title: "Cookies Policy",
      icon: <Shield size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">We employ the use of cookies. By accessing Events N Tickets, you agreed to use cookies in agreement with the Events N Tickets's Privacy Policy.</p>
          <p className="mb-4">Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.</p>
        </div>
      )
    },
    {
      title: "Intellectual Property Rights",
      icon: <FileCheck size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">Unless otherwise stated, Events N Tickets and/or its licensors own the intellectual property rights for all material on Events N Tickets. All intellectual property rights are reserved. You may access this from Events N Tickets for your own personal use subjected to restrictions set in these terms and conditions.</p>
          <p className="mb-4">You must not:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Republish material from Events N Tickets</li>
            <li>Sell, rent or sub-license material from Events N Tickets</li>
            <li>Reproduce, duplicate or copy material from Events N Tickets</li>
            <li>Redistribute content from Events N Tickets</li>
          </ul>
          <p className="mb-4">This Agreement shall begin on the date hereof.</p>
        </div>
      )
    },
    {
      title: "User Comments",
      icon: <AlertCircle size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. Events N Tickets does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of Events N Tickets, its agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and opinions. To the extent permitted by applicable laws, Events N Tickets shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.</p>
          <p className="mb-4">Events N Tickets reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.</p>
          <p className="mb-4">You warrant and represent that:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;</li>
            <li>The Comments do not invade any intellectual property right, including without limitation copyright, patent or trademark of any third party;</li>
            <li>The Comments do not contain any defamatory, libelous, offensive, indecent or otherwise unlawful material which is an invasion of privacy</li>
            <li>The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity.</li>
          </ul>
          <p className="mb-4">You hereby grant Events N Tickets a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and edit any of your Comments in any and all forms, formats or media.</p>
        </div>
      )
    },
    {
      title: "Hyperlinking to our Content",
      icon: <FileCheck size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">The following organizations may link to our Website without prior written approval:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Government agencies;</li>
            <li>Search engines;</li>
            <li>News organizations;</li>
            <li>Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses; and</li>
            <li>System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Web site.</li>
          </ul>
          <p className="mb-4">These organizations may link to our home page, to publications or to other Website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products and/or services; and (c) fits within the context of the linking party's site.</p>
          <p className="mb-4">We may consider and approve other link requests from the following types of organizations:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>commonly-known consumer and/or business information sources;</li>
            <li>dot.com community sites;</li>
            <li>associations or other groups representing charities;</li>
            <li>online directory distributors;</li>
            <li>internet portals;</li>
            <li>accounting, law and consulting firms; and</li>
            <li>educational institutions and trade associations.</li>
          </ul>
          <p className="mb-4">We will approve link requests from these organizations if we decide that: (a) the link would not make us look unfavorably to ourselves or to our accredited businesses; (b) the organization does not have any negative records with us; (c) the benefit to us from the visibility of the hyperlink compensates the absence of Events N Tickets; and (d) the link is in the context of general resource information.</p>
          <p className="mb-4">These organizations may link to our home page so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products or services; and (c) fits within the context of the linking party's site.</p>
          <p className="mb-4">If you are one of the organizations listed in paragraph 2 above and are interested in linking to our website, you must inform us by sending an e-mail to Events N Tickets. Please include your name, your organization name, contact information as well as the URL of your site, a list of any URLs from which you intend to link to our Website, and a list of the URLs on our site to which you would like to link. Wait 2-3 weeks for a response.</p>
          <p className="mb-4">Approved organizations may hyperlink to our Website as follows:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>By use of our corporate name; or</li>
            <li>By use of the uniform resource locator being linked to; or</li>
            <li>By use of any other description of our Website being linked to that makes sense within the context and format of content on the linking party's site.</li>
          </ul>
          <p className="mb-4">No use of Events N Tickets's logo or other artwork will be allowed for linking absent a trademark license agreement.</p>
        </div>
      )
    },
    {
      title: "iFrames & Content Liability",
      icon: <AlertCircle size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.</p>
          <p className="mb-4">We shall not be hold responsible for any content that appears on your Website. You agree to protect and defend us against all claims that is rising on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.</p>
        </div>
      )
    },
    {
      title: "Your Privacy & Reservation of Rights",
      icon: <Shield size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">Please read Privacy Policy</p>
          <p className="mb-4">We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amen these terms and conditions and it's linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.</p>
          <p className="mb-4">Removal of links from our website</p>
          <p className="mb-4">If you find any link on our Website that is offensive for any reason, you are free to contact and inform us any moment. We will consider requests to remove links but we are not obligated to or so or to respond to you directly.</p>
          <p className="mb-4">We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy; nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.</p>
        </div>
      )
    },
    {
      title: "Disclaimer & Limitations",
      icon: <AlertCircle size={24} className="text-orange-500" />,
      content: (
        <div>
          <p className="mb-4">To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>limit or exclude our or your liability for death or personal injury;</li>
            <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
            <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
            <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
          </ul>
          <p className="mb-4">The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty.</p>
          <p className="mb-4">As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.</p>
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
        {/* Back button */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className={`sticky top-20 z-30 py-6 px-8 mb-10 bg-white rounded-2xl shadow-lg transform transition-all duration-300 ${
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
        <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to Events N Tickets</h2>
          <p className="text-gray-600 mb-6">
            Please read these terms and conditions carefully before using our website. By accessing or using our service, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
          </p>
          <div className="flex items-center p-4 bg-orange-50 rounded-xl">
            <AlertCircle size={24} className="text-orange-500 mr-3 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              If you have any questions about these Terms & Conditions, please contact us at <span className="text-orange-600 font-medium">support@eventsntickets.com.au</span>
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-orange-100 hover:shadow-lg transition-all duration-300"
            >
              <button 
                className="w-full px-8 py-6 flex items-center justify-between focus:outline-none"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center">
                  <div className="mr-4">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
                </div>
                <div className="text-orange-500">
                  {activeSection === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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

        {/* Contact section */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
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
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Document version: 2.1 | Effective Date: April 15, 2025</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;