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
  Eye,
  TrendingUp
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

  // Group orders by event - using the new API structure
  const groupOrdersByEvent = (orders) => {
    if (!orders || !Array.isArray(orders)) return [];

    const eventGroups = {};

    orders.forEach((order) => {
      const eventId = order.eventId?._id || order.eventId;
      const eventTitle = order.eventId?.title || `Event ${eventId?.slice(-8) || 'Unknown'}`;
      const eventDate = order.eventId?.date;

      if (!eventGroups[eventId]) {
        eventGroups[eventId] = {
          eventId: eventId,
          eventTitle: eventTitle,
          eventDate: eventDate,
          eventData: order.eventId,
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

      if (order.paymentStatus === 'success')
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
    if (!salesData?.orders) return [];

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
  }, [searchTerm, salesData]);

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
        "Event Date",
        "Total Revenue",
        "Total Orders",
        "Total Tickets",
        "Successful Orders",
        "Pending Orders",
        "Failed Orders",
        "Success Rate (%)",
        "Avg Order Value"
      ]);

      // Add event data
      filteredEvents.forEach((event) => {
        const successRate =
          event.totalOrders > 0
            ? ((event.successfulOrders / event.totalOrders) * 100).toFixed(1)
            : 0;
        
        const avgOrderValue = event.totalOrders > 0 
          ? (event.totalRevenue / event.totalOrders).toFixed(2)
          : 0;

        worksheetData.push([
          event.eventTitle,
          event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "N/A",
          event.totalRevenue,
          event.totalOrders,
          event.totalSeats,
          event.successfulOrders,
          event.pendingOrders,
          event.failedOrders,
          successRate,
          avgOrderValue
        ]);
      });

      // Add summary row
      worksheetData.push([]);
      worksheetData.push(["SUMMARY"]);
      
      const totalRevenue = filteredEvents.reduce((sum, event) => sum + event.totalRevenue, 0);
      const totalOrders = filteredEvents.reduce((sum, event) => sum + event.totalOrders, 0);
      const totalSeats = filteredEvents.reduce((sum, event) => sum + event.totalSeats, 0);
      const totalSuccessful = filteredEvents.reduce((sum, event) => sum + event.successfulOrders, 0);
      const totalPending = filteredEvents.reduce((sum, event) => sum + event.pendingOrders, 0);
      const totalFailed = filteredEvents.reduce((sum, event) => sum + event.failedOrders, 0);
      const overallSuccessRate = totalOrders > 0 ? ((totalSuccessful / totalOrders) * 100).toFixed(1) : 0;
      const overallAvgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

      worksheetData.push([
        "TOTAL",
        `${filteredEvents.length} Events`,
        totalRevenue,
        totalOrders,
        totalSeats,
        totalSuccessful,
        totalPending,
        totalFailed,
        overallSuccessRate,
        overallAvgOrderValue
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
            { wch: 12 }, // Event Date
            { wch: 15 }, // Total Revenue
            { wch: 12 }, // Total Orders
            { wch: 12 }, // Total Tickets
            { wch: 15 }, // Successful Orders
            { wch: 15 }, // Pending Orders
            { wch: 12 }, // Failed Orders
            { wch: 15 }, // Success Rate
            { wch: 15 }  // Avg Order Value
          ];
          worksheet["!cols"] = colWidths;

          window.XLSX.utils.book_append_sheet(workbook, worksheet, "Seller Report");
          
          const dateStr = new Date().toISOString().split("T")[0];
          window.XLSX.writeFile(workbook, `seller-report-${dateStr}.xlsx`);

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

  // Download PDF Report
  const downloadPDFReport = async () => {
    try {
      setDownloadingPDF(true);
      
      const stats = calculateStats();
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Seller Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 15px; 
              color: #333; 
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #f97316; 
              padding-bottom: 10px; 
            }
            .title { 
              font-size: 20px; 
              font-weight: bold; 
              margin-bottom: 5px;
              color: #f97316;
            }
            .date { 
              font-size: 12px; 
              color: #666; 
            }
            .summary {
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #333;
              background-color: #f9f9f9;
            }
            .summary-title {
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 10px;
            }
            .summary-item {
              font-size: 11px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              font-size: 10px;
            }
            th, td { 
              padding: 6px 8px; 
              text-align: left; 
              border: 1px solid #333;
              vertical-align: top;
            }
            th { 
              background-color: #f97316; 
              color: white;
              font-weight: bold; 
              font-size: 11px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #333;
              padding-top: 10px;
            }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Seller Sales Report</div>
            <div class="date">Generated: ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
          
          <div class="summary">
            <div class="summary-title">Overall Summary</div>
            <div class="summary-grid">
              <div class="summary-item"><strong>Total Earnings:</strong> ${formatCurrency(stats.totalSales)}</div>
              <div class="summary-item"><strong>Total Events:</strong> ${filteredEvents.length}</div>
              <div class="summary-item"><strong>Total Orders:</strong> ${stats.totalOrders}</div>
              <div class="summary-item"><strong>Tickets Sold:</strong> ${stats.totalTickets}</div>
              <div class="summary-item"><strong>Completed:</strong> ${stats.completedSales}</div>
              <div class="summary-item"><strong>Pending:</strong> ${stats.pendingSales}</div>
              <div class="summary-item"><strong>Failed:</strong> ${stats.failedSales || 0}</div>
              <div class="summary-item"><strong>Success Rate:</strong> ${stats.successRate}%</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Event Date</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Tickets</th>
                <th>Success</th>
                <th>Pending</th>
                <th>Failed</th>
                <th>Success %</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(event => {
                const successRate = event.totalOrders > 0 
                  ? ((event.successfulOrders / event.totalOrders) * 100).toFixed(1) 
                  : 0;
                return `
                  <tr>
                    <td>${event.eventTitle}</td>
                    <td>${event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "N/A"}</td>
                    <td>${formatCurrency(event.totalRevenue)}</td>
                    <td>${event.totalOrders}</td>
                    <td>${event.totalSeats}</td>
                    <td>${event.successfulOrders}</td>
                    <td>${event.pendingOrders}</td>
                    <td>${event.failedOrders}</td>
                    <td>${successRate}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report contains confidential information. Generated by Ticket Management System.</p>
          </div>
        </body>
        </html>
      `;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      toast.success('PDF report generated! Print dialog should open shortly.');
      
    } catch (err) {
      console.error('Error generating PDF report:', err);
      toast.error('Failed to generate PDF report. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Refresh reports
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSalesData().finally(() => setRefreshing(false));
  };

  // Load data on component mount
  useEffect(() => {
    fetchSalesData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return `$${(amount || 0).toLocaleString()}`;
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

  // Calculate summary statistics
  const calculateStats = () => {
    if (!salesData) {
      return { 
        totalSales: 0, 
        totalTickets: 0, 
        completedSales: 0, 
        pendingSales: 0, 
        failedSales: 0,
        totalOrders: 0,
        successRate: 0
      };
    }
    
    const completedOrders = salesData.orders.filter(order => order.paymentStatus === 'success');
    const pendingOrders = salesData.orders.filter(order => order.paymentStatus === 'pending');
    const failedOrders = salesData.orders.filter(order => 
      order.paymentStatus === 'failed' || order.paymentStatus === 'refunded'
    );
    
    const totalOrders = salesData.orders.length;
    const successRate = totalOrders > 0 
      ? ((completedOrders.length / totalOrders) * 100).toFixed(1)
      : 0;
    
    return {
      totalSales: salesData.totalEarnings || 0,
      totalTickets: salesData.totalTicketsSold || 0,
      completedSales: completedOrders.length,
      pendingSales: pendingOrders.length,
      failedSales: failedOrders.length,
      totalOrders: totalOrders,
      successRate: successRate
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
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading reports...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
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
                  Comprehensive overview of your events, sales, and performance metrics
                </p>
              </div>
              {/* <div className="flex gap-2">
                <button
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer disabled:opacity-50"
                  onClick={downloadExcelReport}
                  disabled={downloadingExcel || filteredEvents.length === 0}
                >
                  <FileSpreadsheet
                    className={`mr-2 ${downloadingExcel ? "animate-spin" : ""}`}
                    size={16}
                  />
                  {downloadingExcel ? "Generating..." : "Export Excel"}
                </button>
                
                <button
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer disabled:opacity-50"
                  onClick={downloadPDFReport}
                  disabled={downloadingPDF || filteredEvents.length === 0}
                >
                  <FileText
                    className={`mr-2 ${downloadingPDF ? "animate-spin" : ""}`}
                    size={16}
                  />
                  {downloadingPDF ? "Generating..." : "Export PDF"}
                </button>
                
                <button
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                    size={16}
                  />
                  Refresh
                </button>
              </div> */}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="mr-2 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold">Error Loading Reports</p>
                <p className="text-sm mt-1">{error}</p>
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
                {currentEvents.map((event) => {
                  const successRate = event.totalOrders > 0 
                    ? ((event.successfulOrders / event.totalOrders) * 100).toFixed(1)
                    : 0;
                  
                  return (
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

                      {event.eventDate && (
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(event.eventDate)}
                        </div>
                      )}

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
                          <span className="text-sm text-gray-600">Tickets Sold</span>
                          <span className="font-semibold text-purple-600">
                            {event.totalSeats}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="font-semibold text-gray-900">
                            {successRate}%
                          </span>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
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
                          <button className="w-full text-center text-orange-600 text-sm font-medium hover:text-orange-800 flex items-center justify-center">
                            View Detailed Report
                            <Eye size={14} className="ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  : "You haven't sold any tickets yet. Create your first event to get started!"}
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

        {/* Empty State */}
        {!loading && !error && (!salesData || !salesData.orders || salesData.orders.length === 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16">
            <div className="text-center">
              <BarChart2 size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sales Data Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start selling tickets to see your performance reports and analytics here.
              </p>
              <button 
                onClick={() => navigate('/dashboard/create-event')}
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                <Calendar className="mr-2" size={18} />
                Create Your First Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerReport;