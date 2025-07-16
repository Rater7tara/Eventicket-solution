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
  QrCode,
  X,
  Scan,
} from "lucide-react";
import serverURL from "../../../../ServerConfig";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";

const SellerEventReport = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventOrders, setEventOrders] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // States for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

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
      
      // Find current event data
      const currentEvent = events.find(event => event._id === eventId);
      if (currentEvent) {
        setEventData(currentEvent);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setAllEvents([]);
    }
  };

  // Fetch seller earnings and filter for current event
  const fetchEventOrders = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) return;

      const response = await axios.get(
        `${serverURL.url}seller/earnings`,
        authHeaders
      );
      
      if (response.data?.success) {
        const orders = response.data.data.orders || [];
        
        // Filter orders for this specific event
        const currentEventOrders = orders.filter(order => order.eventId === eventId);
        
        setEventOrders(currentEventOrders);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching event orders:", err);
      throw err;
    }
  };

  // Filter orders based on search term
  const filterOrders = () => {
    if (!eventOrders) return [];

    let filtered = eventOrders;

    // Filter by search term (booking ID, buyer info)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        return (
          order.bookingId?.toLowerCase().includes(term) ||
          order.buyerId?.toLowerCase().includes(term) ||
          order._id?.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  };

  // Update filtered orders when search term changes
  useEffect(() => {
    const filtered = filterOrders();
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, eventOrders]);

  // Download Excel report
  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);

      // Create worksheet data for detailed event report
      const worksheetData = [];

      // Add headers
      worksheetData.push([
        "Booking ID",
        "Order ID",
        "Buyer ID",
        "Amount",
        "Payment Status",
        "Seats",
        "Seat Details",
        "Order Date",
        "Quantity"
      ]);

      // Add order data
      filteredOrders.forEach((order) => {
        // Create seat details string
        let seatDetails = "";
        if (order.seats && order.seats.length > 0) {
          seatDetails = order.seats
            .map(seat => `${seat.section}-${seat.row}${seat.seatNumber}`)
            .join("; ");
        } else {
          seatDetails = "General Admission";
        }

        worksheetData.push([
          order.bookingId || "N/A",
          order._id || "N/A",
          order.buyerId || "N/A",
          order.totalAmount || 0,
          order.paymentStatus || "Unknown",
          order.quantity || 0,
          seatDetails,
          order.orderTime ? new Date(order.orderTime).toLocaleDateString() : "N/A",
          order.quantity || 0
        ]);
      });

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

          // Set column widths for better readability
          const colWidths = [
            { wch: 15 }, // Booking ID
            { wch: 25 }, // Order ID
            { wch: 25 }, // Buyer ID
            { wch: 12 }, // Amount
            { wch: 15 }, // Payment Status
            { wch: 8 },  // Seats
            { wch: 30 }, // Seat Details
            { wch: 12 }, // Order Date
            { wch: 10 }  // Quantity
          ];
          worksheet["!cols"] = colWidths;

          window.XLSX.utils.book_append_sheet(workbook, worksheet, "Event Report");

          // Generate filename with event title and date
          const eventTitle = (eventData?.title || "Event").replace(/[^a-zA-Z0-9]/g, "_");
          const dateStr = new Date().toISOString().split("T")[0];
          const filename = `${eventTitle}_seller_report_${dateStr}.xlsx`;

          window.XLSX.writeFile(workbook, filename);

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
        
        const eventTitle = (eventData?.title || "Event").replace(/[^a-zA-Z0-9]/g, "_");
        const dateStr = new Date().toISOString().split("T")[0];
        link.download = `${eventTitle}_seller_report_${dateStr}.csv`;
        
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

  // Download PDF Report Function
  const downloadPDFReport = async () => {
    try {
      setDownloadingPDF(true);
      
      const stats = calculateStats();
      
      // Create simple HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Event Sales Report</title>
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
              border-bottom: 1px solid #333; 
              padding-bottom: 10px; 
            }
            .title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .date { 
              font-size: 12px; 
              color: #666; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              font-size: 11px;
            }
            th, td { 
              padding: 6px 8px; 
              text-align: left; 
              border: 1px solid #333;
              vertical-align: top;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              font-size: 11px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .summary {
              margin: 20px 0;
              padding: 10px;
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
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
            }
            .summary-item {
              font-size: 11px;
            }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${eventData?.title || 'Event Sales Report'}</div>
            <div class="date">Generated: ${new Date().toLocaleDateString('en-US')}</div>
          </div>
          
          <div class="summary">
            <div class="summary-title">Summary</div>
            <div class="summary-grid">
              <div class="summary-item"><strong>Total Orders:</strong> ${stats.totalOrders}</div>
              <div class="summary-item"><strong>Total Revenue:</strong> ${formatCurrency(stats.totalRevenue)}</div>
              <div class="summary-item"><strong>Total Seats:</strong> ${stats.totalSeats}</div>
              <div class="summary-item"><strong>Successful:</strong> ${stats.successfulOrders}</div>
              <div class="summary-item"><strong>Pending:</strong> ${stats.pendingOrders}</div>
              <div class="summary-item"><strong>Failed:</strong> ${stats.failedOrders}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Amount</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => {
                return `
                  <tr>
                    <td>${order.bookingId?.slice(-8) || "N/A"}</td>
                    <td>${formatCurrency(order.totalAmount)}</td>
                    <td>${order.quantity || 0}</td>
                    <td>${order.paymentStatus || "Unknown"}</td>
                    <td>${order.orderTime ? new Date(order.orderTime).toLocaleDateString() : "N/A"}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
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

  // Fetch all data
  const fetchAllData = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      await fetchAllEvents();
      await fetchEventOrders();

      if (showToast) {
        toast.success("Event report refreshed successfully!");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to fetch event report.";
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
    const successfulOrders = filteredOrders.filter(order => order.paymentStatus === 'completed' || order.paymentStatus === 'paid').length;
    const pendingOrders = filteredOrders.filter(order => order.paymentStatus === 'pending').length;
    const failedOrders = filteredOrders.filter(order => order.paymentStatus === 'failed' || order.paymentStatus === 'refunded').length;
    
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

  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format seats
  const formatSeats = (seats) => {
    if (!seats || seats.length === 0) return "General Admission";
    return seats.map(seat => `${seat.section}-${seat.row}${seat.seatNumber}`).join(', ');
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
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => navigate('/dashboard/sales-report')}
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
                  Detailed sales report for this event
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
                  onClick={downloadPDFReport}
                  disabled={downloadingPDF}
                  className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText
                    className={`mr-1 ${downloadingPDF ? "animate-spin" : ""}`}
                    size={14}
                  />
                  {downloadingPDF ? "PDF..." : "PDF"}
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
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Success Rate</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {stats.successRate}%
                    </p>
                  </div>
                  <CheckCircle className="text-orange-600" size={24} />
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
                
                {/* Search Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by booking ID or order..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seat Details
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {order.bookingId?.slice(-8) || order._id?.slice(-8) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {order.quantity || 0} seat(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={formatSeats(order.seats)}>
                          {formatSeats(order.seats)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.paymentStatus)}`}>
                          {(order.paymentStatus || "unknown").charAt(0).toUpperCase() + (order.paymentStatus || "unknown").slice(1)}
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

        {/* No Orders Message */}
        {eventOrders && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No orders match your current search criteria. Try adjusting your search."
                  : "No orders have been recorded for this event yet."}
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
      </div>
    </div>
  );
};

export default SellerEventReport;