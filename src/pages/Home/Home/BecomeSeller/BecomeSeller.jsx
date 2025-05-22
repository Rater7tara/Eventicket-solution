import React, { useState } from 'react';
import { toast } from 'react-toastify'; // Assuming you use react-toastify for notifications
import serverURL from '../../../../ServerConfig';

const BecomeSeller = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    shopName: '',
    bio: '',
    contactNumber: '',
    address: '',
    website: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${serverURL.url}seller-request/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Seller request submitted successfully!');
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          shopName: '',
          bio: '',
          contactNumber: '',
          address: '',
          website: ''
        });
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Error submitting seller request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Become Seller Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="w-full bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Become a Seller
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-[9999] flex items-start justify-center overflow-y-auto p-4 pt-20 pb-8">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="py-4 px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Become a Seller</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Email */}
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Shop Name */}
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="shopName">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      id="shopName"
                      name="shopName"
                      placeholder="Awesome Tickets"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={formData.shopName}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="contactNumber">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="01712345678"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={formData.contactNumber}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="address">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      placeholder="Dhaka, Bangladesh"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Website */}
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="website">
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Bio */}
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="bio">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="4"
                      placeholder="Tell us about your business..."
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                      value={formData.bio}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg mr-2 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BecomeSeller;