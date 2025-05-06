import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  UserCog, 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import serverURL from '../../../../ServerConfig';
import { AuthContext } from '../../../../providers/AuthProvider'; // Adjust the path as needed

// Add these styles to your global CSS or component
const fadeInUp = `
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
`;

const ManageUsers = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
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

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const authHeaders = getAuthHeaders();
      
      // Log auth headers for debugging
      console.log('Auth headers:', authHeaders);
      
      // Make API request with auth headers
      const response = await axios.get(
        `${serverURL.url}admin/users`, 
        authHeaders
      );
      
      console.log('Users API response:', response.data);
      
      // Updated to access data from the correct property in the response
      setUsers(response.data.data || []);
      setTotalUsers(response.data.data?.length || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users. Check your admin privileges.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(
        `${serverURL.url}admin/users/${userId}`,
        getAuthHeaders()
      );
      setUsers(users.filter(user => user._id !== userId));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Handle user block/unblock
  const handleToggleBlock = async (userId, isBlocked) => {
    try {
      const endpoint = isBlocked 
        ? `${serverURL.url}admin/unblock-user/` 
        : `${serverURL.url}admin/block-user/`;
        
      await axios.put(
        `${endpoint}${userId}`,
        {}, // Empty body
        getAuthHeaders()
      );
      
      setUsers(users.map(user => {
        if (user._id === userId) {
          return { ...user, isBlocked: !isBlocked };
        }
        return user;
      }));
    } catch (err) {
      console.error('Error toggling block status:', err);
      setError(err.response?.data?.message || `Failed to ${isBlocked ? 'unblock' : 'block'} user`);
    }
  };

  // Handle role update
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(
        `${serverURL.url}admin/update-role/${userId}`, 
        { role: newRole },
        getAuthHeaders()
      );
      
      setUsers(users.map(user => {
        if (user._id === userId) {
          return { ...user, role: newRole };
        }
        return user;
      }));
      
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // Filter and search users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Role Update Modal
  const RoleUpdateModal = () => {
    if (!selectedUser) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div 
          className="bg-white rounded-lg p-6 w-96 shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{animation: 'fadeInUp 0.3s ease-out'}}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Update User Role</h3>
          <div className="mb-4 bg-gray-50 p-3 rounded-md">
            <p><span className="font-medium text-gray-700">User:</span> {selectedUser.name}</p>
            <p><span className="font-medium text-gray-700">Current Role:</span> <span className="text-blue-600 font-medium">{selectedUser.role}</span></p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Select New Role:</p>
            <div className="flex flex-col space-y-2 mt-2">
              {['buyer', 'admin', 'seller'].map(role => (
                <button
                  key={role}
                  className={`py-3 px-4 rounded-md transition-all duration-200 ${
                    selectedUser.role === role 
                      ? 'bg-blue-100 text-blue-700 border border-blue-600 font-medium' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 hover:text-gray-900'
                  }`}
                  onClick={() => handleUpdateRole(selectedUser._id, role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium"
              onClick={() => {
                setIsRoleModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!selectedUser) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
        <div 
          className="bg-white rounded-lg p-6 w-96 shadow-2xl transform transition-all duration-300 ease-out animate-fade-in-up"
          style={{animation: 'fadeInUp 0.3s ease-out'}}
        >
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-xl font-semibold text-gray-800">Confirm Deletion</h3>
          </div>
          <p className="mb-6 text-gray-600">Are you sure you want to delete user <span className="font-medium text-gray-800">{selectedUser.name}</span>? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-800 transition-colors duration-200 font-medium"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 shadow-md font-medium"
              onClick={() => handleDeleteUser(selectedUser._id)}
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
            <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
            <p className="text-gray-600 mt-1">View and manage all users in the system</p>
          </div>
          
          {/* User role check */}
          {user?.role !== 'admin' && (
            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="mr-2" size={20} />
                <p>You need admin privileges to manage users. Current role: {user?.role || 'unknown'}</p>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search users..."
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
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="buyer">Buyer</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="seller">Seller</option>
                </select>
                <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              
              {/* Refresh */}
              <button
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} size={20} />
              </button>
            </div>
          </div>
          
          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : currentUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No users found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'seller'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isBlocked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.isBlocked ? (
                            <>
                              <XCircle className="mr-1" size={14} />
                              Blocked
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-1" size={14} />
                              Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            className={`p-1.5 rounded-md ${
                              user.isBlocked 
                                ? 'text-green-600 hover:bg-green-100' 
                                : 'text-red-600 hover:bg-red-100'
                            }`}
                            onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                            title={user.isBlocked ? 'Unblock User' : 'Block User'}
                          >
                            {user.isBlocked ? <CheckCircle size={18} /> : <XCircle size={18} />}
                          </button>
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsRoleModalOpen(true);
                            }}
                            title="Update Role"
                          >
                            <UserCog size={18} />
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete User"
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
          {!loading && filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
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
      {isRoleModalOpen && <RoleUpdateModal />}
      {isDeleteModalOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default ManageUsers;