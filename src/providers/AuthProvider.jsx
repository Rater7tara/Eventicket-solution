import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext(null);

// Base URL for API calls
const BASE_URL = 'https://event-ticket-backend.vercel.app/api/v1';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Check if user exists in localStorage on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('user-info');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);
    
    // Register user function
    const createUser = async (email, password) => {
        setLoading(true);
        
        try {
            console.log('Creating user with:', { email, password });
            
            const response = await fetch(`${BASE_URL}/auth/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    name: email.split('@')[0] 
                })
            });
            
            const data = await response.json();
            console.log('API Response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Store token
            if (data.token) {
                localStorage.setItem('auth-token', data.token);
            }
            
            // Store user information exactly as received from API
            if (data.user) {
                localStorage.setItem('user-info', JSON.stringify(data.user));
                setUser(data.user);
            }
            
            return data.user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Sign in with email/password
    const signIn = async (email, password) => {
        setLoading(true);
        
        try {
            console.log('Signing in with:', { email, password });
            
            // Development fallback (uncomment if needed)
            // if (process.env.NODE_ENV === 'development') {
            //     // Mock login code here
            // }
            
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('API Response:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Store token
            if (data.token) {
                localStorage.setItem('auth-token', data.token);
            }
            
            // Store user information exactly as received from API
            if (data.user) {
                localStorage.setItem('user-info', JSON.stringify(data.user));
                setUser(data.user);
            }
            
            return data.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Log out
    const logOut = () => {
        // Clear user data and token
        localStorage.removeItem('user-info');
        localStorage.removeItem('auth-token');
        
        // Clear user state
        setUser(null);
        
        return true;
    };

    const authInfo = {
        user,
        loading,
        createUser,
        signIn,
        logOut
    };

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;