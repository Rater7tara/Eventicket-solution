import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  FileText,
  Home,
  Phone,
  LogIn,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  FileCheck,
  User,
  LayoutDashboard,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import serverURL from "../../../ServerConfig";
import { AuthContext } from "../../../providers/AuthProvider";

const NavBar = () => {
  const { user, logOut } = useContext(AuthContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", icon: <Home size={20} />, path: "/" },
    { name: "Events", icon: <Calendar size={20} />, path: "/event-list" },
    { name: "Contact Us", icon: <Phone size={20} />, path: "/contact" },
  ];

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("auth-token");
  };

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setProfileLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.log('No auth token found for profile fetch');
        return;
      }

      console.log('🔍 Fetching user profile for navbar...');

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
          
          // Create user profile object
          const profileInfo = {
            name: profileData.name || profileData.userId?.name || user.name || user.email?.split('@')[0] || 'User',
            email: profileData.email || profileData.userId?.email || user.email || '',
            avatar: profileData.profileImg || null,
            role: profileData.role || user.role || 'buyer'
          };

          console.log('👤 Profile loaded for navbar:', profileInfo);
          setUserProfile(profileInfo);
          
          // Cache the profile data
          localStorage.setItem("userProfile", JSON.stringify(profileInfo));
        }
      } else {
        console.error('Failed to fetch profile:', response.status);
        // Use fallback data from user context
        setUserProfile({
          name: user.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar: null,
          role: user.role || 'buyer'
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Use fallback data from user context
      setUserProfile({
        name: user.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: null,
        role: user.role || 'buyer'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Add Dashboard link to navItems when user is logged in
  const getNavItems = () => {
    if (user) {
      return [...navItems];
    }
    return navItems;
  };

  // Detect scroll position to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      // Try to get cached profile first
      const cachedProfile = localStorage.getItem("userProfile");
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          setUserProfile(parsed);
        } catch (err) {
          console.error('Error parsing cached profile:', err);
        }
      }
      
      // Always fetch fresh profile data
      fetchUserProfile();
    } else {
      // Clear profile data if logged out
      localStorage.removeItem("userProfile");
      setUserProfile(null);
    }
  }, [user]);

  // Check if a nav item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear cached profile
      localStorage.removeItem("userProfile");
      setUserProfile(null);
      
      // Use the logOut method from AuthContext
      await logOut();

      // After successful logout, redirect to home
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle profile image error
  const handleImageError = (e) => {
    console.error('Profile image failed to load:', e.target.src);
    e.target.style.display = 'none';
    // Show fallback user icon
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  // Get current nav items based on user login state
  const currentNavItems = getNavItems();

  return (
    <>
      <div
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "py-2 bg-orange-100 shadow-lg" : "py-3 bg-orange-100"
        }`}
      >
        <div className="container m-auto px-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center p-1 shadow-md">
              <Link to="/" className="flex items-center">
                <div className="relative h-14">
                  <img
                    src={logo}
                    alt="Event n Ticket"
                    className="h-full object-contain"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {currentNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-full font-medium transition-all duration-200 group ${
                    isActive(item.path)
                      ? "text-white bg-orange-500"
                      : "text-neutral hover:text-orange-600"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    {item.icon}
                    <span>{item.name}</span>
                  </span>

                  {/* Hover/active indicator */}
                  {!isActive(item.path) && (
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-orange-500 group-hover:w-4/5 -translate-x-1/2 transition-all duration-300"></span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Login/Logout Button */}
              {!user ? (
                <Link to="/login">
                  <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-full hover:shadow-md hover:shadow-orange-300 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer">
                    <LogIn size={18} />
                    <span>Login</span>
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-full hover:shadow-md hover:shadow-orange-300 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              )}

              {/* User Avatar - Only shown when logged in */}
              {user && userProfile ? (
                <div className="relative cursor-pointer group">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 transform transition-transform duration-300 group-hover:scale-110">
                    {userProfile.avatar ? (
                      <>
                        <img
                          src={userProfile.avatar}
                          alt="User Profile"
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                        <div className="w-full h-full hidden items-center justify-center bg-orange-100">
                          <User size={20} className="text-orange-500" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-100">
                        <User size={20} className="text-orange-500" />
                      </div>
                    )}
                  </div>

                  {/* Loading indicator */}
                  {profileLoading && (
                    <div className="absolute -top-1 -right-1 w-3 h-3">
                      <div className="animate-spin rounded-full h-3 w-3 border-t border-orange-500"></div>
                    </div>
                  )}

                  {/* Dropdown menu for avatar */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-700">
                        Signed in as
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {userProfile.email}
                      </p>
                      {userProfile.role && (
                        <p className="text-xs text-orange-600 capitalize">
                          {userProfile.role}
                        </p>
                      )}
                    </div>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                    >
                      Dashboard
                    </Link>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              ) : user ? (
                // Show loading state for logged in user without profile
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 border-2 border-orange-300">
                  {profileLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-orange-500"></div>
                  ) : (
                    <User size={18} className="text-orange-500" />
                  )}
                </div>
              ) : (
                // Show default user icon for non-logged in users on mobile
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 border-2 border-orange-300 lg:hidden">
                  <User size={18} className="text-orange-500" />
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-orange-100 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden fixed inset-0 bg-white z-40 transition-all duration-300 ${
            isMobileMenuOpen
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-full pointer-events-none"
          }`}
          style={{ top: "64px" }}
        >
          <div className="flex flex-col p-5 space-y-3">
            {/* User info section when logged in */}
            {user && userProfile && (
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500">
                  {userProfile.avatar ? (
                    <>
                      <img
                        src={userProfile.avatar}
                        alt="User Profile"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                      <div className="w-full h-full hidden items-center justify-center bg-orange-100">
                        <User size={24} className="text-orange-500" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-100">
                      <User size={24} className="text-orange-500" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{userProfile.name}</p>
                  <p className="text-sm text-gray-500">{userProfile.email}</p>
                  {userProfile.role && (
                    <p className="text-xs text-orange-600 capitalize">
                      {userProfile.role}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation items */}
            {currentNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 p-3 ${
                  isActive(item.path)
                    ? "bg-orange-100 text-orange-600 rounded-lg font-medium"
                    : "text-gray-700"
                }`}
              >
                <span className="bg-white p-2 rounded-lg shadow-sm">
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Login/Logout button for mobile */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              {!user ? (
                <Link to="/login">
                  <button className="flex items-center w-full gap-2 p-3 bg-orange-500 text-white rounded-lg font-medium">
                    <LogIn size={20} />
                    <span>Login / Sign Up</span>
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full gap-2 p-3 bg-orange-500 text-white rounded-lg font-medium"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              )}
            </div>

            {/* Additional user options when logged in */}
            {user && (
              <div className="space-y-2 mt-2">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-3 p-2 text-gray-600 hover:bg-orange-50 rounded-lg"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/dashboard/my-tickets"
                  className="flex items-center space-x-3 p-2 text-gray-600 hover:bg-orange-50 rounded-lg"
                >
                  <FileCheck size={18} />
                  <span>Your Tickets</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className={`h-16 ${isScrolled ? "h-16" : "h-20"}`}></div>
    </>
  );
};

export default NavBar;