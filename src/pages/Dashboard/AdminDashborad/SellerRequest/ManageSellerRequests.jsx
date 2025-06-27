import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  ArrowLeft,
  Search, 
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import serverURL from '../../../../ServerConfig';
import { AuthContext } from '../../../../providers/AuthProvider';

const ManageSellerRequests = ({ onBack }) => {
  const { user } = useContext(AuthContext);
  const [sellerRequests, setSellerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  // Fetch all seller requests
  const fetchSellerRequests = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const authHeaders = getAuthHeaders();
      
      // Make API request with auth headers
      const response = await axios.get(
        `${serverURL.url}admin/seller-request`, 
        authHeaders
      );
      
      console.log('Seller Requests API response:', response.data);
      
      // Fixed here: use response.data.requests instead of response.data.data
      setSellerRequests(response.data.requests || []);
      setTotalRequests(response.data.total || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching seller requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch seller requests. Check your admin privileges.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerRequests();
  }, []);

  // Handle seller request approval
const handleApproveSeller = async (sellerId) => {
  try {
    await axios.patch(  // Changed from PUT to PATCH
      `${serverURL.url}admin/seller-requests/approve/${sellerId}`,
      {}, // Empty body
      getAuthHeaders()
    );
    
    // Update local state to reflect the change
    setSellerRequests(sellerRequests.filter(seller => seller._id !== sellerId));
    
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
      setSelectedSeller(null);
    }
    
  } catch (err) {
    console.error('Error approving seller:', err);
    setError(err.response?.data?.message || 'Failed to approve seller request');
  }
};

