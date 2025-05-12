import React, { useState, useEffect, useContext } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Download,
  Eye,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../../providers/AuthProvider";
import { jsPDF } from "jspdf";
import serverURL from "../../../../ServerConfig";

const API_BASE_URL = serverURL.url;

const MyTickets = () => {
  const { user, refreshToken } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Function to safely parse localStorage data
  const safelyParseJSON = (jsonString, defaultValue = []) => {
    try {
      if (!jsonString) return defaultValue;
      const parsed = JSON.parse(jsonString);
      return parsed || defaultValue;
    } catch (err) {
      console.error("JSON parsing error:", err);
      return defaultValue;
    }
  };

  // Load tickets from localStorage
  const loadLocalTickets = () => {
    try {
      // Check for ticketPurchases in localStorage
      const ticketPurchasesString = localStorage.getItem("ticketPurchases");

      if (ticketPurchasesString) {
        const ticketPurchases = safelyParseJSON(ticketPurchasesString, []);

        // If ticketPurchases is an array, use it directly
        if (Array.isArray(ticketPurchases) && ticketPurchases.length > 0) {
          setTickets(ticketPurchases);
          setStatusMessage("Your tickets have been loaded successfully.");
          return true;
        }
        // If it's an object (single purchase), wrap it in an array
        else if (
          ticketPurchases &&
          typeof ticketPurchases === "object" &&
          !Array.isArray(ticketPurchases)
        ) {
          setTickets([ticketPurchases]);
          setStatusMessage("Your ticket has been loaded successfully.");
          return true;
        }
      }

      // Check if there's a currentOrderId in localStorage
      const currentOrderId = localStorage.getItem("currentOrderId");

      if (currentOrderId) {
        // Try to find this specific order in localStorage
        const allStorageKeys = Object.keys(localStorage);

        for (const key of allStorageKeys) {
          if (
            key.includes("ticket") ||
            key.includes("order") ||
            key.includes("purchase")
          ) {
            try {
              const value = safelyParseJSON(localStorage.getItem(key));

              // Check if this data contains our order ID
              if (
                value &&
                ((Array.isArray(value) &&
                  value.some((item) => item.orderId === currentOrderId)) ||
                  (typeof value === "object" &&
                    value.orderId === currentOrderId))
              ) {
                // Found matching ticket data
                const ticketData = Array.isArray(value)
                  ? value.filter((item) => item.orderId === currentOrderId)
                  : [value];

                setTickets(ticketData);
                setStatusMessage("Your ticket has been loaded successfully.");
                return true;
              }
            } catch (err) {
              console.error(`Error parsing localStorage key "${key}":`, err);
            }
          }
        }
      }

      return false;
    } catch (err) {
      console.error("Error loading local tickets:", err);
      return false;
    }
  };

  // Load tickets when component mounts
  useEffect(() => {
    fetchTickets();
  }, [user]);

  // Function to fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if refreshToken function is available
      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      // Get token from localStorage
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Call the purchased tickets API
      const response = await fetch(`${API_BASE_URL}user/purchased-tickets`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Parse the response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to fetch tickets (Status: ${response.status})`
        );
      }

      // Check if tickets array exists and has items
      if (
        data.tickets &&
        Array.isArray(data.tickets) &&
        data.tickets.length > 0
      ) {
        setTickets(data.tickets);
        setStatusMessage("Your tickets have been loaded successfully.");
      } else {
        // If API returns empty array, try localStorage as fallback
        const foundLocalTickets = loadLocalTickets();

        if (!foundLocalTickets) {
          setTickets([]);
          setStatusMessage(
            "No tickets found. Purchase tickets to see them here."
          );
        }
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(
        `${err.message} Please try refreshing or check your login status.`
      );

      // Try to load from localStorage as fallback
      loadLocalTickets();
    } finally {
      setLoading(false);
    }
  };

  // Function to view ticket details
  const viewTicketDetails = async (ticketId) => {
    setDetailsLoading(true);
    setError("");

    try {
      // First check if we have this ticket in our state already
      const localTicket = tickets.find(
        (ticket) => ticket.orderId === ticketId || ticket._id === ticketId
      );

      if (localTicket) {
        setSelectedTicket(localTicket);
        setDetailsLoading(false);
        return;
      }

      // If not in local state, try to fetch from API
      // Ensure we have a valid token
      if (typeof refreshToken === "function") {
        await refreshToken();
      }

      // Get token from localStorage
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Call the ticket details API
      const response = await fetch(
        `${API_BASE_URL}user/buy-ticket/${ticketId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Parse the response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch ticket details");
      }

      // Set selected ticket in state
      if (data.ticket) {
        setSelectedTicket(data.ticket);
      } else {
        throw new Error("No ticket data returned from server");
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      setError(`Failed to load ticket details: ${err.message}`);

      // Try to find ticket in local state again as a last resort
      const possibleTicket = tickets.find(
        (ticket) =>
          (ticket.orderId && ticket.orderId.includes(ticketId)) ||
          (ticket._id && ticket._id.includes(ticketId))
      );

      if (possibleTicket) {
        setSelectedTicket(possibleTicket);
      }
    } finally {
      setDetailsLoading(false);
    }
  };


// Simplified PDF generator with reliable fonts
const generateLocalTicketPDF = (ticketId) => {
    // Find the ticket in our state
    const ticket = tickets.find(t => (t._id === ticketId || t.orderId === ticketId));
    
    if (!ticket) {
        setError('Could not find ticket data for local generation');
        return;
    }
    
    try {
        // Create new PDF document
        const doc = new jsPDF();
        
        // Set up dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // ----- TICKET CARD STYLING -----
        
        // Card background
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, margin, contentWidth, 180, 3, 3, 'F');
        
        // Card border
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, margin, contentWidth, 180, 3, 3, 'S');
        
        // ----- HEADER SECTION -----
        
        // Orange gradient header
        doc.setFillColor(224, 88, 41); // Close to your orange color
        doc.rect(margin, margin, contentWidth, 25, 'F');
        
        // Event title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        
        // Truncate long event titles
        const title = ticket.event?.title || 'Untitled Event';
        let displayTitle = title;
        if (title.length > 40) {
            displayTitle = title.substring(0, 37) + '...';
        }
        
        doc.text(displayTitle, margin + 5, margin + 15);
        
        // Ticket count badge
        const ticketCount = ticket.quantity || ticket.selectedSeats?.length || 1;
        const ticketText = `${ticketCount} Ticket${ticketCount !== 1 ? 's' : ''}`;
        
        // Draw badge
        doc.setFillColor(180, 71, 35, 0.5);
        const badgeWidth = doc.getStringUnitWidth(ticketText) * 10 / doc.internal.scaleFactor + 10;
        doc.roundedRect(margin + contentWidth - badgeWidth - 5, margin + 7, badgeWidth, 12, 2, 2, 'F');
        
        // Badge text
        doc.setFontSize(10);
        doc.text(ticketText, margin + contentWidth - badgeWidth/2 - 5, margin + 15, { align: 'center' });
        
        // ----- TICKET BODY -----
        
        // Set up layout
        const bodyTop = margin + 35;
        const leftColWidth = contentWidth * 0.65;
        const rightColStart = margin + leftColWidth + 5;
        
        // Body text styling
        doc.setTextColor(70, 70, 70);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        // ----- LEFT COLUMN -----
        let currentY = bodyTop + 10;
        
        // Date
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(224, 88, 41); // Orange for icons
        doc.text("• ", margin + 5, currentY);
        doc.setTextColor(70, 70, 70);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${formatDate(ticket.event?.date || ticket.purchaseDate)}`, margin + 12, currentY);
        currentY += 15;
        
        // Time
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(224, 88, 41);
        doc.text("• ", margin + 5, currentY);
        doc.setTextColor(70, 70, 70);
        doc.setFont('helvetica', 'normal');
        doc.text(`Time: ${ticket.event?.time || 'Time TBA'}`, margin + 12, currentY);
        currentY += 15;
        
        // Location
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(224, 88, 41);
        doc.text("• ", margin + 5, currentY);
        doc.setTextColor(70, 70, 70);
        doc.setFont('helvetica', 'normal');
        doc.text(`Location: ${ticket.event?.location || 'Location TBA'}`, margin + 12, currentY);
        currentY += 20;
        
        // Seats section (if available)
        if (ticket.selectedSeats && ticket.selectedSeats.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Selected Seats:', margin + 5, currentY);
            currentY += 10;
            
            // Reset to normal style for seats
            doc.setFont('helvetica', 'normal');
            
            // Show seats in a list format
            const maxSeatsToShow = Math.min(4, ticket.selectedSeats.length);
            
            for (let i = 0; i < maxSeatsToShow; i++) {
                const seat = ticket.selectedSeats[i];
                const seatName = seat.name || `Seat ${i + 1}`;
                doc.text(`- ${seatName}`, margin + 10, currentY);
                currentY += 7;
            }
            
            // Add "more" indicator if needed
            if (ticket.selectedSeats.length > 4) {
                doc.text(`+ ${ticket.selectedSeats.length - 4} more seats`, margin + 10, currentY);
                currentY += 7;
            }
            
            currentY += 5;
        }
        
        // Order info
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(224, 88, 41);
        doc.text("• ", margin + 5, currentY);
        doc.setTextColor(70, 70, 70);
        doc.setFont('helvetica', 'normal');
        doc.text(`Order ID: ${ticket._id || ticket.orderId || 'N/A'}`, margin + 12, currentY);
        
        // ----- RIGHT COLUMN -----
        
        // Add right column border
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(rightColStart - 5, bodyTop, rightColStart - 5, bodyTop + 110);
        
        // Price info
        currentY = bodyTop + 15;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(224, 88, 41);
        doc.text(`$${(ticket.grandTotal || ticket.totalPrice || 0).toFixed(2)}`, rightColStart + 10, currentY);
        
        // Purchase date
        currentY += 15;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Purchased on ${new Date(ticket.purchaseDate || ticket.createdAt || Date.now()).toLocaleDateString()}`, 
            rightColStart + 10, currentY);
        
        // Barcode
        currentY += 25;
        doc.setFillColor(229, 231, 235);
        doc.rect(rightColStart + 10, currentY, contentWidth * 0.25, 15, 'F');
        
        // Draw barcode lines
        doc.setFillColor(17, 24, 39);
        
        for (let i = 0; i < 30; i++) {
            const barX = rightColStart + 10 + (i * 1.5);
            const barHeight = 6 + Math.random() * 14;
            doc.setFillColor(17, 24, 39);
            doc.rect(barX, currentY + (15 - barHeight)/2, 0.5, barHeight, 'F');
        }
        
        // Barcode ID
        currentY += 20;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        const ticketNumber = ticket.orderId ? 
            ticket.orderId.substring(0, 12) : 
            `TIX-${Math.floor(Math.random() * 1000000)}`;
        doc.text(ticketNumber, rightColStart + 10 + (contentWidth * 0.25)/2, currentY, { align: 'center' });
        
        // ----- FOOTER -----
        const footerY = margin + 155;
        
        // Footer text
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, footerY, contentWidth, 20, 'F');
        
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY, margin + contentWidth, footerY);
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('This ticket is valid for entry. Please present this at the event.', 
            margin + contentWidth/2, footerY + 12, { align: 'center' });
        
        // Save the PDF
        const shortId = (ticket._id || ticket.orderId || 'ticket').substring(0, 8);
        doc.save(`ticket-${shortId}.pdf`);
        
        setStatusMessage('Ticket PDF generated successfully!');
    } catch (err) {
        console.error('Error generating PDF:', err);
        
        // Fallback to simple text file
        try {
            const ticketText = `TICKET DETAILS
Event: ${ticket.event?.title || 'Untitled Event'}
Date: ${formatDate(ticket.event?.date || ticket.purchaseDate)}
Time: ${ticket.event?.time || 'Time TBA'}
Location: ${ticket.event?.location || 'Location TBA'}
Order ID: ${ticket._id || ticket.orderId || 'N/A'}
Purchased: ${new Date(ticket.purchaseDate || ticket.createdAt || Date.now()).toLocaleString()}
Price: $${(ticket.grandTotal || ticket.totalPrice || 0).toFixed(2)}

This is a locally generated ticket file as the PDF generation failed.
`;

            // Create a Blob containing the ticket text
            const blob = new Blob([ticketText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            
            // Create and click a download link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `ticket-${ticketId}.txt`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            setStatusMessage('Ticket text file created as fallback');
        } catch (fallbackErr) {
            console.error('Error in text fallback:', fallbackErr);
            setError('Failed to generate ticket file');
        }
    }
};

// Modified downloadTicket function that prioritizes local generation
const downloadTicket = async (ticketId) => {
    setDownloadLoading(true);
    setError('');
    
    try {
        // Generate the PDF locally first to avoid API errors
        console.log('Generating ticket PDF locally');
        generateLocalTicketPDF(ticketId);
        setDownloadLoading(false);
        return;
        
        /* The code below is kept for reference but is commented out because
           the API endpoints are not working correctly. If you fix the API endpoints
           later, you can uncomment this section. */
           
        /*
        // Ensure we have a valid token
        if (typeof refreshToken === 'function') {
            await refreshToken();
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('auth-token');
        
        if (!token) {
            throw new Error('Authentication token not found. Please log in again.');
        }
        
        console.log(`Attempting to download ticket with ID: ${ticketId}`);
        
        // Try both query parameter and path parameter approaches
        let response;
        
        try {
            // First try with query parameter
            response = await fetch(`${API_BASE_URL}user/download-tickets?ticketId=${ticketId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                // If that fails, try with path parameter
                response = await fetch(`${API_BASE_URL}user/download-tickets/${ticketId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            // Try alternative endpoint format
            response = await fetch(`${API_BASE_URL}user/download-ticket/${ticketId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
        
        // Check if any of the attempts were successful
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `Failed to download ticket: ${response.status}`);
            } catch (jsonError) {
                throw new Error(`Failed to download ticket (Status: ${response.status})`);
            }
        }
        
        // Check content type to determine how to handle the response
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            // If the server returns JSON instead of a file, it might contain a download URL
            const jsonResponse = await response.json();
            
            if (jsonResponse.downloadUrl) {
                // If there's a download URL, open it
                window.open(jsonResponse.downloadUrl, '_blank');
                setStatusMessage('Ticket download initiated!');
                return;
            } else if (jsonResponse.error) {
                throw new Error(jsonResponse.error || 'Failed to download ticket');
            } else if (jsonResponse.message) {
                throw new Error(jsonResponse.message);
            }
        }
        
        // Convert response to blob and download
        const blob = await response.blob();
        
        // Validate that we got a PDF or some other file (not an HTML error page)
        if (blob.type === 'text/html') {
            // This might be an error page, try to extract the error message
            const text = await blob.text();
            if (text.includes('<html')) {
                throw new Error('Server returned an HTML page instead of a ticket file');
            }
        }
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `ticket-${ticketId}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setStatusMessage('Ticket downloaded successfully!');
        */
    } catch (err) {
        console.error('Error downloading ticket:', err);
        setError(`Failed to download ticket: ${err.message}`);
        
        // Try the fallback local generation method
        try {
            console.log('Attempting local ticket generation as fallback after error');
            generateLocalTicketPDF(ticketId);
        } catch (fallbackErr) {
            console.error('Fallback generation also failed:', fallbackErr);
        }
    } finally {
        setDownloadLoading(false);
    }
};

  // Function to close modal
  const closeModal = () => {
    setSelectedTicket(null);
  };

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Tickets</h2>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status message */}
      {/* {statusMessage && (
                <div className="bg-blue-50 border border-blue-500 text-blue-700 px-4 py-3 rounded mb-4 flex items-start">
                    <div className="mr-2 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>{statusMessage}</div>
                </div>
            )} */}

      {/* Error message */}
      {/* {error && (
                <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>{error}</div>
                </div>
            )} */}

      {/* No tickets message */}
      {!loading && tickets.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Ticket size={48} className="mx-auto text-orange-500 mb-3" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No Tickets Found
          </h3>
          <p className="text-gray-600 mb-6">
            You haven't purchased any tickets yet.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all duration-200"
          >
            <Calendar size={18} />
            Browse Events
          </Link>
        </div>
      )}

      {/* Tickets list */}
      {tickets.length > 0 && (
        <div className="space-y-6 mt-6">
          {tickets.map((ticket, index) => (
            <div
              key={ticket._id || ticket.orderId || index}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200"
            >
              {/* Ticket UI inspired by checkout tickets */}
              <div className="ticket-card relative overflow-hidden">
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-4 flex justify-between items-center">
                  <div className="font-bold text-white text-lg truncate">
                    {ticket.event?.title || "Untitled Event"}
                  </div>
                  <div className="text-sm bg-orange-900 bg-opacity-50 rounded px-2 py-1 text-white">
                    {ticket.quantity || ticket.selectedSeats?.length || 1}{" "}
                    Ticket
                    {(ticket.quantity || ticket.selectedSeats?.length || 1) !==
                    1
                      ? "s"
                      : ""}
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row">
                  {/* Left content */}
                  <div className="md:w-2/3">
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar size={18} className="text-orange-500" />
                        <span>
                          {formatDate(
                            ticket.event?.date || ticket.purchaseDate
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock size={18} className="text-orange-500" />
                        <span>{ticket.event?.time || "Time TBA"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin size={18} className="text-orange-500" />
                        <span>{ticket.event?.location || "Location TBA"}</span>
                      </div>
                    </div>

                    {/* Seats section */}
                    {ticket.selectedSeats &&
                      ticket.selectedSeats.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">
                            Selected Seats:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {ticket.selectedSeats
                              .slice(0, 4)
                              .map((seat, idx) => (
                                <div
                                  key={idx}
                                  className="inline-block bg-gray-100 rounded px-2 py-1 text-sm"
                                >
                                  {seat.name || `Seat ${idx + 1}`}
                                </div>
                              ))}
                            {ticket.selectedSeats.length > 4 && (
                              <div className="inline-block bg-gray-100 rounded px-2 py-1 text-sm">
                                +{ticket.selectedSeats.length - 4} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Order info */}
                    <div className="text-sm text-gray-500 mt-4 flex items-center gap-1">
                      <FileText size={16} />
                      <span>
                        Order ID: {ticket._id || ticket.orderId || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="md:w-1/3 mt-4 md:mt-0 md:border-l md:border-gray-200 md:pl-6 flex flex-col justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        ${ticket.grandTotal || ticket.totalPrice || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        Purchased on{" "}
                        {new Date(
                          ticket.purchaseDate || ticket.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Barcode */}
                    <div className="mt-4 mb-4 md:mb-0">
                      <div className="bg-gray-200 p-1 rounded">
                        <div className="flex space-x-0.5">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-gray-900"
                              style={{
                                height: `${6 + Math.random() * 14}px`,
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="text-center text-xs mt-1 text-gray-400">
                        {/* Generate a ticket ID based on order ID */}
                        {ticket.orderId
                          ? ticket.orderId.substring(0, 12)
                          : `TIX-${Math.floor(Math.random() * 1000000)}`}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() =>
                          viewTicketDetails(ticket._id || ticket.orderId)
                        }
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                      <button
                        onClick={() =>
                          downloadTicket(ticket._id || ticket.orderId)
                        }
                        className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? (
                          <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full mr-1"></div>
                        ) : (
                          <Download size={18} />
                        )}
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket details modal */}
      {selectedTicket && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Ticket Details</h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-orange-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Ticket content */}
            <div className="p-6">
              {/* Event info */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedTicket.event?.title || "Untitled Event"}
                </h4>
                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar size={18} className="text-orange-500" />
                    <span>
                      {formatDate(
                        selectedTicket.event?.date ||
                          selectedTicket.purchaseDate
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={18} className="text-orange-500" />
                    <span>{selectedTicket.event?.time || "Time TBA"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin size={18} className="text-orange-500" />
                    <span>
                      {selectedTicket.event?.location || "Location TBA"}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600">
                  {selectedTicket.event?.description ||
                    "No description available"}
                </p>
              </div>

              {/* Ticket breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Ticket info */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">
                    Ticket Information
                  </h4>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-medium text-gray-800 break-all">
                          {selectedTicket._id ||
                            selectedTicket.orderId ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Purchase Date</p>
                        <p className="font-medium text-gray-800">
                          {new Date(
                            selectedTicket.purchaseDate ||
                              selectedTicket.createdAt ||
                              Date.now()
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ticket Type</p>
                        <p className="font-medium text-gray-800">
                          {selectedTicket.ticketType?.name || "Regular"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium text-gray-800">
                          {selectedTicket.quantity ||
                            selectedTicket.selectedSeats?.length ||
                            1}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price details */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">
                    Price Details
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          ${selectedTicket.totalPrice || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="font-medium">
                          ${selectedTicket.serviceFee || 0}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-orange-600">
                            $
                            {selectedTicket.grandTotal ||
                              selectedTicket.totalPrice ||
                              0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat selection */}
              {selectedTicket.selectedSeats &&
                selectedTicket.selectedSeats.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-700 mb-3">
                      Selected Seats
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {selectedTicket.selectedSeats.map((seat, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-md p-3 text-center"
                          >
                            <div className="font-bold text-gray-800">
                              {seat.name || `Seat ${idx + 1}`}
                            </div>
                            {seat.section && (
                              <div className="text-xs text-gray-500">
                                {seat.section}, Row {seat.row}, Seat{" "}
                                {seat.number}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Ticket visualization */}
              <div className="mb-6 border-t border-gray-200 pt-6">
                <h4 className="font-bold text-gray-700 mb-3">Ticket Preview</h4>
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-md">
                  {/* Ticket header */}
                  <div className="bg-gradient-to-r from-orange-700 to-orange-500 p-3 flex justify-between items-center">
                    <div className="font-bold text-white truncate">
                      {selectedTicket.event?.title || "Event"}
                    </div>
                    <div className="text-xs bg-orange-900 bg-opacity-50 rounded px-2 py-1 text-white">
                      Admit{" "}
                      {selectedTicket.quantity ||
                        selectedTicket.selectedSeats?.length ||
                        1}
                    </div>
                  </div>

                  {/* Ticket body */}
                  <div className="p-4 flex justify-between">
                    <div className="w-2/3">
                      <div className="flex flex-col space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Event</div>
                          <div className="font-medium">
                            {selectedTicket.event?.title || "Untitled Event"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">
                            Date & Time
                          </div>
                          <div className="font-medium">
                            {formatDate(
                              selectedTicket.event?.date ||
                                selectedTicket.purchaseDate
                            )}
                          </div>
                          <div className="font-medium">
                            {selectedTicket.event?.time || "Time TBA"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">Location</div>
                          <div className="font-medium">
                            {selectedTicket.event?.location || "Location TBA"}
                          </div>
                        </div>

                        {selectedTicket.selectedSeats &&
                          selectedTicket.selectedSeats[0] && (
                            <div>
                              <div className="text-xs text-gray-500">Seat</div>
                              <div className="font-medium">
                                {selectedTicket.selectedSeats[0].name ||
                                  "General Admission"}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="w-1/3 flex flex-col items-end justify-between">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Price</div>
                        <div className="font-bold text-orange-600">
                          $
                          {(
                            selectedTicket.grandTotal ||
                            selectedTicket.totalPrice ||
                            0
                          ).toFixed(2)}
                        </div>
                      </div>

                      {/* Barcode */}
                      <div className="mt-2">
                        <div className="bg-gray-200 p-1 rounded">
                          <div className="flex space-x-0.5">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-gray-900"
                                style={{
                                  height: `${6 + Math.random() * 14}px`,
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>
                        <div className="text-center text-xs mt-1 text-gray-400">
                          {/* Generate ticket ID based on order ID */}
                          {selectedTicket.orderId
                            ? selectedTicket.orderId.substring(0, 12)
                            : `TIX-${Math.floor(Math.random() * 1000000)}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-100 p-2 text-center text-xs text-gray-500 border-t border-gray-300">
                    This ticket is valid for entry. Please present this at the
                    event.
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    downloadTicket(selectedTicket._id || selectedTicket.orderId)
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2 ${
                    downloadLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg"
                  } text-white rounded-lg transition-all`}
                  disabled={downloadLoading}
                >
                  {downloadLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Download size={18} />
                  )}
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
