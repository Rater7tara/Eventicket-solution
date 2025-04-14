import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Music, Film, Home, DollarSign, LogIn, Menu } from 'lucide-react';

const NavBar = () => {

    const navItems = [
        { name: 'Home', icon: <Home size={18} />, path: '/' },
        { name: 'All Events', icon: <Ticket size={18} />, path: '/events' },
        { name: 'Music Shows', icon: <Music size={18} />, path: '/music' },
        { name: 'Movies/Films', icon: <Film size={18} />, path: '/movies' },
        { name: 'Ticket Pricing', icon: <DollarSign size={18} />, path: '/pricing' },
    ];

    return (
        <>
              <div className="navbar bg-neutral text-white px-4 shadow-md sticky top-0 z-50">
            {/* Logo */}
            <div className="navbar-start">
                <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-wide hover:text-orange-300 transition-all duration-200">
                    <Ticket size={28} className="text-orange-400" />
                    <span className="text-white">Eventify</span>
                </Link>
            </div>

            {/* Nav Links */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 gap-4">
                    {navItems.map(({ name, icon, path }) => (
                        <li key={name}>
                            <Link
                                to={path}
                                className="flex items-center gap-1 text-white hover:text-orange-300 transition-colors duration-150"
                            >
                                {icon}
                                {name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right Side: Login + Avatar */}
            <div className="navbar-end gap-4">
                <button className="btn btn-sm bg-white text-orange-500 hover:bg-orange-100 border-none font-semibold flex items-center gap-1">
                    <LogIn size={16} />
                    Login
                </button>
                <div className="avatar">
                    <div className="w-10 rounded-full ring ring-white ring-offset-base-100 ring-offset-2 me-2">
                        <img src="https://i.pravatar.cc/100" alt="User Avatar" />
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            <div className="dropdown dropdown-end lg:hidden">
                <label tabIndex={0} className="btn btn-ghost text-white">
                    <Menu size={24} />
                </label>
                <ul
                    tabIndex={0}
                    className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52"
                >
                    {navItems.map(({ name, icon, path }) => (
                        <li key={name}>
                            <Link
                                to={path}
                                className="flex items-center gap-2 hover:text-orange-300 transition-all"
                            >
                                {icon}
                                {name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        </>
    );
};

export default NavBar;