import React, { useState, useEffect, useContext } from 'react';
import { 
  Calendar, 
  DollarSign, 
  BarChart2, 
  Filter, 
  Download, 
  Search, 
  RefreshCw, 
  Ticket,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";

const SellerReport = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  
  // Enhanced states for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("No authentication token found. Please login again.");
      navigate('/login');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch all events to resolve event details
  const fetchAllEvents = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const response = await axios.get(
        `${serverURL.url}event/events`,
        authHeaders
      );

      let events = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          events = response.data;
        } else if (response.data.events && Array.isArray(response.data.events)) {
          events = response.data.events;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          events = response.data.data;
        }
      }

      setAllEvents(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      setAllEvents([]);
    }
  };

  // Helper function to get event details by ID
  const getEventById = (eventId) => {
    if (!eventId || !Array.isArray(allEvents) || allEvents.length === 0) return null;
    return allEvents.find(event => event._id === eventId);
  };

  // Group orders by event - Similar to admin report
  const groupOrdersByEvent = (orders) => {
    if (!orders || !Array.isArray(orders)) return [];

    const eventGroups = {};

    orders.forEach((order) => {
      const eventId = order.eventId;
      const event = getEventById(eventId);
      const eventTitle = event?.title || `Event ${eventId?.slice(-8) || 'Unknown'}`;

      if (!eventGroups[eventId]) {
        eventGroups[eventId] = {
          eventId: eventId,
          eventTitle: eventTitle,
          eventData: event,
          orders: [],
          totalRevenue: 0,
          totalOrders: 0,
          totalSeats: 0,
          successfulOrders: 0,
          pendingOrders: 0,
          failedOrders: 0,
        };
      }

      eventGroups[eventId].orders.push(order);
      eventGroups[eventId].totalRevenue += order.totalAmount || 0;
      eventGroups[eventId].totalOrders += 1;
      eventGroups[eventId].totalSeats += order.quantity || 0;

      if (order.paymentStatus === 'completed' || order.paymentStatus === 'paid')
        eventGroups[eventId].successfulOrders += 1;
      else if (order.paymentStatus === 'pending')
        eventGroups[eventId].pendingOrders += 1;
      else if (order.paymentStatus === 'failed' || order.paymentStatus === 'refunded')
        eventGroups[eventId].failedOrders += 1;
    });

    return Object.values(eventGroups);
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
      toast.error(errorMessage);
      
      if (err.response?.status === 401) {
        localStorage.removeItem("auth-token");
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on search term
  const filterEvents = () => {
    if (!salesData?.orders || !Array.isArray(allEvents)) return [];

    const eventGroups = groupOrdersByEvent(salesData.orders);
    let filtered = eventGroups;

    // Filter by search term (event name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((event) =>
        event.eventTitle.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  // Update filtered events when search term changes
  useEffect(() => {
    const filtered = filterEvents();
    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, salesData, allEvents]);

  // Navigate to individual event report
  const navigateToEventReport = (eventId, eventTitle) => {
    navigate(`/dashboard/sales-report/event/${eventId}`, {
      state: {
        eventId,
        eventTitle,
        eventOrders: filteredEvents.find((e) => e.eventId === eventId)?.orders || [],
      },
    });
  };

  // Download Excel report
  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);

      // Create worksheet data
      const worksheetData = [];

      // Add headers
      worksheetData.push([
        "Event Title",
        "Total Revenue",
        "Total Orders",
        "Total Seats",
        "Successful Orders",
        "Pending Orders",
        "Failed Orders",
        "Success Rate (%)",
        "Event Date",
        "Event Location"
      ]);

      // Add event data
      filteredEvents.forEach((event) => {
        const successRate =
          event.totalOrders > 0
            ? ((event.successfulOrders / event.totalOrders) * 100).toFixed(1)
            : 0;

        worksheetData.push([
          event.eventTitle,
          event.totalRevenue,
          event.totalOrders,
          event.totalSeats,
          event.successfulOrders,
          event.pendingOrders,
          event.failedOrders,
          successRate,
          event.eventData?.date || "N/A",
          event.eventData?.location || "N/A"
        ]);
      });

      // Add summary row
      const totalRevenue = filteredEvents.reduce((sum, event) => sum + event.totalRevenue, 0);
      const totalOrders = filteredEvents.reduce((sum, event) => sum + event.totalOrders, 0);
      const totalSeats = filteredEvents.reduce((sum, event) => sum + event.totalSeats, 0);
      const totalSuccessful = filteredEvents.reduce((sum, event) => sum + event.successfulOrders, 0);
      const totalPending = filteredEvents.reduce((sum, event) => sum + event.pendingOrders, 0);
      const totalFailed = filteredEvents.reduce((sum, event) => sum + event.failedOrders, 0);
      const overallSuccessRate = totalOrders > 0 ? ((totalSuccessful / totalOrders) * 100).toFixed(1) : 0;

      worksheetData.push([]);
      worksheetData.push([
        "TOTAL",
        totalRevenue,
        totalOrders,
        totalSeats,
        totalSuccessful,
        totalPending,
        totalFailed,
        overallSuccessRate,
        "",
        ""
      ]);

      // Try to create Excel file using SheetJS, fallback to CSV
      try {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        if (window.XLSX) {
          const workbook = window.XLSX.utils.book_new();
          const worksheet = window.XLSX.utils.aoa_to_sheet(worksheetData);

          const colWidths = [
            { wch: 30 }, // Event Title
            { wch: 15 }, // Total Revenue
            { wch: 12 }, // Total Orders
            { wch: 12 }, // Total Seats
            { wch: 15 }, // Successful Orders
            { wch: 15 }, // Pending Orders
            { wch: 12 }, // Failed Orders
            { wch: 15 }, // Success Rate
            { wch: 12 }, // Event Date
            { wch: 20 }  // Event Location
          ];
          worksheet["!cols"] = colWidths;

          window.XLSX.utils.book_append_sheet(workbook, worksheet, "Seller Report");
          window.XLSX.writeFile(workbook, `seller-report-${new Date().toISOString().split("T")[0]}.xlsx`);

          toast.success("Excel report downloaded successfully!");
        } else {
          throw new Error("XLSX not loaded");
        }

        document.head.removeChild(script);
      } catch (xlsxError) {
        console.warn("Excel generation failed, falling back to CSV:", xlsxError);

        // Fallback to CSV
        const csvContent = worksheetData
          .map((row) =>
            row
              .map((field) => {
                const stringField = String(field || "");
                return stringField.includes(",") ||
                  stringField.includes('"') ||
                  stringField.includes("\n")
                  ? `"${stringField.replace(/"/g, '""')}"`
                  : stringField;
              })
              .join(",")
          )
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `seller-report-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("CSV report downloaded successfully!");
      }
    } catch (err) {
      console.error("Error downloading report:", err);
      toast.error("Failed to download report. Please try again.");
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Fetch all data
  const fetchAllData = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events first, then sales data
      await fetchAllEvents();
      await fetchSalesData();

      if (showToast) {
        toast.success("Reports refreshed successfully!");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to fetch reports.";
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
    fetchAllData(true);
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString() || 0}`;
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

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <BarChart2 className="mr-3" size={28} />
                  Seller Reports Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Overview of your events, sales, and performance metrics
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer"
                  onClick={downloadExcelReport}
                  disabled={downloadingExcel}
                >
                  <FileSpreadsheet
                    className={`mr-1 ${downloadingExcel ? "animate-spin" : ""}`}
                    size={14}
                  />
                  {downloadingExcel ? "Excel..." : "Excel"}
                </button>
                
                <button
                  className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`mr-1 ${refreshing ? "animate-spin" : ""}`}
                    size={14}
                  />
                  Refresh
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

        {/* Statistics Cards */}
        {salesData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(stats.totalSales)}
                  </p>
                </div>
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Tickets Sold</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.totalTickets}
                  </p>
                </div>
                <Ticket className="text-blue-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Orders</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.totalOrders}
                  </p>
                </div>
                <ShoppingCart className="text-purple-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Completed</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.completedSales}
                  </p>
                </div>
                <CheckCircle className="text-orange-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {stats.pendingSales}
                  </p>
                </div>
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Events Report with Search */}
        {salesData?.orders && salesData.orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Events Overview ({filteredEvents.length} events)
                </h3>

                {/* Search Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search events..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
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
                      <ExternalLink className="text-orange-500 flex-shrink-0" size={18} />
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
                        <button className="w-full text-center text-orange-600 text-sm font-medium hover:text-orange-800">
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
                                ? "bg-orange-500 text-white"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Events Found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No events match your current search criteria. Try adjusting your search."
                  : "You haven't sold any tickets yet."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200"
                >
                  Clear Search
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
                <BarChart2 className="mr-2" size={20} />
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

export default SellerReport;