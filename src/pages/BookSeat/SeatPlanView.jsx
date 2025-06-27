import React from 'react';
import CountdownTimer from "../Dashboard/UserDashboard/CountdownTimer/CountdownTimer";

const SeatPlanView = ({
  // State props
  selectedSeats,
  activeSection,
  isBooking,
  bookingError,
  timerActive,
  showTimeoutModal,
  isReserving,
  reserveSuccess,
  bookedSeatsData,
  isLoadingSeats,
  userData,
  timerStartTime,
  
  // Event and config props
  eventDetails,
  ticketType,
  quantity,
  mode,
  sellerId,
  sections,
  rowLetters,
  totalPrice,
  
  // Handler functions
  handleTimerExpire,
  handleTimeoutOk,
  handleExtendTime,
  handleGoBack,
  toggleSection,
  toggleSeat,
  handleCheckout,
  handleContactOrganizer,
  formatEventDate,
  formatEventTime,
  isSeatBooked,
  setSelectedSeats,
  navigate
}) => {

  // Judges table component
  const JudgesTable = () => (
    <div className="flex flex-col items-center my-4">
      <div className="text-xs text-orange-300 mb-1">Judges Panel</div>
      <div className="flex flex-col items-center">
        {/* Table */}
        <div className="h-6 w-40 bg-gray-600 rounded-t-md flex items-center justify-center">
          {/* Laptops on the table */}
          <div className="flex justify-around w-full px-2">
            <div className="w-6 h-4 bg-gray-800 rounded"></div>
            <div className="w-6 h-4 bg-gray-800 rounded"></div>
            <div className="w-6 h-4 bg-gray-800 rounded"></div>
          </div>
        </div>
        {/* Chairs */}
        <div className="flex justify-around w-40 px-2">
          <div className="w-6 h-3 bg-gray-700 rounded-b-md"></div>
          <div className="w-6 h-3 bg-gray-700 rounded-b-md"></div>
          <div className="w-6 h-3 bg-gray-700 rounded-b-md"></div>
        </div>
      </div>
    </div>
  );

  // Entrance door component
  const EntranceDoor = () => (
    <div className="absolute" style={{ left: "0px", top: "40%" }}>
      <div className="flex items-center">
        <div className="border-2 border-orange-500 rounded-md p-1 bg-gray-800 shadow-lg flex flex-col items-center">
          <div className="flex flex-col items-center"></div>
          <div
            className="text-xs text-orange-300 font-bold mt-1 writing-mode-vertical"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            ENTRANCE
          </div>
        </div>
      </div>
    </div>
  );

  // Success Modal for Reserve (This should not show anymore since we use same booking process)
  const ReserveSuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg border border-green-500 max-w-md mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-green-400 mb-2">
            Booking Successful!
          </h3>
          <p className="text-gray-300 mb-6">
            You have successfully booked {selectedSeats.length} seats.
            Proceeding to checkout for payment.
          </p>
          <p className="text-sm text-gray-400">
            Redirecting to checkout...
          </p>
        </div>
      </div>
    </div>
  );

  // Loading component
  const LoadingSeats = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <span className="ml-2 text-gray-400">Loading seat availability...</span>
    </div>
  );

  // Timeout Modal
  const TimeoutModal = () => (
    <div
      className="fixed left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ top: "88px" }}
    >
      <div className="bg-gray-800 p-6 rounded-lg border border-red-500 max-w-md mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-400 mb-2">
            Session Expired
          </h3>
          <p className="text-gray-300 mb-6">
            Your seat selection session has expired. Your selected seats
            have been released.
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={handleTimeoutOk}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // VIP Section Component
  const VIPSection = () => (
    <div className="mb-8">
      <h3
        className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
        style={{ backgroundColor: sections[0].color }}
      >
        {sections[0].name} - ${sections[0].price}
      </h3>

      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-red-300">
              Premium VIP Section
            </h4>
            <p className="text-sm text-gray-300">
              Rows A-B require direct booking with the event organizer.
            </p>
          </div>
          <button
            onClick={() => handleContactOrganizer(sections[0])}
            className="ml-auto bg-red-600 hover:bg-red-500 text-white cursor-pointer py-2 px-4 rounded-lg text-sm font-medium"
          >
            Contact for VIP Booking
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {Array.from({ length: 2 }).map((_, rowIndex) => (
            <div key={`vip-row-${rowIndex}`} className="flex mb-1">
              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-red-400">
                {rowLetters[rowIndex]}
              </div>
              {Array.from({ length: sections[0].columns }).map((_, colIndex) => (
                <div key={`vip-row-${rowIndex}-col-${colIndex}`} className="flex space-x-1 mr-4">
                  {Array.from({ length: sections[0].seatsPerRow }).map((_, seatIndex) => {
                    const seatNumber = colIndex * sections[0].seatsPerRow + seatIndex + 1;
                    return (
                      <button
                        key={`vip-${rowIndex}-${colIndex}-${seatIndex}`}
                        disabled={true}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium bg-red-900 opacity-60 cursor-not-allowed"
                        style={{ fontSize: "0.65rem" }}
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
  );

  // Generic Section Component
  const SectionComponent = ({ section, startRowIndex = 0 }) => (
    <div className="mb-8">
      <h3
        className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
        style={{ backgroundColor: section.color }}
      >
        {section.name} - ${section.price}
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {Array.from({ length: section.rows }).map((_, idx) => {
            const rowIndex = idx + startRowIndex;
            return (
              <div key={`${section.id}-row-${idx}`} className="flex mb-1">
                <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-blue-400">
                  {rowLetters[rowIndex]}
                </div>
                {Array.from({ length: section.columns }).map((_, colIndex) => (
                  <div key={`${section.id}-row-${idx}-col-${colIndex}`} className="flex space-x-1 mr-4">
                    {Array.from({ length: section.seatsPerRow }).map((_, seatIndex) => {
                      const seatNumber = colIndex * section.seatsPerRow + seatIndex + 1;
                      const seatId = `${section.id}_${idx}_${colIndex}_${seatIndex}`;
                      
                      const isBooked = isSeatBooked(section.id, rowLetters[rowIndex], seatNumber);
                      const isSelected = selectedSeats.some((s) => s.id === seatId);

                      return (
                        <button
                          key={seatId}
                          disabled={isBooked}
                          onClick={() =>
                            !isBooked &&
                            toggleSeat({
                              id: seatId,
                              name: `${section.name} ${rowLetters[rowIndex]}${seatNumber}`,
                              price: section.price,
                              section: section.id,
                              row: rowLetters[rowIndex],
                              number: seatNumber,
                            })
                          }
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                            isBooked
                              ? "bg-gray-700 opacity-50 cursor-not-allowed"
                              : isSelected
                              ? "bg-yellow-400 text-gray-900 shadow-md transform scale-110"
                              : `hover:bg-opacity-80 hover:transform hover:scale-105`
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? "#FBBF24"
                              : isBooked
                              ? "#374151"
                              : section.color,
                            fontSize: "0.65rem",
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
  );

  // Special Gamma College Zone Section
  const GammaCollegeZoneSection = () => (
    <div className="mb-4">
      <h3
        className="text-center mb-3 inline-block px-3 py-1 rounded-full text-white mx-auto text-sm"
        style={{ backgroundColor: sections[5].color }}
      >
        {sections[5].name} - ${sections[5].price}
      </h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {Array.from({ length: sections[5].rows }).map((_, rowIndex) => (
            <div key={`gamma-row-${rowIndex}`} className="flex mb-1">
              <div className="mr-2 w-6 flex items-center justify-center text-xs font-bold text-red-400">
                {rowLetters[rowIndex]}
              </div>
              {sections[5].columnSeats.map((column, colIndex) => (
                <div key={`gamma-row-${rowIndex}-col-${colIndex}`} className="flex space-x-1 mr-4">
                  {Array.from({ length: column.end - column.start + 1 }).map((_, seatIndex) => {
                    const seatNumber = column.start + seatIndex;
                    const seatId = `gamma-college-zone_${rowIndex}_${colIndex}_${seatIndex}`;
                    
                    const isBooked = isSeatBooked("gamma-college-zone", rowLetters[rowIndex], seatNumber);
                    const isSelected = selectedSeats.some((s) => s.id === seatId);

                    return (
                      <button
                        key={seatId}
                        disabled={isBooked}
                        onClick={() =>
                          !isBooked &&
                          toggleSeat({
                            id: seatId,
                            name: `Gamma College Zone ${rowLetters[rowIndex]}${seatNumber}`,
                            price: sections[5].price,
                            section: "gamma-college-zone",
                            row: rowLetters[rowIndex],
                            number: seatNumber,
                          })
                        }
                        className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                          isBooked
                            ? "bg-gray-700 opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "bg-yellow-400 text-gray-900 shadow-md transform scale-110"
                            : `hover:bg-opacity-80 hover:transform hover:scale-105`
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? "#FBBF24"
                            : isBooked
                            ? "#374151"
                            : sections[5].color,
                          fontSize: "0.6rem",
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
  );

  // Booking Summary Component
  const BookingSummary = () => (
    <div className="lg:col-span-1 bg-gray-900 rounded-lg p-4 border border-gray-700 h-fit sticky top-4">
      <h2 className="text-xl font-bold mb-4">
        {mode === "reserve" ? "Reserve Selection" : "Your Selection"}
      </h2>

      {bookingError && (
        <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 p-3 rounded-md mb-4">
          <p className="text-sm">{bookingError}</p>
        </div>
      )}

      {selectedSeats.length > 0 ? (
        <>
          <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
            {selectedSeats.map((seat) => (
              <div
                key={seat.id}
                className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div>
                  <div className="font-medium">{seat.name}</div>
                  <div className="text-sm text-gray-400">
                    Row {seat.row}, Seat {seat.number}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${seat.price}
                  </div>
                  <button
                    onClick={() => toggleSeat(seat)}
                    className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4 mb-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <p className="text-purple-400">Total</p>
              <p className="text-purple-400">${totalPrice.toFixed(2)}</p>
            </div>
            {mode === "reserve" && (
              <p className="text-sm text-gray-400 mt-2">
                These seats will be reserved for your personal guests at no cost.
              </p>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={selectedSeats.length === 0 || isBooking || isReserving}
            className={`w-full py-3 cursor-pointer ${
              selectedSeats.length === 0 || isBooking || isReserving
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-purple-500/30 transform hover:-translate-y-0.5"
            } text-white font-bold rounded-lg shadow-lg transition-all duration-300`}
          >
            {isReserving
              ? "Processing..."
              : isBooking
              ? "Processing..."
              : selectedSeats.length === 0
              ? "Select Seats"
              : "Proceed to Checkout"}
          </button>

          <button
            onClick={() => setSelectedSeats([])}
            disabled={isBooking || isReserving}
            className="w-full mt-2 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Selection
          </button>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-purple-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-1">No Seats Selected</h3>
          <p className="text-gray-400">
            {mode === "reserve"
              ? "Select seats to reserve as personal guest tickets."
              : "Select seats from the seating chart."}
          </p>
          <div className="mt-6 text-sm text-gray-500">
            <p>Tip: Click on a section above to focus on that specific seating area.</p>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-gray-700 pt-4">
        <h3 className="text-sm font-medium mb-2">Need Help?</h3>
        <button
          onClick={() =>
            navigate("/contact", {
              state: {
                subject: `Seating inquiry for ${eventDetails.title || "the event"}`,
                organizer: eventDetails.organizer,
              },
            })
          }
          className="w-full py-2 bg-transparent border border-purple-500 text-purple-400 rounded-lg text-sm hover:bg-purple-500/10 transition-colors cursor-pointer"
        >
          Contact Event Organizer
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      {/* Timer Component */}
      {timerStartTime && (
        <CountdownTimer
          initialMinutes={10}
          onExpire={handleTimerExpire}
          isActive={timerActive}
          showWarning={true}
          position="fixed"
          startTime={timerStartTime}
        />
      )}

      {/* Modals */}
      {showTimeoutModal && <TimeoutModal />}

      <div className="max-w-full mx-auto bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30">
        {/* Header with event info */}
        <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleGoBack}
              className="flex items-center text-white hover:text-orange-200 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
            <h1 className="text-xl md:text-3xl font-bold text-center flex-1">
              {mode === "reserve"
                ? "Reserve Personal Guest Tickets"
                : "Select Your Seats"}
            </h1>
            <div className="w-12"></div>
          </div>

          <div className="text-center mb-2">
            <h2 className="text-lg md:text-2xl font-bold">
              {eventDetails.title || "Event"}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-1 text-orange-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatEventDate(eventDetails.date)}
            </div>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-1 text-orange-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatEventTime(eventDetails.time)}
            </div>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-1 text-orange-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {eventDetails.location || "Location TBA"}
            </div>
          </div>

          <div className="mt-2 text-center text-sm md:text-base bg-orange-900 bg-opacity-40 p-2 rounded-lg">
            <p>
              <span className="font-semibold">
                {mode === "reserve"
                  ? "Select seats to reserve as personal guest tickets"
                  : "Select your seats below"}
              </span>
            </p>
          </div>
        </div>

        {/* Section Selection */}
        <div className="p-4">
          <div className="text-sm text-orange-300 mb-2">
            Choose a section to view:
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {/* All Button */}
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeSection === null
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => toggleSection(null)}
            >
              All Sections
            </button>
            
            {/* Individual Section Buttons */}
            {sections.map((section) => (
              <button
                key={section.id}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeSection === section.id
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => toggleSection(section.id)}
              >
                {section.name} - ${section.price}
              </button>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoadingSeats && <LoadingSeats />}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Seat Map Container */}
            <div className="lg:col-span-4 bg-gray-900 rounded-lg border border-gray-700 p-4 overflow-x-auto">
              {/* Stage */}
              <div className="w-full max-w-5xl mx-auto h-12 bg-gradient-to-r from-red-900 via-red-600 to-red-900 rounded-xl flex items-center justify-center mb-8 sticky top-0 z-10">
                <span className="text-red-100 font-bold tracking-widest">STAGE</span>
              </div>

              {/* Seating Layout Container */}
              <div className="w-full max-w-6xl mx-auto pb-4 overflow-x-auto">
                {/* Greenfield VIP Zone */}
                {(!activeSection || activeSection === "greenfield-vip-zone") && <VIPSection />}

                {/* Alfa College Zone - Rows C-E */}
                {(!activeSection || activeSection === "alfa-college-zone") && (
                  <SectionComponent section={sections[1]} startRowIndex={2} />
                )}

                {/* Section separator */}
                <div className="w-full h-8 my-4 flex items-center justify-center text-xs text-orange-300">
                  <div className="w-4/5 border-b-2 border-dashed border-orange-500 relative">
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 text-xs">
                      Main Walking Path
                    </span>
                  </div>
                </div>

                {/* Luminedge Zone */}
                {(!activeSection || activeSection === "luminedge-zone") && (
                  <SectionComponent section={sections[2]} startRowIndex={0} />
                )}

                {/* Ample Accounting Zone */}
                {(!activeSection || activeSection === "ample-accounting-zone") && (
                  <SectionComponent section={sections[3]} startRowIndex={0} />
                )}

                {/* BetaWatt Zone */}
                {(!activeSection || activeSection === "betawatt-zone") && (
                  <div className="mb-8 relative pl-6">
                    <EntranceDoor />
                    <SectionComponent section={sections[4]} startRowIndex={0} />
                  </div>
                )}

                {/* Judges' Table */}
                <div className="mt-2 flex justify-center">
                  <JudgesTable />
                </div>

                {/* Gamma College Zone Section */}
                {(!activeSection || activeSection === "gamma-college-zone") && <GammaCollegeZoneSection />}
              </div>

              {/* Legend */}
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="text-sm font-medium mb-2">Legend:</div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-900 opacity-60 rounded"></div>
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
                  <div className="flex items-center space-x-2">
                    <div
                      className="border-2 border-orange-500 rounded-sm p-px bg-gray-800"
                      style={{ width: "16px", height: "16px" }}
                    >
                      <svg
                        className="w-3 h-3 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-400">Entrance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <span className="text-xs text-gray-400">Judges' Table</span>
                  </div>
                  {sections.slice(1).map((section) => (
                    <div key={`legend-${section.id}`} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: section.color }}
                      ></div>
                      <span className="text-xs text-gray-400">{section.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <BookingSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatPlanView;