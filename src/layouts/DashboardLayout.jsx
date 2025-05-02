import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, UserCircle, LayoutDashboard, Ticket, LogOut, Menu, X, Calendar, Settings, FileText, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../providers/AuthProvider'; // Adjust the path as needed

const DashboardLayout = () => {
    const { user, logOut } = useContext(AuthContext);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const [userName, setUserName] = useState('User');
    
    // Get user data from AuthContext and localStorage
    // Updated key name to match what we saved in the Register component
    const [role, setRole] = useState('buyer'); // Default to buyer
    
    // Load role from localStorage when component mounts
    useEffect(() => {
        const storedRole = localStorage.getItem('user-role');
        if (storedRole) {
            console.log("Found role in localStorage:", storedRole);
            setRole(storedRole);
        } else {
            console.log("No role found in localStorage, using default: buyer");
        }
    }, []);
    
    // Update userName when user object changes - with improved logging
    useEffect(() => {
        console.log("User object changed:", user); // Add debugging to see what's in the user object
        if (user) {
            if (user.displayName) {
                setUserName(user.displayName);
                console.log("Setting userName from displayName:", user.displayName);
            } else if (user.name) {
                // Try alternative property if displayName doesn't exist
                setUserName(user.name);
                console.log("Setting userName from name:", user.name);
            } else if (user.email) {
                // Fallback to email if no name is available
                setUserName(user.email.split('@')[0]);
                console.log("Setting userName from email:", user.email);
            }
        }
    }, [user]);
    
    // Format role for display (capitalize first letter)
    const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
    
    const commonLinks = [
        { to: '/', label: 'Home', icon: <Home size={20} /> },
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ];

    const roleLinks = {
        admin: [
            { to: '/dashboard/manage-users', label: 'Manage Users', icon: <UserCircle size={20} /> },
            { to: '/dashboard/manage-events', label: 'Manage Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/reports', label: 'Reports', icon: <FileText size={20} /> },
            { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} /> },
        ],
        seller: [
            { to: '/dashboard/my-events', label: 'My Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/add-event', label: 'Add Event', icon: <FileText size={20} /> },
            { to: '/dashboard/sales-report', label: 'Sales Report', icon: <ShoppingBag size={20} /> },
            { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} /> },
        ],
        buyer: [
            { to: '/dashboard/my-tickets', label: 'My Tickets', icon: <Ticket size={20} /> },
            { to: '/dashboard/purchase-history', label: 'Purchase History', icon: <ShoppingBag size={20} /> },
        ],
    };

    // Use the role to determine which links to show
    const links = [...commonLinks, ...(roleLinks[role] || [])];
    
    // Check if a link is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logOut();
            // Clear role from localStorage on logout
            localStorage.removeItem('user-role');
            localStorage.removeItem('access-token');
            // Navigate to home page will be handled by the auth provider
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Toggle sidebar visibility (for mobile)
    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // Debugging helper - render this somewhere hidden if needed
    const debugOutput = process.env.NODE_ENV === 'development' ? (
        <div className="hidden">
            <pre>{JSON.stringify({ user, userName, role }, null, 2)}</pre>
        </div>
    ) : null;

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
                            {user && user.photoURL ? (
                                <img 
                                    src={user.photoURL} 
                                    alt="Profile" 
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <UserCircle size={32} className="text-white" />
                            )}
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
                    {/* Breadcrumb & page title could be added here */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {userName}!</h1>
                        <p className="text-gray-800">
                            Here's your {role === 'buyer' ? 'ticket dashboard' : role === 'seller' ? 'event dashboard' : 'admin dashboard'}
                        </p>
                    </div>
                    
                    {/* Dashboard content */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        {debugOutput}
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;