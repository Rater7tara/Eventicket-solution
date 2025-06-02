import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Home, UserCircle, LayoutDashboard, Ticket, LogOut, Menu, X, Calendar, Settings, FileText, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../providers/AuthProvider';
import serverURL from '../ServerConfig'; // Adjust the path as needed

const DashboardLayout = () => {
    const { user, loading, logOut } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userName, setUserName] = useState('User');
    const [profileImage, setProfileImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const location = useLocation();
    
    // Get auth token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem("auth-token");
    };

    // Fetch user profile to get profile image
    const fetchUserProfile = async () => {
        try {
            setImageLoading(true);
            const token = getAuthToken();
            
            if (!token) {
                console.log('No auth token found');
                return;
            }

            const response = await fetch(`${serverURL.url}auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result?.success && result?.data) {
                    const profileData = result.data;
                    
                    // Update user name
                    if (profileData.name) {
                        setUserName(profileData.name);
                    } else if (profileData.email) {
                        setUserName(profileData.email.split('@')[0]);
                    }
                    
                    // Set profile image if exists
                    if (profileData.profileImg) {
                        setProfileImage(profileData.profileImg);
                    }
                }
            } else {
                console.error('Failed to fetch profile:', response.status);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setImageLoading(false);
        }
    };
    
    useEffect(() => {
        if (user) {
            // Set initial user name from context
            if (user.name) {
                setUserName(user.name);
            } else if (user.email) {
                setUserName(user.email.split('@')[0]);
            }
            
            // Set initial profile image from context if available
            if (user.profileImg) {
                setProfileImage(user.profileImg);
            }
            
            // Fetch fresh profile data to get updated info
            fetchUserProfile();
        }
    }, [user]);

    // Handle profile image error
    const handleImageError = () => {
        setImageError(true);
        setProfileImage(null);
    };

    // Handle profile image load success
    const handleImageLoad = () => {
        setImageError(false);
    };
    
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
            { to: '/dashboard/manage-events', label: 'Manage All Events', icon: <Calendar size={20} /> },
            { to: '/dashboard/my-events', label: 'My Events', icon: <Calendar size={20} /> },
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
            { to: '/dashboard/buyer-profile', label: 'Settings', icon: <Settings size={20} /> },
        ],
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

    // Profile Image Component
    const ProfileImageComponent = () => {
        if (imageLoading) {
            return (
                <div className="w-14 h-14 rounded-full bg-orange-300 flex items-center justify-center border-2 border-white shadow-md">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
            );
        }

        if (profileImage && !imageError) {
            return (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-orange-300">
                    <img
                        src={profileImage}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                    />
                </div>
            );
        }

        // Fallback to UserCircle icon
        return (
            <div className="w-14 h-14 rounded-full bg-orange-300 flex items-center justify-center border-2 border-white shadow-md">
                <UserCircle size={32} className="text-white" />
            </div>
        );
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
                        <ProfileImageComponent />
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-lg text-white truncate">{userName}</h2>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                                {formattedRole}
                            </div>
                        </div>
                    </div>
                    
                    {/* Quick refresh button for profile image */}
                    {/* <button
                        onClick={fetchUserProfile}
                        className="text-xs text-orange-200 hover:text-white transition-colors duration-200 opacity-70 hover:opacity-100"
                        title="Refresh profile"
                    >
                        {imageLoading ? 'Loading...' : 'Refresh Profile'}
                    </button> */}
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
                    {/* Page header with profile image */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="hidden sm:block">
                            <ProfileImageComponent />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Welcome back, {userName}!</h1>
                            <p className="text-gray-600">
                                Here's your {role === 'buyer' ? 'ticket dashboard' : role === 'seller' ? 'event dashboard' : 'admin dashboard'}
                            </p>
                        </div>
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