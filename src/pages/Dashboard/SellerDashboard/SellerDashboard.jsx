import React, { useState, useEffect, useContext } from 'react';
import { Calendar, DollarSign, BarChart2, Filter, Download, Search, RefreshCw, Ticket, TrendingUp, Users, Clock, AlertCircle, User } from 'lucide-react';
import axios from 'axios';
import serverURL from '../../../ServerConfig';

// import { AuthContext } from "../../../../providers/AuthProvider"; // Uncomment this line in your actual app
// import { toast } from "react-toastify"; // Uncomment this line in your actual app
// import { useNavigate } from "react-router-dom"; // Uncomment this line in your actual app

const SellerDashboard = () => {
  // const { user } = useContext(AuthContext); // Uncomment this line in your actual app
  // const navigate = useNavigate(); // Uncomment this line in your actual app
  
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'orderTime', direction: 'desc' });
  const [showStats, setShowStats] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [debugInfo, setDebugInfo] = useState(null);

  // Get auth token from localStorage (following SellerProfile pattern)
  const getAuthToken = () => {
    const token = localStorage.getItem("auth-token");
    console.log("Retrieved auth token:", token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  };

  // Set up axios headers with authentication (following SellerProfile pattern)
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      const errorMsg = "No authentication token found. Please login again.";
      console.error(errorMsg);
      // toast.error(errorMsg); // Uncomment in actual app
      // navigate('/login'); // Uncomment in actual app
      setError(errorMsg);
      return null;
    }
    
    const headers = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    
    console.log("Auth headers prepared:", {
      ...headers,
      headers: {
        ...headers.headers,
        Authorization: `Bearer ${token.substring(0, 20)}...`
      }
    });
    
    return headers;
  };

  // Check if user is authenticated and has seller role
  const checkAuthStatus = () => {
    const token = getAuthToken();
    if (!token) {
      return { isValid: false, error: "No authentication token found" };
    }

    try {
      // Basic token validation (you might want to decode JWT here)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return { isValid: false, error: "Invalid token format" };
      }

      // You can add JWT decoding here to check expiration and role
      // const payload = JSON.parse(atob(tokenParts[1]));
      // if (payload.exp < Date.now() / 1000) {
      //   return { isValid: false, error: "Token expired" };
      // }

      return { isValid: true };
    } catch (err) {
      return { isValid: false, error: "Token validation failed" };
    }
  };

  // Fetch seller earnings data
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      // Check authentication first
      const authStatus = checkAuthStatus();
      if (!authStatus.isValid) {
        throw new Error(authStatus.error);
      }

      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const apiUrl = `${serverURL.url}seller/earnings`;
      console.log("Making request to:", apiUrl);
      console.log("Server URL config:", serverURL);

      const response = await axios.get(apiUrl, authHeaders);

      console.log("Full API Response:", response);
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);
      
      if (response.data?.success) {
        const earningsData = response.data.data;
        console.log("Earnings data structure:", earningsData);
        console.log("Total earnings:", earningsData?.totalEarnings);
        console.log("Total tickets sold:", earningsData?.totalTicketsSold);
        console.log("Orders array:", earningsData?.orders);
        console.log("Orders length:", earningsData?.orders?.length);
        
        setSalesData(earningsData);
        setDebugInfo({
          success: true,
          apiUrl,
          dataReceived: true,
          ordersCount: earningsData?.orders?.length || 0,
          totalEarnings: earningsData?.totalEarnings || 0,
          totalTickets: earningsData?.totalTicketsSold || 0
        });
      } else {
        console.error("API returned success: false", response.data);
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Complete error object:", err);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);
      console.error("Error message:", err.message);
      console.error("Error status:", err.response?.status);
      console.error("Error config:", err.config);
      
      let errorMessage = "Failed to fetch earnings data. Please try again.";
      let debugData = {
        success: false,
        errorType: err.name || 'Unknown',
        status: err.response?.status,
        statusText: err.response?.statusText,
        apiUrl: err.config?.url,
        method: err.config?.method?.toUpperCase(),
        hasAuthHeader: !!err.config?.headers?.Authorization
      };

      if (err.response?.status === 404) {
        if (err.response?.data?.message === 'Seller not found') {
          errorMessage = "Seller account not found. You may need to complete your seller registration.";
          debugData.suggestion = "Check if you have completed seller onboarding or contact support";
        } else {
          errorMessage = "API endpoint not found. Please check if the server is running correctly.";
          debugData.suggestion = "Verify the API endpoint URL and server status";
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        localStorage.removeItem("auth-token");
        debugData.suggestion = "Token may be expired or invalid";
        // navigate('/login'); // Uncomment in actual app
      } else if (err.response?.status === 403) {
        errorMessage = "Access denied. You don't have permission to view seller data.";
        debugData.suggestion = "Check if your account has seller privileges";
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = "Network error. Please check your connection and try again.";
        debugData.suggestion = "Check internet connection and server availability";
      } else {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }

      setError(errorMessage);
      setDebugInfo(debugData);
      // toast.error(errorMessage); // Uncomment in actual app
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSalesData();
  }, []);
  
  // Refresh data handler
  const handleRefresh = async () => {
    await fetchSalesData();
  };

  // Clear debug info
  const clearDebugInfo = () => {
    setDebugInfo(null);
  };

  // Handle login redirect (for demo purposes)
  const handleLoginRedirect = () => {
    console.log("Redirecting to login...");
    // navigate('/login'); // Uncomment in actual app
    alert("In a real app, this would redirect to the login page");
  };

  // Handle seller registration redirect (for demo purposes)
  const handleSellerRegistration = () => {
    console.log("Redirecting to seller registration...");
    // navigate('/seller/register'); // Uncomment in actual app
    alert("In a real app, this would redirect to the seller registration page");
  };
  
  // Calculate summary statistics
  const calculateStats = () => {
    console.log("Calculating stats with salesData:", salesData);
    
    if (!salesData) {
      console.log("No salesData found, returning zeros");
      return { 
        totalSales: 0, 
        totalTickets: 0, 
        completedSales: 0, 
        pendingSales: 0, 
        totalOrders: 0,
        avgOrderValue: 0,
        recentOrders: 0
      };
    }
    
    console.log("salesData.orders:", salesData.orders);
    console.log("salesData.totalEarnings:", salesData.totalEarnings);
    console.log("salesData.totalTicketsSold:", salesData.totalTicketsSold);
    
    // Handle case where orders might be undefined or empty
    const orders = salesData.orders || [];
    console.log("Orders array length:", orders.length);
    
    const completedOrders = orders.filter(order => {
      console.log("Order payment status:", order.paymentStatus);
      return order.paymentStatus === 'completed' || order.paymentStatus === 'paid';
    });
    
    const pendingOrders = orders.filter(order => order.paymentStatus === 'pending');
    
    // Calculate recent orders (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(order => new Date(order.orderTime) > sevenDaysAgo);
    
    // Calculate average order value
    const totalAmount = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalAmount / completedOrders.length : 0;
    
    console.log("Completed orders:", completedOrders.length);
    console.log("Pending orders:", pendingOrders.length);
    
    const stats = {
      totalSales: salesData.totalEarnings || 0,
      totalTickets: salesData.totalTicketsSold || 0,
      completedSales: completedOrders.length,
      pendingSales: pendingOrders.length,
      totalOrders: orders.length,
      avgOrderValue: avgOrderValue,
      recentOrders: recentOrders.length
    };
    
    console.log("Calculated stats:", stats);
    return stats;
  };
  
  // Get event title (you might need to fetch this from another API or include it in the response)
  const getEventTitle = (eventId) => {
    return `Event ${eventId.slice(-8)}`;
  };
  
  // Get buyer email (you might need to fetch this from another API or include it in the response)
  const getBuyerEmail = (buyerId) => {
    return `buyer-${buyerId.slice(-8)}@example.com`;
  };
  
  // Filter and sort data
  const getFilteredData = () => {
    if (!salesData || !salesData.orders) return [];
    
    const filtered = salesData.orders.filter(order => {
      // Filter by status
      if (filterStatus !== 'all' && order.paymentStatus !== filterStatus) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const eventTitle = getEventTitle(order.eventId);
        const buyerEmail = getBuyerEmail(order.buyerId);
        return (
          eventTitle.toLowerCase().includes(searchLower) ||
          buyerEmail.toLowerCase().includes(searchLower) ||
          order.bookingId.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
    
    // Sort data
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'orderTime') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  };
  
  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };
  
  // Calculate stats
  const stats = calculateStats();
  
  // Get filtered and sorted data
  const filteredData = getFilteredData();
  
  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Format seat information
  const formatSeats = (seats) => {
    return seats.map(seat => `${seat.section}-${seat.row}${seat.seatNumber}`).join(', ');
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Seller Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage your events and track your sales performance</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button 
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button 
              className="inline-flex items-center gap-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              disabled={!salesData}
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sales Details
            </button>
            <button
              onClick={() => setActiveTab('debug')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'debug'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Debug Info
            </button>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h4 className="font-semibold mb-1">Error Loading Dashboard</h4>
              <p className="mb-3">{error}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
                {error.includes('not found') && (
                  <button
                    onClick={handleSellerRegistration}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                  >
                    Complete Seller Setup
                  </button>
                )}
                {error.includes('login') && (
                  <button
                    onClick={handleLoginRedirect}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Login Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading your dashboard...</span>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && (
        <>
          {activeTab === 'debug' && (
            <div className="space-y-4">
              {/* Debug Information */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-blue-800">🔍 Debug Information</h3>
                  {debugInfo && (
                    <button
                      onClick={clearDebugInfo}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {debugInfo ? (
                  <div className="text-sm text-blue-700 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Request Details:</h4>
                        <ul className="space-y-1">
                          <li><strong>Success:</strong> {debugInfo.success ? 'Yes' : 'No'}</li>
                          <li><strong>API URL:</strong> {debugInfo.apiUrl}</li>
                          <li><strong>Method:</strong> {debugInfo.method || 'GET'}</li>
                          <li><strong>Auth Header:</strong> {debugInfo.hasAuthHeader ? 'Present' : 'Missing'}</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Response Details:</h4>
                        <ul className="space-y-1">
                          <li><strong>Status:</strong> {debugInfo.status} {debugInfo.statusText}</li>
                          <li><strong>Error Type:</strong> {debugInfo.errorType || 'N/A'}</li>
                          {debugInfo.success && (
                            <>
                              <li><strong>Orders Count:</strong> {debugInfo.ordersCount}</li>
                              <li><strong>Total Earnings:</strong> ${debugInfo.totalEarnings}</li>
                              <li><strong>Total Tickets:</strong> {debugInfo.totalTickets}</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                    
                    {debugInfo.suggestion && (
                      <div className="mt-3 p-3 bg-blue-100 rounded">
                        <strong>Suggestion:</strong> {debugInfo.suggestion}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-blue-700">No debug information available. Try refreshing the data.</p>
                )}
              </div>

              {/* Auth Token Info */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">🔐 Authentication Status</h3>
                <div className="text-sm text-yellow-700">
                  {(() => {
                    const token = getAuthToken();
                    const authStatus = checkAuthStatus();
                    return (
                      <div className="space-y-1">
                        <p><strong>Token Present:</strong> {token ? 'Yes' : 'No'}</p>
                        {token && (
                          <>
                            <p><strong>Token Preview:</strong> {token.substring(0, 20)}...</p>
                            <p><strong>Token Valid:</strong> {authStatus.isValid ? 'Yes' : 'No'}</p>
                            {!authStatus.isValid && (
                              <p><strong>Validation Error:</strong> {authStatus.error}</p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Server Config Info */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">⚙️ Server Configuration</h3>
                <div className="text-sm text-gray-700">
                  <p><strong>Base URL:</strong> {serverURL.url}</p>
                  <p><strong>Full Endpoint:</strong> {serverURL.url}seller/earnings</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Earnings</p>
                      <h3 className="text-2xl font-bold text-gray-800">${stats.totalSales.toLocaleString()}</h3>
                      <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign size={20} className="text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Tickets Sold</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stats.totalTickets.toLocaleString()}</h3>
                      <p className="text-xs text-green-600 mt-1">+8% from last month</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Ticket size={20} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Orders</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stats.totalOrders}</h3>
                      <p className="text-xs text-blue-600 mt-1">{stats.recentOrders} in last 7 days</p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <BarChart2 size={20} className="text-indigo-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Avg Order Value</p>
                      <h3 className="text-2xl font-bold text-gray-800">${stats.avgOrderValue.toFixed(2)}</h3>
                      <p className="text-xs text-orange-600 mt-1">Per transaction</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <TrendingUp size={20} className="text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Completed Orders</p>
                      <h3 className="text-2xl font-bold text-green-600">{stats.completedSales}</h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Users size={20} className="text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Pending Orders</p>
                      <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingSales}</h3>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock size={20} className="text-yellow-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Success Rate</p>
                      <h3 className="text-2xl font-bold text-blue-600">
                        {stats.totalOrders > 0 ? Math.round((stats.completedSales / stats.totalOrders) * 100) : 0}%
                      </h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp size={20} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Preview */}
              {salesData && salesData.orders && salesData.orders.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                      <button
                        onClick={() => setActiveTab('sales')}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                      >
                        View All →
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {salesData.orders.slice(0, 5).map((order) => (
                        <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Ticket size={16} className="text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{getEventTitle(order.eventId)}</p>
                              <p className="text-sm text-gray-500">{getBuyerEmail(order.buyerId)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">${order.totalAmount}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.paymentStatus)}`}>
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by booking ID, event, or buyer"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sales Table */}
              {salesData && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('bookingId')}
                          >
                            Booking ID{getSortIndicator('bookingId')}
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('eventId')}
                          >
                            Event{getSortIndicator('eventId')}
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('orderTime')}
                          >
                            Order Date{getSortIndicator('orderTime')}
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Buyer
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('quantity')}
                          >
                            Quantity{getSortIndicator('quantity')}
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('totalAmount')}
                          >
                            Amount{getSortIndicator('totalAmount')}
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('paymentStatus')}
                          >
                            Status{getSortIndicator('paymentStatus')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <BarChart2 size={48} className="text-gray-300 mb-2" />
                                <p>No sales records found matching your criteria</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                #{order.bookingId.slice(-8)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {getEventTitle(order.eventId)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.orderTime).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getBuyerEmail(order.buyerId)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.quantity} tickets
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                ${order.totalAmount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(order.paymentStatus)}`}>
                                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Results Summary */}
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{filteredData.length}</span> of{" "}
                          <span className="font-medium">{salesData.orders?.length || 0}</span> results
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && (!salesData || !salesData.orders || salesData.orders.length === 0) && activeTab !== 'debug' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            {error && error.includes('not found') ? (
              <>
                <User size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Seller Profile Not Found</h3>
                <p className="text-gray-600 mb-6">
                  You need to complete your seller registration to access this dashboard.
                </p>
                <button 
                  onClick={handleSellerRegistration}
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <User className="mr-2" size={16} />
                  Complete Seller Setup
                </button>
              </>
            ) : (
              <>
                <BarChart2 size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Sales Data Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start selling tickets to see your earnings and analytics here.
                </p>
                <button className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  <Calendar className="mr-2" size={16} />
                  Create Your First Event
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;