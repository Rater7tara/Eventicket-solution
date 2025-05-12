import React, { useState, useEffect, useContext } from 'react';
import { Calendar, DollarSign, Tag, MapPin } from 'lucide-react';
import { AuthContext } from '../../../../providers/AuthProvider';


const PurchaseHistory = () => {
  const { user } = useContext(AuthContext);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get authentication token
        const token = localStorage.getItem('access-token');
        
        // Replace with your actual API endpoint
        const response = await fetch('/api/user/purchase-history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch purchase history');
        }
        
        const data = await response.json();
        setPurchases(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching purchase history:', error);
        setError('Failed to load purchase history. Please try again later.');
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPurchaseHistory();
    }
  }, [user]);
  
  // Show loading state
  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Purchase History</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Purchase History</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Purchase History</h2>
      
      {purchases && purchases.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span>{purchase.purchaseDate}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{purchase.eventName}</div>
                    <div className="text-sm text-gray-500">{purchase.eventDate}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-2" />
                      <span>{purchase.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Tag size={16} className="text-gray-400 mr-2" />
                      <span>{purchase.ticketType}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign size={16} className="text-gray-400 mr-1" />
                      <span>{purchase.price}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      purchase.status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : purchase.status === 'Refunded'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100 text-center">
          <p className="text-yellow-700">You haven't made any purchases yet.</p>
          <a 
            href="/events"
            className="inline-block mt-2 py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Browse Events
          </a>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;