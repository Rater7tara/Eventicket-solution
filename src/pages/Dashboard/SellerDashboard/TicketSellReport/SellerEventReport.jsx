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
  User,
  Mail,
  TrendingUp,
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
  const [eventData, setEventData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // States for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
        const currentEventOrders = orders.filter(order => {
          const orderEventId = order.eventId?._id || order.eventId;
          return orderEventId === eventId;
        });
        
        setEventOrders(currentEventOrders);
        
        // Set event data from the first order if available
        if (currentEventOrders.length > 0 && currentEventOrders[0].eventId) {
          setEventData(currentEventOrders[0].eventId);
        }
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching event orders:", err);
      throw err;
    }
  };

  // Filter orders based on search term and status
  const filterOrders = () => {
    if (!eventOrders) return [];

    let filtered = eventOrders;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.paymentStatus === statusFilter);
    }

    // Filter by search term (booking ID, buyer info)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        return (
          order.bookingId?.toLowerCase().includes(term) ||
          order.buyerId?.name?.toLowerCase().includes(term) ||
          order.buyerId?.email?.toLowerCase().includes(term) ||
          order._id?.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  };

  // Update filtered orders when search term or status changes
  useEffect(() => {
    const filtered = filterOrders();
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, eventOrders]);

  // Download Excel report
  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);

      // Create worksheet data for detailed event report
      const worksheetData = [];
      const sellerInfo = eventOrders[0]?.sellerId;

      // Add seller information header
      if (sellerInfo) {
        worksheetData.push(["SELLER INFORMATION"]);
        worksheetData.push(["Seller Name", sellerInfo.name || "N/A"]);
        worksheetData.push(["Email", sellerInfo.email || "N/A"]);
        worksheetData.push(["Contact Number", sellerInfo.contactNumber || "N/A"]);
        worksheetData.push([]);
      }

      // Add event information
      if (eventData) {
        worksheetData.push(["EVENT INFORMATION"]);
        worksheetData.push(["Event Name", eventData.title || "N/A"]);
        worksheetData.push(["Event Date", eventData.date ? new Date(eventData.date).toLocaleDateString() : "N/A"]);
        worksheetData.push([]);
      }

      // Add headers for orders
      worksheetData.push([
        "Buyer Name",
        "Buyer Email",
        "Amount",
        "Quantity",
        "Seat Details",
        "Order Date",
        "Ticket Code"
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
          order.buyerId?.name || "N/A",
          order.buyerId?.email || "N/A",
          order.totalAmount || 0,
          order.quantity || 0,
          seatDetails,
          order.orderTime ? new Date(order.orderTime).toLocaleDateString() : "N/A",
          order.ticketCode || "N/A"
        ]);
      });

      // Add summary
      const stats = calculateStats();
      worksheetData.push([]);
      worksheetData.push(["SUMMARY"]);
      worksheetData.push(["Total Revenue", stats.totalRevenue]);
      worksheetData.push(["Total Orders", stats.totalOrders]);
      worksheetData.push(["Total Seats", stats.totalSeats]);
      worksheetData.push(["Successful Orders", stats.successfulOrders]);
      worksheetData.push(["Pending Orders", stats.pendingOrders]);
      worksheetData.push(["Failed Orders", stats.failedOrders]);
      worksheetData.push(["Success Rate", `${stats.successRate}%`]);
      worksheetData.push(["Average Order Value", stats.avgOrderValue]);

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
            { wch: 20 }, // Buyer Name
            { wch: 25 }, // Buyer Email
            { wch: 12 }, // Amount
            { wch: 10 }, // Quantity
            { wch: 30 }, // Seat Details
            { wch: 15 }, // Order Date
            { wch: 15 }  // Ticket Code
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
      const sellerInfo = eventOrders[0]?.sellerId;
      
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
              border-bottom: 2px solid #f97316; 
              padding-bottom: 10px; 
            }
            .title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 5px;
              color: #f97316;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 3px;
            }
            .date { 
              font-size: 12px; 
              color: #666; 
            }
            .seller-info {
              margin: 15px 0;
              padding: 10px;
              background-color: #e0f2fe;
              border: 1px solid #0ea5e9;
              border-radius: 5px;
            }
            .seller-info h4 {
              margin: 0 0 8px 0;
              font-size: 13px;
              color: #0369a1;
            }
            .seller-details {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              font-size: 11px;
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
              background-color: #f97316; 
              color: white;
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
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 10px;
            }
            .summary-item {
              font-size: 11px;
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
            <div class="title">${eventData?.title || 'Event Sales Report'}</div>
            <div class="subtitle">${eventData?.date ? `Event Date: ${new Date(eventData.date).toLocaleDateString('en-US')}` : ''}</div>
            <div class="date">Report Generated: ${new Date().toLocaleDateString('en-US')}</div>
          </div>
          
          ${sellerInfo ? `
          <div class="seller-info">
            <h4>Seller Information</h4>
            <div class="seller-details">
              <div><strong>Name:</strong> ${sellerInfo.name || 'N/A'}</div>
              <div><strong>Email:</strong> ${sellerInfo.email || 'N/A'}</div>
              <div><strong>Contact:</strong> ${sellerInfo.contactNumber || 'N/A'}</div>
            </div>
          </div>
          ` : ''}
          
          <div class="summary">
            <div class="summary-title">Performance Summary</div>
            <div class="summary-grid">
              <div class="summary-item"><strong>Total Orders:</strong> ${stats.totalOrders}</div>
              <div class="summary-item"><strong>Total Revenue:</strong> ${formatCurrency(stats.totalRevenue)}</div>
              <div class="summary-item"><strong>Total Seats:</strong> ${stats.totalSeats}</div>
              <div class="summary-item"><strong>Success Rate:</strong> ${stats.successRate}%</div>
              <div class="summary-item"><strong>Successful:</strong> ${stats.successfulOrders}</div>
              <div class="summary-item"><strong>Pending:</strong> ${stats.pendingOrders}</div>
              <div class="summary-item"><strong>Failed:</strong> ${stats.failedOrders}</div>
              <div class="summary-item"><strong>Avg Order:</strong> ${formatCurrency(stats.avgOrderValue)}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Buyer Name</th>
                <th>Buyer Email</th>
                <th>Amount</th>
                <th>Seats</th>
                <th>Seat Details</th>
                <th>Order Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => {
                return `
                  <tr>
                    <td>${order.buyerId?.name || "N/A"}</td>
                    <td>${order.buyerId?.email || "N/A"}</td>
                    <td>${formatCurrency(order.totalAmount)}</td>
                    <td>${order.quantity || 0}</td>
                    <td>${formatSeats(order.seats)}</td>
                    <td>${order.orderTime ? new Date(order.orderTime).toLocaleDateString() : "N/A"}</td>
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

  // Fetch all data
  const fetchAllData = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

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
    fetchAllData();
  }, [eventId]);

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
    const failedOrders = filteredOrders.filter(order => order.paymentStatus === 'failed' || order.paymentStatus === 'refunded').length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalRevenue,
      totalOrders,
      totalSeats,
      successfulOrders,
      pendingOrders,
      failedOrders,
      successRate: totalOrders > 0 ? ((successfulOrders / totalOrders) * 100).toFixed(1) : 0,
      avgOrderValue
    };
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
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
            <span className="ml-3 text-gray-600">Loading event report...</span>
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
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => navigate('/dashboard/sales-report')}
                    className="flex items-center text-gray-600 hover:text-gray-800 mr-4 transition-colors"
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
                  {eventData?.date && `Event Date: ${formatDate(eventData.date)} • `}
                  Detailed sales report and analytics
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer disabled:opacity-50"
                  onClick={downloadExcelReport}
                  disabled={downloadingExcel || filteredOrders.length === 0}
                >
                  <FileSpreadsheet
                    className={`mr-2 ${downloadingExcel ? "animate-spin" : ""}`}
                    size={16}
                  />
                  {downloadingExcel ? "Generating..." : "Excel"}
                </button>
                
                <button
                  onClick={downloadPDFReport}
                  disabled={downloadingPDF || filteredOrders.length === 0}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText
                    className={`mr-2 ${downloadingPDF ? "animate-spin" : ""}`}
                    size={16}
                  />
                  {downloadingPDF ? "Generating..." : "PDF"}
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

        {/* Seller Information Card */}
        {eventOrders && eventOrders.length > 0 && eventOrders[0].sellerId && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
                <User className="mr-2" size={20} />
                Seller Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Seller Name</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {eventOrders[0].sellerId?.name || "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mail className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {eventOrders[0].sellerId?.email || "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Contact Number</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {eventOrders[0].sellerId?.contactNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Stats */}
        {/* <div className="bg-white rounded-lg shadow-md overflow-hidden">
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

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="text-green-600 mr-2" size={20} />
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.successfulOrders}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="text-yellow-600 mr-2" size={20} />
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="text-blue-600 mr-2" size={20} />
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
            </div>
          </div>
        </div> */}


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
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by booking ID or buyer..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Seat Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="text-blue-600" size={18} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.buyerId?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.buyerId?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {order.quantity || 0} seat(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={formatSeats(order.seats)}>
                          {formatSeats(order.seats)}
                        </div>
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
                {searchTerm || statusFilter !== "all"
                  ? "No orders match your current search or filter criteria. Try adjusting your filters."
                  : "No orders have been recorded for this event yet."}
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200"
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

export default SellerEventReport;