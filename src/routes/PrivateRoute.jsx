import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../providers/AuthProvider';

// This component is used to protect routes that require authentication
const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();
    
    // Show loading indicator while checking authentication
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }
    
    // If user is not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // If roles are specified and user's role is not included, redirect to dashboard
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    // User is authenticated and authorized, render the children
    return children;
};

export default PrivateRoute;