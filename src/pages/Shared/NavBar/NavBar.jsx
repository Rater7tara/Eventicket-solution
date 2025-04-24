import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, FileText, Home, Phone, LogIn, Menu, X, Bell, Shield, FileCheck } from 'lucide-react';
import logo from '../../../assets/logo.png'; 
import { path } from 'framer-motion/client';

const NavBar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { name: 'Home', icon: <Home size={20} />, path: '/' },
        { name: 'Events', icon: <Calendar size={20} />, path: '/events' },
        { name: 'About Us', icon: <Users size={20} />, path: '/about' },
        { name: 'Blogs', icon: <FileText size={20} />, path: '/blogs' },
        {
            name: 'Contact',
            path: '/contact',
            icon: <Phone size={20} />,
            dropdown: true,
            items: [
                { name: 'Contact Us', icon: <Phone size={20} />, path: '/contact' },
                { name: 'Privacy Policy', icon: <Shield size={20} />, path: '/privacy-policy' },
                { name: 'Terms & Conditions', icon: <FileCheck size={20} />, path: '/terms' },
            ]
        },
    ];

    // Detect scroll position to change navbar style
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    // Check if a nav item is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Check if any contact dropdown item is active
    const isContactActive = () => {
        const contactItem = navItems.find(item => item.dropdown);
        return contactItem && contactItem.items.some(item => location.pathname === item.path);
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <>
            <div 
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                    isScrolled ? 'py-2 bg-orange-100 shadow-lg' : 'py-3 bg-orange-100'
                }`}
            >
                <div className="mx-auto px-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center p-1 shadow-md">
                            <Link to="/" className="flex items-center ">
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
                            {navItems.map((item) => item.dropdown ? (
                                // Contact dropdown menu
                                <div key={item.name} className="relative contact-dropdown group">
                                    <Link
                                        to={item.items[0].path} // Default link to first dropdown item
                                        className={`relative px-4 py-2 rounded-full font-medium transition-all duration-200 group ${
                                            isContactActive()
                                                ? 'text-orange-500 hover:text-white bg-orange-500'
                                                : 'text-neutral hover:text-orange-600'
                                        }`}
                                    >
                                        <span className="flex items-center space-x-1.5">
                                            {item.icon}
                                            <span>{item.name}</span>
                                        </span>
                                        
                                        {/* Hover/active indicator */}
                                        {!isContactActive() && (
                                            <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-orange-500 group-hover:w-4/5 -translate-x-1/2 transition-all duration-300"></span>
                                        )}
                                    </Link>

                                    {/* Contact Dropdown Menu - Visible on Hover */}
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-20 transition-all duration-300 transform origin-top-right opacity-0 invisible group-hover:opacity-100 group-hover:visible scale-95 group-hover:scale-100">
                                        {item.items.map((dropdownItem) => (
                                            <Link
                                                key={dropdownItem.name}
                                                to={dropdownItem.path}
                                                className={`block px-4 py-2 text-sm hover:bg-orange-50 transition-colors flex items-center space-x-2 ${
                                                    isActive(dropdownItem.path) ? 'text-orange-600 bg-orange-50' : 'text-gray-700'
                                                }`}
                                            >
                                                {dropdownItem.icon}
                                                <span>{dropdownItem.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`relative px-4 py-2 rounded-full font-medium transition-all duration-200 group ${
                                        isActive(item.path)
                                            ? 'text-white bg-orange-500'
                                            : 'text-neutral hover:text-orange-600'
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
                            {/* Notification Bell */}
                            <button className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors hidden sm:block">
                                <Bell size={20} />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                            </button>
                            
                            {/* Login Button */}
                            <Link to="/login">
                                <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-full hover:shadow-md hover:shadow-orange-300 transition-all duration-300 transform hover:-translate-y-0.5">
                                    <LogIn size={18} />
                                    <span>Login</span>
                                </button>
                            </Link>
                            
                            {/* User Avatar */}
                            <div className="relative cursor-pointer group">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 transform transition-transform duration-300 group-hover:scale-110">
                                    <img src="https://i.pravatar.cc/100" alt="User" className="w-full h-full object-cover" />
                                </div>
                                
                                {/* Dropdown menu for avatar (optional) */}
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-700">Signed in as</p>
                                        <p className="text-sm text-gray-500 truncate">user@example.com</p>
                                    </div>
                                    <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">Your Profile</a>
                                    <a href="#tickets" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">Your Tickets</a>
                                    <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">Settings</a>
                                    <div className="border-t border-gray-100 mt-2 pt-2">
                                        <a href="#signout" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</a>
                                    </div>
                                </div>
                            </div>
                            
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
                            ? 'opacity-100 translate-x-0' 
                            : 'opacity-0 translate-x-full pointer-events-none'
                    }`}
                    style={{ top: '64px' }}
                >
                    <div className="flex flex-col p-5 space-y-3">
                        {navItems.map((item) => item.dropdown ? (
                            // Mobile Contact Us Section with dropdown items
                            <div key={item.name} className="mt-2 border-t border-gray-100 pt-2">
                                <div className="p-3 text-gray-800 font-medium">
                                    <span className="flex items-center space-x-3">
                                        <span className="bg-white p-2 rounded-lg shadow-sm">
                                            {item.icon}
                                        </span>
                                        <span>{item.name}</span>
                                    </span>
                                </div>
                                
                                <div className="ml-12 space-y-2">
                                    {item.items.map((dropdownItem) => (
                                        <Link
                                            key={dropdownItem.name}
                                            to={dropdownItem.path}
                                            className={`flex items-center space-x-3 p-2 ${
                                                isActive(dropdownItem.path)
                                                    ? 'bg-orange-50 text-orange-600 rounded-lg'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            <span>{dropdownItem.icon}</span>
                                            <span>{dropdownItem.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center space-x-3 p-3 ${
                                    isActive(item.path)
                                        ? 'bg-orange-100 text-orange-600 rounded-lg font-medium'
                                        : 'text-gray-700'
                                }`}
                            >
                                <span className="bg-white p-2 rounded-lg shadow-sm">{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        ))}
                        
                        <div className="pt-4 mt-4 border-t border-gray-100">
                            <Link to="/login">
                                <button className="flex items-center w-full gap-2 p-3 bg-orange-500 text-white rounded-lg font-medium">
                                    <LogIn size={20} />
                                    <span>Login / Sign Up</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Spacer to prevent content from hiding behind fixed navbar */}
            <div className={`h-16 ${isScrolled ? 'h-16' : 'h-20'}`}></div>
        </>
    );
};

export default NavBar;