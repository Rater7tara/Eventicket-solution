// userRegistration.js - Use this to handle user registration with buyer role
// Place this file in your services or utils directory

import serverURL from '../ServerConfig';

/**
 * Register a new user with buyer role enforced on the frontend
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Registration result
 */
export const registerUser = async (userData) => {
  // Always explicitly set the role to 'buyer' in the request
  const userDataWithBuyerRole = {
    ...userData,
    role: 'buyer' // Force role to be 'buyer'
  };
  
  console.log('Registering user with role buyer:', userDataWithBuyerRole);

  try {
    // Call your registration API
    const response = await fetch(`${serverURL}/api/v1/admin/add-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userDataWithBuyerRole), // Send data with buyer role
    });

    const data = await response.json();
    
    // Even if the backend doesn't respect the role we sent,
    // we'll force it to 'buyer' in the frontend
    if (data.success && data.user) {
      // Manually set the role to 'buyer' in the returned user object
      const userWithBuyerRole = {
        ...data.user,
        role: 'buyer'
      };
      
      console.log('User registered successfully with role buyer:', userWithBuyerRole);
      
      // Store user in localStorage with buyer role
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      // Store the user with buyer role in localStorage
      localStorage.setItem('user', JSON.stringify(userWithBuyerRole));
      
      return { 
        success: true, 
        user: userWithBuyerRole 
      };
    } else {
      console.error('Registration failed:', data.message);
      return { 
        success: false, 
        message: data.message || 'Registration failed' 
      };
    }
  } catch (error) {
    console.error('Error during registration:', error);
    return { 
      success: false, 
      message: 'An error occurred during registration' 
    };
  }
};

/**
 * Log in a user and force role to buyer in frontend
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Login result
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${serverURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success && data.user) {
      // Force role to 'buyer' regardless of what the server returns
      const userWithBuyerRole = {
        ...data.user,
        role: 'buyer'
      };
      
      // Save token to localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      // Save user with buyer role to localStorage
      localStorage.setItem('user', JSON.stringify(userWithBuyerRole));
      
      console.log('User logged in with role buyer:', userWithBuyerRole);
      
      return { 
        success: true, 
        user: userWithBuyerRole 
      };
    } else {
      console.error('Login failed:', data.message);
      return { 
        success: false, 
        message: data.message || 'Login failed' 
      };
    }
  } catch (error) {
    console.error('Error during login:', error);
    return { 
      success: false, 
      message: 'An error occurred during login' 
    };
  }
};

/**
 * Get current user with role forced to buyer
 * @returns {Object} - Current user or null
 */
export const getCurrentUser = () => {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    
    // Always return the user with role 'buyer' regardless of what's stored
    return {
      ...user,
      role: 'buyer'
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
  return localStorage.getItem('authToken') !== null;
};

/**
 * Get authentication token
 * @returns {string} - Auth token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Log out user
 */
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};