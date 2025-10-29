import React, { useState, useEffect, useContext } from 'react';
import { 
  Ticket, 
  CalendarCheck, 
  Search, 
  User, 
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../providers/AuthProvider';
import serverURL from '../../../ServerConfig';
import { toast } from 'react-toastify';

const BuyerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTickets: 0,
    upcomingEvents: 0,
    totalSpent: 0,
    recentTickets: []
  });

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('auth-token');
  };

  // Fetch purchased tickets data
  const fetchTicketsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('🎫 Fetching my orders...');

      // FIXED: Using correct endpoint
      const response = await fetch(`${serverURL.url}orders/my-orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth-token');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🎫 Orders response:', result);

      // Extract orders data from response
      let orders = [];
      if (result.success && result.data) {
        orders = Array.isArray(result.data) ? result.data : [];
      } else if (Array.isArray(result)) {
        orders = result;
      } else if (result.orders && Array.isArray(result.orders)) {
        orders = result.orders;
      } else if (result.data && Array.isArray(result.data.orders)) {
        orders = result.data.orders;
      }

      console.log(`🎫 Found ${orders.length} orders`);

      // Calculate stats from orders
      const currentDate = new Date();
      let upcomingEvents = 0;
      let totalSpent = 0;
      let totalTickets = 0;
      const uniqueEventIds = new Set();

      orders.forEach(order => {
        console.log('Processing order:', order);
        
        // Count total spent
        if (order.totalAmount || order.amount || order.price) {
          totalSpent += parseFloat(order.totalAmount || order.amount || order.price || 0);
        }

        // Count total tickets (quantity in each order)
        if (order.quantity || order.tickets || order.numberOfTickets) {
          totalTickets += parseInt(order.quantity || order.tickets || order.numberOfTickets || 1);
        } else {
          totalTickets += 1; // Default to 1 ticket per order if no quantity specified
        }

        // Count upcoming events
        let eventDate = null;
        let eventId = null;

        // Try various ways the event data might be stored
        if (order.eventId) {
          if (typeof order.eventId === 'object') {
            eventDate = order.eventId.date ? new Date(order.eventId.date) : null;
            eventId = order.eventId._id || order.eventId.id;
          } else {
            eventId = order.eventId;
          }
        } else if (order.event) {
          eventDate = order.event.date ? new Date(order.event.date) : null;
          eventId = order.event._id || order.event.id;
        } else if (order.eventDate) {
          eventDate = new Date(order.eventDate);
          eventId = order._id; // Use order ID as fallback
        }

        // If we found a future event, add it to upcoming count
        if (eventDate && eventDate > currentDate && eventId) {
          uniqueEventIds.add(eventId);
        }
      });

      upcomingEvents = uniqueEventIds.size;

      console.log(`📊 Stats calculated:`, {
        totalTickets,
        upcomingEvents, 
        totalSpent,
        ordersCount: orders.length
      });

      setStats({
        totalTickets,
        upcomingEvents,
        totalSpent,
        recentTickets: orders.slice(0, 5) // Show 5 most recent orders
      });

    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setError(err.message);
      setStats({
        totalTickets: 0,
        upcomingEvents: 0,
        totalSpent: 0,
        recentTickets: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchTicketsData();
    toast.success('Dashboard refreshed!');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString() || 0}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchTicketsData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl overflow-hidden">
        <div className="px-8 py-12 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {user?.name || 'there'}!
              </h1>
              <p className="text-xl opacity-90 mb-6">
                Welcome to your ticket dashboard. Manage your events and discover new experiences.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/event-list"
                  className="inline-flex items-center justify-center bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Search className="mr-2" size={18} />
                  Browse Events
                </Link>
                
                <Link
                  to="/dashboard/my-tickets"
                  className="inline-flex items-center justify-center bg-orange-600 bg-opacity-30 text-white border border-white border-opacity-30 px-6 py-3 rounded-lg hover:bg-opacity-40 transition-colors duration-200"
                >
                  <Ticket className="mr-2" size={18} />
                  My Tickets
                </Link>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              className="p-2 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors cursor-pointer"
              title="Refresh dashboard"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center text-red-700">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Tickets
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalTickets}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Ticket className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Upcoming Events
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.upcomingEvents}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CalendarCheck className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalSpent)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <ShoppingBag className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Average Spend
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalTickets > 0 
                    ? formatCurrency(stats.totalSpent / stats.totalTickets)
                    : '$0'
                  }
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Ticket className="mr-2" size={20} />
                Recent Tickets
              </h3>
              <Link
                to="/dashboard/my-tickets"
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {stats.recentTickets.length > 0 ? (
              <div className="space-y-4">
                {stats.recentTickets.map((order, index) => (
                  <div key={order._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                        <Calendar size={16} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {order.eventId?.title || order.event?.title || 'Event Name'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.eventId?.date || order.event?.date || order.orderTime)} • {order.quantity || 1} ticket(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount || order.amount || order.price)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.paymentStatus === 'success' || order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.paymentStatus === 'pending' || order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus || order.status || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Tickets Yet</h3>
                <p className="text-gray-500 mb-4">Start exploring events and get your first ticket!</p>
                <Link
                  to="/event-list"
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Search className="mr-2" size={16} />
                  Browse Events
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/event-list"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <Search className="text-blue-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <span className="font-medium text-gray-700">Browse All Events</span>
                  <p className="text-sm text-gray-500">Discover upcoming events</p>
                </div>
              </Link>

              <Link
                to="/dashboard/my-tickets"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
              >
                <Eye className="text-purple-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <span className="font-medium text-gray-700">View My Tickets</span>
                  <p className="text-sm text-gray-500">Manage your purchased tickets</p>
                </div>
              </Link>

              <Link
                to="/dashboard/buyer-profile"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <User className="text-green-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <span className="font-medium text-gray-700">My Profile</span>
                  <p className="text-sm text-gray-500">Update your information</p>
                </div>
              </Link>

              {/* Upcoming Events Link */}
              {stats.upcomingEvents > 0 && (
                <Link
                  to="/dashboard/my-tickets"
                  className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group border-2 border-orange-200"
                >
                  <Clock className="text-orange-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
                  <div>
                    <span className="font-medium text-gray-700">Upcoming Events</span>
                    <p className="text-sm text-gray-500">{stats.upcomingEvents} events coming up</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explore Section */}
      {/* <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-8 shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-orange-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Discover Amazing Events</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Explore concerts, workshops, conferences, and more. Find your next unforgettable experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/event-list"
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Calendar className="mr-2" size={18} />
              View All Events
            </Link>
            <Link
              to="/event-list?category=popular"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
            >
              <TrendingUp className="mr-2" size={18} />
              Popular Events
            </Link>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default BuyerDashboard;