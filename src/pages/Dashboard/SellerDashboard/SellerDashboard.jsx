import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, BarChart2, Filter, Download, Search, RefreshCw, Ticket, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import serverURL from '../../../ServerConfig';

const SellerDashboard = () => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'orderTime', direction: 'desc' });
  const [activeTab, setActiveTab] = useState('overview');

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      setError("Please login to view your dashboard");
      return null;
    }
    
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch seller earnings data
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const response = await axios.get(`${serverURL.url}seller/earnings`, authHeaders);

      if (response.data?.success) {
        setSalesData(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to fetch earnings data");
      }
    } catch (err) {
      let errorMessage = "Failed to load dashboard data";

      if (err.response?.status === 404) {
        errorMessage = "Seller profile not found. Please complete your seller registration.";
      } else if (err.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
        localStorage.removeItem("auth-token");
      } else if (err.response?.status === 403) {
        errorMessage = "Access denied. You don't have seller permissions.";
      } else if (!err.response) {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSalesData();
  }, []);
  
  // Refresh data handler
  const handleRefresh = () => {
    fetchSalesData();
  };

  // Calculate summary statistics
  const calculateStats = () => {
    if (!salesData || !salesData.orders) {
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
    
    const orders = salesData.orders;
    const completedOrders = orders.filter(order => order.paymentStatus === 'success');
    const pendingOrders = orders.filter(order => order.paymentStatus === 'pending');
    
    // Calculate recent orders (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(order => new Date(order.orderTime) > sevenDaysAgo);
    
    // Calculate average order value
    const totalAmount = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalAmount / completedOrders.length : 0;
    
    return {
      totalSales: salesData.totalEarnings || 0,
      totalTickets: salesData.totalTicketsSold || 0,
      completedSales: completedOrders.length,
      pendingSales: pendingOrders.length,
      totalOrders: orders.length,
      avgOrderValue: avgOrderValue,
      recentOrders: recentOrders.length
    };
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
        return (
          order.eventId?.title?.toLowerCase().includes(searchLower) ||
          order.buyerId?.email?.toLowerCase().includes(searchLower) ||
          order.buyerId?.name?.toLowerCase().includes(searchLower) ||
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
      case 'success':
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
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export to CSV
  const handleExport = () => {
    if (!salesData || !salesData.orders || salesData.orders.length === 0) return;

    const headers = ['Booking ID', 'Event', 'Buyer Name', 'Buyer Email', 'Date', 'Quantity', 'Amount', 'Status'];
    const csvData = filteredData.map(order => [
      order.bookingId,
      order.eventId?.title || 'N/A',
      order.buyerId?.name || 'N/A',
      order.buyerId?.email || 'N/A',
      formatDate(order.orderTime),
      order.quantity,
      order.totalAmount,
      order.paymentStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Seller Dashboard</h2>
            <p className="text-gray-600 mt-1">Track your sales performance and manage earnings</p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button 
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            
            {/* <button 
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              disabled={!salesData || filteredData.length === 0}
            >
              <Download size={16} />
              <span>Export</span>
            </button> */}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sales'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sales Details
            </button>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h4 className="font-semibold text-red-800 mb-1">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
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
      {!loading && !error && salesData && (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Earnings</p>
                      <h3 className="text-2xl font-bold text-gray-800 mt-1">
                        ${stats.totalSales.toLocaleString()}
                      </h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Tickets Sold</p>
                      <h3 className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.totalTickets.toLocaleString()}
                      </h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Ticket size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                      <h3 className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.totalOrders}
                      </h3>
                      <p className="text-xs text-blue-600 mt-1">
                        {stats.recentOrders} in last 7 days
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <BarChart2 size={24} className="text-indigo-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Avg Order Value</p>
                      <h3 className="text-2xl font-bold text-gray-800 mt-1">
                        ${stats.avgOrderValue.toFixed(2)}
                      </h3>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <TrendingUp size={24} className="text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Overview */}
              {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Completed Orders</p>
                      <h3 className="text-3xl font-bold text-green-600 mt-2">
                        {stats.completedSales}
                      </h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Users size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Pending Orders</p>
                      <h3 className="text-3xl font-bold text-yellow-600 mt-2">
                        {stats.pendingSales}
                      </h3>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock size={24} className="text-yellow-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Success Rate</p>
                      <h3 className="text-3xl font-bold text-blue-600 mt-2">
                        {stats.totalOrders > 0 
                          ? Math.round((stats.completedSales / stats.totalOrders) * 100) 
                          : 0}%
                      </h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Recent Orders Preview */}
              {salesData.orders && salesData.orders.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
                      <button
                        onClick={() => setActiveTab('sales')}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                      >
                        View All →
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {salesData.orders.slice(0, 5).map((order) => (
                        <div 
                          key={order._id} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Ticket size={18} className="text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {order.eventId?.title || 'Event'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.buyerId?.name || order.buyerId?.email || 'Customer'}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatDate(order.orderTime)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800 mb-1">
                              ${order.totalAmount}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.paymentStatus)}`}>
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
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by event, buyer, or booking ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[150px]"
                    >
                      <option value="all">All Statuses</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sales Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {/* <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => requestSort('bookingId')}
                        >
                          Booking ID{getSortIndicator('bookingId')}
                        </th> */}
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => requestSort('eventId')}
                        >
                          Event{getSortIndicator('eventId')}
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => requestSort('quantity')}
                        >
                          Quantity{getSortIndicator('quantity')}
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => requestSort('totalAmount')}
                        >
                          Amount{getSortIndicator('totalAmount')}
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => requestSort('paymentStatus')}
                        >
                          Status{getSortIndicator('paymentStatus')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <BarChart2 size={48} className="text-gray-300 mb-3" />
                              <p className="text-gray-500 font-medium">No orders found</p>
                              <p className="text-gray-400 text-sm mt-1">
                                {searchTerm || filterStatus !== 'all' 
                                  ? 'Try adjusting your filters' 
                                  : 'Orders will appear here once customers make purchases'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              #{order.bookingId.slice(-8)}
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {order.eventId?.title || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(order.eventId?.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.orderTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.buyerId?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {order.buyerId?.email || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.quantity} {order.quantity === 1 ? 'ticket' : 'tickets'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ${order.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.paymentStatus)}`}>
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
                {filteredData.length > 0 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{filteredData.length}</span> of{" "}
                      <span className="font-medium">{salesData.orders?.length || 0}</span> orders
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && (!salesData || !salesData.orders || salesData.orders.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16">
          <div className="text-center">
            <BarChart2 size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sales Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start selling tickets to see your earnings and analytics here. Create your first event to get started!
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              <Calendar className="mr-2" size={18} />
              Create Your First Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;