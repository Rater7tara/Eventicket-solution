import React, { useState } from 'react';

const ConcertSeating = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  
  // Sample data for the sections
  const sections = [
    { id: 'first-class', name: 'First Class', price: 200, color: '#FF4500' },
    { id: 'second-class', name: 'Second Class', price: 160, color: '#FF7E50' },
    { id: 'third-class', name: 'Third Class', price: 120, color: '#FFA07A' },
    { id: 'fourth-class', name: 'Fourth Class', price: 80, color: '#FFB6C1' },
    { id: 'fifth-class', name: 'Fifth Class', price: 60, color: '#FFC0CB' }
  ];
  
  // Row letters for each section
  const rowLetters = {
    'first-class': ['A', 'B', 'C', 'D', 'E'],
    'second-class': ['A', 'B', 'C', 'D', 'E'],
    'third-class': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    'fourth-class': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    'fifth-class': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  };
  
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
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-orange-700 to-orange-900 text-white p-1">
      <div className="mx-auto bg-black bg-opacity-40 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-2">
          <h1 className="text-3xl font-bold">Concert Seating Map</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Grand Harmony Arena
            </p>
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              June 20, 2025
            </p>
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              7:00 PM
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4">
          <div className="md:col-span-5">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4">Select Your Seats</h2>
            
            {/* Section Selection */}
            <div className="mb-4">
              <div className="text-sm text-orange-300 mb-2">Choose a section:</div>
              <div className="flex flex-wrap gap-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
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
            
            {/* Seating Layout Container - No Horizontal Scroll */}
            <div className="relative bg-gray-900 p-4 rounded-lg border border-orange-800">
              {/* Stage */}
              <div className="w-3/4 max-w-2xl mx-auto h-12 bg-gradient-to-r from-orange-900 via-orange-600 to-orange-900 rounded-xl flex items-center justify-center mb-8">
                <span className="text-orange-100 font-bold tracking-widest">STAGE</span>
              </div>
              
              {/* Main Seating Map - Scaled to fit container */}
              <div className="relative w-full">
                {/* First Class Section */}
                {(!activeSection || activeSection === 'first-class') && (
                  <div className="mb-6">
                    <h3 className="text-center mb-3 bg-orange-800 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm">First Class</h3>
                    <div className="flex justify-center space-x-4 scale-[0.95] transform-gpu">
                      {[0, 1].map(colGroup => (
                        <div key={`first-col-${colGroup}`} className="space-y-1">
                          {[0, 1, 2, 3, 4].map(row => (
                            <div key={`first-row-${row}`} className="flex items-center">
                              {/* Row Label */}
                              {colGroup === 0 && (
                                <div className="mr-2 w-6 h-4 flex items-center justify-center text-xs font-bold text-orange-400">
                                  {rowLetters['first-class'][row]}
                                </div>
                              )}
                              
                              <div className="flex space-x-1">
                                {Array(20).fill(0).map((_, seatIndex) => {
                                  const seatId = `first-class_${colGroup}_${row}_${seatIndex}`;
                                  const seatNumber = seatIndex + 1;
                                  const isBooked = (row * seatIndex) % 7 === 0;
                                  const isSelected = selectedSeats.some(s => s.id === seatId);
                                  
                                  return (
                                    <button
                                      key={seatId}
                                      disabled={isBooked}
                                      onClick={() => !isBooked && toggleSeat({
                                        id: seatId,
                                        name: `First Class ${rowLetters['first-class'][row]}${seatNumber}`,
                                        price: 200,
                                        section: 'first-class'
                                      })}
                                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                        isBooked 
                                          ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                          : isSelected
                                            ? 'bg-yellow-400 shadow-md'
                                            : 'bg-orange-600 hover:bg-orange-500'
                                      }`}
                                    >
                                      {seatNumber}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Walking Aisle */}
                <div className="w-full h-4 my-3 flex items-center justify-center text-xs text-orange-300">
                  <div className="w-4/5 border-b border-dashed border-orange-500 relative">
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">Walking Path</span>
                  </div>
                </div>
                
                {/* Second Class Section */}
                {(!activeSection || activeSection === 'second-class') && (
                  <div className="mb-6">
                    <h3 className="text-center mb-3 bg-orange-700 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm">Second Class</h3>
                    <div className="flex justify-center space-x-4 scale-[0.95] transform-gpu">
                      {[0, 1].map(colGroup => (
                        <div key={`second-col-${colGroup}`} className="space-y-1">
                          {[0, 1, 2, 3, 4].map(row => (
                            <div key={`second-row-${row}`} className="flex items-center">
                              {/* Row Label */}
                              {colGroup === 0 && (
                                <div className="mr-2 w-6 h-4 flex items-center justify-center text-xs font-bold text-orange-400">
                                  {rowLetters['second-class'][row]}
                                </div>
                              )}
                              
                              <div className="flex space-x-1">
                                {Array(20).fill(0).map((_, seatIndex) => {
                                  const seatId = `second-class_${colGroup}_${row}_${seatIndex}`;
                                  const seatNumber = seatIndex + 1;
                                  const isBooked = (row * seatIndex) % 9 === 0;
                                  const isSelected = selectedSeats.some(s => s.id === seatId);
                                  
                                  return (
                                    <button
                                      key={seatId}
                                      disabled={isBooked}
                                      onClick={() => !isBooked && toggleSeat({
                                        id: seatId,
                                        name: `Second Class ${rowLetters['second-class'][row]}${seatNumber}`,
                                        price: 160,
                                        section: 'second-class'
                                      })}
                                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                        isBooked 
                                          ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                          : isSelected
                                            ? 'bg-yellow-400 shadow-md'
                                            : 'bg-orange-500 hover:bg-orange-400'
                                      }`}
                                    >
                                      {seatNumber}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Wider Walking Aisle */}
                <div className="w-full h-8 my-4 flex items-center justify-center text-xs text-orange-300">
                  <div className="w-4/5 border-b-2 border-dashed border-orange-500 relative">
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">Main Walking Path</span>
                  </div>
                </div>
                
                {/* Judges Table */}
                <div className="flex justify-center">
                  <div className="bg-orange-800 p-3 rounded-lg text-center">
                    <div className="bg-orange-900 w-24 h-10 rounded flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-white">Judges Table</span>
                    </div>
                    <div className="flex justify-center space-x-3">
                      {[1, 2, 3].map(chair => (
                        <div key={`chair-${chair}`} className="w-6 h-6 bg-orange-700 rounded-full flex items-center justify-center text-xs">
                          {chair}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Third Class Section */}
                {(!activeSection || activeSection === 'third-class') && (
                  <div className="mb-6">
                    <h3 className="text-center mb-3 bg-orange-600 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm">Third Class</h3>
                    <div className="flex justify-center space-x-4 scale-90 transform-gpu">
                      {[0, 1].map(colGroup => (
                        <div key={`third-col-${colGroup}`} className="space-y-1">
                          {[0, 1, 2, 3, 4, 5, 6, 7].map(row => (
                            <div key={`third-row-${row}`} className="flex items-center">
                              {/* Row Label */}
                              {colGroup === 0 && (
                                <div className="mr-2 w-6 h-3 flex items-center justify-center text-xs font-bold text-orange-400">
                                  {rowLetters['third-class'][row]}
                                </div>
                              )}
                              
                              <div className="flex space-x-1">
                                {Array(30).fill(0).map((_, seatIndex) => {
                                  const seatId = `third-class_${colGroup}_${row}_${seatIndex}`;
                                  const seatNumber = seatIndex + 1;
                                  const isBooked = (row * seatIndex) % 11 === 0;
                                  const isSelected = selectedSeats.some(s => s.id === seatId);
                                  
                                  return (
                                    <button
                                      key={seatId}
                                      disabled={isBooked}
                                      onClick={() => !isBooked && toggleSeat({
                                        id: seatId,
                                        name: `Third Class ${rowLetters['third-class'][row]}${seatNumber}`,
                                        price: 120,
                                        section: 'third-class'
                                      })}
                                      className={`w-4 h-4 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                        isBooked 
                                          ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                          : isSelected
                                            ? 'bg-yellow-400 shadow-md'
                                            : 'bg-orange-400 hover:bg-orange-300'
                                      }`}
                                    >
                                      &nbsp;
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Walking Aisle */}
                <div className="w-full h-4 my-3 flex items-center justify-center text-xs text-orange-300">
                  <div className="w-4/5 border-b border-dashed border-orange-500 relative">
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">Walking Path</span>
                  </div>
                </div>
                
                {/* Fourth Class Section with Entrance Gate */}
                {(!activeSection || activeSection === 'fourth-class') && (
                  <div className="mb-6 relative">
                    {/* Small Left Side Entrance Gate */}
                    <div className="absolute -left-12 top-52 transform -translate-y-1/2 bg-orange-900 p-1 rounded-r text-xs border-r-2 border-yellow-500 z-10">
                      <span className="font-bold text-yellow-300 rotate-90 inline-block">ENTRANCE</span>
                    </div>
                    
                    <h3 className="text-center mb-3 bg-orange-500 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm">Fourth Class</h3>
                    <div className="flex justify-center space-x-4 scale-90 transform-gpu">
                      {[0, 1].map(colGroup => (
                        <div key={`fourth-col-${colGroup}`} className="space-y-1">
                          {[0, 1, 2, 3, 4, 5, 6, 7].map(row => (
                            <div key={`fourth-row-${row}`} className="flex items-center">
                              {/* Row Label */}
                              {colGroup === 0 && (
                                <div className="mr-2 w-6 h-3 flex items-center justify-center text-xs font-bold text-orange-400">
                                  {rowLetters['fourth-class'][row]}
                                </div>
                              )}
                              
                              <div className="flex space-x-1">
                                {Array(30).fill(0).map((_, seatIndex) => {
                                  const seatId = `fourth-class_${colGroup}_${row}_${seatIndex}`;
                                  const seatNumber = seatIndex + 1;
                                  const isBooked = (row * seatIndex) % 13 === 0;
                                  const isSelected = selectedSeats.some(s => s.id === seatId);
                                  
                                  return (
                                    <button
                                      key={seatId}
                                      disabled={isBooked}
                                      onClick={() => !isBooked && toggleSeat({
                                        id: seatId,
                                        name: `Fourth Class ${rowLetters['fourth-class'][row]}${seatNumber}`,
                                        price: 80,
                                        section: 'fourth-class'
                                      })}
                                      className={`w-4 h-4 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                        isBooked 
                                          ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                          : isSelected
                                            ? 'bg-yellow-400 shadow-md'
                                            : 'bg-orange-300 hover:bg-orange-200 hover:text-gray-800'
                                      }`}
                                    >
                                      &nbsp;
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Walking Aisle */}
                <div className="w-full h-4 my-3 flex items-center justify-center text-xs text-orange-300">
                  <div className="w-4/5 border-b border-dashed border-orange-500 relative">
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">Walking Path</span>
                  </div>
                </div>
                
                
                {/* Fifth Class Section with varying column sizes */}
                {(!activeSection || activeSection === 'fifth-class') && (
                  <div className="mb-4">
                    <h3 className="text-center mb-3 bg-orange-400 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm">Fifth Class</h3>
                    <div className="flex justify-center scale-90 transform-gpu">
                      <div className="flex">
                        {/* Column 1: 1-8 seats */}
                        <div className="space-y-1">
                          {Array(12).fill(0).map((_, rowIndex) => (
                            <div key={`fifth-row-${rowIndex}-col-1`} className="flex items-center">
                              {/* Row Label */}
                              <div className="mr-2 w-6 h-3 flex items-center justify-center text-xs font-bold text-orange-400">
                                {rowLetters['fifth-class'][rowIndex]}
                              </div>
                              
                              <div className="flex space-x-1">
                                {Array(8).fill(0).map((_, seatIndex) => {
                                  const seatId = `fifth-class_1_${rowIndex}_${seatIndex}`;
                                  const seatNumber = seatIndex + 1;
                                  const isBooked = (rowIndex + seatIndex) % 10 === 0;
                                  const isSelected = selectedSeats.some(s => s.id === seatId);
                                  
                                  return (
                                    <button
                                      key={seatId}
                                      disabled={isBooked}
                                      onClick={() => !isBooked && toggleSeat({
                                        id: seatId,
                                        name: `Fifth Class ${rowLetters['fifth-class'][rowIndex]}${seatNumber}`,
                                        price: 60,
                                        section: 'fifth-class'
                                      })}
                                      className={`w-4 h-4 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                        isBooked 
                                          ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                          : isSelected
                                            ? 'bg-yellow-400 shadow-md'
                                            : 'bg-orange-200 hover:bg-orange-100 hover:text-gray-800'
                                      }`}
                                    >
                                      &nbsp;
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Walking path indicator */}
                        <div className="w-1 bg-orange-900/20 rounded-full flex items-center mx-1">
                          <div className="w-full h-full border-l border-dashed border-orange-500"></div>
                        </div>
                        
                        {/* Column 2: 9-24 seats */}
                        <div className="space-y-1">
                          {Array(12).fill(0).map((_, rowIndex) => (
                            <div key={`fifth-row-${rowIndex}-col-2`} className="flex space-x-1">
                              {Array(16).fill(0).map((_, seatIndex) => {
                                const seatId = `fifth-class_2_${rowIndex}_${seatIndex}`;
                                const seatNumber = seatIndex + 9;
                                const isBooked = (rowIndex + seatIndex) % 10 === 0;
                                const isSelected = selectedSeats.some(s => s.id === seatId);
                                
                                return (
                                  <button
                                    key={seatId}
                                    disabled={isBooked}
                                    onClick={() => !isBooked && toggleSeat({
                                      id: seatId,
                                      name: `Fifth Class ${rowLetters['fifth-class'][rowIndex]}${seatNumber}`,
                                      price: 60,
                                      section: 'fifth-class'
                                    })}
                                    className={`w-4 h-4 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                      isBooked 
                                        ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                        : isSelected
                                          ? 'bg-yellow-400 shadow-md'
                                          : 'bg-orange-200 hover:bg-orange-100 hover:text-gray-800'
                                    }`}
                                  >
                                    &nbsp;
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        
                        {/* Walking path indicator */}
                        <div className="w-1 bg-orange-900/20 rounded-full flex items-center mx-1">
                          <div className="w-full h-full border-l border-dashed border-orange-500"></div>
                        </div>
                        
                        {/* Column 3: 25-38 seats */}
                        <div className="space-y-1">
                          {Array(12).fill(0).map((_, rowIndex) => (
                            <div key={`fifth-row-${rowIndex}-col-3`} className="flex space-x-1">
                              {Array(14).fill(0).map((_, seatIndex) => {
                                const seatId = `fifth-class_3_${rowIndex}_${seatIndex}`;
                                const seatNumber = seatIndex + 25;
                                const isBooked = (rowIndex + seatIndex) % 10 === 0;
                                const isSelected = selectedSeats.some(s => s.id === seatId);
                                
                                return (
                                  <button
                                    key={seatId}
                                    disabled={isBooked}
                                    onClick={() => !isBooked && toggleSeat({
                                      id: seatId,
                                      name: `Fifth Class ${rowLetters['fifth-class'][rowIndex]}${seatNumber}`,
                                      price: 60,
                                      section: 'fifth-class'
                                    })}
                                    className={`w-4 h-4 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                      isBooked 
                                        ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                        : isSelected
                                          ? 'bg-yellow-400 shadow-md'
                                          : 'bg-orange-200 hover:bg-orange-100 hover:text-gray-800'
                                    }`}
                                  >
                                    &nbsp;
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        
                        {/* Walking path indicator */}
                        <div className="w-1 bg-orange-900/20 rounded-full flex items-center mx-1">
                          <div className="w-full h-full border-l border-dashed border-orange-500"></div>
                        </div>
                        
                        {/* Column 4: 39-54 seats */}
                        <div className="space-y-1">
                          {Array(12).fill(0).map((_, rowIndex) => (
                            <div key={`fifth-row-${rowIndex}-col-4`} className="flex space-x-1">
                              {Array(16).fill(0).map((_, seatIndex) => {
                                const seatId = `fifth-class_4_${rowIndex}_${seatIndex}`;
                                const seatNumber = seatIndex + 39;
                                const isBooked = (rowIndex + seatIndex) % 10 === 0;
                                const isSelected = selectedSeats.some(s => s.id === seatId);
                                
                                return (
                                  <button
                                    key={seatId}
                                    disabled={isBooked}
                                    onClick={() => !isBooked && toggleSeat({
                                      id: seatId,
                                      name: `Fifth Class ${rowLetters['fifth-class'][rowIndex]}${seatNumber}`,
                                      price: 60,
                                      section: 'fifth-class'
                                    })}
                                    className={`w-4 h-4 rounded flex items-center justify-center text-xs font-medium transition-all ${
                                      isBooked 
                                        ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                                        : isSelected
                                          ? 'bg-yellow-400 shadow-md'
                                          : 'bg-orange-200 hover:bg-orange-100 hover:text-gray-800'
                                    }`}
                                  >
                                    &nbsp;
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center mt-4 text-xs text-gray-400">
                <p>Adjust section view by clicking on section buttons above</p>
                <p className="mt-1">Spaces between columns and rows represent walking paths for attendees</p>
              </div>
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
                        <div className="text-sm text-gray-400">{seat.section.replace("-", " ")}</div>
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
                  <div className="w-4 h-4 bg-orange-600 rounded"></div>
                  <span className="text-xs text-gray-400">First Class</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-400">Second Class</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span className="text-xs text-gray-400">Third Class</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-300 rounded"></div>
                  <span className="text-xs text-gray-400">Fourth Class</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-200 rounded"></div>
                  <span className="text-xs text-gray-400">Fifth Class</span>
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