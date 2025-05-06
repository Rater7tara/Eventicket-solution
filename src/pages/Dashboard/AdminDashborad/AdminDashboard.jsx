import React, { useState, useEffect, useContext } from 'react';
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';
import serverURL from '../../../ServerConfig';
import { AuthContext } from '../../../providers/AuthProvider';

const AdminDashboard = ({ userName }) => {
    const { user } = useContext(AuthContext);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('auth-token');
    };

    // Set up axios headers with authentication
    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                setLoading(true);
                
                // Get auth headers
                const authHeaders = getAuthHeaders();
                
                // Fetch users count
                const response = await axios.get(
                    `${serverURL.url}admin/users`, 
                    authHeaders
                );
                
                if (response.data && response.data.data) {
                    setUserCount(response.data.data.length);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user count:', error);
                setError('Failed to load user data');
                setLoading(false);
            }
        };

        fetchUserCount();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6">Admin Dashboard</h2>
            
            {/* Error message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
                    <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
                    <p>{error}</p>
                </div>
            )}
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-blue-500 font-medium">Total Users</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                {loading ? '...' : userCount}
                            </h3>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Users size={24} className="text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6 shadow-sm border border-green-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-green-500 font-medium">Total Events</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">0</h3>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <Calendar size={24} className="text-green-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-purple-500 font-medium">Total Sales</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">$0</h3>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <TrendingUp size={24} className="text-purple-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-orange-500 font-medium">Pending Approvals</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">0</h3>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                            <AlertCircle size={24} className="text-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome, {userName || user?.name || 'Admin'}!</h3>
                <p className="text-gray-600">
                    This is your admin dashboard. From here, you can manage users, events, and monitor activity on your platform.
                    Use the navigation menu to access different admin features.
                </p>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <a 
                        href="/dashboard/manage-users" 
                        className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Users className="text-blue-500 mr-3" size={20} />
                        <span className="font-medium text-gray-700">Manage Users</span>
                    </a>
                    
                    <a 
                        href="/dashboard/manage-events" 
                        className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Calendar className="text-green-500 mr-3" size={20} />
                        <span className="font-medium text-gray-700">Manage Events</span>
                    </a>
                    
                    <a 
                        href="/dashboard/reports" 
                        className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <TrendingUp className="text-purple-500 mr-3" size={20} />
                        <span className="font-medium text-gray-700">View Reports</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;