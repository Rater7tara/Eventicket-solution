import React, { useState, useEffect } from 'react';
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

const ManageUsers = () => {
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

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverURL}/admin/users`);
      setUsers(response.data.users || []);
      setTotalUsers(response.data.users?.length || 0);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${serverURL}/admin/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  // Handle user block/unblock
  const handleToggleBlock = async (userId, isBlocked) => {
    try {
      const endpoint = isBlocked ? `${serverURL}/admin/unblock-user/` : `${serverURL}/admin/block-user/`;
      await axios.put(`${endpoint}${userId}`);
      
      setUsers(users.map(user => {
        if (user._id === userId) {
          return { ...user, isBlocked: !isBlocked };
        }
        return user;
      }));
    } catch (err) {
      setError(`Failed to ${isBlocked ? 'unblock' : 'block'} user`);
    }
  };

  // Handle role update
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`${serverURL}/admin/update-role/${userId}`, { role: newRole });
      
      setUsers(users.map(user => {
        if (user._id === userId) {
          return { ...user, role: newRole };
        }
        return user;
      }));
      
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError('Failed to update user role');
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
          <h3 className="text-lg font-medium mb-4">Update User Role</h3>
          <div className="mb-4">
            <p><span className="font-medium">User:</span> {selectedUser.name}</p>
            <p><span className="font-medium">Current Role:</span> {selectedUser.role}</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Select New Role:</p>
            <div className="flex flex-col space-y-2">
              {['user', 'admin', 'seller'].map(role => (
                <button
                  key={role}
                  className={`py-2 px-4 rounded-md ${selectedUser.role === role ? 'bg-blue-100 text-blue-600 border border-blue-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => handleUpdateRole(selectedUser._id, role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Confirm Deletion</h3>
          </div>
          <p className="mb-4">Are you sure you want to delete user <span className="font-medium">{selectedUser.name}</span>? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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