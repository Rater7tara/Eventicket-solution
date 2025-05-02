import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, BarChart2, Filter, Download, Search, RefreshCw, TicketIcon } from 'lucide-react';

// Mock API service
const TicketSalesAPI = {
  getSalesData: () => {
    // This simulates an API call delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock data that would normally come from an API
        const mockData = [
          {
            id: 1,
            eventId: 11,
            eventTitle: "Jazz Madness",
            purchaseDate: "2025-04-28",
            buyer: "john.doe@example.com",
            ticketsSold: 2,
            ticketsAvailable: 110,
            unitPrice: 45,
            totalAmount: 90,
            status: "completed"
          },
          {
            id: 2,
            eventId: 11,
            eventTitle: "Jazz Madness",
            purchaseDate: "2025-04-29",
            buyer: "sarah.smith@example.com",
            ticketsSold: 1,
            ticketsAvailable: 108,
            unitPrice: 45,
            totalAmount: 45,
            status: "completed"
          },
          {
            id: 3,
            eventId: 12,
            eventTitle: "Rock Festival",
            purchaseDate: "2025-04-27",
            buyer: "mike.wilson@example.com",
            ticketsSold: 4,
            ticketsAvailable: 250,
            unitPrice: 55,
            totalAmount: 220,
            status: "completed"
          },
          {
            id: 4,
            eventId: 13,
            eventTitle: "Classical Night",
            purchaseDate: "2025-04-30",
            buyer: "emily.johnson@example.com",
            ticketsSold: 2,
            ticketsAvailable: 150,
            unitPrice: 65,
            totalAmount: 130,
            status: "completed"
          },
          {
            id: 5,
            eventId: 11,
            eventTitle: "Jazz Madness",
            purchaseDate: "2025-04-30",
            buyer: "david.brown@example.com",
            ticketsSold: 3,
            ticketsAvailable: 107,
            unitPrice: 45,
            totalAmount: 135,
            status: "completed"
          },
          {
            id: 6,
            eventId: 14,
            eventTitle: "Pop Concert",
            purchaseDate: "2025-05-01",
            buyer: "jessica.miller@example.com",
            ticketsSold: 2,
            ticketsAvailable: 200,
            unitPrice: 50,
            totalAmount: 100,
            status: "pending"
          },
          {
            id: 7,
            eventId: 12,
            eventTitle: "Rock Festival",
            purchaseDate: "2025-05-01",
            buyer: "robert.jones@example.com",
            ticketsSold: 1,
            ticketsAvailable: 246,
            unitPrice: 55,
            totalAmount: 55,
            status: "completed"
          },
          {
            id: 8,
            eventId: 11,
            eventTitle: "Jazz Madness",
            purchaseDate: "2025-05-01",
            buyer: "linda.davis@example.com",
            ticketsSold: 2,
            ticketsAvailable: 104,
            unitPrice: 45,
            totalAmount: 90,
            status: "refunded"
          },
          {
            id: 9,
            eventId: 15,
            eventTitle: "EDM Night",
            purchaseDate: "2025-05-02",
            buyer: "thomas.clark@example.com",
            ticketsSold: 5,
            ticketsAvailable: 375,
            unitPrice: 40,
            totalAmount: 200,
            status: "completed"
          },
          {
            id: 10,
            eventId: 13,
            eventTitle: "Classical Night",
            purchaseDate: "2025-05-02",
            buyer: "jennifer.white@example.com",
            ticketsSold: 3,
            ticketsAvailable: 148,
            unitPrice: 65,
            totalAmount: 195,
            status: "completed"
          }
        ];
        resolve(mockData);
      }, 1000); // Simulate 1 second delay
    });
  }
};

const TicketSellReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'purchaseDate', direction: 'desc' });
  const [showStats, setShowStats] = useState(true);
  
  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await TicketSalesAPI.getSalesData();
        setSalesData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch sales data:", err);
        setError("Failed to load sales data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Refresh data handler
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const data = await TicketSalesAPI.getSalesData();
      setSalesData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to refresh sales data:", err);
      setError("Failed to refresh sales data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate summary statistics
  const calculateStats = () => {
    const totalSales = salesData.reduce((sum, sale) => {
      if (sale.status !== 'refunded') {
        return sum + sale.totalAmount;
      }
      return sum;
    }, 0);
    
    const totalTickets = salesData.reduce((sum, sale) => {
      if (sale.status !== 'refunded') {
        return sum + sale.ticketsSold;
      }
      return sum;
    }, 0);
    
    const completedSales = salesData.filter(sale => sale.status === 'completed').length;
    
    const uniqueEvents = [...new Set(salesData.map(sale => sale.eventId))].length;
    
    // Calculate total remaining tickets
    const remainingTickets = salesData.reduce((obj, sale) => {
      if (!obj[sale.eventId]) {
        obj[sale.eventId] = {
          title: sale.eventTitle,
          available: sale.ticketsAvailable
        };
      }
      return obj;
    }, {});
    
    const totalAvailable = Object.values(remainingTickets).reduce((sum, event) => sum + event.available, 0);
    
    return { totalSales, totalTickets, completedSales, uniqueEvents, totalAvailable };
  };
  
  // Filter and sort data
  const getFilteredData = () => {
    const filtered = salesData.filter(sale => {
      // Filter by status
      if (filterStatus !== 'all' && sale.status !== filterStatus) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          sale.eventTitle.toLowerCase().includes(searchLower) ||
          sale.buyer.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
    
    // Sort data
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  };
  
  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };
  
  // Calculate stats
  const stats = calculateStats();
  
  // Get filtered and sorted data
  const filteredData = getFilteredData();
  
  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Ticket Sales Report</h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button 
            onClick={() => setShowStats(!showStats)}
            className="inline-flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <BarChart2 size={16} />
            <span className="hidden sm:inline">{showStats ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
          
          <button 
            className="inline-flex items-center gap-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-800">${stats.totalSales.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Tickets Sold</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalTickets.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Available Tickets</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalAvailable.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <TicketIcon size={20} className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed Sales</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.completedSales}</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart2 size={20} className="text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Unique Events</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.uniqueEvents}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar size={20} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by event or buyer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}
      
      {/* Results Table */}
      {!loading && (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('id')}
                    >
                      ID{getSortIndicator('id')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('eventTitle')}
                    >
                      Event{getSortIndicator('eventTitle')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('purchaseDate')}
                    >
                      Date{getSortIndicator('purchaseDate')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('buyer')}
                    >
                      Buyer{getSortIndicator('buyer')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('ticketsSold')}
                    >
                      Sold{getSortIndicator('ticketsSold')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('ticketsAvailable')}
                    >
                      Available{getSortIndicator('ticketsAvailable')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('totalAmount')}
                    >
                      Amount{getSortIndicator('totalAmount')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('status')}
                    >
                      Status{getSortIndicator('status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No sales records found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{sale.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.eventTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sale.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.buyer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.ticketsSold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.ticketsAvailable}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${sale.totalAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(sale.status)}`}>
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination or Results Summary */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-100 border-t-0 rounded-b-xl sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredData.length}</span> of{" "}
                  <span className="font-medium">{salesData.length}</span> results
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketSellReport;