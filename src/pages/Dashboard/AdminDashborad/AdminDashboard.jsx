import React, { useState, useEffect, useContext } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  DollarSign,
  ShoppingCart,
  UserCheck,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  FileText,
  BarChart3,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import axios from 'axios';
import serverURL from '../../../ServerConfig';
import { AuthContext } from '../../../providers/AuthProvider';
import { toast } from 'react-toastify';

const AdminDashboard = ({ userName }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState({
    users: {
      totalUsers: 0,
      totalSellers: 0,
      recentUsers: []
    },
    events: {
      totalEvents: 0,
      publishedEvents: 0,
      unpublishedEvents: 0,
      recentEvents: []
    },
    sales: {
      totalRevenue: 0,
      totalSales: 0,
      totalTickets: 0,
      recentOrders: []
    },
    transactions: {
      successPayments: 0,
      pendingPayments: 0,
      failedPayments: 0
    }
  });

  // Get auth token
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

  // Fetch all dashboard data
  const fetchDashboardData = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      const authHeaders = getAuthHeaders();

      // Fetch all data in parallel
      const [usersResponse, eventsResponse, salesResponse, transactionsResponse] = await Promise.allSettled([
        axios.get(`${serverURL.url}admin/users-report`, authHeaders),
        axios.get(`${serverURL.url}admin/events`, authHeaders),
        axios.get(`${serverURL.url}admin/sales-report`, authHeaders),
        axios.get(`${serverURL.url}admin/transactions-report`, authHeaders)
      ]);

      // Process users data
      if (usersResponse.status === 'fulfilled') {
        const usersData = usersResponse.value.data;
        setDashboardData(prev => ({
          ...prev,
          users: {
            totalUsers: usersData.totalUsers || 0,
            totalSellers: usersData.totalSellers || 0,
            recentUsers: usersData.recentUsers || []
          }
        }));
      }

      // Process events data
      if (eventsResponse.status === 'fulfilled') {
        const eventsData = eventsResponse.value.data.data || [];
        const publishedEvents = eventsData.filter(event => event.isPublished).length;
        setDashboardData(prev => ({
          ...prev,
          events: {
            totalEvents: eventsData.length,
            publishedEvents,
            unpublishedEvents: eventsData.length - publishedEvents,
            recentEvents: eventsData.slice(0, 5)
          }
        }));
      }

      // Process sales data
      if (salesResponse.status === 'fulfilled') {
        const salesData = salesResponse.value.data;
        setDashboardData(prev => ({
          ...prev,
          sales: {
            totalRevenue: salesData.totalRevenue || 0,
            totalSales: salesData.totalSales || 0,
            totalTickets: salesData.totalTickets || 0,
            recentOrders: salesData.orders?.slice(0, 5) || []
          }
        }));
      }

      // Process transactions data
      if (transactionsResponse.status === 'fulfilled') {
        const transactionsData = transactionsResponse.value.data;
        setDashboardData(prev => ({
          ...prev,
          transactions: {
            successPayments: transactionsData.successPayments || 0,
            pendingPayments: transactionsData.pendingPayments || 0,
            failedPayments: transactionsData.failedPayments || 0
          }
        }));
      }

      if (showToast) {
        toast.success('Dashboard data refreshed successfully!');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString() || 0}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate success rate
  const calculateSuccessRate = () => {
    const { successPayments, pendingPayments, failedPayments } = dashboardData.transactions;
    const total = successPayments + pendingPayments + failedPayments;
    return total > 0 ? ((successPayments / total) * 100).toFixed(1) : 0;
  };

  // Calculate average order value
  const calculateAverageOrderValue = () => {
    const { totalRevenue, totalSales } = dashboardData.sales;
    return totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : 0;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="mr-3" size={28} />
            Admin Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Welcome back, {userName || user?.name || 'Admin'}! Here's your platform overview.
          </p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-md font-medium cursor-pointer"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
            size={16}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
          <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(dashboardData.sales.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {dashboardData.sales.totalSales}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {dashboardData.users.totalUsers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Events
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {dashboardData.events.totalEvents}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Calendar className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Statistics */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <CreditCard className="mr-2" size={20} />
              Payment Stats
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 mr-2" size={16} />
                <span className="text-sm text-gray-600">Successful</span>
              </div>
              <span className="font-semibold text-gray-900">
                {dashboardData.transactions.successPayments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Clock className="text-yellow-500 mr-2" size={16} />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-semibold text-gray-900">
                {dashboardData.transactions.pendingPayments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="text-red-500 mr-2" size={16} />
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="font-semibold text-gray-900">
                {dashboardData.transactions.failedPayments}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Success Rate</span>
                <span className="font-bold text-green-600">
                  {calculateSuccessRate()}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Users className="mr-2" size={20} />
              User Stats
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold text-gray-900">
                {dashboardData.users.totalUsers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sellers</span>
              <span className="font-semibold text-gray-900">
                {dashboardData.users.totalSellers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Regular Users</span>
              <span className="font-semibold text-gray-900">
                {dashboardData.users.totalUsers - dashboardData.users.totalSellers}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Seller Ratio</span>
                <span className="font-bold text-blue-600">
                  {dashboardData.users.totalUsers > 0 
                    ? `${((dashboardData.users.totalSellers / dashboardData.users.totalUsers) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Calendar className="mr-2" size={20} />
              Event Stats
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Events</span>
              <span className="font-semibold text-gray-900">
                {dashboardData.events.totalEvents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Published</span>
              <span className="font-semibold text-green-600">
                {dashboardData.events.publishedEvents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Unpublished</span>
              <span className="font-semibold text-red-600">
                {dashboardData.events.unpublishedEvents}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Avg Order Value</span>
                <span className="font-bold text-purple-600">
                  {formatCurrency(parseFloat(calculateAverageOrderValue()))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {dashboardData.sales.recentOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <ShoppingCart className="mr-2" size={20} />
                Recent Orders
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.sales.recentOrders.map((order, index) => (
                  <div key={order._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {order.eventId?.title || 'Event N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.quantity} seats • {formatDate(order.orderTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.paymentStatus === "success"
                            ? "bg-green-100 text-green-800"
                            : order.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {dashboardData.events.recentEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Calendar className="mr-2" size={20} />
                Recent Events
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.events.recentEvents.map((event, index) => (
                  <div key={event._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                        <Calendar size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.date)} • {event.location || 'Location TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.isPublished
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/dashboard/manage-users" 
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <Users className="text-blue-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
              <span className="font-medium text-gray-700">Manage Users</span>
            </a>
            
            <a 
              href="/dashboard/manage-events" 
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <Calendar className="text-green-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
              <span className="font-medium text-gray-700">Manage Events</span>
            </a>
            
            <a 
              href="/dashboard/reports" 
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <BarChart3 className="text-purple-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
              <span className="font-medium text-gray-700">View Reports</span>
            </a>

            <a 
              href="/dashboard/create-events" 
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
            >
              <Activity className="text-orange-500 mr-3 group-hover:scale-110 transition-transform" size={20} />
              <span className="font-medium text-gray-700">Create Event</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;