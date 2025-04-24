import React, { useState, useEffect } from 'react';

const BookSeat = () => {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Option 1: Fetch from a local JSON file
        const response = await fetch('theaterSeating.json');
        
        // Option 2: Hardcode the data if fetch doesn't work
        // If fetch doesn't work, you can uncomment and use this:
        // const hardcodedData = {/* copy the entire JSON here */};
        // setEventData(hardcodedData);
        // setLoading(false);
        // return;
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        setEventData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching theater seating data:", err);
        setError("Failed to load seating chart. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle seat selection
  const handleSeatClick = (rowId, seatId) => {
    const rowIndex = eventData.seatMap.rows.findIndex(row => row.id === rowId);
    const seatIndex = eventData.seatMap.rows[rowIndex].seats.findIndex(seat => seat.id === seatId);
    const seat = eventData.seatMap.rows[rowIndex].seats[seatIndex];

    // Only allow selection of available seats
    if (seat.status === "booked") return;

    // Create a deep copy of the data
    const updatedData = JSON.parse(JSON.stringify(eventData));
    const updatedSeat = updatedData.seatMap.rows[rowIndex].seats[seatIndex];

    // Check if the seat is already selected and toggle accordingly
    if (selectedSeats.some(selectedSeat => selectedSeat.id === seatId)) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(selectedSeat => selectedSeat.id !== seatId));
      setSelectedSeatDetails(null);
    } else {
      // Select seat
      const seatCategoryDetails = eventData.seatCategories.find(
        category => category.id === seat.category
      );
      const newSelectedSeat = {
        ...seat,
        rowName: eventData.seatMap.rows[rowIndex].name,
        price: seatCategoryDetails.price,
        categoryName: seatCategoryDetails.name,
        categoryColor: seatCategoryDetails.color
      };
      setSelectedSeats([...selectedSeats, newSelectedSeat]);
      setSelectedSeatDetails(newSelectedSeat);
    }

    setEventData(updatedData);
  };

  // Calculate total price when selected seats change
  useEffect(() => {
    const newTotalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    setTotalPrice(newTotalPrice);
  }, [selectedSeats]);

  // Get a category's details by its ID
  const getCategoryById = (categoryId) => {
    return eventData.seatCategories.find(category => category.id === categoryId);
  };

  // Get the CSS class for a seat based on its status and category
  const getSeatClass = (seat, isSelected) => {
    const category = getCategoryById(seat.category);
    
    if (seat.status === "booked") {
      return "bg-gray-400 cursor-not-allowed opacity-50";
    }
    
    if (isSelected) {
      return "bg-yellow-400 border-yellow-600";
    }
    
    // Apply active filter
    if (activeCategoryFilter && seat.category !== activeCategoryFilter) {
      return `opacity-30 hover:opacity-60 cursor-pointer transition-all duration-200`;
    }
    
    return `hover:opacity-80 hover:scale-110 cursor-pointer transition-all duration-200`;
  };

  // Get the background color style for a seat
  const getSeatStyle = (seat, isSelected) => {
    const category = getCategoryById(seat.category);
    
    if (seat.status === "booked") {
      return {};
    }
    
    if (isSelected) {
      return {};
    }
    
    return { backgroundColor: category.color };
  };

  // Filter seats by category
  const filterByCategory = (categoryId) => {
    if (activeCategoryFilter === categoryId) {
      setActiveCategoryFilter(null); // Toggle off if already active
    } else {
      setActiveCategoryFilter(categoryId);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomLevel < 1.5) setZoomLevel(prev => prev + 0.1);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.8) setZoomLevel(prev => prev - 0.1);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading seating chart...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Seating Chart</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-2 sm:px-4 lg:px-6 text-white">
      <div className="max-w-7xl mx-auto bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6">
          <h1 className="text-3xl font-bold">{eventData.eventName}</h1>
          <div className="flex flex-wrap gap-4 mt-2">
            <p>{eventData.venue}</p>
            <p>•</p>
            <p>{new Date(eventData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>•</p>
            <p>{eventData.time}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Seat Map Section - Takes 3 columns on large screens */}
          <div className="lg:col-span-3 p-6 border-r border-gray-700 bg-gray-900 relative">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-orange-400">Select Your Seats</h2>
                
                {/* Zoom Controls */}
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleZoomOut}
                    className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-full text-white hover:bg-orange-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button 
                    onClick={handleResetZoom}
                    className="text-xs text-gray-300 hover:text-white transition-colors"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={handleZoomIn}
                    className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-full text-white hover:bg-orange-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Seat Categories Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {eventData.seatCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => filterByCategory(category.id)}
                    className={`flex items-center px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      activeCategoryFilter === category.id 
                        ? 'bg-gray-800 border-orange-500 shadow-lg shadow-orange-500/20' 
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm">{category.name} - ${category.price}</span>
                  </button>
                ))}
                <div className="flex items-center px-3 py-1.5 rounded-full border border-gray-700">
                  <div className="w-3 h-3 rounded-full mr-2 bg-gray-400 opacity-50"></div>
                  <span className="text-sm">Booked</span>
                </div>
                <div className="flex items-center px-3 py-1.5 rounded-full border border-gray-700">
                  <div className="w-3 h-3 rounded-full mr-2 bg-yellow-400"></div>
                  <span className="text-sm">Selected</span>
                </div>
              </div>

              {/* Stage and Seats Container */}
              <div className="relative pt-8 pb-16 overflow-x-auto">
                {/* Movie Theater Room Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-lg"></div>
                
                <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} className="relative transition-transform duration-300">
                  {/* Stage */}
                  <div className="relative mb-16">
                    {/* Stage lights */}
                    <div className="absolute -top-6 left-0 right-0 flex justify-around">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-2 h-8 bg-gray-800 relative before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-3 before:h-3 before:bg-orange-400 before:rounded-full before:blur-sm before:animate-pulse"></div>
                      ))}
                    </div>
                    
                    {/* Main stage */}
                    <div className="w-5/6 mx-auto h-16 perspective-stage relative">
                      {/* Stage front face */}
                      <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-orange-900 via-orange-800 to-orange-900 rounded-t-xl border-t-2 border-orange-700 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.7)]">
                        <div className="flex items-center justify-center h-full">
                          <span className="text-orange-300 font-bold text-lg tracking-wider drop-shadow-lg">STAGE</span>
                        </div>
                      </div>
                      
                      {/* Stage top face */}
                      <div className="absolute top-0 left-0 right-0 h-8 bg-orange-800 transform -translate-y-8 rotatex-70 origin-bottom rounded-lg border-t border-orange-700"></div>
                    </div>
                    
                    {/* Floor gradients in front of stage */}
                    <div className="h-8 w-full bg-gradient-to-b from-orange-900/20 to-transparent mt-0"></div>
                  </div>

                  {/* Seat Map */}
                  <div className="space-y-6 mx-auto text-center">
                    {eventData.seatMap.rows.map((row, rowIdx) => (
                      <div key={row.id} className="flex items-center justify-center group">
                        <div className="w-10 text-right pr-3 font-medium text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
                          {row.name}
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap" style={{ 
                          // Make rows appear as a curved theater
                          transform: `perspective(1000px) rotateX(${5 + rowIdx * 0.5}deg)`,
                          maxWidth: `${Math.min(100, 70 + rowIdx * 5)}%`,
                        }}>
                          {row.seats.map((seat) => {
                            const isSelected = selectedSeats.some(s => s.id === seat.id);
                            return (
                              <button
                                key={seat.id}
                                disabled={seat.status === "booked"}
                                onClick={() => handleSeatClick(row.id, seat.id)}
                                className={`w-7 h-7 m-0.5 rounded-t-lg border-b-0 text-xs font-medium flex items-center justify-center transition-all duration-300 relative seat-3d ${
                                  isSelected ? 'scale-110 z-10' : ''
                                } ${getSeatClass(seat, isSelected)}`}
                                style={{
                                  ...getSeatStyle(seat, isSelected),
                                  boxShadow: isSelected ? '0 0 8px rgba(250, 204, 21, 0.7)' : 'none'
                                }}
                                title={`${row.name}${seat.number} - ${getCategoryById(seat.category).name}`}
                              >
                                {seat.number}
                                <div className="absolute top-full left-0 right-0 h-1.5 bg-gray-800"></div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                
                  {/* Front row identifier */}
                  {/* <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-md px-3 py-1 opacity-80">
                    <span className="text-orange-300 text-xs">SCREEN</span>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary Section */}
          <div className="p-6 bg-gray-800">
            <h2 className="text-2xl font-bold text-orange-400 mb-6">Booking Summary</h2>
            
            {selectedSeats.length > 0 ? (
              <>
                <div className="space-y-3 mb-6">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-orange-500 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-md"
                          style={{ backgroundColor: seat.categoryColor }}
                        >
                          {seat.rowName}{seat.number}
                        </div>
                        <div>
                          <p className="font-medium text-white">{seat.categoryName}</p>
                          <p className="text-sm text-gray-400">Row {seat.rowName}, Seat {seat.number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">${seat.price}</p>
                        <button 
                          onClick={() => setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))}
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
                    <p className="font-medium text-white">${totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-300">Booking Fee</p>
                    <p className="font-medium text-white">$5.00</p>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold mt-4">
                    <p className="text-orange-400">Total</p>
                    <p className="text-orange-400">${(totalPrice + 5).toFixed(2)}</p>
                  </div>
                </div>

                <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-0.5">
                  Proceed to Payment
                </button>
                
                <button className="w-full mt-2 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                  Clear Selection
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 text-orange-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No Seats Selected</h3>
                <p className="text-gray-400">Click on available seats in the seating chart to add them to your booking.</p>
              </div>
            )}

            {/* Selected Seat Details */}
            {selectedSeatDetails && (
              <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-orange-600/30">
                <h3 className="font-medium text-orange-300 mb-3">Selected Seat Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Category:</div>
                  <div className="font-medium text-white">{selectedSeatDetails.categoryName}</div>
                  <div className="text-gray-400">Location:</div>
                  <div className="font-medium text-white">Row {selectedSeatDetails.rowName}, Seat {selectedSeatDetails.number}</div>
                  <div className="text-gray-400">Price:</div>
                  <div className="font-medium text-white">${selectedSeatDetails.price}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* CSS for 3D effects */}
      <style jsx>{`
        .perspective-stage {
          perspective: 1000px;
        }
        
        .rotatex-70 {
          transform: rotateX(70deg);
        }
        
        .seat-3d {
          position: relative;
          transform-style: preserve-3d;
          transform: perspective(100px) rotateX(10deg);
        }
        
        .seat-3d:hover {
          transform: perspective(100px) rotateX(5deg) scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default BookSeat;