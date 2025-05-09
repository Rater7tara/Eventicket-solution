import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../providers/AuthProvider'; // Adjust the path as needed

/**
 * A component that restricts access to routes based on user roles
 * @param {Object} props
 * @param {Array} props.allowedRoles - Array of roles that can access this route
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 */
const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  
  // Get user role from user object or localStorage
  const userRole = user?.role || localStorage.getItem('user-role') || 'buyer';
  
  // Check if the user's role is included in the allowed roles
  if (!allowedRoles.includes(userRole)) {
    // If not allowed, redirect to their role-specific dashboard
    return <Navigate to={`/dashboard/${userRole}`} state={{ from: location }} replace />;
  }
  
  // If allowed, render the children components
  return children;
};

export default RoleBasedRoute;