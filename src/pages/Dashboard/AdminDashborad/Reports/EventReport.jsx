import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  DollarSign,
  Users,
  Calendar,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  BarChart3,
  Search,
  Filter,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";

const EventReport = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventOrders, setEventOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // States for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch all users to resolve names
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}admin/users`,
        getAuthHeaders()
      );
      
      // Handle different response structures
      let users = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          users = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else {
          console.warn("Unexpected users API response structure:", response.data);
          users = [];
        }
      }
      
      setAllUsers(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      setAllUsers([]); // Ensure allUsers is always an array
    }
  };

  // Helper function to get user name by ID
  const getUserNameById = (userId) => {
    if (!userId || !Array.isArray(allUsers)) return "N/A";
    const user = allUsers.find(u => u._id === userId);
    return user ? user.name : "N/A";
  };

  // Helper function to get user details by ID
  const getUserById = (userId) => {
    if (!userId || !Array.isArray(allUsers)) return null;
    return allUsers.find(u => u._id === userId);
  };

  // Fetch sales report and filter for current event
  const fetchEventOrders = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}admin/sales-report`,
        getAuthHeaders()
      );
      
      // Filter orders for this specific event
      const orders = response.data.orders || [];
      const currentEventOrders = orders.filter(order => 
        (order.eventId?._id === eventId) || (order.eventId === eventId)
      );
      
      // Get event data from first order
      if (currentEventOrders.length > 0) {
        setEventData(currentEventOrders[0].eventId);
      }
      
      setEventOrders(currentEventOrders);
    } catch (err) {
      console.error("Error fetching event orders:", err);
      throw err;
    }
  };

  // Filter orders based on search term and status
  const filterOrders = () => {
    if (!eventOrders || !Array.isArray(allUsers)) return [];

    let filtered = eventOrders;

    // Filter by search term (seller name, buyer name, order ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const sellerName = getUserNameById(order.sellerId?._id || order.sellerId);
        const buyerName = getUserNameById(order.userId?._id || order.userId);
        return (
          sellerName.toLowerCase().includes(term) ||
          buyerName.toLowerCase().includes(term) ||
          order._id?.toLowerCase().includes(term)
        );
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.paymentStatus === statusFilter);
    }

    return filtered;
  };

  // Update filtered orders when search term or status changes
  useEffect(() => {
    const filtered = filterOrders();
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, eventOrders, allUsers]);

  // Download Excel report for this event
  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);
      
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      // Send filtered data to backend for Excel generation
      const requestData = {
        eventId,
        eventTitle: eventData?.title || location.state?.eventTitle || "Event Report",
        orders: filteredOrders.map(order => ({
          ...order,
          sellerName: getUserNameById(order.sellerId?._id || order.sellerId),
          buyerName: getUserNameById(order.userId?._id || order.userId)
        })),
        searchTerm,
        statusFilter,
        totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        totalOrders: filteredOrders.length,
        totalSeats: filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0)
      };

      const response = await axios.post(
        `${serverURL.url}admin/sales-report/event-excel`,
        requestData,
        {
          ...authHeaders,
          responseType: 'blob',
          headers: {
            ...authHeaders.headers,
            'Content-Type': 'application/json',
          }
        }
      );

      // Create blob from response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventData?.title || 'event'}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel report downloaded successfully!');
    } catch (err) {
      console.error('Error downloading Excel report:', err);
      const errorMessage = err.response?.data?.message || 'Failed to download Excel report. Please try again.';
      toast.error(errorMessage);
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Fetch all data
  const fetchAllData = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchAllUsers(),
        fetchEventOrders(),
      ]);

      if (showToast) {
        toast.success("Event report refreshed successfully!");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to fetch event report. Check your admin privileges.";
      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh report
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData(true);
  };

  useEffect(() => {
    // If we have event orders from navigation state, use them initially
    if (location.state?.eventOrders) {
      setEventOrders(location.state.eventOrders);
    }
    
    fetchAllData();
  }, [eventId]);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate event statistics
  const calculateStats = () => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalSeats = filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
    const successfulOrders = filteredOrders.filter(order => order.paymentStatus === 'success').length;
    const pendingOrders = filteredOrders.filter(order => order.paymentStatus === 'pending').length;
    const failedOrders = filteredOrders.filter(order => order.paymentStatus === 'failed').length;
    
    return {
      totalRevenue,
      totalOrders,
      totalSeats,
      successfulOrders,
      pendingOrders,
      failedOrders,
      successRate: totalOrders > 0 ? ((successfulOrders / totalOrders) * 100).toFixed(1) : 0
    };
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => navigate('/admin/reports')}
                    className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
                  >
                    <ArrowLeft size={20} className="mr-1" />
                    Back to Reports
                  </button>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Calendar className="mr-3" size={28} />
                  {eventData?.title || location.state?.eventTitle || "Event Report"}
                </h1>
                <p className="text-gray-600 mt-1">
                  Detailed sales and performance report for this event
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-md font-medium cursor-pointer"
                  onClick={downloadExcelReport}
                  disabled={downloadingExcel}
                >
                  <FileSpreadsheet
                    className={`mr-2 ${downloadingExcel ? "animate-spin" : ""}`}
                    size={16}
                  />
                  {downloadingExcel ? "Generating..." : "Download Excel"}
                </button>
                <button
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 shadow-md font-medium cursor-pointer"
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
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="mr-2" size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Event Stats */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Event Performance
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <ShoppingCart className="text-blue-600" size={24} />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Seats Sold</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.totalSeats}
                    </p>
                  </div>
                  <Users className="text-purple-600" size={24} />
                </div>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">Success Rate</p>
                    <p className="text-2xl font-bold text-indigo-900">
                      {stats.successRate}%
                    </p>
                  </div>
                  <CheckCircle className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Order Status Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Successful Orders</p>
                    <p className="text-xl font-bold text-green-900">{stats.successfulOrders}</p>
                  </div>
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>
              
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Pending Orders</p>
                    <p className="text-xl font-bold text-yellow-900">{stats.pendingOrders}</p>
                  </div>
                  <Clock className="text-yellow-600" size={20} />
                </div>
              </div>
              
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Failed Orders</p>
                    <p className="text-xl font-bold text-red-900">{stats.failedOrders}</p>
                  </div>
                  <XCircle className="text-red-600" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {eventOrders && eventOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <FileText className="mr-2" size={20} />
                  Orders Details ({filteredOrders.length} orders)
                </h3>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by seller, buyer, or order ID..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => {
                    const seller = getUserById(order.sellerId?._id || order.sellerId);
                    const buyer = getUserById(order.userId?._id || order.userId);
                    
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="font-mono">
                            {order._id?.slice(-8) || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <User size={14} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {seller?.name || "Seller N/A"}
                              </div>
                              {seller?.email && (
                                <div className="text-xs text-gray-500">
                                  {seller.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                              <User size={14} className="text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {buyer?.name || "Buyer N/A"}
                              </div>
                              {buyer?.email && (
                                <div className="text-xs text-gray-500">
                                  {buyer.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {order.quantity} seat(s)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.orderTime)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstOrder + 1} to{" "}
                  {Math.min(indexOfLastOrder, filteredOrders.length)} of{" "}
                  {filteredOrders.length} orders
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
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      const showEllipsisBefore =
                        index > 0 && array[index - 1] !== page - 1;
                      const showEllipsisAfter =
                        index < array.length - 1 && array[index + 1] !== page + 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="px-3 py-1 text-gray-500">...</span>
                          )}
                          <button
                            className={`px-3 py-1 rounded-md cursor-pointer ${
                              currentPage === page
                                ? "bg-blue-500 text-white"
                                : "border border-gray-300 text-gray-600 hover:bg-gray-100"
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
        )}

        {/* No Orders Message */}
        {eventOrders && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No orders match your current search criteria. Try adjusting your filters."
                  : "No orders have been recorded for this event yet."}
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventReport;