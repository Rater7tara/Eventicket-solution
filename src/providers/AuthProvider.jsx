import React, { createContext, useEffect, useState } from "react";
import ServerURL from "../ServerConfig";
import AuthService from "../services/AuthService"; // Import the AuthService

export const AuthContext = createContext(null);

// Base URL for API calls
const BASE_URL = ServerURL.url;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Check if user exists in localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user-info");
    const storedToken = localStorage.getItem("auth-token");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedToken) {
      setAuthToken(storedToken);
    }

    setLoading(false);
  }, []);

  // Refresh token function
  const refreshToken = async () => {
    // If we have a user but no token, try to get a new token by logging in again
    if (user && !authToken) {
      try {
        const storedUserData = JSON.parse(
          localStorage.getItem("userData") || "{}"
        );
        if (storedUserData.email && storedUserData.password) {
          const loginResult = await signIn(
            storedUserData.email,
            storedUserData.password,
            true
          );
          console.log("Token refreshed successfully:", !!loginResult);
          return !!loginResult;
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
        return false;
      }
    }
    return false;
  };

  // Register user function
  const createUser = async (name, email, phone, password) => {
    setLoading(true);

    try {
      console.log("Creating user with:", { name, email, phone, password });

      const response = await fetch(`${BASE_URL}auth/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      // Log response status and headers for debugging
      console.log("API Response status:", response.status);

      const responseText = await response.text();
      console.log("API Response text:", responseText);

      // Parse the response
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("API Response parsed:", data);
      } catch (parseError) {
        console.error("Error parsing response as JSON:", parseError);
        throw new Error("Invalid response from server. Please try again.");
      }

      if (!data.success) {
        console.error("API reported failure:", data.message);
        throw new Error(data.message || "Registration failed");
      }

      // Get the user data - in this API, it's in data.data
      const userData = data.data;

      if (!userData) {
        throw new Error("No user data received from server");
      }

      // Store user information
      localStorage.setItem("user-info", JSON.stringify(userData));
      setUser(userData);
      console.log("User data stored:", userData);

      // Since registration doesn't return a token, immediately login to get a token
      try {
        await signIn(email, password);
        console.log("Auto-login after registration successful");
      } catch (loginError) {
        console.error("Auto-login after registration failed:", loginError);
        // Continue anyway since registration was successful
      }

      return userData;
    } catch (error) {
      console.error("Registration error details:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email/password
  const signIn = async (email, password, isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      console.log("Signing in with:", { email, password });

      const response = await fetch(`${BASE_URL}auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Log response status for debugging
      console.log("API Response status:", response.status);

      const responseText = await response.text();
      console.log("API Response text:", responseText);

      // Parse the response
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("API Response parsed:", data);
      } catch (parseError) {
        console.error("Error parsing response as JSON:", parseError);
        throw new Error("Invalid response from server. Please try again.");
      }

      if (!data.success) {
        console.error("API reported failure:", data.message);
        throw new Error(data.message || "Login failed");
      }

      // Store token if present
      if (data.token) {
        localStorage.setItem("auth-token", data.token);
        // Also store a backup of the token
        sessionStorage.setItem("auth-token-backup", data.token);
        setAuthToken(data.token);
        console.log(
          "Token stored in localStorage and sessionStorage:",
          data.token
        );
      } else {
        console.warn("No token returned from login API.");
      }

      // Get the user data
      const userData = data.user || data.data || {};

      if (Object.keys(userData).length === 0) {
        console.warn("No user data found in response");
      }

      // Store user information
      localStorage.setItem("user-info", JSON.stringify(userData));
      setUser(userData);
      console.log("User data stored:", userData);

      return userData;
    } catch (error) {
      console.error("Login error details:", error);
      throw error;
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  // Enhanced Log out using AuthService
  const logOut = () => {
    // Use the AuthService to properly clean up all storage
    AuthService.logout();
    
    // Clear user state
    setUser(null);
    setAuthToken(null);
    
    console.log("Logged out and cleared all user data");
    return true;
  };

  const authInfo = {
    user,
    loading,
    authToken,
    createUser,
    signIn,
    logOut,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;