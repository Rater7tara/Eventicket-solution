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

  // Fetch sales report
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
    return `৳${amount?.toLocaleString() || 0}`;
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
                <span className="text-gray-600">Revenue Growth</span>
                <span className="font-semibold text-green-600">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    "+12.5%"
                  )}
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
                <span className="text-gray-600">User Growth</span>
                <span className="font-semibold text-green-600">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    "+8.3%"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {salesData?.orders && salesData.orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <FileText className="mr-2" size={20} />
                Recent Orders
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
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
                  {salesData.orders.slice(0, 5).map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order._id?.slice(-8) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.quantity} seat(s)
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;