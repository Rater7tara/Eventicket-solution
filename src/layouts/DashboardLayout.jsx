import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Home, UserCircle, LayoutDashboard, Ticket, LogOut } from 'lucide-react';

const DashboardLayout = ({ role }) => {
    const commonLinks = [
        { to: '/dashboard/home', label: 'Home', icon: <Home size={20} /> },
    ];

    const roleLinks = {
        admin: [
            ...commonLinks,
            { to: '/dashboard/manage-users', label: 'Manage Users', icon: <UserCircle size={20} /> },
            { to: '/dashboard/reports', label: 'Reports', icon: <LayoutDashboard size={20} /> },
        ],
        seller: [
            ...commonLinks,
            { to: '/dashboard/my-events', label: 'My Events', icon: <Ticket size={20} /> },
            { to: '/dashboard/add-event', label: 'Add Event', icon: <LayoutDashboard size={20} /> },
        ],
        user: [
            ...commonLinks,
            { to: '/dashboard/my-tickets', label: 'My Tickets', icon: <Ticket size={20} /> },
            { to: '/dashboard/settings', label: 'Settings', icon: <LayoutDashboard size={20} /> },
        ],
    };

    const links = roleLinks[role] || [];

    return (
        <div className="flex h-screen bg-neutral">
            {/* Sidebar */}
            <aside className="w-64 bg-base-200 text-white p-6 space-y-4 shadow-xl">
                <h1 className="text-2xl font-bold text-orange-400">🎟️ Eventify</h1>
                <nav className="space-y-3">
                    {links.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-400 transition"
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    ))}
                    <Link
                        to="/logout"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-500 transition"
                    >
                        <LogOut size={20} /> Logout
                    </Link>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-6 bg-base-100 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
