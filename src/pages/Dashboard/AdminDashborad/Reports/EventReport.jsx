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
  Shield, UserPlus
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
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [ticketVerification, setTicketVerification] = useState({});
  const [showTicketScanner, setShowTicketScanner] = useState(false);
  const [scannedTicketId, setScannedTicketId] = useState("");

  // NEW: Barcode modal states
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedOrderForBarcode, setSelectedOrderForBarcode] = useState(null);

  // NEW: Barcode scanning states
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(""); // 'success', 'pending', 'error'
  const [isScanning, setIsScanning] = useState(false);

  // NEW: Individual seat verification tracking
  const [seatVerification, setSeatVerification] = useState({}); // Track each seat separately

  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // UPDATED REALISTIC BARCODE COMPONENT - Now uses backend ticketCode
  const BarcodeDisplay = ({
    ticketCode,
    isCancelled = false,
    size = "normal",
  }) => {
    // Use the ticketCode directly from backend, no generation needed
    const barcodeId = ticketCode || "000000000000"; // Fallback if no ticketCode
    const containerHeight = size === "large" ? "h-16" : "h-12";

    const generateRealisticBarcode = (data) => {
      const bars = [];

      // Start pattern for Code 128
      bars.push({ type: "bar", width: 2 });
      bars.push({ type: "space", width: 1 });
      bars.push({ type: "bar", width: 1 });
      bars.push({ type: "space", width: 1 });
      bars.push({ type: "bar", width: 1 });
      bars.push({ type: "space", width: 1 });

      // Data pattern based on barcode ID
      for (let i = 0; i < data.length; i++) {
        const digit = parseInt(data[i]) || 0;

        switch (digit % 4) {
          case 0:
            bars.push({ type: "bar", width: 1 });
            bars.push({ type: "space", width: 1 });
            bars.push({ type: "bar", width: 3 });
            bars.push({ type: "space", width: 2 });
            break;
          case 1:
            bars.push({ type: "bar", width: 2 });
            bars.push({ type: "space", width: 1 });
            bars.push({ type: "bar", width: 1 });
            bars.push({ type: "space", width: 3 });
            break;
          case 2:
            bars.push({ type: "bar", width: 1 });
            bars.push({ type: "space", width: 2 });
            bars.push({ type: "bar", width: 2 });
            bars.push({ type: "space", width: 1 });
            break;
          case 3:
            bars.push({ type: "bar", width: 3 });
            bars.push({ type: "space", width: 1 });
            bars.push({ type: "bar", width: 1 });
            bars.push({ type: "space", width: 2 });
            break;
        }
      }

      // End pattern for Code 128
      bars.push({ type: "bar", width: 2 });
      bars.push({ type: "space", width: 1 });
      bars.push({ type: "bar", width: 1 });
      bars.push({ type: "space", width: 1 });
      bars.push({ type: "bar", width: 1 });
      bars.push({ type: "space", width: 1 });
      bars.push({ type: "bar", width: 2 });

      return bars;
    };

    const barPattern = generateRealisticBarcode(barcodeId);

    return (
      <div className="text-center">
        <div
          className={`bg-white p-3 rounded border ${containerHeight} flex items-center justify-center shadow-sm`}
        >
          <div className="flex items-end">
            {barPattern.map((element, i) => {
              if (element.type === "space") {
                return <div key={i} style={{ width: `${element.width}px` }} />;
              }

              const height = size === "large" ? 45 : 35;

              return (
                <div
                  key={i}
                  className={`${isCancelled ? "bg-gray-400" : "bg-black"}`}
                  style={{
                    width: `${element.width}px`,
                    height: `${height}px`,
                  }}
                />
              );
            })}
          </div>
        </div>
        <div
          className={`text-center ${size === "large" ? "text-sm" : "text-xs"
            } mt-2 font-mono tracking-wider ${isCancelled ? "text-gray-400" : "text-gray-700"
            }`}
        >
          {barcodeId}
        </div>
      </div>
    );
  };

  // UPDATED: Enhanced barcode verification function for individual seats - now uses backend ticketCode
  const verifyScannedBarcode = (scannedCode) => {
    // Check all orders for matching ticketCode
    const validTickets = [];

    eventOrders.forEach((order) => {
      if (order.seats && order.seats.length > 0) {
        // Multiple seat tickets - check if order has a ticketCode that matches
        if (order.ticketCode === scannedCode) {
          // For multi-seat orders, we need to determine which specific seat
          // Since we can't distinguish individual seats with the same ticketCode,
          // we'll verify the first unverified seat
          const unverifiedSeatIndex = order.seats.findIndex((seat, index) => {
            const seatKey = `${order._id}_seat_${index}`;
            const currentStatus = seatVerification[seatKey];
            return !currentStatus || currentStatus === "Pending";
          });

          if (unverifiedSeatIndex !== -1) {
            const seat = order.seats[unverifiedSeatIndex];
            const seatInfo = `${seat.section} ${seat.row}${seat.seatNumber}`;
            validTickets.push({
              ticketCode: order.ticketCode,
              orderId: order._id,
              ticketId: `${order._id}_seat_${unverifiedSeatIndex}`,
              seatIndex: unverifiedSeatIndex,
              seatInfo,
              order,
              seat,
            });
          } else {
            // All seats already verified/used
            const seat = order.seats[0];
            const seatInfo = `${seat.section} ${seat.row}${seat.seatNumber}`;
            validTickets.push({
              ticketCode: order.ticketCode,
              orderId: order._id,
              ticketId: `${order._id}_seat_0`,
              seatIndex: 0,
              seatInfo,
              order,
              seat,
              allUsed: true,
            });
          }
        }
      } else {
        // General admission ticket
        if (order.ticketCode === scannedCode) {
          validTickets.push({
            ticketCode: order.ticketCode,
            orderId: order._id,
            ticketId: order._id,
            seatIndex: 0,
            seatInfo: "General Admission",
            order,
            seat: null,
          });
        }
      }
    });

    // Check if scanned code matches any valid ticket
    const matchedTicket = validTickets.find(
      (ticket) => ticket.ticketCode === scannedCode
    );

    if (matchedTicket) {
      // Check if all seats are already used
      if (matchedTicket.allUsed) {
        return {
          status: "already-used",
          message: `All seats for this ticket are already used`,
          ticket: matchedTicket,
          seatKey: `${matchedTicket.orderId}_seat_${matchedTicket.seatIndex}`,
        };
      }

      // Create unique seat key for tracking individual seats
      const seatKey = `${matchedTicket.orderId}_seat_${matchedTicket.seatIndex}`;
      const currentSeatStatus = seatVerification[seatKey];

      if (currentSeatStatus === "Used") {
        return {
          status: "already-used",
          message: `Seat ${matchedTicket.seatInfo} already used`,
          ticket: matchedTicket,
          seatKey,
        };
      } else if (currentSeatStatus === "Verified") {
        return {
          status: "already-verified",
          message: `Seat ${matchedTicket.seatInfo} already verified`,
          ticket: matchedTicket,
          seatKey,
        };
      } else {
        // Mark this specific seat as verified
        setSeatVerification((prev) => ({
          ...prev,
          [seatKey]: "Verified",
        }));

        // Also update overall order verification for display
        updateOrderVerificationStatus(matchedTicket.orderId);

        return {
          status: "success",
          message: `Seat ${matchedTicket.seatInfo} verified successfully`,
          ticket: matchedTicket,
          seatKey,
        };
      }
    } else {
      return {
        status: "pending",
        message: "Invalid barcode - ticket not found",
        ticket: null,
        seatKey: null,
      };
    }
  };

  // Helper function to update overall order verification status
  const updateOrderVerificationStatus = (orderId) => {
    const order = eventOrders.find((o) => o._id === orderId);
    if (!order) return;

    if (order.seats && order.seats.length > 0) {
      // Check how many seats are verified for this order
      const totalSeats = order.seats.length;
      let verifiedSeats = 0;
      let usedSeats = 0;

      order.seats.forEach((seat, index) => {
        const seatKey = `${orderId}_seat_${index}`;
        const seatStatus = seatVerification[seatKey];
        if (seatStatus === "Verified") verifiedSeats++;
        if (seatStatus === "Used") usedSeats++;
      });

      // Update overall order status based on seat statuses
      if (usedSeats === totalSeats) {
        setTicketVerification((prev) => ({ ...prev, [orderId]: "Used" }));
      } else if (verifiedSeats + usedSeats === totalSeats) {
        setTicketVerification((prev) => ({ ...prev, [orderId]: "Verified" }));
      } else if (verifiedSeats > 0 || usedSeats > 0) {
        setTicketVerification((prev) => ({ ...prev, [orderId]: "Partial" }));
      } else {
        setTicketVerification((prev) => ({ ...prev, [orderId]: "Pending" }));
      }
    } else {
      // Single seat - update directly
      const seatKey = `${orderId}_seat_0`;
      const seatStatus = seatVerification[seatKey];
      setTicketVerification((prev) => ({
        ...prev,
        [orderId]: seatStatus || "Pending",
      }));
    }
  };

  // Helper function to get order verification status with seat details
  const getOrderVerificationStatus = (order) => {
    if (!order.seats || order.seats.length <= 1) {
      // Single seat or no seats
      const status = ticketVerification[order._id] || "Pending";
      return { status, details: null };
    }

    // Multiple seats - check individual seat statuses
    const seatStatuses = order.seats.map((seat, index) => {
      const seatKey = `${order._id}_seat_${index}`;
      const seatStatus = seatVerification[seatKey] || "Pending";
      return {
        index,
        seat,
        status: seatStatus,
        seatInfo: `${seat.section} ${seat.row}${seat.seatNumber}`,
      };
    });

    const totalSeats = seatStatuses.length;
    const verifiedSeats = seatStatuses.filter(
      (s) => s.status === "Verified"
    ).length;
    const usedSeats = seatStatuses.filter((s) => s.status === "Used").length;
    const pendingSeats = seatStatuses.filter(
      (s) => s.status === "Pending"
    ).length;

    let overallStatus;
    if (usedSeats === totalSeats) {
      overallStatus = "Used";
    } else if (verifiedSeats + usedSeats === totalSeats) {
      overallStatus = "Verified";
    } else if (verifiedSeats > 0 || usedSeats > 0) {
      overallStatus = "Partial";
    } else {
      overallStatus = "Pending";
    }

    return {
      status: overallStatus,
      details: {
        total: totalSeats,
        verified: verifiedSeats,
        used: usedSeats,
        pending: pendingSeats,
        seats: seatStatuses,
      },
    };
  };

  // Handle individual seat verification (mark as used)
  const handleSeatVerification = (orderId, seatIndex, newStatus) => {
    const seatKey = `${orderId}_seat_${seatIndex}`;

    setSeatVerification((prev) => ({
      ...prev,
      [seatKey]: newStatus,
    }));

    // Update overall order status
    setTimeout(() => updateOrderVerificationStatus(orderId), 100);

    const order = eventOrders.find((o) => o._id === orderId);
    const seat = order?.seats?.[seatIndex];
    const seatInfo = seat
      ? `${seat.section} ${seat.row}${seat.seatNumber}`
      : `Seat ${seatIndex + 1}`;

    toast.success(`${seatInfo} marked as ${newStatus.toLowerCase()}`);
  };

  const downloadExcelReport = async () => {
    try {
      setDownloadingExcel(true);

      // Create worksheet data for detailed event report
      const worksheetData = [];

      // Add headers
      worksheetData.push([
        "Order ID",
        "Seller Name",
        "Seller Email",
        "Buyer Name",
        "Buyer Email",
        "Buyer Phone",
        "Amount",
        "Payment Status",
        "Seats",
        "Seat Details",
        "Verification Status",
        "Order Date",
        "Booking ID",
        "Ticket Code",
      ]);

      // Add order data
      filteredOrders.forEach((order) => {
        const seller = getUserById(order.sellerId);
        const buyer = getUserById(order.buyerId);
        const verificationInfo = getOrderVerificationStatus(order);

        // Create seat details string
        let seatDetails = "";
        if (order.seats && order.seats.length > 0) {
          seatDetails = order.seats
            .map(
              (seat) =>
                `${seat.section} ${seat.row}${seat.seatNumber} ($${seat.price || 0
                })`
            )
            .join("; ");
        } else {
          seatDetails = "General Admission";
        }

        // Enhanced verification status with seat breakdown
        let verificationStatus = verificationInfo.status;
        if (verificationInfo.details) {
          verificationStatus += ` (${verificationInfo.details.verified}V/${verificationInfo.details.used}U/${verificationInfo.details.pending}P)`;
        }

        worksheetData.push([
          order._id || "N/A",
          seller?.name || "N/A",
          seller?.email || "N/A",
          buyer?.name || "N/A",
          buyer?.email || "N/A",
          buyer?.phone || "N/A",
          order.totalAmount || 0,
          order.paymentStatus || "Unknown",
          order.quantity || 0,
          seatDetails,
          verificationStatus,
          order.orderTime
            ? new Date(order.orderTime).toLocaleDateString()
            : "N/A",
          order.bookingId || order._id?.slice(-8) || "N/A",
          order.ticketCode || "N/A",
        ]);
      });

      // Summary sections removed for cleaner Excel export

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
            { wch: 20 }, // Seller Name
            { wch: 25 }, // Seller Email
            { wch: 20 }, // Buyer Name
            { wch: 25 }, // Buyer Email
            { wch: 15 }, // Buyer Phone
            { wch: 12 }, // Amount
            { wch: 15 }, // Payment Status
            { wch: 8 }, // Seats
            { wch: 30 }, // Seat Details
            { wch: 20 }, // Verification Status
            { wch: 12 }, // Order Date
            { wch: 15 }, // Booking ID
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
              "Buyer Name",
              "Seat Section",
              "Seat Row",
              "Seat Number",
              "Seat Price",
              "Seat Verification Status",
              "Ticket Code",
            ]);

            multiSeatOrders.forEach((order) => {
              const buyer = getUserById(order.buyerId);
              order.seats.forEach((seat, index) => {
                const seatKey = `${order._id}_seat_${index}`;
                const seatStatus = seatVerification[seatKey] || "Pending";

                seatWorksheetData.push([
                  order._id || "N/A",
                  buyer?.name || "N/A",
                  seat.section || "N/A",
                  seat.row || "N/A",
                  seat.seatNumber || seat.number || "N/A",
                  seat.price || 0,
                  seatStatus,
                  order.ticketCode || "N/A",
                ]);
              });
            });

            const seatWorksheet =
              window.XLSX.utils.aoa_to_sheet(seatWorksheetData);
            const seatColWidths = [
              { wch: 25 }, // Order ID
              { wch: 20 }, // Buyer Name
              { wch: 12 }, // Seat Section
              { wch: 10 }, // Seat Row
              { wch: 12 }, // Seat Number
              { wch: 12 }, // Seat Price
              { wch: 20 }, // Seat Verification Status
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

  // UPDATED: Barcode Modal with backend ticketCode
  const BarcodeModal = () => {
    if (!showBarcodeModal || !selectedOrderForBarcode) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <QrCode className="mr-2" size={24} />
              Ticket Barcode
            </h3>
            <button
              onClick={() => {
                setShowBarcodeModal(false);
                setSelectedOrderForBarcode(null);
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Order Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Booking ID:</strong>{" "}
                {selectedOrderForBarcode.bookingId ||
                  selectedOrderForBarcode._id?.slice(-8) ||
                  "N/A"}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Buyer:</strong>{" "}
                {getUserNameById(selectedOrderForBarcode.buyerId)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Amount:</strong>{" "}
                {formatCurrency(selectedOrderForBarcode.totalAmount)}
              </p>
            </div>

            {/* UPDATED: Single barcode per order using backend ticketCode */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Ticket Barcode:</h4>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {selectedOrderForBarcode.seats &&
                    selectedOrderForBarcode.seats.length > 0
                    ? `${selectedOrderForBarcode.seats.length} Seat(s)`
                    : "General Admission"}
                </div>

                <BarcodeDisplay
                  ticketCode={selectedOrderForBarcode.ticketCode}
                  isCancelled={
                    selectedOrderForBarcode.paymentStatus === "cancelled" ||
                    selectedOrderForBarcode.paymentStatus === "failed"
                  }
                  size="large"
                />

                <div className="mt-2 text-xs text-gray-500 text-center">
                  Ticket Code:{" "}
                  {selectedOrderForBarcode.ticketCode || "Not Available"}
                </div>

                {/* Seat Details */}
                {selectedOrderForBarcode.seats &&
                  selectedOrderForBarcode.seats.length > 0 && (
                    <div className="mt-3 text-xs text-gray-600">
                      <strong>Seats:</strong>
                      <div className="mt-1 space-y-1">
                        {selectedOrderForBarcode.seats.map((seat, index) => (
                          <div key={index} className="flex justify-between">
                            <span>
                              {seat.section} {seat.row}
                              {seat.seatNumber}
                            </span>
                            <span>${seat.price || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📱 Scan Instructions:</strong> Use your barcode scanner
                app to scan this code for ticket verification at the event
                entrance.
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Note: One barcode covers all seats in this order.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

      // Handle different response structures and ensure it's always an array
      let users = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          users = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else {
          console.warn(
            "Unexpected users API response structure:",
            response.data
          );
          users = [];
        }
      }

      setAllUsers(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      setAllUsers([]); // Ensure allUsers is always an array
    }
  };

  // Helper function to get user name by ID - Fixed to handle non-array allUsers
  const getUserNameById = (userId) => {
    if (!userId || !Array.isArray(allUsers) || allUsers.length === 0)
      return "N/A";
    const user = allUsers.find((u) => u._id === userId);
    return user ? user.name : "N/A";
  };

  // Helper function to get user details by ID - Fixed to handle non-array allUsers
  const getUserById = (userId) => {
    if (!userId || !Array.isArray(allUsers) || allUsers.length === 0)
      return null;
    return allUsers.find((u) => u._id === userId);
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

  // Filter orders based on search term - Removed status filter
  const filterOrders = () => {
    if (!eventOrders || !Array.isArray(allUsers)) return [];

    let filtered = eventOrders;

    // Filter by search term (seller name, buyer name, order ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const sellerName = getUserNameById(order.sellerId);
        const buyerName = getUserNameById(order.buyerId); // Changed from userId to buyerId
        return (
          sellerName.toLowerCase().includes(term) ||
          buyerName.toLowerCase().includes(term) ||
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
  }, [searchTerm, eventOrders, allUsers]);

  // NEW: Download PDF Report Function - Clean table format
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
              <div class="summary-item"><strong>Total Orders:</strong> ${stats.totalOrders
        }</div>
              <div class="summary-item"><strong>Total Revenue:</strong> ${formatCurrency(
          stats.totalRevenue
        )}</div>
              <div class="summary-item"><strong>Total Seats:</strong> ${stats.totalSeats
        }</div>
              <div class="summary-item"><strong>Successful:</strong> ${stats.successfulOrders
        }</div>
              <div class="summary-item"><strong>Pending:</strong> ${stats.pendingOrders
        }</div>
              <div class="summary-item"><strong>Failed:</strong> ${stats.failedOrders
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
                <th>Verification</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders
          .map((order) => {
            const seller = getUserById(order.sellerId);
            const buyer = getUserById(order.buyerId);
            const verificationInfo = getOrderVerificationStatus(order);

            return `
                  <tr>
                    <td>${seller?.name || "N/A"}</td>
                    <td>${buyer?.name || "N/A"}</td>
                    <td>${formatCurrency(order.totalAmount)}</td>
                    <td>${order.quantity || 0}</td>
                    <td>${verificationInfo.status}</td>
                    <td>${order.orderTime
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
          // Note: Window will close automatically after printing on most browsers
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

  // Handle ticket verification - Fixed implementation (removed 'Active' status)
  const handleTicketVerification = async (orderId, status) => {
    try {
      setTicketVerification((prev) => ({
        ...prev,
        [orderId]: status,
      }));

      toast.success(`Ticket ${status.toLowerCase()} successfully!`);
    } catch (err) {
      console.error("Error updating ticket status:", err);
      toast.error("Failed to update ticket status. Please try again.");
    }
  };

  // UPDATED: Handle ticket scanner - Enhanced with backend ticketCode verification
  const handleTicketScan = () => {
    if (!scannedTicketId.trim()) {
      toast.error("Please enter a barcode or ticket ID");
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanStatus("");

    // Verify the scanned barcode using backend ticketCode
    const result = verifyScannedBarcode(scannedTicketId.trim());

    setTimeout(() => {
      setScanResult(result);
      setScanStatus(result.status);

      if (result.status === "success") {
        toast.success(`✅ ${result.message}`);
        // Auto-close scanner after successful scan
        setTimeout(() => {
          setScannedTicketId("");
          setShowTicketScanner(false);
          setScanResult(null);
          setScanStatus("");
        }, 2000);
      } else if (result.status === "already-used") {
        toast.warning(`🎫 ${result.message}`);
      } else if (result.status === "already-verified") {
        toast.info(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.message}`);
      }

      setIsScanning(false);
    }, 1000); // Simulate processing time
  };

  // NEW: Handle showing barcode for an order
  const showOrderBarcode = (order) => {
    setSelectedOrderForBarcode(order);
    setShowBarcodeModal(true);
  };

  // Fetch all data - Modified to ensure proper order of operations
  const fetchAllData = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users first, then other reports to ensure allUsers is populated
      await fetchAllUsers();
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

    return {
      totalRevenue,
      totalOrders,
      totalSeats,
      successfulOrders,
      pendingOrders,
      failedOrders,
      successRate:
        totalOrders > 0
          ? ((successfulOrders / totalOrders) * 100).toFixed(1)
          : 0,
    };
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
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {/* <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => navigate("/dashboard/reports")}
                    className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
                  >
                    <ArrowLeft size={20} className="mr-1" />
                    Back to Reports
                  </button>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Calendar className="mr-3" size={28} />
                  {eventData?.title ||
                    location.state?.eventTitle ||
                    "Event Report"}
                </h1>
                <p className="text-gray-600 mt-1">
                  Detailed sales and performance report for this event
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer"
                  onClick={() => setShowTicketScanner(true)}
                >
                  <Scan className="mr-1" size={14} />
                  Scan
                </button>

                
                <button
                  className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-sm text-sm cursor-pointer disabled:opacity-50"
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
        </div> */}

        <div className="bg-white rounded-lg shadow-md p-4 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate("/dashboard/events")}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
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
                onClick={() => navigate(`/dashboard/event/${eventId}/moderators`)}
                className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-md"
                title="View all moderators"
              >
                <Shield size={20} className="mr-2" />
                View Moderators
              </button>

              <button
                onClick={() => navigate(`/dashboard/event/${eventId}/create-moderator`)}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
                title="Create new moderator for this event"
              >
                <UserPlus size={20} className="mr-2" />
                Create Moderator
              </button>

              <button
                onClick={downloadPDFReport}
                disabled={downloadingPDF}
                className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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

              {/* Existing Download Excel Button */}
              <button
                onClick={downloadExcelReport}
                disabled={downloadingExcel}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
                      Success Rate
                    </p>
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
            <h3 className="text-lg font-bold text-gray-800">
              Order Status Breakdown
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => {
                    const seller = getUserById(order.sellerId);
                    const buyer = getUserById(order.buyerId);
                    const verificationInfo = getOrderVerificationStatus(order);

                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
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
                          <div className="space-y-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${verificationInfo.status === "Verified"
                                  ? "bg-green-100 text-green-800"
                                  : verificationInfo.status === "Used"
                                    ? "bg-blue-100 text-blue-800"
                                    : verificationInfo.status === "Partial"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {verificationInfo.status === "Verified" &&
                                "✅ All Verified"}
                              {verificationInfo.status === "Used" &&
                                "🎫 All Used"}
                              {verificationInfo.status === "Partial" &&
                                "⚠️ Partial"}
                              {verificationInfo.status === "Pending" &&
                                "⏳ Pending"}
                            </span>
                            {verificationInfo.details && (
                              <div className="text-xs text-gray-500">
                                {verificationInfo.details.verified}V /{" "}
                                {verificationInfo.details.used}U /{" "}
                                {verificationInfo.details.pending}P
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.orderTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => showOrderBarcode(order)}
                              className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                            >
                              <QrCode size={14} className="inline mr-1" />
                              Barcode
                            </button>

                            {/* Individual seat management for multi-seat orders */}
                            {order.seats && order.seats.length > 1 && (
                              <div className="relative group">
                                <button className="px-2 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600 cursor-pointer">
                                  Manage Seats
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                  <div className="p-3">
                                    <div className="text-xs font-medium text-gray-700 mb-2">
                                      Individual Seat Status:
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {verificationInfo.details?.seats.map(
                                        (seatInfo, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between text-xs"
                                          >
                                            <span className="font-mono">
                                              {seatInfo.seatInfo}
                                            </span>
                                            <div className="flex gap-1">
                                              <span
                                                className={`px-1 py-0.5 rounded text-xs ${seatInfo.status === "Verified"
                                                    ? "bg-green-100 text-green-800"
                                                    : seatInfo.status === "Used"
                                                      ? "bg-blue-100 text-blue-800"
                                                      : "bg-gray-100 text-gray-800"
                                                  }`}
                                              >
                                                {seatInfo.status}
                                              </span>
                                              {seatInfo.status ===
                                                "Verified" && (
                                                  <button
                                                    onClick={() =>
                                                      handleSeatVerification(
                                                        order._id,
                                                        index,
                                                        "Used"
                                                      )
                                                    }
                                                    className="px-1 py-0.5 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                                                  >
                                                    Use
                                                  </button>
                                                )}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Single seat or all verified - show mark used button */}
                            {(!order.seats || order.seats.length <= 1) &&
                              verificationInfo.status === "Verified" && (
                                <button
                                  onClick={() =>
                                    handleTicketVerification(order._id, "Used")
                                  }
                                  className="px-2 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600 cursor-pointer"
                                >
                                  Mark Used
                                </button>
                              )}
                          </div>
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
                            <span className="px-3 py-1 text-gray-500">...</span>
                          )}
                          <button
                            className={`px-3 py-1 rounded-md cursor-pointer ${currentPage === page
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
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Ticket Scanner Modal with blur background */}
      {showTicketScanner && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Scan className="mr-2" size={24} />
                Barcode Scanner
              </h3>
              <button
                onClick={() => {
                  setShowTicketScanner(false);
                  setScanResult(null);
                  setScanStatus("");
                  setScannedTicketId("");
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Manual Entry Option */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  ⌨️ Manual Entry
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter ticket code..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={scannedTicketId}
                    onChange={(e) => setScannedTicketId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleTicketScan()}
                  />
                  <button
                    onClick={handleTicketScan}
                    disabled={!scannedTicketId.trim() || isScanning}
                    className={`w-full py-2 rounded-md transition-all ${!scannedTicketId.trim() || isScanning
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                      } text-white`}
                  >
                    {isScanning ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      "Verify Ticket Code"
                    )}
                  </button>
                </div>
              </div>

              {/* Scan Result Display */}
              {scanResult && (
                <div
                  className={`border rounded-lg p-4 ${scanStatus === "success"
                      ? "border-green-200 bg-green-50"
                      : scanStatus === "already-used"
                        ? "border-yellow-200 bg-yellow-50"
                        : scanStatus === "already-verified"
                          ? "border-blue-200 bg-blue-50"
                          : "border-red-200 bg-red-50"
                    }`}
                >
                  <div className="flex items-center mb-2">
                    {scanStatus === "success" && (
                      <CheckCircle className="text-green-600 mr-2" size={20} />
                    )}
                    {scanStatus === "already-used" && (
                      <AlertCircle className="text-yellow-600 mr-2" size={20} />
                    )}
                    {scanStatus === "already-verified" && (
                      <CheckCircle className="text-blue-600 mr-2" size={20} />
                    )}
                    {scanStatus === "pending" && (
                      <XCircle className="text-red-600 mr-2" size={20} />
                    )}
                    <h4
                      className={`font-medium ${scanStatus === "success"
                          ? "text-green-800"
                          : scanStatus === "already-used"
                            ? "text-yellow-800"
                            : scanStatus === "already-verified"
                              ? "text-blue-800"
                              : "text-red-800"
                        }`}
                    >
                      {scanStatus === "success" &&
                        "✅ VERIFIED - Ticket Valid for Entry"}
                      {scanStatus === "already-used" &&
                        "🎫 ALREADY USED - Entry Completed"}
                      {scanStatus === "already-verified" &&
                        "✅ ALREADY VERIFIED - Ready for Entry"}
                      {scanStatus === "pending" &&
                        "❌ PENDING - Invalid Ticket Code"}
                    </h4>
                  </div>

                  <p
                    className={`text-sm mb-2 ${scanStatus === "success"
                        ? "text-green-700"
                        : scanStatus === "already-used"
                          ? "text-yellow-700"
                          : scanStatus === "already-verified"
                            ? "text-blue-700"
                            : "text-red-700"
                      }`}
                  >
                    {scanResult.message}
                  </p>

                  {scanResult.ticket && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Booking ID:</strong>{" "}
                        {scanResult.ticket.order.bookingId ||
                          scanResult.ticket.orderId.slice(-8)}
                      </div>
                      <div>
                        <strong>Seat:</strong> {scanResult.ticket.seatInfo}
                      </div>
                      <div>
                        <strong>Buyer:</strong>{" "}
                        {getUserNameById(scanResult.ticket.order.buyerId)}
                      </div>
                      <div>
                        <strong>Ticket Code:</strong>{" "}
                        {scanResult.ticket.ticketCode}
                      </div>
                      {scanResult.seatKey && (
                        <div>
                          <strong>Seat Status:</strong>{" "}
                          {seatVerification[scanResult.seatKey] || "Pending"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📋 Instructions:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Enter the ticket code from the barcode</li>
                  <li>• 🟢 Green = Verified ticket (ready for entry)</li>
                  <li>• 🔵 Blue = Already verified ticket</li>
                  <li>• 🟡 Yellow = Already used ticket</li>
                  <li>• 🔴 Red = Invalid/not found ticket</li>
                  <li>
                    • One ticket code covers all seats in multi-seat orders
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowTicketScanner(false);
                    setScanResult(null);
                    setScanStatus("");
                    setScannedTicketId("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Close Scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      <BarcodeModal />
    </div>
  );
};

export default EventReport;
