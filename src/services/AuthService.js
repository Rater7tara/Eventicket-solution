// AuthService.js - Enhanced service that works with your existing AuthProvider

import ServerURL from '../ServerConfig';

class AuthService {
  /**
   * Get the current user information from all possible sources
   */
  getCurrentUser() {
    try {
      // Check different possible storage locations in priority order
      const userInfo = localStorage.getItem("user-info");
      if (userInfo) {
        return JSON.parse(userInfo);
      }
      
      const userData = localStorage.getItem("userData");
      if (userData) {
        return JSON.parse(userData);
      }
      
      // Try to extract from token as last resort
      const token = localStorage.getItem("auth-token");
      if (token) {
        try {
          const tokenPayload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(tokenPayload));
          if (decodedPayload && decodedPayload.id) {
            return {
              _id: decodedPayload.id,
              name: decodedPayload.name,
              email: decodedPayload.email,
              role: decodedPayload.role
            };
          }
        } catch (e) {
          console.error("Error extracting data from token:", e);
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
  
  /**
   * Get the user ID from any available source
   */
  getUserId() {
    const user = this.getCurrentUser();
    return user ? (user._id || user.id) : null;
  }
  
  /**
   * Check if a user is logged in
   */
  isAuthenticated() {
    return !!this.getUserId() && !!localStorage.getItem("auth-token");
  }
  
  /**
   * Enhance the existing logout function in AuthProvider
   * This can be called from AuthProvider's logOut method
   */
  logout() {
    // Clear all user-related data from localStorage
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-info");
    localStorage.removeItem("userData");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("bookingId");
    sessionStorage.removeItem("auth-token-backup");
    
    // Clear any other user-related data you might have
    // Add any additional items that need to be cleared
    
    console.log("All user data cleared from storage");
    return true;
  }

  /**
   * Get the auth token from storage
   */
  getToken() {
    return localStorage.getItem("auth-token") || sessionStorage.getItem("auth-token-backup");
  }

  /**
   * Extract the buyer ID from the available sources
   * Useful for the SeatPlan component
   */
  getBuyerId() {
    const user = this.getCurrentUser();
    if (user && (user._id || user.id)) {
      return user._id || user.id;
    }
    
    // Try to extract from token if no user object
    const token = this.getToken();
    if (token) {
      try {
        const tokenPayload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(tokenPayload));
        if (decodedPayload && decodedPayload.id) {
          return decodedPayload.id;
        }
      } catch (e) {
        console.error("Error extracting ID from token:", e);
      }
    }
    
    return null;
  }
  
  /**
   * Debug function to print all stored user data to console
   * Can be helpful for troubleshooting authentication issues
   */
  debugAuthData() {
    console.group("Auth Data Debug");
    
    try {
      console.log("auth-token:", localStorage.getItem("auth-token"));
      console.log("auth-token-backup:", sessionStorage.getItem("auth-token-backup"));
      
      const userInfo = localStorage.getItem("user-info");
      console.log("user-info:", userInfo ? JSON.parse(userInfo) : null);
      
      const userData = localStorage.getItem("userData");
      console.log("userData:", userData ? JSON.parse(userData) : null);
      
      const extractedUser = this.getCurrentUser();
      console.log("Extracted current user:", extractedUser);
      
      const buyerId = this.getBuyerId();
      console.log("Extracted buyer ID:", buyerId);
      
      console.log("Is authenticated:", this.isAuthenticated());
    } catch (error) {
      console.error("Error debugging auth data:", error);
    }
    
    console.groupEnd();
  }
}

// Create a singleton instance
const authServiceInstance = new AuthService();
export default authServiceInstance;