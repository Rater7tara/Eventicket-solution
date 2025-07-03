import React, { useState, useEffect, useContext } from 'react';

import serverURL from '../../../../ServerConfig';
import { AuthContext } from '../../../../providers/AuthProvider';

const MyReservation = () => {
  const authContext = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [groupedReservations, setGroupedReservations] = useState({});
  const [eventDetails, setEventDetails] = useState({}); // Add this state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingIds, setCancellingIds] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  // Fetch reservations on component mount
  useEffect(() => {
    fetchReservations();
  }, []);

  // Group reservations by event when reservations change
  useEffect(() => {
    if (reservations.length > 0) {
      groupReservationsByEvent();
      fetchEventDetails();
    }
  }, [reservations]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = (authContext && authContext.authToken) || 
                    localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token required. Please login again.");
      }

      const response = await fetch(`${serverURL.url}orders/my-reservations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch reservations");
      }

      if (data.success) {
        setReservations(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch reservations");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError(error.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to fetch event details
  const fetchEventDetails = async () => {
    try {
      const token = (authContext && authContext.authToken) || 
                    localStorage.getItem("auth-token");

      if (!token) return;

      // Get unique event IDs
      const uniqueEventIds = [...new Set(reservations.map(r => r.eventId))];
      
      const eventDetailsPromises = uniqueEventIds.map(async (eventId) => {
        try {
          const response = await fetch(`${serverURL.url}events/${eventId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          const data = await response.json();
          
          if (response.ok && data.success) {
            return { eventId, eventData: data.data };
          } else {
            return { eventId, eventData: null };
          }
        } catch (error) {
          console.error(`Error fetching event ${eventId}:`, error);
          return { eventId, eventData: null };
        }
      });

      const eventResults = await Promise.all(eventDetailsPromises);
      
      const eventDetailsMap = {};
      eventResults.forEach(({ eventId, eventData }) => {
        eventDetailsMap[eventId] = eventData;
      });

      setEventDetails(eventDetailsMap);
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  const groupReservationsByEvent = () => {
    const grouped = {};
    
    reservations.forEach(reservation => {
      const eventId = reservation.eventId;
      if (!grouped[eventId]) {
        grouped[eventId] = {
          eventId: eventId,
          reservations: [],
          totalSeats: 0
        };
      }
      grouped[eventId].reservations.push(reservation);
      grouped[eventId].totalSeats += reservation.seats.length;
    });

    setGroupedReservations(grouped);
    
    // Auto-expand if only one event
    if (Object.keys(grouped).length === 1) {
      setExpandedEvents(new Set([Object.keys(grouped)[0]]));
    }
  };

  const handleCancelReservation = async (bookingId, seat) => {
    try {
      setCancellingIds(prev => new Set(prev).add(`${bookingId}-${seat._id}`));
      setError('');
      setSuccessMessage('');

      const token = (authContext && authContext.authToken) || 
                    localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token required. Please login again.");
      }

      const cancelData = {
        bookingId: bookingId,
        seatsToCancel: [
          {
            section: seat.section,
            row: seat.row,
            seatNumber: seat.seatNumber
          }
        ]
      };

      console.log("Cancelling reservation:", cancelData);

      const response = await fetch(`${serverURL.url}bookings/cancel-reserved`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(cancelData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel reservation");
      }

      console.log("Reservation cancelled successfully:", data);
      setSuccessMessage(`Successfully cancelled seat ${seat.row}${seat.seatNumber} in ${seat.section}`);
      
      // Refresh reservations list
      await fetchReservations();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      setError(error.message || "Failed to cancel reservation");
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${bookingId}-${seat._id}`);
        return newSet;
      });
    }
  };

  const toggleEventExpansion = (eventId) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatSectionName = (sectionId) => {
    return sectionId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTotalReservations = () => {
    return Object.values(groupedReservations).reduce((total, event) => total + event.totalSeats, 0);
  };

  // Add helper function to get event name
  const getEventName = (eventId) => {
    const event = eventDetails[eventId];
    return event ? event.name || event.title || `Event ${eventId.slice(-8)}` : `Event ${eventId.slice(-8)}`;
  };

  // Add helper function to get event date
  const getEventDate = (eventId) => {
    const event = eventDetails[eventId];
    return event ? formatDate(event.date || event.eventDate) : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-lg text-gray-400">Loading your reservations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-orange-500 border-opacity-30 mb-6">
          <div className="bg-gradient-to-r from-orange-800 to-orange-600 p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-center">My Reservations</h1>
            <p className="text-center text-orange-200 mt-2">Manage your reserved seats by event</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900 bg-opacity-50 border border-green-500 text-green-200 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        {Object.keys(groupedReservations).length > 0 && (
          <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{Object.keys(groupedReservations).length}</div>
                  <div className="text-sm text-gray-400">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{getTotalReservations()}</div>
                  <div className="text-sm text-gray-400">Total Seats</div>
                </div>
              </div>
              <button
                onClick={fetchReservations}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {Object.keys(groupedReservations).length === 0 ? (
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 text-gray-400 mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Reservations Found</h3>
                <p className="text-gray-400 mb-6">You haven't made any seat reservations yet.</p>
                
              </div>
            </div>
          ) : (
            // Event-wise Reservations
            Object.entries(groupedReservations).map(([eventId, eventData]) => (
              <div key={eventId} className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                {/* Event Header - Updated to show event name */}
                <div 
                  className="bg-gradient-to-r from-purple-800 to-purple-600 p-4 cursor-pointer hover:from-purple-700 hover:to-purple-500 transition-all"
                  onClick={() => toggleEventExpansion(eventId)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white">{getEventName(eventId)}</h3>
                      <div className="flex flex-col space-y-1">
                        <p className="text-purple-200 text-sm">
                          {eventData.totalSeats} seat{eventData.totalSeats !== 1 ? 's' : ''} reserved • {eventData.reservations.length} booking{eventData.reservations.length !== 1 ? 's' : ''}
                        </p>
                        {getEventDate(eventId) && (
                          <p className="text-purple-300 text-xs">
                            📅 {getEventDate(eventId)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-200 text-sm mr-2">
                        {expandedEvents.has(eventId) ? 'Collapse' : 'Expand'}
                      </span>
                      <svg
                        className={`w-6 h-6 text-purple-200 transform transition-transform ${
                          expandedEvents.has(eventId) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Event Content */}
                {expandedEvents.has(eventId) && (
                  <div className="p-6">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full table-auto">
                        <thead>
                          <tr className="bg-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Booking ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Section
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Seat Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Reserved On
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {eventData.reservations.map((reservation) =>
                            reservation.seats.map((seat, seatIndex) => (
                              <tr key={`${reservation._id}-${seat._id}`} className="hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  <div className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                                    {reservation._id.slice(-8)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  <div className="font-medium">
                                    {formatSectionName(seat.section)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  <div className="flex items-center">
                                    <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold mr-2">
                                      {seat.row}{seat.seatNumber}
                                    </div>
                                    <span>Row {seat.row}, Seat {seat.seatNumber}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Reserved
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {formatDate(reservation.bookingTime)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleCancelReservation(reservation._id, seat)}
                                    disabled={cancellingIds.has(`${reservation._id}-${seat._id}`)}
                                    className={`${
                                      cancellingIds.has(`${reservation._id}-${seat._id}`)
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700'
                                    } text-white px-3 py-1 rounded text-xs transition-colors`}
                                  >
                                    {cancellingIds.has(`${reservation._id}-${seat._id}`) ? (
                                      <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                        Cancelling...
                                      </div>
                                    ) : (
                                      'Cancel'
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {eventData.reservations.map((reservation) =>
                        reservation.seats.map((seat, seatIndex) => (
                          <div key={`${reservation._id}-${seat._id}`} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="text-sm text-gray-400">Booking ID</div>
                                <div className="font-mono text-xs bg-gray-600 px-2 py-1 rounded inline-block">
                                  {reservation._id.slice(-8)}
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Reserved
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <div className="text-sm text-gray-400">Section</div>
                              <div className="font-medium">{formatSectionName(seat.section)}</div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="text-sm text-gray-400">Seat Details</div>
                              <div className="flex items-center">
                                <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold mr-2">
                                  {seat.row}{seat.seatNumber}
                                </div>
                                <span>Row {seat.row}, Seat {seat.seatNumber}</span>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <div className="text-sm text-gray-400">Reserved On</div>
                              <div className="text-sm">{formatDate(reservation.bookingTime)}</div>
                            </div>
                            
                            <button
                              onClick={() => handleCancelReservation(reservation._id, seat)}
                              disabled={cancellingIds.has(`${reservation._id}-${seat._id}`)}
                              className={`w-full ${
                                cancellingIds.has(`${reservation._id}-${seat._id}`)
                                  ? 'bg-gray-600 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700'
                              } text-white py-2 rounded transition-colors`}
                            >
                              {cancellingIds.has(`${reservation._id}-${seat._id}`) ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                                  Cancelling...
                                </div>
                              ) : (
                                'Cancel Reservation'
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReservation;