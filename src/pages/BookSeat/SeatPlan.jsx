import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SeatPlan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const eventDetails = location.state?.event || {};
  const ticketType = location.state?.ticketType || {};
  const quantity = location.state?.quantity || 1;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Define seating sections with their configurations
  const sections = [
    { 
      id: 'vip', 
      name: 'VIP Lounge', 
      price: 200, 
      color: '#FF4500',
      rows: 2,
      seatsPerRow: 20,
      columns: 2,
      requiresContact: true,
      description: 'Premium VIP seating with the best view of the stage. Contact organizer for bookings.'
    },
    { 
      id: 'energon-enclave', 
      name: 'Energon Enclave', 
      price: 160, 
      color: '#FF7E50',
      rows: 3,
      seatsPerRow: 20,
      columns: 2,
      rowStart: 2 // Starting from row C (index 2)
    },
    { 
      id: 'hdb-house', 
      name: 'HDB House', 
      price: 120, 
      color: '#FFA07A',
      rows: 5,
      seatsPerRow: 20,
      columns: 2
    },
    { 
      id: 'ausdream-arena', 
      name: 'AusDream Arena', 
      price: 80, 
      color: '#FFB6C1',
      rows: 8,
      seatsPerRow: 30,
      columns: 2
    },
    { 
      id: 'century-circle', 
      name: 'Century Circle', 
      price: 70, 
      color: '#FFC0CB',
      rows: 8,
      seatsPerRow: 30,
      columns: 2
    },
    { 
      id: 'gamma-gallery', 
      name: 'Gamma Gallery', 
      price: 60, 
      color: '#FFDAB9',
      rows: 13,
      specialLayout: true,
      columnSeats: [
        { start: 1, end: 8 },
        { start: 9, end: 24 },
        { start: 25, end: 38 },
        { start: 39, end: 54 },
        { start: 55, end: 62 }
      ]
    }
  ];
  
  // Row letters for seating
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  
  // Service fee calculation
  const serviceFee = Math.max(12, totalPrice * 0.06); // Minimum $12 or 6% of total
  
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
      // Limit selection to the quantity specified
      if (selectedSeats.length < quantity) {
        setSelectedSeats([...selectedSeats, seat]);
      } else {
        // Replace oldest selection if quantity limit reached
        const newSelection = [...selectedSeats.slice(1), seat];
        setSelectedSeats(newSelection);
      }
    }
  };
  
  // Handle go back
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Handle proceed to checkout
  const handleCheckout = () => {
    navigate('/checkout', { 
      state: { 
        event: eventDetails,
        selectedSeats,
        totalPrice,
        serviceFee,
        grandTotal: totalPrice + serviceFee
      } 
    });
  };
  
  // Handle contact organizer for VIP seats
  const handleContactOrganizer = (section) => {
    navigate('/contact', { 
      state: { 
        subject: `VIP Seating inquiry for ${eventDetails.title || 'the event'}`,
        message: `I'm interested in booking ${section.name} seats for ${eventDetails.title || 'the event'}.`,
        organizer: eventDetails.organizer 
      } 
    });
  };
  
  // Generate a random number for "booked" seats simulation
  const isRandomlyBooked = (section, row, seat) => {
    // Use a deterministic algorithm to create a pattern of booked seats
    return (section.charCodeAt(0) + row * 3 + seat) % 11 === 0;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-full mx-auto bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30">
        {/* Header with event info */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleGoBack}
              className="flex items-center text-white hover:text-orange-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-xl md:text-3xl font-bold text-center flex-1">Select Your Seats</h1>
            <div className="w-12"></div> {/* Spacer for balance */}
          </div>
          
          <div className="text-center mb-2">
            <h2 className="text-lg md:text-2xl font-bold">{eventDetails.title || 'Event'}</h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {eventDetails.date || 'Date TBA'}
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {eventDetails.time || 'Time TBA'}
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {eventDetails.location || 'Location TBA'}
            </div>
          </div>
          
          <div className="mt-2 text-center text-sm md:text-base bg-orange-900 bg-opacity-40 p-2 rounded-lg">
            <p><span className="font-semibold">Selected Ticket:</span> {ticketType.name || 'Regular'} - ${ticketType.price || '0'} each</p>
            <p><span className="font-semibold">Quantity:</span> {quantity} {quantity === 1 ? 'ticket' : 'tickets'}</p>
          </div>
        </div>
        
        {/* Section Selection */}
        <div className="p-4">
          <div className="text-sm text-orange-300 mb-2">Choose a section to view:</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {sections.map(section => (
              <button
                key={section.id}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeSection === section.id 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => toggleSection(section.id)}
              >
                {section.name} - ${section.price}
              </button>
            ))}
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Seat Map Container */}
            <div className="lg:col-span-4 bg-gray-900 rounded-lg border border-gray-700 p-4 overflow-x-auto">
              {/* Stage */}
              <div className="w-full max-w-5xl mx-auto h-12 bg-gradient-to-r from-orange-900 via-orange-600 to-orange-900 rounded-xl flex items-center justify-center mb-8 sticky top-0 z-10">
                <span className="text-orange-100 font-bold tracking-widest">STAGE</span>
              </div>
              
              {/* Seating Layout Container */}
              <div className="w-full max-w-6xl mx-auto pb-4 overflow-x-auto">
                {/* VIP Section (Rows A-B) */}
                {(!activeSection || activeSection === 'vip') && (
                  <div className="mb-8">
                    <h3 className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                        style={{ backgroundColor: sections[0].color }}>
                      {sections[0].name} - ${sections[0].price}
                    </h3>
                    
                    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-orange-300">Premium VIP Section</h4>
                          <p className="text-sm text-gray-300">Rows A-B require direct booking with the event organizer.</p>
                        </div>
                        <button 
                          onClick={() => handleContactOrganizer(sections[0])}
                          className="ml-auto bg-orange-600 hover:bg-orange-500 text-white py-2 px-4 rounded-lg text-sm font-medium"
                        >
                          Contact for VIP Booking
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: 2 }).map((_, rowIndex) => (
                          <div key={`vip-row-${rowIndex}`} className="flex mb-1">
                            {/* Row Label */}
                            <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-orange-400">
                              {rowLetters[rowIndex]}
                            </div>
                            
                            {/* Generate columns */}
                            {Array.from({ length: sections[0].columns }).map((_, colIndex) => (
                              <div key={`vip-row-${rowIndex}-col-${colIndex}`} className="flex space-x-1 mr-4">
                                {/* Generate seats for this column */}
                                {Array.from({ length: sections[0].seatsPerRow }).map((_, seatIndex) => {
                                  // Calculate actual seat number (continuous across columns)
                                  const seatNumber = colIndex * sections[0].seatsPerRow + seatIndex + 1;
                                  
                                  return (
                                    <button
                                      key={`vip-${rowIndex}-${colIndex}-${seatIndex}`}
                                      disabled={true}
                                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium bg-orange-900 opacity-60 cursor-not-allowed"
                                      style={{ fontSize: '0.65rem' }}
                                    >
                                      {seatNumber}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Energon Enclave - Same class as VIP but rows C-E */}
                {(!activeSection || activeSection === 'energon-enclave') && (
                  <div className="mb-8">
                    <h3 className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                        style={{ backgroundColor: sections[1].color }}>
                      {sections[1].name} - ${sections[1].price}
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: 3 }).map((_, idx) => {
                          // Use rowIndex starting from C (index 2)
                          const rowIndex = idx + 2;
                          
                          return (
                            <div key={`energon-row-${idx}`} className="flex mb-1">
                              {/* Row Label */}
                              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-orange-400">
                                {rowLetters[rowIndex]}
                              </div>
                              
                              {/* Generate columns */}
                              {Array.from({ length: sections[1].columns }).map((_, colIndex) => (
                                <div key={`energon-row-${idx}-col-${colIndex}`} className="flex space-x-1 mr-4">
                                  {/* Generate seats for this column */}
                                  {Array.from({ length: sections[1].seatsPerRow }).map((_, seatIndex) => {
                                    // Calculate actual seat number (continuous across columns)
                                    const seatNumber = colIndex * sections[1].seatsPerRow + seatIndex + 1;
                                    const seatId = `energon-enclave_${idx}_${colIndex}_${seatIndex}`;
                                    
                                    // Check if seat is booked (simulated)
                                    const isBooked = isRandomlyBooked('energon', rowIndex, seatNumber);
                                    const isSelected = selectedSeats.some(s => s.id === seatId);
                                    
                                    return (
                                      <button
                                        key={seatId}
                                        disabled={isBooked}
                                        onClick={() => !isBooked && toggleSeat({
                                          id: seatId,
                                          name: `${sections[1].name} ${rowLetters[rowIndex]}${seatNumber}`,
                                          price: sections[1].price,
                                          section: sections[1].id,
                                          row: rowLetters[rowIndex],
                                          number: seatNumber
                                        })}
                                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                          isBooked 
                                            ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                            : isSelected
                                              ? 'bg-yellow-400 text-gray-900 shadow-md transform scale-110'
                                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                        }`}
                                        style={{
                                          backgroundColor: isSelected ? '#FBBF24' : isBooked ? '#374151' : sections[1].color,
                                          fontSize: '0.65rem'
                                        }}
                                      >
                                        {seatNumber}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Section separator */}
                <div className="w-full h-8 my-4 flex items-center justify-center text-xs text-orange-300">
                  <div className="w-4/5 border-b-2 border-dashed border-orange-500 relative">
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">Main Walking Path</span>
                  </div>
                </div>
                
                {/* Standard Sections (HDB House, AusDream, Century Circle) */}
                {sections.slice(2, 5).map((section, sectionIndex) => {
                  // Only render if no active section or this is the active section
                  if (activeSection && activeSection !== section.id) return null;
                  
                  return (
                    <div key={section.id} className="mb-8">
                      <h3 className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                          style={{ backgroundColor: section.color }}>
                        {section.name} - ${section.price}
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <div className="inline-block min-w-full">
                          {Array.from({ length: section.rows }).map((_, rowIndex) => (
                            <div key={`${section.id}-row-${rowIndex}`} className="flex mb-1">
                              {/* Row Label */}
                              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-orange-400">
                                {rowLetters[rowIndex]}
                              </div>
                              
                              {/* Generate columns */}
                              {Array.from({ length: section.columns }).map((_, colIndex) => (
                                <div key={`${section.id}-row-${rowIndex}-col-${colIndex}`} className="flex space-x-1 mr-4">
                                  {/* Generate seats for this column */}
                                  {Array.from({ length: section.seatsPerRow }).map((_, seatIndex) => {
                                    // Calculate actual seat number (continuous across columns)
                                    const seatNumber = colIndex * section.seatsPerRow + seatIndex + 1;
                                    const seatId = `${section.id}_${rowIndex}_${colIndex}_${seatIndex}`;
                                    
                                    // Check if seat is booked (simulated)
                                    const isBooked = isRandomlyBooked(section.id, rowIndex, seatNumber);
                                    const isSelected = selectedSeats.some(s => s.id === seatId);
                                    
                                    return (
                                      <button
                                        key={seatId}
                                        disabled={isBooked}
                                        onClick={() => !isBooked && toggleSeat({
                                          id: seatId,
                                          name: `${section.name} ${rowLetters[rowIndex]}${seatNumber}`,
                                          price: section.price,
                                          section: section.id,
                                          row: rowLetters[rowIndex],
                                          number: seatNumber
                                        })}
                                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                          isBooked 
                                            ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                            : isSelected
                                              ? 'bg-yellow-400 text-gray-900 shadow-md transform scale-110'
                                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                        }`}
                                        style={{
                                          backgroundColor: isSelected ? '#FBBF24' : isBooked ? '#374151' : section.color,
                                          fontSize: '0.65rem'
                                        }}
                                      >
                                        {seatNumber}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Section separator */}
                      {sectionIndex < sections.length - 3 && (
                        <div className="w-full h-4 my-3 flex items-center justify-center text-xs text-orange-300">
                          <div className="w-4/5 border-b border-dashed border-orange-500 relative">
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">Walking Path</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Special Gamma Gallery Section */}
                {(!activeSection || activeSection === 'gamma-gallery') && (
                  <div className="mb-4">
                    <h3 className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
                        style={{ backgroundColor: sections[5].color }}>
                      {sections[5].name} - ${sections[5].price}
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full">
                        {Array.from({ length: sections[5].rows }).map((_, rowIndex) => (
                          <div key={`gamma-row-${rowIndex}`} className="flex mb-1">
                            {/* Row Label */}
                            <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-orange-400">
                              {rowLetters[rowIndex]}
                            </div>
                            
                            {/* Generate special column layout */}
                            {sections[5].columnSeats.map((column, colIndex) => (
                              <div key={`gamma-row-${rowIndex}-col-${colIndex}`} className="flex space-x-1 mr-4">
                                {/* Generate seats for this column */}
                                {Array.from({ length: column.end - column.start + 1 }).map((_, seatIndex) => {
                                  const seatNumber = column.start + seatIndex;
                                  const seatId = `gamma-gallery_${rowIndex}_${colIndex}_${seatIndex}`;
                                  
                                  // Check if seat is booked (simulated)
                                  const isBooked = isRandomlyBooked('gamma', rowIndex, seatNumber);
                                  const isSelected = selectedSeats.some(s => s.id === seatId);
                                  
                                  return (
                                    <button
                                      key={seatId}
                                      disabled={isBooked}
                                      onClick={() => !isBooked && toggleSeat({
                                        id: seatId,
                                        name: `Gamma Gallery ${rowLetters[rowIndex]}${seatNumber}`,
                                        price: sections[5].price,
                                        section: 'gamma-gallery',
                                        row: rowLetters[rowIndex],
                                        number: seatNumber
                                      })}
                                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                        isBooked 
                                          ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                          : isSelected
                                            ? 'bg-yellow-400 text-gray-900 shadow-md transform scale-110'
                                            : `hover:bg-opacity-80 hover:transform hover:scale-105`
                                      }`}
                                      style={{
                                        backgroundColor: isSelected ? '#FBBF24' : isBooked ? '#374151' : sections[5].color,
                                        fontSize: '0.6rem'
                                      }}
                                    >
                                      {seatNumber}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="text-sm font-medium mb-2">Legend:</div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-900 opacity-60 rounded"></div>
                    <span className="text-xs text-gray-400">VIP (Contact Organizer)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-700 opacity-50 rounded"></div>
                    <span className="text-xs text-gray-400">Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-xs text-gray-400">Selected</span>
                  </div>
                  {sections.slice(1).map(section => (
                    <div key={`legend-${section.id}`} className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: section.color }}></div>
                      <span className="text-xs text-gray-400">{section.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Booking Summary */}
            <div className="lg:col-span-1 bg-gray-900 rounded-lg p-4 border border-gray-700 h-fit sticky top-4">
              <h2 className="text-xl font-bold mb-4">Your Selection</h2>
              
              {selectedSeats.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
                    {selectedSeats.map(seat => (
                      <div key={seat.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <div>
                          <div className="font-medium">{seat.name}</div>
                          <div className="text-sm text-gray-400">Row {seat.row}, Seat {seat.number}</div>
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
                      <p className="font-medium">${serviceFee.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold mt-4">
                      <p className="text-orange-400">Total</p>
                      <p className="text-orange-400">${(totalPrice + serviceFee).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={selectedSeats.length === 0}
                    className={`w-full py-3 ${
                      selectedSeats.length === 0 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:shadow-orange-500/30 transform hover:-translate-y-0.5'
                    } text-white font-bold rounded-lg shadow-lg transition-all duration-300`}
                  >
                    {selectedSeats.length < quantity ? `Select ${quantity - selectedSeats.length} More` : 'Proceed to Checkout'}
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
                  <p className="text-gray-400">Please select {quantity} {quantity === 1 ? 'seat' : 'seats'} from the seating chart.</p>
                  
                  <div className="mt-6 text-sm text-gray-500">
                    <p>Tip: Click on a section above to focus on that specific seating area.</p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium mb-2">Need Help?</h3>
                <button 
                  onClick={() => navigate('/contact', { 
                    state: { 
                      subject: `Seating inquiry for ${eventDetails.title || 'the event'}`,
                      organizer: eventDetails.organizer 
                    } 
                  })}
                  className="w-full py-2 bg-transparent border border-orange-500 text-orange-400 rounded-lg text-sm hover:bg-orange-500/10 transition-colors"
                >
                  Contact Event Organizer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatPlan;