import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Home, UserCircle, LayoutDashboard, Ticket, LogOut, Menu, X, Calendar, Settings, FileText, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../providers/AuthProvider'; // Adjust the path as needed

const DashboardLayout = () => {
    const { user, loading, logOut, preserveUserRole, forceAdminRole } = useContext(AuthContext);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [userName, setUserName] = useState('User');
    const [activeRole, setActiveRole] = useState(null);
    const location = useLocation();
    
    // IMPORTANT: All hooks must be called at the top level, before any conditional returns
    useEffect(() => {
        if (user) {
            console.log("User object changed:", user);
            
            // Set user name from available properties
            if (user.displayName) {
                setUserName(user.displayName);
                console.log("Setting userName from displayName:", user.displayName);
            } else if (user.name) {
                setUserName(user.name);
                console.log("Setting userName from name:", user.name);
            } else if (user.email) {
                setUserName(user.email.split('@')[0]);
                console.log("Setting userName from email:", user.email);
            }
            
            // CRITICAL FIX: Store the role from user object
            if (user.role) {
                console.log("Setting active role from user object:", user.role);
                setActiveRole(user.role);
                
                // Store the role in sessionStorage as an extra backup
                sessionStorage.setItem('active-role', user.role);
            } else {
                console.error("User object doesn't have a role property!");
                
                // Try to recover from backup
                const backupRole = sessionStorage.getItem('active-role') || 
                                  sessionStorage.getItem('user-role-backup');
                
                if (backupRole) {
                    console.log("Recovering role from backup:", backupRole);
                    setActiveRole(backupRole);
                } else {
                    // Absolute last resort
                    console.warn("No role backup found, defaulting to 'buyer'");
                    setActiveRole('buyer');
                }
            }
        }
    }, [user]);
    
    // CRITICAL FIX: Effect to preserve role without needing backend API
    useEffect(() => {
        const ensureCorrectRole = () => {
            if (user) {
                console.log("Preserving user role...");
                
                // Preserve the role using our local storage mechanism
                preserveUserRole();
                
                // Check if this is a known admin based on email
                const isKnownAdmin = localStorage.getItem('is-admin-account') === 'true' && 
                                    user.email === localStorage.getItem('admin-email');
                                    
                // Get user-specific role backup
                const userSpecificRole = localStorage.getItem(`user-role-${user.email}`) || 
                                        sessionStorage.getItem(`user-role-${user.email}`);
                
                console.log(`Current user: ${user.email}, Is known admin: ${isKnownAdmin}`);
                console.log(`Current role: ${user.role}, Backed up role: ${userSpecificRole}`);
                
                // Set the active role from the most reliable source
                const finalRole = isKnownAdmin ? 'admin' : 
                                 userSpecificRole ? userSpecificRole : 
                                 user.role || 'buyer';
                
                console.log(`Final determined role: ${finalRole}`);
                setActiveRole(finalRole);
                sessionStorage.setItem('active-role', finalRole);
                
                // Emergency fix for admin case - if we know this should be admin but it's not
                if (isKnownAdmin && user.role !== 'admin') {
                    console.log("Admin account detected with wrong role. Forcing admin role...");
                    // This will update the user object and all storage
                    forceAdminRole();
                }
            }
        };
        
        ensureCorrectRole();
    }, [user, preserveUserRole, forceAdminRole]);
    
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
        console.log("No user found, redirecting to login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // CRITICAL FIX: Get role from our state rather than user object directly
    // This ensures we're using the verified/reconciled role value
    const role = activeRole || 'buyer';
    console.log("Current user role in dashboard:", role);
    
    // Format role for display (capitalize first letter)
    const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
    
    const commonLinks = [
        { to: '/', label: 'Home', icon: <Home size={20} /> },
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ];

    const roleLinks = {
        admin: [
            { to: '/dashboard/manage-users', label: 'Manage Users', icon: <UserCircle size={20} /> },
            { to: '/dashboard/create-events', label: 'Create Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/manage-events', label: 'Manage Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/sold-tickets', label: 'Sold Tickets', icon: <Calendar size={20} /> },
            { to: '/dashboard/reports', label: 'Reports', icon: <FileText size={20} /> },
            { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} /> },
        ],
        seller: [
            { to: '/dashboard/my-events', label: 'My Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/add-event', label: 'Add Event', icon: <FileText size={20} /> },
            { to: '/dashboard/sales-report', label: 'Sales Report', icon: <ShoppingBag size={20} /> },
        ],
        buyer: [
            { to: '/dashboard/my-tickets', label: 'My Tickets', icon: <Ticket size={20} /> },
            { to: '/dashboard/purchase-history', label: 'Purchase History', icon: <ShoppingBag size={20} /> },
        ],
    };

    // CRITICAL FIX: Check if roleLinks contains the role key
    // If not, use buyer as a fallback, but log the error
    if (!roleLinks[role]) {
        console.error(`Invalid role detected: ${role}. Using 'buyer' links as fallback.`);
    }

    // Use the role to determine which links to show
    const links = [...commonLinks, ...(roleLinks[role] || roleLinks.buyer)];
    
    // Check if a link is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            // CRITICAL FIX: Clear role storage on logout
            sessionStorage.removeItem('active-role');
            await logOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Toggle sidebar visibility (for mobile)
    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
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
                    {/* Page header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {userName}!</h1>
                        <p className="text-gray-800">
                            Here's your {role === 'buyer' ? 'ticket dashboard' : role === 'seller' ? 'event dashboard' : 'admin dashboard'}
                        </p>
                    </div>
                    
                    {/* Admin Role Debug Section */}
                    {role === 'admin' && (
                        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                            <h3 className="font-bold text-green-800">Admin Access Confirmed</h3>
                            <p className="text-green-700">You have full administrator privileges.</p>
                            <div className="mt-2 text-xs text-green-600">
                                <p>User: {user.email}</p>
                                <p>Role: {role}</p>
                                <p>Role in user object: {user.role}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Role Mismatch Warning */}
                    {role !== user.role && (
                        <div className="mb-6 p-4 bg-amber-100 border border-amber-300 rounded-lg">
                            <h3 className="font-bold text-amber-800">Role Synchronization</h3>
                            <p className="text-amber-700">
                                Dashboard role: {role}, User object role: {user.role}
                            </p>
                            <button 
                                onClick={() => forceAdminRole()} 
                                className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-md text-sm hover:bg-amber-600"
                            >
                                Force Admin Role
                            </button>
                        </div>
                    )}
                    
                    {/* Dashboard content - ALWAYS use Outlet to render nested routes */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;