import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Calendar,
  User,
  CreditCard,
  Tag,
  DollarSign
} from 'lucide-react';
import serverURL from '../../../../ServerConfig';
import { AuthContext } from '../../../../providers/AuthProvider'; // Adjust the path as needed

const SoldTickets = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(10);
  const [totalTickets, setTotalTickets] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('auth-token');
  };

  // Set up axios headers with authentication
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch all sold tickets
  const fetchSoldTickets = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const authHeaders = getAuthHeaders();
      
      // Make API request with auth headers
      const response = await axios.get(
        `${serverURL.url}admin/sold-tickets`, 
        authHeaders
      );
      
      console.log('Sold Tickets API response:', response.data);
      
      // Updated to access data from the correct property in the response
      setTickets(response.data.data || []);
      setTotalTickets(response.data.data?.length || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sold tickets:', err);
      setError(err.response?.data?.message || 'Failed to fetch sold tickets. Check your admin privileges.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoldTickets();
  }, []);

  // Format date for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter and search tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ticket.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.stripePaymentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || ticket.paymentStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Ticket Details Modal
  const TicketDetailsModal = () => {
    if (!selectedTicket) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div 
          className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{animation: 'fadeInUp 0.3s ease-out'}}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Tag className="mr-2 text-blue-600" size={20} />
            Ticket Sale Details
          </h3>
          
          <div className="space-y-4">
            {/* Transaction Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-blue-700">Transaction Info</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTicket.paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedTicket.paymentStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 flex items-center">
                <CreditCard className="inline mr-2 text-gray-500" size={16} />
                Payment ID: <span className="font-medium ml-1 text-gray-700">{selectedTicket.stripePaymentId}</span>
              </p>
              <p className="text-sm text-gray-600 flex items-center">
                <Calendar className="inline mr-2 text-gray-500" size={16} />
                Date: <span className="font-medium ml-1 text-gray-700">{formatDate(selectedTicket.createdAt)}</span>
              </p>
            </div>
            
            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Customer</h4>
              <p className="text-sm text-gray-600 flex items-center">
                <User className="inline mr-2 text-gray-500" size={16} />
                Name: <span className="font-medium ml-1 text-gray-700">{selectedTicket.userId?.name || 'N/A'}</span>
              </p>
              <p className="text-sm text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                Email: <span className="font-medium ml-1 text-gray-700">{selectedTicket.userId?.email || 'N/A'}</span>
              </p>
              <p className="text-sm text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                User ID: <span className="font-medium ml-1 text-gray-700">{selectedTicket.userId?._id || 'N/A'}</span>
              </p>
            </div>
            
            {/* Ticket Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Ticket Details</h4>
              <p className="text-sm text-gray-600 flex items-center">
                <Tag className="inline mr-2 text-gray-500" size={16} />
                Ticket ID: <span className="font-medium ml-1 text-gray-700">{selectedTicket.ticketId}</span>
              </p>
              <p className="text-sm text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9h12M6 12h12M6 15h12"></path>
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                </svg>
                Quantity: <span className="font-medium ml-1 text-gray-700">{selectedTicket.quantity}</span>
              </p>
              <p className="text-sm text-gray-600 flex items-center">
                <DollarSign className="inline mr-2 text-gray-500" size={16} />
                Total Amount: <span className="font-medium ml-1 text-green-700">{formatCurrency(selectedTicket.totalAmount)}</span>
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium"
              onClick={() => {
                setIsDetailsModalOpen(false);
                setSelectedTicket(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Sold Tickets</h1>
            <p className="text-gray-600 mt-1">View and manage all ticket sales in the system</p>
          </div>
          
          {/* User role check */}
          {user?.role !== 'admin' && (
            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="mr-2" size={20} />
                <p>You need admin privileges to access this page. Current role: {user?.role || 'unknown'}</p>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              
              {/* Refresh */}
              <button
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                onClick={fetchSoldTickets}
                disabled={loading}
              >
                <RefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} size={20} />
              </button>
            </div>
          </div>
          
          {/* Tickets Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : currentTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No sold tickets found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                              {ticket.userId?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{ticket.userId?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{ticket.userId?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900">ID: {ticket.ticketId.slice(0, 8)}...</div>
                          <div className="text-sm text-gray-600">Quantity: {ticket.quantity}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ticket.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : ticket.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : ticket.paymentStatus === 'refunded'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ticket.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(ticket.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsDetailsModalOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-md"
                            title="Download Receipt"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          {!loading && filteredTickets.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstTicket + 1} to {Math.min(indexOfLastTicket, filteredTickets.length)} of {filteredTickets.length} sold tickets
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages +/- 1 from current
                    return page === 1 || page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-3 py-1 text-gray-500">...</span>
                        )}
                        <button
                          className={`px-3 py-1 rounded-md ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
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
                  className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Cards - Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(tickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0))}
                </h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tickets Sold</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {tickets.reduce((sum, ticket) => sum + ticket.quantity, 0)}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Tag className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unique Customers</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {new Set(tickets.map(ticket => ticket.userId?._id)).size}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <User className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {isDetailsModalOpen && <TicketDetailsModal />}
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 30px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SoldTickets;