import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
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
} from "lucide-react";
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [transactionsData, setTransactionsData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced states for search and filtering
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

  // Fetch sales report with enhanced data
  const fetchSalesReport = async () => {
    try {
      const response = await axios.get(
        `${serverURL.url}admin/sales-report`,
        getAuthHeaders()
      );
      setSalesData(response.data);
      
      // If orders exist, set them for filtering
      if (response.data?.orders) {
        setFilteredOrders(response.data.orders);
      }
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

  // Filter orders based on search term and status
  const filterOrders = () => {
    if (!salesData?.orders) return [];

    let filtered = salesData.orders;

    // Filter by search term (event name, seller name, order ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.eventId?.title?.toLowerCase().includes(term) ||
        order.sellerId?.name?.toLowerCase().includes(term) ||
        order.userId?.name?.toLowerCase().includes(term) ||
        order._id?.toLowerCase().includes(term)
      );
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
  }, [searchTerm, statusFilter, salesData]);

  // Download Excel report
  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);
      
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      // Send filtered data to backend for Excel generation
      const requestData = {
        orders: filteredOrders,
        searchTerm,
        statusFilter,
        totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        totalOrders: filteredOrders.length,
        totalSeats: filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0)
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
      link.download = `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Download PDF report
  const downloadPDFReport = async () => {
    try {
      setDownloadingExcel(true); // Using same loading state
      
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      // Send filtered data to backend for PDF generation
      const requestData = {
        orders: filteredOrders,
        searchTerm,
        statusFilter,
        totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        totalOrders: filteredOrders.length,
        totalSeats: filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0),
        generatedAt: new Date().toISOString(),
        generatedBy: user?.name || user?.email || 'Admin'
      };

      const response = await axios.post(
        `${serverURL.url}admin/sales-report/pdf`,
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
        type: 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF report downloaded successfully!');
    } catch (err) {
      console.error('Error downloading PDF report:', err);
      const errorMessage = err.response?.data?.message || 'Failed to download PDF report. Please try again.';
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate success rate
  const calculateSuccessRate = () => {
    if (!transactionsData) return 0;
    const total =
      transactionsData.successPayments +
      transactionsData.pendingPayments +
      transactionsData.failedPayments;
    return total > 0 ? ((transactionsData.successPayments / total) * 100).toFixed(1) : 0;
  };

  // Calculate average order value
  const calculateAverageOrderValue = () => {
    if (!salesData || salesData.totalSales === 0) return 0;
    return (salesData.totalRevenue / salesData.totalSales).toFixed(2);
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(salesData?.totalRevenue),
      icon: DollarSign,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      loading: loading,
    },
    {
      title: "Total Sales",
      value: salesData?.totalSales || 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      loading: loading,
    },
    {
      title: "Total Users",
      value: usersData?.totalUsers || 0,
      icon: Users,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      loading: loading,
    },
    {
      title: "Total Sellers",
      value: usersData?.totalSellers || 0,
      icon: UserCheck,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      loading: loading,
    },
  ];

  // Payment stats cards
  const paymentStatsCards = [
    {
      title: "Successful Payments",
      value: transactionsData?.successPayments || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Pending Payments",
      value: transactionsData?.pendingPayments || 0,
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Failed Payments",
      value: transactionsData?.failedPayments || 0,
      icon: XCircle,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "Success Rate",
      value: `${calculateSuccessRate()}%`,
      icon: TrendingUp,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
  ];

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
                  Dashboard Reports
                </h1>
                <p className="text-gray-600 mt-1">
                  Overview of sales, users, and transactions
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
                {/* <button
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-md font-medium cursor-pointer"
                  onClick={downloadCSVReport}
                  disabled={filteredOrders.length === 0}
                >
                  <Download className="mr-2" size={16} />
                  Download CSV
                </button> */}
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

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {card.loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                      ) : (
                        card.value
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <card.icon className={`${card.textColor}`} size={24} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Statistics */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <CreditCard className="mr-2" size={24} />
              Payment Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paymentStatsCards.map((card, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {card.title}
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {loading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                        ) : (
                          card.value
                        )}
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${card.bgColor}`}>
                      <card.icon className={`${card.textColor}`} size={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Insights */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Activity className="mr-2" size={20} />
                Sales Insights
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Order Value</span>
                <span className="font-semibold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    formatCurrency(parseFloat(calculateAverageOrderValue()))
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-semibold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    salesData?.totalSales || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Filtered Results</span>
                <span className="font-semibold text-blue-600">
                  {filteredOrders.length} orders
                </span>
              </div>
            </div>
          </div>

          {/* User Insights */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Users className="mr-2" size={20} />
                User Insights
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Seller Ratio</span>
                <span className="font-semibold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    usersData?.totalUsers > 0
                      ? `${((usersData.totalSellers / usersData.totalUsers) * 100).toFixed(1)}%`
                      : "0%"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Regular Users</span>
                <span className="font-semibold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    (usersData?.totalUsers || 0) - (usersData?.totalSellers || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Events</span>
                <span className="font-semibold text-green-600">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    salesData?.totalEvents || 0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Sales Report with Search and Filters */}
        {salesData?.orders && salesData.orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <FileText className="mr-2" size={20} />
                  Sales Report ({filteredOrders.length} orders)
                </h3>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by event, seller, or order ID..."
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
                      Event Name
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
                  {currentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="font-mono">
                          {order._id?.slice(-8) || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={order.eventId?.title}>
                          {order.eventId?.title || "Event Deleted"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                            <Users size={14} className="text-blue-600" />
                          </div>
                          <span className="max-w-xs truncate" title={order.sellerId?.name}>
                            {order.sellerId?.name || "Seller N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={order.userId?.name}>
                          {order.userId?.name || "User N/A"}
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
                  ))}
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
        {salesData?.orders && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No orders match your current search criteria. Try adjusting your filters."
                  : "No sales orders have been recorded yet."}
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
        {filteredOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <BarChart3 className="mr-2" size={20} />
                Filtered Report Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Revenue</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(
                          filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
                        )}
                      </p>
                    </div>
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Orders</p>
                      <p className="text-xl font-bold text-blue-900">
                        {filteredOrders.length}
                      </p>
                    </div>
                    <ShoppingCart className="text-blue-600" size={24} />
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total Seats</p>
                      <p className="text-xl font-bold text-purple-900">
                        {filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0)}
                      </p>
                    </div>
                    <Users className="text-purple-600" size={24} />
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