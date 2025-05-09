import React, { createContext, useEffect, useState } from 'react';
import serverURL from '../ServerConfig';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Create a user with our API
    const createUser = async (email, password, role = 'buyer') => {
        setLoading(true);
        
        try {
            // Always use 'buyer' role regardless of what's passed
            const userRole = 'buyer';
            
            console.log('Creating user with role:', userRole);
            
            // Register with your API
            const response = await fetch(`${serverURL.url}auth/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email,
                    password,
                    name: email.split('@')[0], // Default name from email
                    role: userRole // Force role to be 'buyer'
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user on API');
            }
            
            // Extract token if available in response
            const token = data.token || null;
            
            // Create user object with buyer role
            const userInfo = {
                email: email,
                role: userRole, // Explicitly set to 'buyer'
                name: data.user?.name || email.split('@')[0],
                _id: data.user?._id
            };
            
            console.log('User created with info:', userInfo);
            
            // Store user information and token in localStorage for persistence
            localStorage.setItem('user-info', JSON.stringify(userInfo));
            if (token) {
                localStorage.setItem('auth-token', token);
            }
            
            // Update user state
            setUser(userInfo);
            setLoading(false);
            
            return userInfo;
        } catch (error) {
            console.error('User creation error:', error);
            setLoading(false);
            throw error;
        }
    }

    // Sign in with email/password
    const signIn = async (email, password) => {
        setLoading(true);
        
        try {
            // Sign in with your API
            const response = await fetch(`${serverURL.url}auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Get token from API response
            const token = data.token;
            
            // Get user info from the API response
            const { name, _id } = data.user || {};
            
            // ALWAYS use 'buyer' role regardless of what the API returns
            const userRole = 'buyer';
            
            // Create the user object with role always set to 'buyer'
            const userInfo = {
                email: email,
                role: userRole, // Force role to be 'buyer'
                name: name || email.split('@')[0],
                _id: _id
            };
            
            console.log('User signed in with role:', userRole);
            
            // Save user data in localStorage for persistence
            localStorage.setItem('user-info', JSON.stringify(userInfo));
            localStorage.setItem('auth-token', token);
            
            // Update user state
            setUser(userInfo);
            setLoading(false);
            
            return userInfo;
        } catch (error) {
            console.error('Login error:', error);
            setLoading(false);
            throw error;
        }
    }

    // Sign in with Google
    const signInWithGoogle = async (googleUserData) => {
        setLoading(true);
        
        try {
            const { displayName, email, photoURL } = googleUserData;
            
            // Force role to be 'buyer'
            const userRole = 'buyer';
            
            // Register this user with our API
            const response = await fetch(`${serverURL.url}auth/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name: displayName || email.split('@')[0], 
                    email, 
                    photoURL,
                    authProvider: 'google',
                    role: userRole // Force role to be 'buyer'
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Google sign-in failed');
            }
            
            // Get token from response
            const token = data.token;
            
            // Create user object with buyer role
            const userInfo = {
                email: email,
                role: userRole, // Always use 'buyer' role
                name: displayName || email.split('@')[0],
                photoURL: photoURL,
                _id: data.user?._id
            };
            
            console.log('User signed in with Google, role:', userRole);
            
            // Save data in localStorage
            localStorage.setItem('user-info', JSON.stringify(userInfo));
            localStorage.setItem('auth-token', token);
            
            // Update user state
            setUser(userInfo);
            
            return userInfo;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Log out
    const logOut = async () => {
        setLoading(true);
        
        try {
            // Clear user data and token from localStorage
            localStorage.removeItem('user-info');
            localStorage.removeItem('auth-token');
            
            // Clear user state
            setUser(null);
            setLoading(false);
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            setLoading(false);
            throw error;
        }
    }

    // Check if the user is authenticated on component mount
    useEffect(() => {
        const checkAuth = () => {
            try {
                // Check for token and user info in localStorage
                const token = localStorage.getItem('auth-token');
                const userInfo = JSON.parse(localStorage.getItem('user-info') || 'null');
                
                if (token && userInfo) {
                    // ENSURE user always has 'buyer' role regardless of what's saved
                    const userWithBuyerRole = {
                        ...userInfo,
                        role: 'buyer' // Force role to be 'buyer'
                    };
                    
                    // User is authenticated, set user state with buyer role
                    console.log('User authenticated from localStorage with role:', userWithBuyerRole.role);
                    
                    // Update localStorage with buyer role
                    localStorage.setItem('user-info', JSON.stringify(userWithBuyerRole));
                    
                    // Set user with buyer role
                    setUser(userWithBuyerRole);
                } else {
                    // No authentication data found
                    setUser(null);
                }
            } catch (error) {
                console.error('Error checking authentication state:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuth();
    }, []);

    const authInfo = {
        user,
        loading,
        createUser,
        signIn,
        logOut,
        signInWithGoogle,
        setUserRole: (role) => {
            // Always set role to 'buyer' regardless of what's passed
            const buyerRole = 'buyer';
            
            if (user) {
                // Create updated user object with 'buyer' role
                const updatedUser = {
                    ...user,
                    role: buyerRole
                };
                
                console.log('Setting user role to:', buyerRole);
                
                // Update localStorage
                localStorage.setItem('user-info', JSON.stringify(updatedUser));
                
                // Update user state
                setUser(updatedUser);
                
                return updatedUser;
            }
            return null;
        }
    }

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;