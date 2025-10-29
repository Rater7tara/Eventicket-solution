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
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Shield,
  UserPlus,
  User,
  Scan,
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
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
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
      const currentEventOrders = orders.filter(
        (order) => order.eventId?._id === eventId || order.eventId === eventId
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

  // Filter orders based on search term
  const filterOrders = () => {
    if (!eventOrders) return [];

    let filtered = eventOrders;

    // Filter by search term (seller name, buyer name, order ID, email)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const sellerName = order.sellerId?.name || "";
        const sellerEmail = order.sellerId?.email || "";
        const buyerName = order.buyerId?.name || "";
        const buyerEmail = order.buyerId?.email || "";
        
        return (
          sellerName.toLowerCase().includes(term) ||
          sellerEmail.toLowerCase().includes(term) ||
          buyerName.toLowerCase().includes(term) ||
          buyerEmail.toLowerCase().includes(term) ||
          order._id?.toLowerCase().includes(term) ||
          order.bookingId?.toLowerCase().includes(term)
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

  // Download Excel Report
  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);

      // Create worksheet data for detailed event report
      const worksheetData = [];

      // Add headers
      worksheetData.push([
        "Order ID",
        "Booking ID",
        "Seller Name",
        "Seller Email",
        "Buyer Name",
        "Buyer Email",
        "Amount",
        "Payment Status",
        "Seats",
        "Seat Details",
        "Scan Status",
        "Order Date",
        "Ticket Code",
      ]);

      // Add order data
      filteredOrders.forEach((order) => {
        // Create seat details string
        let seatDetails = "";
        if (order.seats && order.seats.length > 0) {
          seatDetails = order.seats
            .map(
              (seat) =>
                `${seat.section} ${seat.row}${seat.seatNumber} ($${
                  seat.price || 0
                })`
            )
            .join("; ");
        } else {
          seatDetails = "General Admission";
        }

        // Get scan status
        const scanStatus = order.scanStatus || "not_scanned";
        const scanStatusDisplay = scanStatus === "scanned" ? "Scanned" : "Not Scanned";

        worksheetData.push([
          order._id || "N/A",
          order.bookingId || "N/A",
          order.sellerId?.name || "N/A",
          order.sellerId?.email || "N/A",
          order.buyerId?.name || "N/A",
          order.buyerId?.email || "N/A",
          order.totalAmount || 0,
          order.paymentStatus || "Unknown",
          order.quantity || 0,
          seatDetails,
          scanStatusDisplay,
          order.orderTime
            ? new Date(order.orderTime).toLocaleDateString()
            : "N/A",
          order.ticketCode || "N/A",
        ]);
      });

      // Try to create Excel file using SheetJS, fallback to CSV
      try {
        // Load SheetJS from CDN
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        if (window.XLSX) {
          // Create Excel file
          const workbook = window.XLSX.utils.book_new();
          const worksheet = window.XLSX.utils.aoa_to_sheet(worksheetData);

          // Set column widths for better readability
          const colWidths = [
            { wch: 25 }, // Order ID
            { wch: 15 }, // Booking ID
            { wch: 20 }, // Seller Name
            { wch: 25 }, // Seller Email
            { wch: 20 }, // Buyer Name
            { wch: 25 }, // Buyer Email
            { wch: 12 }, // Amount
            { wch: 15 }, // Payment Status
            { wch: 8 }, // Seats
            { wch: 30 }, // Seat Details
            { wch: 15 }, // Scan Status
            { wch: 12 }, // Order Date
            { wch: 15 }, // Ticket Code
          ];
          worksheet["!cols"] = colWidths;

          // Add worksheet to workbook
          window.XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Event Report"
          );

          // Create a separate sheet for seat-level details if there are multi-seat orders
          const multiSeatOrders = filteredOrders.filter(
            (order) => order.seats && order.seats.length > 1
          );
          if (multiSeatOrders.length > 0) {
            const seatWorksheetData = [];
            seatWorksheetData.push([
              "Order ID",
              "Booking ID",
              "Buyer Name",
              "Seat Section",
              "Seat Row",
              "Seat Number",
              "Seat Price",
              "Scan Status",
              "Ticket Code",
            ]);

            multiSeatOrders.forEach((order) => {
              const scanStatus = order.scanStatus || "not_scanned";
              const scanStatusDisplay = scanStatus === "scanned" ? "Scanned" : "Not Scanned";

              order.seats.forEach((seat, index) => {
                seatWorksheetData.push([
                  order._id || "N/A",
                  order.bookingId || "N/A",
                  order.buyerId?.name || "N/A",
                  seat.section || "N/A",
                  seat.row || "N/A",
                  seat.seatNumber || seat.number || "N/A",
                  seat.price || 0,
                  scanStatusDisplay,
                  order.ticketCode || "N/A",
                ]);
              });
            });

            const seatWorksheet =
              window.XLSX.utils.aoa_to_sheet(seatWorksheetData);
            const seatColWidths = [
              { wch: 25 }, // Order ID
              { wch: 15 }, // Booking ID
              { wch: 20 }, // Buyer Name
              { wch: 15 }, // Seat Section
              { wch: 10 }, // Seat Row
              { wch: 12 }, // Seat Number
              { wch: 12 }, // Seat Price
              { wch: 15 }, // Scan Status
              { wch: 15 }, // Ticket Code
            ];
            seatWorksheet["!cols"] = seatColWidths;

            window.XLSX.utils.book_append_sheet(
              workbook,
              seatWorksheet,
              "Seat Details"
            );
          }

          // Generate filename with event title and date
          const eventTitle = (eventData?.title || "Event").replace(
            /[^a-zA-Z0-9]/g,
            "_"
          );
          const dateStr = new Date().toISOString().split("T")[0];
          const filename = `${eventTitle}_report_${dateStr}.xlsx`;

          // Download the file
          window.XLSX.writeFile(workbook, filename);

          toast.success("Excel report downloaded successfully!");
        } else {
          throw new Error("XLSX not loaded");
        }

        // Clean up script
        document.head.removeChild(script);
      } catch (xlsxError) {
        console.warn(
          "Excel generation failed, falling back to CSV:",
          xlsxError
        );

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

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const eventTitle = (eventData?.title || "Event").replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );
        const dateStr = new Date().toISOString().split("T")[0];
        link.download = `${eventTitle}_report_${dateStr}.csv`;

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

      // Create simple HTML content for PDF - just the table
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
            <div class="title">${eventData?.title || "Event Sales Report"}</div>
            <div class="date">Generated: ${new Date().toLocaleDateString(
              "en-US"
            )}</div>
          </div>
          
          <div class="summary">
            <div class="summary-title">Summary</div>
            <div class="summary-grid">
              <div class="summary-item"><strong>Total Orders:</strong> ${
                stats.totalOrders
              }</div>
              <div class="summary-item"><strong>Total Revenue:</strong> ${formatCurrency(
                stats.totalRevenue
              )}</div>
              <div class="summary-item"><strong>Total Seats:</strong> ${
                stats.totalSeats
              }</div>
              <div class="summary-item"><strong>Successful:</strong> ${
                stats.successfulOrders
              }</div>
              <div class="summary-item"><strong>Pending:</strong> ${
                stats.pendingOrders
              }</div>
              <div class="summary-item"><strong>Failed:</strong> ${
                stats.failedOrders
              }</div>
              <div class="summary-item"><strong>Scanned:</strong> ${
                stats.scannedOrders
              }</div>
              <div class="summary-item"><strong>Not Scanned:</strong> ${
                stats.notScannedOrders
              }</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Seats</th>
                <th>Scan Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders
                .map((order) => {
                  const scanStatus = order.scanStatus || "not_scanned";
                  const scanStatusDisplay = scanStatus === "scanned" ? "Scanned" : "Not Scanned";

                  return `
                  <tr>
                    <td>${order.sellerId?.name || "N/A"}<br/><small>${order.sellerId?.email || ""}</small></td>
                    <td>${order.buyerId?.name || "N/A"}<br/><small>${order.buyerId?.email || ""}</small></td>
                    <td>${formatCurrency(order.totalAmount)}</td>
                    <td>${order.quantity || 0}</td>
                    <td>${scanStatusDisplay}</td>
                    <td>${
                      order.orderTime
                        ? new Date(order.orderTime).toLocaleDateString()
                        : "N/A"
                    }</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      toast.success("PDF report generated! Print dialog should open shortly.");
    } catch (err) {
      console.error("Error generating PDF report:", err);
      toast.error("Failed to generate PDF report. Please try again.");
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
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const totalOrders = filteredOrders.length;
    const totalSeats = filteredOrders.reduce(
      (sum, order) => sum + (order.quantity || 0),
      0
    );
    const successfulOrders = filteredOrders.filter(
      (order) => order.paymentStatus === "success"
    ).length;
    const pendingOrders = filteredOrders.filter(
      (order) => order.paymentStatus === "pending"
    ).length;
    const failedOrders = filteredOrders.filter(
      (order) => order.paymentStatus === "failed"
    ).length;
    const scannedOrders = filteredOrders.filter(
      (order) => order.scanStatus === "scanned"
    ).length;
    const notScannedOrders = filteredOrders.filter(
      (order) => order.scanStatus === "not_scanned" || !order.scanStatus
    ).length;

    return {
      totalRevenue,
      totalOrders,
      totalSeats,
      successfulOrders,
      pendingOrders,
      failedOrders,
      scannedOrders,
      notScannedOrders,
      successRate:
        totalOrders > 0
          ? ((successfulOrders / totalOrders) * 100).toFixed(1)
          : 0,
      scanRate:
        totalOrders > 0
          ? ((scannedOrders / totalOrders) * 100).toFixed(1)
          : 0,
    };
  };

  // Get scan status badge
  const getScanStatusBadge = (scanStatus) => {
    if (scanStatus === "scanned") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Scan size={12} className="mr-1" />
          Scanned
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock size={12} className="mr-1" />
          Not Scanned
        </span>
      );
    }
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate("/dashboard/reports")}
                  className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
                  📊 Event Report & Analytics
                </h1>
              </div>

              {eventData && (
                <div className="ml-9">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-2">
                    {eventData.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="mr-2" size={16} />
                      {new Date(eventData.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="mr-2" size={16} />
                      {eventData.venue}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex-row gap-3">
              <button
                onClick={() =>
                  navigate(`/dashboard/event/${eventId}/moderators`)
                }
                className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-md cursor-pointer"
                title="View all moderators"
              >
                <Shield size={20} className="mr-2" />
                View Moderators
              </button>

              <button
                onClick={() =>
                  navigate(`/dashboard/event/${eventId}/create-moderator`)
                }
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md cursor-pointer"
                title="Create new moderator for this event"
              >
                <UserPlus size={20} className="mr-2" />
                Create Moderator
              </button>

              <button
                onClick={downloadPDFReport}
                disabled={downloadingPDF}
                className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                {downloadingPDF ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" size={20} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" size={20} />
                    Download PDF
                  </>
                )}
              </button>

              <button
                onClick={downloadExcelReport}
                disabled={downloadingExcel}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                {downloadingExcel ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" size={20} />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2" size={20} />
                    Download Excel
                  </>
                )}
              </button>
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
                    <p className="text-sm font-medium text-green-600">
                      Total Revenue
                    </p>
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
                    <p className="text-sm font-medium text-blue-600">
                      Total Orders
                    </p>
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
                    <p className="text-sm font-medium text-purple-600">
                      Seats Sold
                    </p>
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
                    <p className="text-sm font-medium text-indigo-600">
                      Scan Rate
                    </p>
                    <p className="text-2xl font-bold text-indigo-900">
                      {stats.scanRate}%
                    </p>
                  </div>
                  <Scan className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        {/* <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">
              Order Status Breakdown
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Successful Orders
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {stats.successfulOrders}
                    </p>
                  </div>
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>

              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      Pending Orders
                    </p>
                    <p className="text-xl font-bold text-yellow-900">
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <Clock className="text-yellow-600" size={20} />
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Failed Orders
                    </p>
                    <p className="text-xl font-bold text-red-900">
                      {stats.failedOrders}
                    </p>
                  </div>
                  <XCircle className="text-red-600" size={20} />
                </div>
              </div>

              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Scanned
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {stats.scannedOrders}
                    </p>
                  </div>
                  <Scan className="text-green-600" size={20} />
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Not Scanned
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {stats.notScannedOrders}
                    </p>
                  </div>
                  <Clock className="text-gray-600" size={20} />
                </div>
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

                {/* Search Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, email, or order ID..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                      Scan Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => {
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <User size={14} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {order.sellerId?.name || "N/A"}
                              </div>
                              {order.sellerId?.email && (
                                <div className="text-xs text-gray-500">
                                  {order.sellerId.email}
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
                                {order.buyerId?.name || "N/A"}
                              </div>
                              {order.buyerId?.email && (
                                <div className="text-xs text-gray-500">
                                  {order.buyerId.email}
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
                          {getScanStatusBadge(order.scanStatus)}
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
                        index < array.length - 1 &&
                        array[index + 1] !== page + 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="px-3 py-1 text-gray-500">
                              ...
                            </span>
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
                            <span className="px-3 py-1 text-gray-500">
                              ...
                            </span>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Orders Found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No orders match your current search criteria. Try adjusting your search."
                  : "No orders have been recorded for this event yet."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
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

export default EventReport;