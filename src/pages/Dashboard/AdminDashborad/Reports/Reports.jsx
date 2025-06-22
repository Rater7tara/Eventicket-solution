import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
  ShoppingCart,
  UserCheck,
  AlertCircle,
  RefreshCw,
  FileText,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  BarChart3,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";

const Reports = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [transactionsData, setTransactionsData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced states for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [filteredEvents, setFilteredEvents] = useState([]);
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

  // Fetch all users to resolve N/A names
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}admin/users`,
        getAuthHeaders()
      );
      setAllUsers(response.data.users || response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Helper function to get user name by ID
  const getUserNameById = (userId) => {
    if (!userId) return "N/A";
    const user = allUsers.find(u => u._id === userId);
    return user ? user.name : "N/A";
  };

  // Group orders by event
  const groupOrdersByEvent = (orders) => {
    if (!orders || !Array.isArray(orders)) return [];
    
    const eventGroups = {};
    
    orders.forEach(order => {
      const eventId = order.eventId?._id || order.eventId;
      const eventTitle = order.eventId?.title || "Unknown Event";
      
      if (!eventGroups[eventId]) {
        eventGroups[eventId] = {
          eventId: eventId,
          eventTitle: eventTitle,
          eventData: order.eventId,
          orders: [],
          totalRevenue: 0,
          totalOrders: 0,
          totalSeats: 0,
          successfulOrders: 0,
          pendingOrders: 0,
          failedOrders: 0
        };
      }
      
      eventGroups[eventId].orders.push({
        ...order,
        sellerName: getUserNameById(order.sellerId?._id || order.sellerId),
        buyerName: getUserNameById(order.userId?._id || order.userId)
      });
      eventGroups[eventId].totalRevenue += order.totalAmount || 0;
      eventGroups[eventId].totalOrders += 1;
      eventGroups[eventId].totalSeats += order.quantity || 0;
      
      if (order.paymentStatus === 'success') eventGroups[eventId].successfulOrders += 1;
      else if (order.paymentStatus === 'pending') eventGroups[eventId].pendingOrders += 1;
      else if (order.paymentStatus === 'failed') eventGroups[eventId].failedOrders += 1;
    });
    
    return Object.values(eventGroups);
  };

  // Fetch sales report with enhanced data
  const fetchSalesReport = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}admin/sales-report`,
        getAuthHeaders()
      );
      setSalesData(response.data);
    } catch (err) {
      console.error("Error fetching sales report:", err);
      throw err;
    }
  };

  // Fetch users report
  const fetchUsersReport = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}admin/users-report`,
        getAuthHeaders()
      );
      setUsersData(response.data);
    } catch (err) {
      console.error("Error fetching users report:", err);
      throw err;
    }
  };

  // Fetch transactions report
  const fetchTransactionsReport = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}admin/transactions-report`,
        getAuthHeaders()
      );
      setTransactionsData(response.data);
    } catch (err) {
      console.error("Error fetching transactions report:", err);
      throw err;
    }
  };

  // Filter events based on search term and status
  const filterEvents = () => {
    if (!salesData?.orders) return [];

    const eventGroups = groupOrdersByEvent(salesData.orders);
    let filtered = eventGroups;

    // Filter by search term (event name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.eventTitle.toLowerCase().includes(term)
      );
    }

    // Filter by status (based on majority of orders)
    if (statusFilter !== "all") {
      filtered = filtered.filter(event => {
        if (statusFilter === "success") return event.successfulOrders > 0;
        if (statusFilter === "pending") return event.pendingOrders > 0;
        if (statusFilter === "failed") return event.failedOrders > 0;
        return true;
      });
    }

    return filtered;
  };

  // Update filtered events when search term or status changes
  useEffect(() => {
    const filtered = filterEvents();
    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, salesData, allUsers]);

  // Navigate to individual event report
  const navigateToEventReport = (eventId, eventTitle) => {
    // You can pass the event data through state or fetch it in the new component
    navigate(`/admin/reports/event/${eventId}`, { 
      state: { 
        eventId, 
        eventTitle,
        eventOrders: filteredEvents.find(e => e.eventId === eventId)?.orders || []
      } 
    });
  };

  // Download Excel report
  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);
      
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      // Send filtered data to backend for Excel generation
      const requestData = {
        events: filteredEvents,
        searchTerm,
        statusFilter,
        totalRevenue: filteredEvents.reduce((sum, event) => sum + event.totalRevenue, 0),
        totalEvents: filteredEvents.length,
        totalOrders: filteredEvents.reduce((sum, event) => sum + event.totalOrders, 0)
      };

      const response = await axios.post(
        `${serverURL.url}admin/sales-report/excel`,
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
      link.download = `events-report-${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Fetch all reports
  const fetchAllReports = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchAllUsers(),
        fetchSalesReport(),
        fetchUsersReport(),
        fetchTransactionsReport(),
      ]);

      if (showToast) {
        toast.success("Reports refreshed successfully!");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to fetch reports. Check your admin privileges.";
      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh reports
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllReports(true);
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

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

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <BarChart3 className="mr-3" size={28} />
                  Events Reports Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Overview of events, sales, and performance metrics
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

          {/* User role check */}
          {user?.role !== "admin" && (
            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="mr-2" size={20} />
                <p>
                  You need admin privileges to view reports. Current role:{" "}
                  {user?.role || "unknown"}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="mr-2" size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Events Report with Search and Filters */}
        {salesData?.orders && salesData.orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Events Overview ({filteredEvents.length} events)
                </h3>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search events..."
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
                      <option value="all">All Events</option>
                      <option value="success">With Successful Orders</option>
                      <option value="pending">With Pending Orders</option>
                      <option value="failed">With Failed Orders</option>
                    </select>
                    <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Events Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white hover:bg-gray-50"
                    onClick={() => navigateToEventReport(event.eventId, event.eventTitle)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                        {event.eventTitle}
                      </h4>
                      <ExternalLink className="text-blue-500 flex-shrink-0" size={18} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(event.totalRevenue)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Orders</span>
                        <span className="font-semibold text-blue-600">
                          {event.totalOrders}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Seats Sold</span>
                        <span className="font-semibold text-purple-600">
                          {event.totalSeats}
                        </span>
                      </div>
                      
                      {/* Status Indicators */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="flex space-x-2">
                          {event.successfulOrders > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <CheckCircle size={12} className="mr-1" />
                              {event.successfulOrders}
                            </span>
                          )}
                          {event.pendingOrders > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              <Clock size={12} className="mr-1" />
                              {event.pendingOrders}
                            </span>
                          )}
                          {event.failedOrders > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              <XCircle size={12} className="mr-1" />
                              {event.failedOrders}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button className="w-full text-center text-blue-600 text-sm font-medium hover:text-blue-800">
                          View Detailed Report →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstEvent + 1} to{" "}
                  {Math.min(indexOfLastEvent, filteredEvents.length)} of{" "}
                  {filteredEvents.length} events
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

        {/* No Events Message */}
        {salesData?.orders && filteredEvents.length === 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-12 text-center">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No events match your current search criteria. Try adjusting your filters."
                  : "No events with sales data have been recorded yet."}
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

        {/* Summary Stats */}
        {filteredEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <BarChart3 className="mr-2" size={20} />
                Overall Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Revenue</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(
                          filteredEvents.reduce((sum, event) => sum + event.totalRevenue, 0)
                        )}
                      </p>
                    </div>
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Events</p>
                      <p className="text-xl font-bold text-blue-900">
                        {filteredEvents.length}
                      </p>
                    </div>
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total Orders</p>
                      <p className="text-xl font-bold text-purple-900">
                        {filteredEvents.reduce((sum, event) => sum + event.totalOrders, 0)}
                      </p>
                    </div>
                    <ShoppingCart className="text-purple-600" size={24} />
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Total Seats</p>
                      <p className="text-xl font-bold text-orange-900">
                        {filteredEvents.reduce((sum, event) => sum + event.totalSeats, 0)}
                      </p>
                    </div>
                    <Users className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;