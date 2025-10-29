import React, { useContext } from 'react';
import AdminDashboard from './AdminDashborad/AdminDashboard';
import SellerDashboard from './SellerDashboard/SellerDashboard';
import BuyerDashboard from './UserDashboard/BuyerDashboard';
import { AuthContext } from '../../providers/AuthProvider';

const RoleBasedDashboard = () => {
  const { user, loading } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // If no user is logged in, show a message (shouldn't happen if auth protection is working)
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">Please log in to access the dashboard</h2>
      </div>
    );
  }

  // Get user role, defaulting to 'buyer' if not specified
  const userRole = user.role || 'buyer';

  // Show appropriate dashboard based on user role
  switch (userRole) {
    case 'admin':
      return <AdminDashboard userName={user.name || user.email} />;
    
    case 'seller':
      return <SellerDashboard userName={user.name || user.email} />;
    
    case 'buyer':
    case 'user': // Handle both 'buyer' and 'user' roles
    default:
      return <BuyerDashboard userName={user.name || user.email} />;
  }
};

export default RoleBasedDashboard;