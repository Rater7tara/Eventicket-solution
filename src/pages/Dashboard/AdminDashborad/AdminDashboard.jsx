import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

const AdminDashboard = ({ userName }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvents: 0,
        totalSales: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentEvents, setRecentEvents] = useState([]);

    // Fetch admin dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('access-token');

                // In a real app, you would fetch this data from your API
                // For now, using mock data for demonstration
                
                // Mock data - replace with actual API calls
                setTimeout(() => {
                    setStats({
                        totalUsers: 245,
                        totalEvents: 48,
                        totalSales: 15680,
                        pendingApprovals: 5
                    });

                    setRecentUsers([
                        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'seller', joined: '2 days ago' },
                        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'buyer', joined: '3 days ago' },
                        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'seller', joined: '5 days ago' },
                    ]);

                    setRecentEvents([
                        { id: 1, name: 'Summer Music Festival', organizer: 'Event Co.', date: 'Jun 15, 2025', status: 'approved' },
                        { id: 2, name: 'Tech Conference 2025', organizer: 'TechHub', date: 'Jul 10, 2025', status: 'pending' },
                        { id: 3, name: 'Food & Wine Expo', organizer: 'Culinary Arts', date: 'Aug 22, 2025', status: 'approved' },
                    ]);

                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error('Error fetching admin dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Admin Dashboard</h2>
            
            {/* Stats Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {Array(4).fill(0).map((_, index) => (
                        <div key={index} className="bg-gray-100 rounded-lg p-6 h-28 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 rounded-lg p-6 shadow-sm border border-blue-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-blue-500 font-medium">Total Users</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalUsers}</h3>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Users size={24} className="text-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6 shadow-sm border border-green-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-green-500 font-medium">Total Events</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalEvents}</h3>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <Calendar size={24} className="text-green-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6 shadow-sm border border-purple-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-purple-500 font-medium">Total Sales</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">${stats.totalSales}</h3>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <TrendingUp size={24} className="text-purple-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-6 shadow-sm border border-orange-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-orange-500 font-medium">Pending Approvals</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingApprovals}</h3>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <AlertCircle size={24} className="text-orange-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Users and Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-700">Recent Users</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {loading ? (
                            Array(3).fill(0).map((_, index) => (
                                <div key={index} className="p-4 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))
                        ) : (
                            recentUsers.map(user => (
                                <div key={user.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-800">{user.name}</h4>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Joined {user.joined}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <a href="/dashboard/manage-users" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View all users →
                        </a>
                    </div>
                </div>

                {/* Recent Events */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-700">Recent Events</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {loading ? (
                            Array(3).fill(0).map((_, index) => (
                                <div key={index} className="p-4 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))
                        ) : (
                            recentEvents.map(event => (
                                <div key={event.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-800">{event.name}</h4>
                                            <p className="text-sm text-gray-500">by {event.organizer}</p>
                                        </div>
                                        <div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                event.status === 'approved' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{event.date}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <a href="/dashboard/manage-events" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View all events →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;