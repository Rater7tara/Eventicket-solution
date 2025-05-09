import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Users,
  Globe,
  CircleSlash
} from 'lucide-react';
import serverURL from '../../../../ServerConfig';
import { AuthContext } from '../../../../providers/AuthProvider';


// Add these styles to your global CSS or component
const fadeInUp = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}
`;

const ManageEvents = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublished, setFilterPublished] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(6);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPublishingEvent, setIsPublishingEvent] = useState(false);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('auth-token');
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const authHeaders = getAuthHeaders();
      
      // Make API request with auth headers
      const response = await axios.get(
        `${serverURL.url}ticket/tickets`, 
        authHeaders
      );
      
      console.log('Events API response:', response.data);
      
      // Updated to access data from the correct property in the response
      setEvents(response.data.data || []);
      setTotalEvents(response.data.data?.length || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Failed to fetch events. Check your admin privileges.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle event deletion
  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(
        `${serverURL.url}ticket/tickets/${eventId}`,
        getAuthHeaders()
      );
      setEvents(events.filter(event => event._id !== eventId));
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  // Handle event publish/unpublish
  const handleTogglePublish = async (eventId, isPublished) => {
    try {
      setIsPublishingEvent(true);
      
      await axios.put(
        `${serverURL.url}ticket/tickets/${eventId}`,
        { isPublished: !isPublished },
        getAuthHeaders()
      );
      
      setEvents(events.map(event => {
        if (event._id === eventId) {
          return { ...event, isPublished: !isPublished };
        }
        return event;
      }));
      
      setIsPublishingEvent(false);
    } catch (err) {
      console.error('Error toggling publish status:', err);
      setError(err.response?.data?.message || `Failed to ${isPublished ? 'unpublish' : 'publish'} event`);
      setIsPublishingEvent(false);
    }
  };

  // Filter and search events
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterPublished === 'all' || 
      (filterPublished === 'published' && event.isPublished) || 
      (filterPublished === 'unpublished' && !event.isPublished);
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Truncate text
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // View Event Modal
  const ViewEventModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div 
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{animation: 'fadeInUp 0.3s ease-out'}}
        >
          {/* Header with image */}
          <div className="relative h-64 bg-gray-300 overflow-hidden rounded-t-lg">
            {selectedEvent.image ? (
              <img 
                src={selectedEvent.image} 
                alt={selectedEvent.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
                <Calendar className="text-white" size={64} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <h2 className="text-2xl font-bold text-white mb-1">{selectedEvent.title}</h2>
              <div className="flex items-center text-white/80">
                <Calendar className="mr-1" size={16} />
                <span className="text-sm">{formatDate(selectedEvent.createdAt)}</span>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                selectedEvent.isPublished 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedEvent.isPublished ? 'Published' : 'Not Published'}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start space-x-3">
                <Clock className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-gray-900">{selectedEvent.time || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-900">{selectedEvent.location || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Tag className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-gray-900">{selectedEvent.price ? `৳${selectedEvent.price}` : 'Free'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Users className="text-gray-500 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Available Tickets</p>
                  <p className="text-gray-900">{selectedEvent.ticketsAvailable || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700">{selectedEvent.description || 'No description available.'}</p>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <p>Created: {formatDate(selectedEvent.createdAt)}</p>
                <p>Last updated: {formatDate(selectedEvent.updatedAt)}</p>
              </div>
              <button
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedEvent(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div 
          className="bg-white rounded-lg p-6 w-96 shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{animation: 'fadeInUp 0.3s ease-out'}}
        >
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-xl font-semibold text-gray-800">Confirm Deletion</h3>
          </div>
          <p className="mb-6 text-gray-600">Are you sure you want to delete the event <span className="font-medium text-gray-800">"{selectedEvent.title}"</span>? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium cursor-pointer"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-md font-medium cursor-pointer"
              onClick={() => handleDeleteEvent(selectedEvent._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h1 className="text-2xl font-bold text-gray-800">Manage Events</h1>
            <p className="text-gray-600 mt-1">View, publish, and manage all events in the system</p>
          </div>
          
          {/* User role check */}
          {user?.role !== 'admin' && (
            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="mr-2" size={20} />
                <p>You need admin privileges to manage events. Current role: {user?.role || 'unknown'}</p>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={filterPublished}
                  onChange={(e) => setFilterPublished(e.target.value)}
                >
                  <option value="all">All Events</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
                <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              
              {/* Refresh */}
              <button
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={fetchEvents}
                disabled={loading}
              >
                <RefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} size={20} />
              </button>
            </div>
          </div>
          
          {/* Events Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : currentEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No events found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentEvents.map((event) => (
                  <div 
                    key={event._id} 
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="relative h-48 bg-gray-300">
                      {event.image ? (
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
                          <Calendar className="text-white" size={36} />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {event.isPublished ? (
                            <>
                              <CheckCircle className="mr-1" size={12} />
                              Published
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1" size={12} />
                              Not Published
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1.5 line-clamp-1">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{truncateText(event.description || 'No description available', 100)}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock className="mr-1" size={14} />
                          <span>{event.time || 'Not specified'}</span>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {event.price ? `৳${event.price}` : 'Free'}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin className="mr-1" size={14} />
                        <span className="truncate">{event.location || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <Users className="mr-1" size={14} />
                        <span>{event.ticketsAvailable || 0} tickets available</span>
                      </div>
                      
                      <div className="flex justify-between mt-auto">
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsViewModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            onClick={() => {
                              // Handle edit - could redirect to edit page
                              window.location.href = `/admin/events/edit/${event._id}`;
                            }}
                            title="Edit Event"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Event"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <button
                          className={`p-2 ${
                            event.isPublished 
                              ? 'text-red-500 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          } rounded-md transition-colors cursor-pointer`}
                          onClick={() => handleTogglePublish(event._id, event.isPublished)}
                          disabled={isPublishingEvent}
                          title={event.isPublished ? 'Unpublish Event' : 'Publish Event'}
                        >
                          {event.isPublished ? (
                            <CircleSlash size={18} />
                          ) : (
                            <Globe size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!loading && filteredEvents.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} events
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages +/- 1 from current
                    return page === 1 || page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-3 py-1 text-gray-500">...</span>
                        )}
                        <button
                          className={`px-3 py-1 rounded-md cursor-pointer ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                        {showEllipsisAfter && (
                          <span className="px-3 py-1 text-gray-500">...</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {isViewModalOpen && <ViewEventModal />}
      {isDeleteModalOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default ManageEvents;