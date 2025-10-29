import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, TicketIcon, TrendingUpIcon, PlusCircleIcon, ShoppingBagIcon } from 'lucide-react';
import { AuthContext } from '../../../providers/AuthProvider'; 

const DashboardWelcome = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalTickets: 0,
    ticketsSold: 0,
    revenue: 0
  });
  
  // Get user role directly from the user object in context
  const role = user?.role || '';
  
  useEffect(() => {
    // Load events data for stats
    const loadData = () => {
      try {
        const storedEvents = localStorage.getItem('events');
        if (storedEvents) {
          const events = JSON.parse(storedEvents);
          
          // Calculate quick stats
          const today = new Date();
          const upcomingEvents = events.filter(event => {
            const eventDate = new Date(event.time.split('|')[0].trim());
            return eventDate > today;
          });
          
          // Get total of all tickets available
          const totalTickets = events.reduce((sum, event) => sum + event.ticketsAvailable, 0);
          
          // Mock some sales data for display purposes
          const ticketsSold = Math.floor(totalTickets * 0.25); // 25% of tickets sold
          const revenue = ticketsSold * 50; // Avg price $50
          
          setStats({
            totalEvents: events.length,
            upcomingEvents: upcomingEvents.length,
            totalTickets,
            ticketsSold,
            revenue
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Get action links based on user role
  const getPrimaryActionLink = () => {
    switch (role) {
      case 'seller':
        return {
          to: '/dashboard/add-event',
          label: 'Create New Event',
          icon: <PlusCircleIcon className="mr-2 h-5 w-5" />
        };
      case 'buyer':
        return {
          to: '/events',
          label: 'Browse Events',
          icon: <CalendarIcon className="mr-2 h-5 w-5" />
        };
      case 'admin':
        return {
          to: '/dashboard/manage-events',
          label: 'Manage Events',
          icon: <CalendarIcon className="mr-2 h-5 w-5" />
        };
      default:
        return {
          to: '/events',
          label: 'Browse Events',
          icon: <CalendarIcon className="mr-2 h-5 w-5" />
        };
    }
  };
  
  const getSecondaryActionLink = () => {
    switch (role) {
      case 'seller':
        return {
          to: '/dashboard/sales-report',
          label: 'View Sales Report',
          icon: <TrendingUpIcon className="mr-2 h-5 w-5" />
        };
      case 'buyer':
        return {
          to: '/dashboard/my-tickets',
          label: 'My Tickets',
          icon: <TicketIcon className="mr-2 h-5 w-5" />
        };
      case 'admin':
        return {
          to: '/dashboard/manage-users',
          label: 'Manage Users',
          icon: <CalendarIcon className="mr-2 h-5 w-5" />
        };
      default:
        return {
          to: '/dashboard/my-tickets',
          label: 'My Tickets',
          icon: <TicketIcon className="mr-2 h-5 w-5" />
        };
    }
  };
  
  const primaryAction = getPrimaryActionLink();
  const secondaryAction = getSecondaryActionLink();
  
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-pattern-dots"></div>
        <div className="relative px-8 py-12 md:py-20 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {user?.name || 'there'}!
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Welcome to your {role === 'buyer' ? 'ticket' : role === 'seller' ? 'event management' : 'admin'} dashboard
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={primaryAction.to}
              className="inline-flex items-center justify-center bg-white text-orange-600 font-semibold px-5 py-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Link>
            
            <Link
              to={secondaryAction.to}
              className="inline-flex items-center justify-center bg-orange-600 bg-opacity-30 text-white border border-white border-opacity-30 px-5 py-3 rounded-lg hover:bg-opacity-40 transition-colors duration-200"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full mr-4">
              <CalendarIcon size={22} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalEvents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <CalendarIcon size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-800">{stats.upcomingEvents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <TicketIcon size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Tickets</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTickets}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full mr-4">
              <ShoppingBagIcon size={22} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-800">{stats.ticketsSold}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full mr-4">
              <TrendingUpIcon size={22} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">${stats.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Section - Example content for different roles */}
      {role === 'seller' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Events</h2>
          {stats.totalEvents > 0 ? (
            <p className="text-gray-600 mb-4">
              You have {stats.totalEvents} events with {stats.upcomingEvents} upcoming. 
              <br />
              Check your sales reports for detailed analytics on ticket sales.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              You haven't created any events yet. Get started by creating your first event!
            </p>
          )}
          <Link
            to="/dashboard/my-events"
            className="inline-flex items-center text-orange-600 font-medium hover:text-orange-700"
          >
            View all your events <span className="ml-1">→</span>
          </Link>
        </div>
      )}
      
      {role === 'buyer' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Tickets</h2>
          <p className="text-gray-600 mb-4">
            Discover amazing events happening around you. Browse upcoming events and secure your tickets today!
          </p>
          <Link
            to="/events"
            className="inline-flex items-center text-orange-600 font-medium hover:text-orange-700"
          >
            Explore trending events <span className="ml-1">→</span>
          </Link>
        </div>
      )}
      
      {role === 'admin' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">System Overview</h2>
          <p className="text-gray-600 mb-4">
            Monitor the platform performance, manage users and events, and view system-wide analytics from your admin dashboard.
          </p>
          <Link
            to="/dashboard/reports"
            className="inline-flex items-center text-orange-600 font-medium hover:text-orange-700"
          >
            View detailed reports <span className="ml-1">→</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardWelcome;