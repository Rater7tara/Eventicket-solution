import React, { useState, useEffect, useContext } from 'react';
import { 
  Ticket, 
  Plus, 
  Calendar, 
  Percent, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign
} from 'lucide-react';
import { AuthContext } from '../../../../providers/AuthProvider';
import serverURL from "../../../../ServerConfig";
import axios from 'axios';

const SellerCoupons = () => {
  const { user } = useContext(AuthContext);
  const [coupons, setCoupons] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    eventId: '',
    code: '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
    minPurchaseAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get auth token and headers
  const getAuthToken = () => localStorage.getItem('auth-token');
  
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch seller's events
  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await axios.get(
        `${serverURL.url}event/my-events`,
        getAuthHeaders()
      );
      
      if (response.data && response.data.events) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMessage('Failed to load events.');
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch seller's coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await axios.get(
        `${serverURL.url}coupons/my-coupons`,
        getAuthHeaders()
      );
      
      console.log('Coupons API response:', response.data);
      
      if (response.data && response.data.coupons) {
        setCoupons(response.data.coupons);
      } else {
        setCoupons([]);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to load coupons.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user) {
      fetchCoupons();
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discountPercentage' || name === 'minPurchaseAmount' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      eventId: '',
      code: '',
      discountPercentage: '',
      startDate: '',
      endDate: '',
      minPurchaseAmount: 0
    });
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Close create modal
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Handle create coupon
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.eventId || !formData.code || !formData.discountPercentage || !formData.startDate || !formData.endDate) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (formData.discountPercentage < 1 || formData.discountPercentage > 100) {
      setErrorMessage('Discount percentage must be between 1 and 100.');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setErrorMessage('End date must be after start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await axios.post(
        `${serverURL.url}coupons/create-coupon`,
        {
          eventId: formData.eventId,
          code: formData.code.toUpperCase(),
          discountPercentage: formData.discountPercentage,
          startDate: formData.startDate,
          endDate: formData.endDate,
          minPurchaseAmount: formData.minPurchaseAmount
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        setSuccessMessage('Coupon created successfully! Waiting for admin approval.');
        closeCreateModal();
        fetchCoupons(); // Refresh coupons list
      } else {
        setErrorMessage(response.data.message || 'Failed to create coupon.');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to create coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      eventId: coupon.eventId,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      startDate: coupon.startDate.split('T')[0],
      endDate: coupon.endDate.split('T')[0],
      minPurchaseAmount: coupon.minPurchaseAmount || 0
    });
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCoupon(null);
    resetForm();
  };

  // Handle update coupon
  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    
    if (!editingCoupon) return;

    // Same validation as create
    if (!formData.eventId || !formData.code || !formData.discountPercentage || !formData.startDate || !formData.endDate) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (formData.discountPercentage < 1 || formData.discountPercentage > 100) {
      setErrorMessage('Discount percentage must be between 1 and 100.');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setErrorMessage('End date must be after start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await axios.put(
        `${serverURL.url}coupons/update/${editingCoupon._id}`,
        {
          eventId: formData.eventId,
          code: formData.code.toUpperCase(),
          discountPercentage: formData.discountPercentage,
          startDate: formData.startDate,
          endDate: formData.endDate,
          minPurchaseAmount: formData.minPurchaseAmount
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        setSuccessMessage('Coupon updated successfully!');
        closeEditModal();
        fetchCoupons(); // Refresh coupons list
      } else {
        setErrorMessage(response.data.message || 'Failed to update coupon.');
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to update coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete coupon
  const handleDeleteCoupon = async (couponId) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const response = await axios.delete(
        `${serverURL.url}coupons/delete/${couponId}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setSuccessMessage('Coupon deleted successfully!');
        setCoupons(coupons.filter(coupon => coupon._id !== couponId));
      } else {
        setErrorMessage(response.data.message || 'Failed to delete coupon.');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to delete coupon.');
    }
    setDeleteConfirmation(null);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <Clock size={14} />, 
        text: 'Pending Approval' 
      },
      approved: { 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircle size={14} />, 
        text: 'Approved' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        icon: <XCircle size={14} />, 
        text: 'Rejected' 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get event title by ID
  const getEventTitle = (eventId) => {
    const event = events.find(e => e._id === eventId);
    return event ? event.title : 'Unknown Event';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Coupons</h2>
          <p className="text-gray-600 mt-1">Create and manage discount coupons for your events</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all duration-200"
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-3" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* No coupons message */}
      {!loading && coupons.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Ticket size={48} className="mx-auto text-orange-500 mb-3" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Coupons Found</h3>
          <p className="text-gray-600 mb-6">You haven't created any coupons yet.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all duration-200"
          >
            <Plus size={18} />
            Create Your First Coupon
          </button>
        </div>
      )}

      {/* Coupons Grid */}
      {coupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <div key={coupon._id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                {/* Coupon Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{coupon.code}</h3>
                    <p className="text-sm text-gray-600">{getEventTitle(coupon.eventId)}</p>
                  </div>
                  {getStatusBadge(coupon.status)}
                </div>

                {/* Discount Info */}
                <div className="bg-orange-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-center">
                    <Percent size={24} className="text-orange-500 mr-2" />
                    <span className="text-2xl font-bold text-orange-600">
                      {coupon.discountPercentage}% OFF
                    </span>
                  </div>
                </div>

                {/* Coupon Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-orange-500" />
                    <span>Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}</span>
                  </div>
                  
                  {coupon.minPurchaseAmount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign size={14} className="text-orange-500" />
                      <span>Min. Purchase: ৳{coupon.minPurchaseAmount}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
                      title="Edit Coupon"
                      disabled={coupon.status === 'approved'}
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirmation(coupon._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                      title="Delete Coupon"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded ${
                    coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Create New Coupon</h3>
              <button onClick={closeCreateModal} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-6">
              {/* Event Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar size={18} className="text-orange-500" />
                  Select Event *
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Choose an event</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupon Code */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Ticket size={18} className="text-orange-500" />
                  Coupon Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. SUMMER20"
                  required
                />
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Percent size={18} className="text-orange-500" />
                  Discount Percentage *
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="20"
                  min="1"
                  max="100"
                  required
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar size={18} className="text-orange-500" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar size={18} className="text-orange-500" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Minimum Purchase Amount */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <DollarSign size={18} className="text-orange-500" />
                  Minimum Purchase Amount (Optional)
                </label>
                <input
                  type="number"
                  name="minPurchaseAmount"
                  value={formData.minPurchaseAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center ${
                    isSubmitting 
                      ? 'bg-gray-400' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Create Coupon
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {isEditModalOpen && editingCoupon && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Edit Coupon</h3>
              <button onClick={closeEditModal} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateCoupon} className="p-6 space-y-6">
              {/* Same form fields as create modal */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar size={18} className="text-orange-500" />
                  Select Event *
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Choose an event</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Ticket size={18} className="text-orange-500" />
                  Coupon Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. SUMMER20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Percent size={18} className="text-orange-500" />
                  Discount Percentage *
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="20"
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar size={18} className="text-orange-500" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar size={18} className="text-orange-500" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <DollarSign size={18} className="text-orange-500" />
                  Minimum Purchase Amount (Optional)
                </label>
                <input
                  type="number"
                  name="minPurchaseAmount"
                  value={formData.minPurchaseAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center ${
                    isSubmitting 
                      ? 'bg-gray-400' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Update Coupon
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCoupon(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCoupons;