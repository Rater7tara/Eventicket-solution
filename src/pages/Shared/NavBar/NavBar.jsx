import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Music, Film, Home, DollarSign, LogIn, Menu } from 'lucide-react';
import './NavBar.css'; 
import logo from '../../../assets/logo.png'; 

const NavBar = () => {

    const navItems = [
        { name: 'Home', icon: <Home size={20} />, path: '/' },
        { name: 'All Events', icon: <Ticket size={20} />, path: '/events' },
        { name: 'Music Shows', icon: <Music size={20} />, path: '/music' },
        { name: 'Movies/Films', icon: <Film size={20} />, path: '/movies' },
        { name: 'Ticket Pricing', icon: <DollarSign size={20} />, path: '/pricing' },
    ];

    return (
        <>
              <div className="navbar bg-white text-neutral shadow-md sticky top-0 z-50">
            {/* Logo */}
            <div className="navbar-start">
                <Link to="/" className="">
                   <img className='img' src={logo} alt="" />
                </Link>
            </div>

            {/* Nav Links */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 gap-4">
                    {navItems.map(({ name, icon, path }) => (
                        <li key={name}>
                            <Link
                                to={path}
                                className="flex items-center gap-1 text-primary hover-secondary transition-colors duration-150 text-xl"
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
                <button className="btn btn-sm bg-white text-primary hover-secondary border-none font-semibold flex items-center gap-1 text-lg">
                    <LogIn size={20} />
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
                    className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-white rounded-box w-52"
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