// src/services/api.js
import axios from 'axios';
import serverURL from '../ServerConfig';

// Set the base URL for the API
const API_BASE_URL = serverURL.url; // Change this to your actual backend URL

// Create an axios instance with the base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Payment APIs
export const paymentService = {
  // Create a new ticket payment
  createTicketPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/create-ticket-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  },

  // Confirm a payment
  confirmPayment: async (orderId) => {
    try {
      const response = await apiClient.post('/payments/confirm-payment', { orderId });
      return response.data;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  },
};

// User APIs
export const userService = {
  // Register a new user
  registerUser: async (userData) => {
    try {
      const response = await apiClient.post('/users/register', userData);
      return response.data;
    } catch (error) {
      console.error('User registration error:', error);
      throw error;
    }
  },

  // Login a user
  loginUser: async (credentials) => {
    try {
      const response = await apiClient.post('/users/login', credentials);
      return response.data;
    } catch (error) {
      console.error('User login error:', error);
      throw error;
    }
  },
};

// Event APIs
export const eventService = {
  // Get all events
  getEvents: async () => {
    try {
      const response = await apiClient.get('/events');
      return response.data;
    } catch (error) {
      console.error('Get events error:', error);
      throw error;
    }
  },

  // Get an event by ID
  getEventById: async (eventId) => {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Get event error:', error);
      throw error;
    }
  },
};

export default {
  payment: paymentService,
  user: userService,
  event: eventService,
};