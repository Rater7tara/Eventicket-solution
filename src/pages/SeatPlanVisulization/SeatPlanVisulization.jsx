import React, { useState } from 'react';

const ConcertSeating = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  
  // Sample data for the sections
  const sections = [
    { id: 'vip', name: 'VIP', price: "Contact Organizer", color: '#FF4500' },
    { id: 'energon', name: 'Energon Enclave', price: 160, color: '#FF4500' },
    { id: 'HBD House', name: 'HBD House', price: 120, color: '#9370DB' },
    { id: 'AusDream Arena', name: 'AusDream Arena', price: 80, color: '#3498DB' },
    { id: 'Century Circle', name: 'Century Circle', price: 70, color: '#2ECC71' },
    { id: 'Gamma Gallery', name: 'Gamma Gallery', price: 60, color: '#F1C40F' }
  ];
  
  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  
  // Toggle section view
  const toggleSection = (sectionId) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };
  
  // Toggle seat selection
  const toggleSeat = (seat) => {
    if (selectedSeats.some(s => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-orange-900 to-black text-white p-6">
      <div className="mx-auto bg-black bg-opacity-40 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-6">
          <h1 className="text-3xl font-bold">Coldplay: Music of the Spheres Tour</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Harmony Arena
            </p>
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              June 12, 2025
            </p>
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              7:30 PM
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 mb-6">Select Your Seats</h2>
            
            {/* Section Selection */}
            <div className="mb-6">
              <div className="text-sm text-orange-300 mb-2">Choose a section:</div>
              <div className="flex flex-wrap gap-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id 
                        ? 'bg-orange-600 text-white shadow-md' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    {section.name} - ${section.price}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Stage */}
            <div className="relative mb-12">
              <div className="w-5/6 mx-auto h-16 bg-gradient-to-r from-orange-900 via-orange-800 to-orange-900 rounded-xl flex items-center justify-center">
                <span className="text-orange-200 font-bold tracking-widest">STAGE</span>
              </div>
            </div>
            
            {/* Sample Seating Layout */}
            <div className="space-y-8">
              {/* VIP Section */}
              {(!activeSection || activeSection === 'vip') && (
                <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 p-4 rounded-lg">
                  <h3 className="text-center mb-4 bg-red-800/60 inline-block px-4 py-1 rounded-full text-red-100 mx-auto">VIP Section</h3>
                  <div className="grid grid-cols-20 gap-1 mb-2">
                    {[...Array(40)].map((_, idx) => {
                      const seat = {
                        id: `vip_${idx}`,
                        name: `VIP ${idx + 1}`,
                        price: 200,
                        section: 'vip',
                        status: idx % 8 === 0 ? 'booked' : 'available'
                      };
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isBooked = seat.status === 'booked';
                      
                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => !isBooked && toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all ${
                            isBooked 
                              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-yellow-400 shadow-md transform scale-110'
                                : 'bg-red-600 hover:bg-red-500 hover:scale-110'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Energon Enclave section */}
              {(!activeSection || activeSection === 'energon') && (
                <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 p-4 rounded-lg">
                  <h3 className="text-center mb-4 bg-red-800/60 inline-block px-4 py-1 rounded-full text-red-100 mx-auto">Energon Enclave Section</h3>
                  <div className="grid grid-cols-20 gap-1 mb-2">
                    {[...Array(40)].map((_, idx) => {
                      const seat = {
                        id: `energon_${idx}`,
                        name: `Energon ${idx + 1}`,
                        price: 160,
                        section: 'energon',
                        status: idx % 8 === 0 ? 'booked' : 'available'
                      };
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isBooked = seat.status === 'booked';
                      
                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => !isBooked && toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all ${
                            isBooked 
                              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-yellow-400 shadow-md transform scale-110'
                                : 'bg-red-600 hover:bg-red-500 hover:scale-110'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* HBD House Section */}
              {(!activeSection || activeSection === 'HBD House') && (
                <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 p-4 rounded-lg">
                  <h3 className="text-center mb-4 bg-purple-800/60 inline-block px-4 py-1 rounded-full text-orange-100 mx-auto">HBD House Section</h3>
                  <div className="grid grid-cols-10 gap-1 mb-2">
                    {[...Array(40)].map((_, idx) => {
                      const seat = {
                        id: `HBD House_${idx}`,
                        name: `HBD House ${idx + 1}`,
                        price: 80,
                        section: 'HBD House',
                        status: idx % 7 === 0 ? 'booked' : 'available'
                      };
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isBooked = seat.status === 'booked';
                      
                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => !isBooked && toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all ${
                            isBooked 
                              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-yellow-400 shadow-md transform scale-110'
                                : 'bg-purple-600 hover:bg-purple-500 hover:scale-110'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* AusDream Arena Section */}
              {(!activeSection || activeSection === 'AusDream Arena') && (
                <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-4 rounded-lg">
                  <h3 className="text-center mb-4 bg-blue-800/60 inline-block px-4 py-1 rounded-full text-blue-100 mx-auto">AusDream Arena Section</h3>
                  <div className="grid grid-cols-12 gap-1 mb-2">
                    {[...Array(60)].map((_, idx) => {
                      const seat = {
                        id: `AusDream Arena_${idx}`,
                        name: `AusDream Arena ${idx + 1}`,
                        price: 70,
                        section: 'AusDream Arena',
                        status: idx % 9 === 0 ? 'booked' : 'available'
                      };
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isBooked = seat.status === 'booked';
                      
                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => !isBooked && toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all ${
                            isBooked 
                              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-yellow-400 shadow-md transform scale-110'
                                : 'bg-blue-600 hover:bg-blue-500 hover:scale-110'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Century Circle Section */}
              {(!activeSection || activeSection === 'Century Circle') && (
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-4 rounded-lg">
                  <h3 className="text-center mb-4 bg-green-800/60 inline-block px-4 py-1 rounded-full text-green-100 mx-auto">Century Circle Section</h3>
                  <div className="grid grid-cols-30 gap-1 mb-2">
                    {[...Array(60)].map((_, idx) => {
                      const seat = {
                        id: `Century Circle_${idx}`,
                        name: `Century Circle ${idx + 1}`,
                        price: 80,
                        section: 'Century Circle',
                        status: idx % 12 === 0 ? 'booked' : 'available'
                      };
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isBooked = seat.status === 'booked';
                      
                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => !isBooked && toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all ${
                            isBooked 
                              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-yellow-400 shadow-md transform scale-110'
                                : 'bg-green-600 hover:bg-green-500 hover:scale-110'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Gamma Gallery Section */}
              {(!activeSection || activeSection === 'Gamma Gallery') && (
                <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 p-4 rounded-lg">
                  <h3 className="text-center mb-4 bg-yellow-800/60 inline-block px-4 py-1 rounded-full text-yellow-100 mx-auto">Gamma Gallery Section</h3>
                  <div className="grid grid-cols-12 gap-1 mb-2">
                    {[...Array(62)].map((_, idx) => {
                      const seat = {
                        id: `Gamma Gallery_${idx}`,
                        name: `Gamma Gallery ${idx + 1}`,
                        price: 60,
                        section: 'Gamma Gallery',
                        status: idx % 10 === 0 ? 'booked' : 'available'
                      };
                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                      const isBooked = seat.status === 'booked';
                      
                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => !isBooked && toggleSeat(seat)}
                          className={`w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all ${
                            isBooked 
                              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-yellow-400 shadow-md transform scale-110'
                                : 'bg-yellow-600 hover:bg-yellow-500 hover:scale-110'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center mt-6 text-xs text-gray-400">
              Note: Adjust section view by clicking on section buttons above
            </div>
          </div>
          
          {/* Booking Summary */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
            
            {selectedSeats.length > 0 ? (
              <>
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {selectedSeats.map(seat => (
                    <div key={seat.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                      <div>
                        <div className="font-medium">{seat.name}</div>
                        <div className="text-sm text-gray-400">{sections.find(s => s.id === seat.section).name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${seat.price}</div>
                        <button 
                          onClick={() => toggleSeat(seat)}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-300">Subtotal</p>
                    <p className="font-medium">${totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-300">Service Fee</p>
                    <p className="font-medium">$12.00</p>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold mt-4">
                    <p className="text-orange-400">Total</p>
                    <p className="text-orange-400">${(totalPrice + 12).toFixed(2)}</p>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-lg shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
                  Proceed to Checkout
                </button>
                
                <button 
                  onClick={() => setSelectedSeats([])}
                  className="w-full mt-2 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-orange-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">No Seats Selected</h3>
                <p className="text-gray-400">Click on available seats in the seating chart to add them to your booking.</p>
              </div>
            )}
            
            {/* Legend */}
            <div className="mt-6 border-t border-gray-700 pt-4">
              <div className="text-sm font-medium mb-2">Legend:</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-700 opacity-50 rounded"></div>
                  <span className="text-xs text-gray-400">Booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-xs text-gray-400">Selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-xs text-gray-400">VIP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-600 rounded"></div>
                  <span className="text-xs text-gray-400">HBD House</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-xs text-gray-400">AusDream Arena</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-xs text-gray-400">Century Circle</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                  <span className="text-xs text-gray-400">Gamma Gallery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcertSeating;