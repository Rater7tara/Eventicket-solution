import React, { createContext, useEffect, useState } from 'react';
import serverURL from '../ServerConfig';

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Helper function to validate JWT token format
    const isValidToken = (token) => {
        return token && typeof token === 'string' && token.startsWith('eyJ');
    };
    
    // Helper function to ensure token is properly saved
    const saveTokenSafely = async (token) => {
        if (!isValidToken(token)) {
            console.warn('Attempted to save invalid token format:', token);
            return false;
        }
        
        try {
            // First remove any existing token to prevent concatenation
            localStorage.removeItem('auth-token');
            
            // Then set the new token
            localStorage.setItem('auth-token', token);
            
            // Backup the token to session storage for recovery
            sessionStorage.setItem('auth-token-backup', token);
            
            // Add a small delay to ensure localStorage updates
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Verify token was saved correctly
            const savedToken = localStorage.getItem('auth-token');
            const isCorrect = savedToken === token;
            
            if (!isCorrect) {
                console.error('Token was not saved correctly to localStorage', {
                    original: token,
                    saved: savedToken
                });
            }
            
            return isCorrect;
        } catch (error) {
            console.error('Error saving token:', error);
            return false;
        }
    };
    
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
            
            // Extract and validate token if available in response
            const token = data.token || null;
            
            // Create user object with buyer role
            const userInfo = {
                email: email,
                role: userRole, // Explicitly set to 'buyer'
                name: data.user?.name || email.split('@')[0],
                _id: data.user?._id
            };
            
            console.log('User created with info:', userInfo);
            
            // Store user information in localStorage for persistence
            localStorage.setItem('user-info', JSON.stringify(userInfo));
            
            // Store the same data in userData for checkout form compatibility
            localStorage.setItem('userData', JSON.stringify({
                email,
                password,
                name: userInfo.name
            }));
            
            // Save token if available and valid
            if (token) {
                if (isValidToken(token)) {
                    await saveTokenSafely(token);
                } else {
                    console.error('Received invalid token format from create-user API:', token);
                }
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
            
            // Get and validate token from API response
            const token = data.token;
            
            if (!isValidToken(token)) {
                throw new Error('Invalid token format received from server');
            }
            
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
            
            // Store the same data in userData for checkout form compatibility
            localStorage.setItem('userData', JSON.stringify({
                email,
                password,
                name: userInfo.name
            }));
            
            // Save token safely
            await saveTokenSafely(token);
            
            // Double-check token was saved correctly
            const savedToken = localStorage.getItem('auth-token');
            if (savedToken !== token) {
                console.error('Token was not saved correctly to localStorage');
                
                // Force a direct set as last resort
                localStorage.setItem('auth-token', token);
            }
            
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
            
            if (!isValidToken(token)) {
                throw new Error('Invalid token format received from server');
            }
            
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
            
            // Save token safely
            await saveTokenSafely(token);
            
            // Store data in userData for checkout form compatibility
            localStorage.setItem('userData', JSON.stringify({
                email,
                name: userInfo.name
            }));
            
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
            localStorage.removeItem('userData');
            sessionStorage.removeItem('auth-token-backup');
            
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
        const checkAuth = async () => {
            try {
                // Check for token and user info in localStorage
                let token = localStorage.getItem('auth-token');
                const userInfo = JSON.parse(localStorage.getItem('user-info') || 'null');
                
                // Fix for potentially corrupted token
                if (token && (!token.startsWith('eyJ') || token.includes('forced-token'))) {
                    console.warn('Detected invalid token format in localStorage, attempting to fix...');
                    
                    // Try to retrieve the token from session storage or any backup
                    const backupToken = sessionStorage.getItem('auth-token-backup');
                    
                    if (backupToken && backupToken.startsWith('eyJ')) {
                        console.log('Restored token from backup');
                        await saveTokenSafely(backupToken);
                        token = backupToken;
                    } else {
                        // If no valid backup, clear the token
                        console.error('No valid backup token found, clearing invalid token');
                        localStorage.removeItem('auth-token');
                        token = null;
                    }
                }
                
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
                    
                    // Backup the token to session storage for emergency recovery if it's valid
                    if (isValidToken(token)) {
                        sessionStorage.setItem('auth-token-backup', token);
                    }
                    
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
        },
        // Add a method to refresh or validate token
        refreshToken: async () => {
            try {
                const token = localStorage.getItem('auth-token');
                
                // If token is missing or invalid, try to recover from backup
                if (!isValidToken(token)) {
                    const backupToken = sessionStorage.getItem('auth-token-backup');
                    
                    if (isValidToken(backupToken)) {
                        console.log('Recovered token from backup during refresh');
                        await saveTokenSafely(backupToken);
                        return true;
                    }
                    
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error('Error refreshing token:', error);
                return false;
            }
        }
    }

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;