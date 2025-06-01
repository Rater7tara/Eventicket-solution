import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Home, UserCircle, LayoutDashboard, Ticket, LogOut, Menu, X, Calendar, Settings, FileText, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../providers/AuthProvider'; // Adjust the path as needed

const DashboardLayout = () => {
    const { user, loading, logOut } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userName, setUserName] = useState('User');
    const location = useLocation();
    
    useEffect(() => {
        if (user) {
            // Set user name from available properties
            if (user.name) {
                setUserName(user.name);
            } else if (user.email) {
                setUserName(user.email.split('@')[0]);
            }
        }
    }, [user]);
    
    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-orange-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }
    
    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Get role directly from user object, default to 'buyer' if not present
    const userRole = user.role || 'buyer';
    
    // Treat 'user' role the same as 'buyer' role for dashboard purposes
    const role = userRole === 'user' ? 'buyer' : userRole;
    
    // Format role for display (capitalize first letter)
    const formattedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    
    const commonLinks = [
        { to: '/', label: 'Home', icon: <Home size={20} /> },
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ];

    const roleLinks = {
        admin: [
            
            { to: '/dashboard/create-events', label: 'Create Events', icon: <Calendar size={20} /> },
            // { to: '/dashboard/manage-my-events', label: 'Manage My Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/manage-events', label: 'Manage All Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/coupons', label: 'My Coupons', icon: <Ticket size={20} /> },
            { to: '/dashboard/my-tickets', label: 'My Tickets', icon: <Ticket size={20} /> },
            { to: '/dashboard/sold-tickets', label: 'Sold Tickets', icon: <Ticket size={20} /> },
            { to: '/dashboard/manage-users', label: 'Manage Users', icon: <UserCircle size={20} /> },
            { to: '/dashboard/manage-sellers', label: 'Manage Seller', icon: <UserCircle size={20} /> },
            { to: '/dashboard/reports', label: 'Reports', icon: <FileText size={20} /> },
            { to: '/dashboard/add-blogs', label: 'Add Blogs', icon: <FileText size={20} /> },
            { to: '/dashboard/admin-profile', label: 'Settings', icon: <Settings size={20} /> },
        ],
        seller: [
            { to: '/dashboard/my-events', label: 'My Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/add-event', label: 'Add Event', icon: <FileText size={20} /> },
            { to: '/dashboard/my-tickets', label: 'My Tickets', icon: <Ticket size={20} /> },
            { to: '/dashboard/coupons', label: 'My Coupons', icon: <Ticket size={20} /> },
            { to: '/dashboard/sales-report', label: 'Sales Report', icon: <ShoppingBag size={20} /> },
            { to: '/dashboard/seller-profile', label: 'Settings', icon: <Settings size={20} /> },
        ],
        buyer: [
            { to: '/dashboard/my-tickets', label: 'My Tickets', icon: <Ticket size={20} /> },
            // { to: '/dashboard/purchase-history', label: 'Purchase History', icon: <ShoppingBag size={20} /> },
            { to: '/dashboard/buyer-profile', label: 'Settings', icon: <Settings size={20} /> },
        ],
        // No need for a separate 'user' entry since we're mapping 'user' to 'buyer'
    };

    // Use the role to determine which links to show, defaulting to buyer if invalid role
    const links = [...commonLinks, ...(roleLinks[role] || roleLinks.buyer)];
    
    // Check if a link is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Toggle sidebar visibility (for mobile)
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen bg-orange-50">
            {/* Mobile sidebar toggle button */}
            <button 
                onClick={toggleSidebar} 
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-orange-500 text-white shadow-lg"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside 
                className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-xl transform transition-transform duration-300 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                } lg:flex flex-col`}
            >
                {/* User profile section */}
                <div className="p-6 border-b border-orange-400">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-14 h-14 rounded-full bg-orange-300 flex items-center justify-center border-2 border-white shadow-md">
                            <UserCircle size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white">{userName}</h2>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                                {formattedRole}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Navigation links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {links.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                isActive(link.to)
                                    ? 'bg-white text-orange-600 shadow-md font-medium'
                                    : 'text-white hover:bg-orange-400 hover:bg-opacity-50'
                            }`}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
                
                {/* Logout button */}
                <div className="p-4 border-t border-orange-400">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full gap-3 p-3 rounded-lg text-white hover:bg-red-600 transition-colors duration-200"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Page header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {userName}!</h1>
                        <p className="text-gray-800">
                            Here's your {role === 'buyer' ? 'ticket dashboard' : role === 'seller' ? 'event dashboard' : 'admin dashboard'}
                        </p>
                    </div>
                    
                    {/* Dashboard content */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;