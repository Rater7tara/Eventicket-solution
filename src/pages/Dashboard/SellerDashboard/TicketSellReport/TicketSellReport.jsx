import React, { useState, useEffect, useContext } from 'react';
import { Calendar, DollarSign, BarChart2, Filter, Download, Search, RefreshCw, Ticket } from 'lucide-react';
import axios from 'axios';
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider"; // Uncomment this line in your actual app
import { toast } from "react-toastify"; // Uncomment this line in your actual app
import { useNavigate } from "react-router-dom"; // Uncomment this line in your actual app

// Temporary serverURL for demo - replace with actual import

const TicketSellReport = () => {
  // const { user } = useContext(AuthContext); // Uncomment this line in your actual app
  // const navigate = useNavigate(); // Uncomment this line in your actual app
  
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'orderTime', direction: 'desc' });
  const [showStats, setShowStats] = useState(true);

  // Get auth token from localStorage (following SellerProfile pattern)
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Set up axios headers with authentication (following SellerProfile pattern)
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      // toast.error("No authentication token found. Please login again."); // Uncomment in actual app
      // navigate('/login'); // Uncomment in actual app
      setError("No authentication token found. Please login again.");
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

      const response = await axios.get(
        `${serverURL.url}seller/earnings`,
        authHeaders
      );

      console.log("Earnings data:", response.data);
      
      if (response.data?.success) {
        const earningsData = response.data.data;
        setSalesData(earningsData);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching earnings data:", err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Failed to fetch earnings data. Please try again.";
      setError(errorMessage);
      // toast.error(errorMessage); // Uncomment in actual app
      
      if (err.response?.status === 401) {
        localStorage.removeItem("auth-token");
        // navigate('/login'); // Uncomment in actual app
      }
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
  
  // Calculate summary statistics
  const calculateStats = () => {
    if (!salesData) {
      return { totalSales: 0, totalTickets: 0, completedSales: 0, pendingSales: 0, totalOrders: 0 };
    }
    
    const completedOrders = salesData.orders.filter(order => order.paymentStatus === 'completed' || order.paymentStatus === 'paid');
    const pendingOrders = salesData.orders.filter(order => order.paymentStatus === 'pending');
    
    return {
      totalSales: salesData.totalEarnings,
      totalTickets: salesData.totalTicketsSold,
      completedSales: completedOrders.length,
      pendingSales: pendingOrders.length,
      totalOrders: salesData.orders.length
    };
  };
  
  // Get event title (you might need to fetch this from another API or include it in the response)
  const getEventTitle = (eventId) => {
    // This is a placeholder - you might want to fetch event details separately
    // or include event title in the API response
    return `Event ${eventId.slice(-8)}`;
  };
  
  // Get buyer email (you might need to fetch this from another API or include it in the response)
  const getBuyerEmail = (buyerId) => {
    // This is a placeholder - you might want to fetch buyer details separately
    // or include buyer email in the API response
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
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Seller Earnings Report</h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button 
            onClick={() => setShowStats(!showStats)}
            className="inline-flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"
          >
            <BarChart2 size={16} />
            <span className="hidden sm:inline">{showStats ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
          
          <button 
            className="inline-flex items-center gap-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      {showStats && salesData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Earnings</p>
                <h3 className="text-2xl font-bold text-gray-800">${stats.totalSales.toLocaleString()}</h3>
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
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Calendar size={20} className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed Orders</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.completedSales}</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart2 size={20} className="text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Orders</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingSales}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar size={20} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
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
              className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
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
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={handleRefresh}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}
      
      {/* Results Table */}
      {!loading && salesData && (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => requestSort('bookingId')}
                    >
                      Booking ID{getSortIndicator('bookingId')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => requestSort('eventId')}
                    >
                      Event{getSortIndicator('eventId')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => requestSort('orderTime')}
                    >
                      Order Date{getSortIndicator('orderTime')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => requestSort('buyerId')}
                    >
                      Buyer{getSortIndicator('buyerId')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Seats
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => requestSort('quantity')}
                    >
                      Quantity{getSortIndicator('quantity')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => requestSort('totalAmount')}
                    >
                      Amount{getSortIndicator('totalAmount')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => requestSort('paymentStatus')}
                    >
                      Status{getSortIndicator('paymentStatus')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        No sales records found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {order.bookingId.slice(-8)}
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
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                          <div className="truncate" title={formatSeats(order.seats)}>
                            {formatSeats(order.seats)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.quantity}
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
          </div>
          
          {/* Pagination or Results Summary */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-100 border-t-0 rounded-b-xl sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredData.length}</span> of{" "}
                  <span className="font-medium">{salesData.orders.length}</span> results
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketSellReport;