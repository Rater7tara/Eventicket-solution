// src/utils/TicketSyncUtil.js or src/components/TicketSyncUtil.js
import { useState, useEffect } from 'react';

class TicketSyncUtil {
  static instance = null;
  listeners = [];

  static getInstance() {
    if (!TicketSyncUtil.instance) {
      TicketSyncUtil.instance = new TicketSyncUtil();
    }
    return TicketSyncUtil.instance;
  }

  // Subscribe to ticket state changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners when a ticket is cancelled
  notifyTicketCancelled(ticketId, orderId) {
    console.log(`Broadcasting ticket cancellation: ${ticketId}`);
    this.listeners.forEach(callback => {
      try {
        callback({
          type: 'TICKET_CANCELLED',
          ticketId,
          orderId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error in ticket sync listener:', error);
      }
    });
  }

  // Notify all listeners when tickets need to be refreshed
  notifyTicketsRefresh() {
    console.log('Broadcasting ticket refresh request');
    this.listeners.forEach(callback => {
      try {
        callback({
          type: 'TICKETS_REFRESH',
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error in ticket sync listener:', error);
      }
    });
  }

  // Add this method to localStorage to persist cancelled ticket IDs
  static addCancelledTicket(ticketId, orderId) {
    try {
      const cancelled = JSON.parse(localStorage.getItem('cancelledTickets') || '[]');
      const cancellation = {
        ticketId,
        orderId,
        timestamp: Date.now()
      };
      
      // Add if not already present
      if (!cancelled.some(c => c.ticketId === ticketId)) {
        cancelled.push(cancellation);
        localStorage.setItem('cancelledTickets', JSON.stringify(cancelled));
      }
    } catch (error) {
      console.error('Error storing cancelled ticket:', error);
    }
  }

  // Check if a ticket is in the cancelled list
  static isTicketCancelled(ticketId, orderId) {
    try {
      const cancelled = JSON.parse(localStorage.getItem('cancelledTickets') || '[]');
      return cancelled.some(c => c.ticketId === ticketId || c.orderId === orderId);
    } catch (error) {
      console.error('Error checking cancelled tickets:', error);
      return false;
    }
  }

  // Clean up old cancelled ticket records (older than 30 days)
  static cleanupCancelledTickets() {
    try {
      const cancelled = JSON.parse(localStorage.getItem('cancelledTickets') || '[]');
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const cleaned = cancelled.filter(c => c.timestamp > thirtyDaysAgo);
      localStorage.setItem('cancelledTickets', JSON.stringify(cleaned));
    } catch (error) {
      console.error('Error cleaning cancelled tickets:', error);
    }
  }
}

// Hook to use the sync utility in React components
export const useTicketSync = (onTicketEvent) => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const syncUtil = TicketSyncUtil.getInstance();
    
    const unsubscribe = syncUtil.subscribe((event) => {
      if (onTicketEvent) {
        onTicketEvent(event);
      }
      // Force re-render
      forceUpdate({});
    });

    // Cleanup old cancelled tickets on mount
    TicketSyncUtil.cleanupCancelledTickets();

    return unsubscribe;
  }, [onTicketEvent]);

  return {
    notifyTicketCancelled: (ticketId, orderId) => {
      TicketSyncUtil.addCancelledTicket(ticketId, orderId);
      TicketSyncUtil.getInstance().notifyTicketCancelled(ticketId, orderId);
    },
    notifyTicketsRefresh: () => {
      TicketSyncUtil.getInstance().notifyTicketsRefresh();
    },
    isTicketCancelled: TicketSyncUtil.isTicketCancelled
  };
};

export default TicketSyncUtil;