// Handle seller request denial
const handleDenySeller = async (sellerId) => {
  try {
    await axios.patch(  // Changed from PUT to PATCH
      `${serverURL.url}admin/seller-requests/deny/${sellerId}`,
      {}, // Empty body
      getAuthHeaders()
    );
    
    // Update local state to reflect the change
    setSellerRequests(sellerRequests.filter(seller => seller._id !== sellerId));
    
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
      setSelectedSeller(null);
    }
    
  } catch (err) {
    console.error('Error denying seller:', err);
    setError(err.response?.data?.message || 'Failed to deny seller request');
  }
};

  // Handle seller monitoring
  const handleMonitorSeller = async (sellerId) => {
    try {
      await axios.put(
        `${serverURL.url}admin/monitor-seller/${sellerId}`,
        {}, // Empty body
        getAuthHeaders()
      );
      
      // Update local state to reflect the change
      setSellerRequests(sellerRequests.map(seller => {
        if (seller._id === sellerId) {
          return { ...seller, isMonitored: !seller.isMonitored };
        }
        return seller;
      }));
      
    } catch (err) {
      console.error('Error monitoring seller:', err);
      setError(err.response?.data?.message || 'Failed to update seller monitoring status');
    }
  };

  // Handle seller deletion
  const handleDeleteSeller = async (sellerId) => {
    try {
      // Assuming deletion uses the deny endpoint or a specific delete endpoint
      await axios.delete(
        `${serverURL.url}admin/seller-request/${sellerId}`,
        getAuthHeaders()
      );
      
      // Update local state to reflect the change
      setSellerRequests(sellerRequests.filter(seller => seller._id !== sellerId));
      setIsDeleteModalOpen(false);
      setSelectedSeller(null);
      
    } catch (err) {
      console.error('Error deleting seller:', err);
      setError(err.response?.data?.message || 'Failed to delete seller request');
    }
  };

  // Filter and search seller requests
  const filteredRequests = sellerRequests.filter(seller => {
    const matchesSearch = 
      seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.shopName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Seller Details Modal
const SellerDetailsModal = () => {
  if (!selectedSeller) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <span>Seller Request Details</span>
          <span className="ml-auto text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            {selectedSeller.status?.charAt(0).toUpperCase() + selectedSeller.status?.slice(1) || 'Pending'}
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* User Information */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-800 mb-3">User Information</h4>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-gray-600 w-24">Name:</span>
                <span className="font-medium text-gray-800">{selectedSeller.name || 'Not provided'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-24">Email:</span>
                <span className="font-medium text-gray-800">{selectedSeller.email || 'Not provided'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-24">User ID:</span>
                <span className="font-medium text-gray-800 text-xs">{selectedSeller._id}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-24">Applied:</span>
                <span className="font-medium text-gray-800">
                  {selectedSeller.createdAt ? new Date(selectedSeller.createdAt).toLocaleDateString() : 'Not available'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Shop Information */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-800 mb-3">Shop Information</h4>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-gray-600 w-24">Shop Name:</span>
                <span className="font-medium text-gray-800">{selectedSeller.shopName || 'Not provided'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-24">Address:</span>
                <span className="font-medium text-gray-800">{selectedSeller.address || 'Not provided'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-24">Phone:</span>
                <span className="font-medium text-gray-800">{selectedSeller.contactNumber || 'Not provided'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-24">Website:</span>
                <span className="font-medium text-gray-800">
                  {selectedSeller.website ? (
                    <a 
                      href={selectedSeller.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {selectedSeller.website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bio/Description */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Bio/Description</h4>
          <p className="text-gray-700">
            {selectedSeller.bio || 'No bio or description provided.'}
          </p>
        </div>
        
        {/* Request Status & Timestamps */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Request Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex">
              <span className="text-gray-600 w-24">Status:</span>
              <span className={`font-medium px-2 py-1 rounded text-xs ${
                selectedSeller.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                selectedSeller.status === 'approved' ? 'bg-green-100 text-green-800' :
                selectedSeller.status === 'denied' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedSeller.status?.charAt(0).toUpperCase() + selectedSeller.status?.slice(1) || 'Unknown'}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-600 w-24">Last Updated:</span>
              <span className="font-medium text-gray-800">
                {selectedSeller.updatedAt ? new Date(selectedSeller.updatedAt).toLocaleDateString() : 'Not available'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium"
            onClick={() => {
              setIsViewModalOpen(false);
              setSelectedSeller(null);
            }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-md font-medium"
            onClick={() => handleDenySeller(selectedSeller._id)}
          >
            Deny Request
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-md font-medium"
            onClick={() => handleApproveSeller(selectedSeller._id)}
          >
            Approve Request
          </button>
        </div>
      </div>
    </div>
  );
};

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!selectedSeller) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div className="bg-white rounded-lg p-6 w-96 shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up">
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-xl font-semibold text-gray-800">Confirm Deletion</h3>
          </div>
          <p className="mb-6 text-gray-600">
            Are you sure you want to delete the seller request from <span className="font-medium text-gray-800">{selectedSeller.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedSeller(null);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-md font-medium"
              onClick={() => handleDeleteSeller(selectedSeller._id)}
            >
              Delete
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
            <div className="flex items-center">
              <button 
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Manage Seller Requests</h1>
                <p className="text-gray-600 mt-1">Review and process seller applications</p>
              </div>
            </div>
          </div>
          
          {/* User role check */}
          {user?.role !== 'admin' && (
            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="mr-2" size={20} />
                <p>You need admin privileges to manage seller requests. Current role: {user?.role || 'unknown'}</p>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search requests..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            {/* Refresh */}
            <div className="flex items-center">
              <button
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                onClick={fetchSellerRequests}
                disabled={loading}
              >
                <RefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} size={20} />
              </button>
            </div>
          </div>
          
          {/* Seller Requests Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : currentRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No seller requests found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
  {currentRequests.map((seller) => (
    <tr key={seller._id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
            {seller.avatar ? (
              <img src={seller.avatar} alt={seller.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                {seller.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{seller.name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">{seller.email || 'No email'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{seller.shopName || 'No shop name'}</div>
        <div className="text-sm text-gray-500">{seller.address || 'No address provided'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          seller.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          seller.status === 'approved' ? 'bg-green-100 text-green-800' :
          seller.status === 'denied' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {seller.status?.charAt(0).toUpperCase() + seller.status?.slice(1) || 'Unknown'}
        </span>
        {seller.isMonitored && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Monitored
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString() : 'Unknown'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
        <div className="flex justify-center space-x-2">
          <button
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md cursor-pointer"
            onClick={() => {
              setSelectedSeller(seller);
              setIsViewModalOpen(true);
            }}
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            className="p-1.5 text-green-600 hover:bg-green-100 rounded-md cursor-pointer"
            onClick={() => handleApproveSeller(seller._id)}
            title="Approve Request"
          >
            <CheckCircle size={18} />
          </button>
          <button
            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md cursor-pointer"
            onClick={() => handleDenySeller(seller._id)}
            title="Deny Request"
          >
            <XCircle size={18} />
          </button>
          <button
            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md cursor-pointer"
            onClick={() => {
              setSelectedSeller(seller);
              setIsDeleteModalOpen(true);
            }}
            title="Delete Request"
          >
            <Trash2 size={18} />
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
          {!loading && filteredRequests.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstRequest + 1} to {Math.min(indexOfLastRequest, filteredRequests.length)} of {filteredRequests.length} requests
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
      </div>
      
      {/* Modals */}
      {isViewModalOpen && <SellerDetailsModal />}
      {isDeleteModalOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default ManageSellerRequests;