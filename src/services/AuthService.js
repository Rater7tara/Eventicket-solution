// AuthService.js - A service to handle authentication and user role management

import serverURL from '../ServerConfig';

class AuthService {
  // Sign in user
  async signIn(email, password) {
    try {
      const response = await fetch(`${serverURL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token in localStorage
        localStorage.setItem('authToken', data.token);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      return { success: false, message: 'An error occurred during sign-in' };
    }
  }

  // Register a new user - UPDATED to always set role as buyer
  async register(userData) {
    try {
      // Always set the role to buyer
      const userDataWithRole = {
        ...userData,
        role: 'buyer'  // Force the role to be 'buyer' regardless of what was passed
      };

      // Use the /admin/add-user endpoint as specified
      const response = await fetch(`${serverURL}/api/v1/admin/add-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDataWithRole),
      });

      const data = await response.json();

      if (data.success) {
        console.log("User registered with role:", userDataWithRole.role);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Error during registration:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
  }

  // Get the current user data
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Get the auth token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Sign out user
  signOut() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Update user role - use this after login if role needs to be updated
  async updateUserRole(userId, role = 'buyer') {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, message: 'Authentication required' };
      }
      
      const response = await fetch(`${serverURL}/api/v1/users/update-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the user in localStorage
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          currentUser.role = role;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
        
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Failed to update role' };
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, message: 'An error occurred while updating role' };
    }
  }
}

export default new AuthService();