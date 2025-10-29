import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  Facebook, 
  Twitter, 
  Instagram, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const pageTopRef = useRef(null);

  // EmailJS Configuration
  const emailJSConfig = {
    publicKey: 'yE3itMLICqdZKlDIc',
    serviceId: 'service_w6r6t1d',
    templateId: 'template_j1shtad'
  };

  // Scroll to top when page loads/reloads
  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
  }, []);

  // Scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError('');
    if (debugInfo) setDebugInfo('');
  };

  const sendEmail = async (formData) => {
    setDebugInfo('Loading EmailJS library...');
    
    try {
      // Load EmailJS library if not already loaded
      if (!window.emailjs) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        setDebugInfo('EmailJS library loaded successfully');
      }

      // Initialize EmailJS
      setDebugInfo('Initializing EmailJS...');
      window.emailjs.init(emailJSConfig.publicKey);
      setDebugInfo('EmailJS initialized with public key: ' + emailJSConfig.publicKey);

      // Prepare email data
      const emailData = {
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone || 'Not provided',
        message: formData.message,
        to_email: 'info@eventsntickets.com.au',
        reply_to: formData.email
      };

      setDebugInfo('Sending email with service: ' + emailJSConfig.serviceId + ', template: ' + emailJSConfig.templateId);

      // Send email using EmailJS
      const result = await window.emailjs.send(
        emailJSConfig.serviceId,
        emailJSConfig.templateId,
        emailData
      );

      setDebugInfo('Email sent successfully! Response: ' + JSON.stringify(result));
      return { success: true, result };

    } catch (error) {
      console.error('Email sending failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      let debugMessage = 'Error details: ';
      
      if (error.status) {
        debugMessage += `Status: ${error.status}, `;
      }
      if (error.text) {
        debugMessage += `Text: ${error.text}, `;
        errorMessage = error.text;
      }
      if (error.message) {
        debugMessage += `Message: ${error.message}`;
        errorMessage = error.message;
      }

      setDebugInfo(debugMessage);

      // Specific error handling
      if (error.text && error.text.includes('service ID not found')) {
        errorMessage = `Service ID "${emailJSConfig.serviceId}" not found. Please check your EmailJS dashboard.`;
      } else if (error.text && error.text.includes('template')) {
        errorMessage = `Template ID "${emailJSConfig.templateId}" not found or invalid.`;
      } else if (error.text && error.text.includes('public key')) {
        errorMessage = `Public key "${emailJSConfig.publicKey}" is invalid.`;
      }

      return { success: false, error: errorMessage };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setDebugInfo('');

    try {
      // Validate form
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        setSubmitError('Please fill in all required fields.');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setSubmitError('Please enter a valid email address.');
        return;
      }

      setDebugInfo('Starting email sending process...');

      // Send email using EmailJS
      const result = await sendEmail(formData);
      
      if (result.success) {
        setIsSubmitted(true);
        setDebugInfo('Success! Email sent to info@eventsntickets.com.au');
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            name: '',
            email: '',
            phone: '',
            message: ''
          });
          setDebugInfo('');
        }, 5000);
      } else {
        setSubmitError(result.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again later.');
      setDebugInfo('Unexpected error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Debug Information */}
        {/* {debugInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Info size={20} className="text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Debug Information</h3>
                <p className="text-sm text-blue-700">{debugInfo}</p>
              </div>
            </div>
          </div>
        )} */}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-orange-100 rounded-full">
                  <Mail size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Email</p>
                  <p className="text-gray-600">info@eventsntickets.com.au</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-orange-100 rounded-full">
                  <MapPin size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Address</p>
                  <p className="text-gray-600">Sydney, NSW, Australia</p>
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
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg shadow-orange-50 border border-orange-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            
            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-bold text-green-700 mb-2">Message Sent Successfully!</h3>
                <p className="text-green-600">Your message has been sent to info@eventsntickets.com.au</p>
                <p className="text-green-600 mt-2">We'll get back to you soon.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center">
                    <AlertCircle size={20} className="text-red-500 mr-2" />
                    <p className="text-red-600">{submitError}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all disabled:bg-gray-50"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2">Email Address *</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all disabled:bg-gray-50"
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
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all disabled:bg-gray-50"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-2">Your Message *</label>
                  <textarea 
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all disabled:bg-gray-50"
                    placeholder="Type your message here..."
                  ></textarea>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;