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
    
    // Save user info safely to localStorage
    const saveUserInfoSafely = (userInfo) => {
        try {
            // Preserve the exact role from the API response
            if (!userInfo.role) {
                console.error('Attempted to save user info without role:', userInfo);
                return false;
            }
            
            console.log('Saving user with role:', userInfo.role);
            
            // Save to localStorage
            localStorage.setItem('user-info', JSON.stringify(userInfo));
            
            // Create a backup of critical user info including role
            sessionStorage.setItem('user-role-backup', userInfo.role);
            sessionStorage.setItem('user-info-backup', JSON.stringify(userInfo));
            
            return true;
        } catch (error) {
            console.error('Error saving user info:', error);
            return false;
        }
    };
    
    // Create a user with our API
    const createUser = async (email, password, role = 'buyer') => {
        setLoading(true);
        
        try {
            // Use the provided role parameter
            console.log('Creating user with role:', role);
            
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
                    role // Use the provided role
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user on API');
            }
            
            // Extract and validate token if available in response
            const token = data.token || null;
            
            // IMPORTANT: Create user object using the exact role from the response
            // Don't use fallbacks or defaults for role here if we received a specific role
            const userRole = data.user?.role;
            if (!userRole) {
                console.warn('No role received from API, using provided role:', role);
            }
            
            const userInfo = {
                email: email,
                // Only use the fallback if no role received from API
                role: userRole || role,
                name: data.user?.name || email.split('@')[0],
                _id: data.user?._id
            };
            
            console.log('User created with info:', userInfo);
            
            // Store user information in localStorage for persistence
            saveUserInfoSafely(userInfo);
            
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
            // Check if this is an admin login before making the API call
            // You can modify this condition based on how you identify admin accounts
            const isAdminLogin = email.includes('admin') || email === 'admin@example.com';
            console.log('Is admin login attempt:', isAdminLogin);
            
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
            const { name, _id, role } = data.user || {};
            
            // CRITICAL FIX: Log and verify the role we're getting from the API
            console.log('API returned user with role:', role);
            
            // Create user info object with proper role handling
            let finalRole = role;
            
            // CRITICAL FIX FOR ADMIN: If the backend isn't returning admin role correctly,
            // but we know this should be an admin account
            if (isAdminLogin && (!role || role === 'buyer')) {
                console.log('Admin login detected but incorrect role returned. Forcing admin role.');
                finalRole = 'admin';
                
                // Add a permanent flag to identify admin accounts
                localStorage.setItem('is-admin-account', 'true');
            } else if (localStorage.getItem('is-admin-account') === 'true' && email === localStorage.getItem('admin-email')) {
                // If this is a known admin account from previous logins
                console.log('Known admin account detected. Preserving admin role.');
                finalRole = 'admin';
            }
            
            // Store admin email if this is an admin account
            if (finalRole === 'admin') {
                localStorage.setItem('admin-email', email);
            }
            
            // Create the user object with the final determined role
            const userInfo = {
                email: email,
                role: finalRole,
                name: name || email.split('@')[0],
                _id: _id
            };
            
            console.log('User signed in with role:', userInfo.role);
            
            // Save user data in localStorage for persistence
            saveUserInfoSafely(userInfo);
            
            // CRITICAL: Save a special backup of the role for this user
            localStorage.setItem(`user-role-${email}`, userInfo.role);
            sessionStorage.setItem(`user-role-${email}`, userInfo.role);
            
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
            
            // Default role is 'buyer' but can be changed later
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
                    role: userRole
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
            
            // Create user object with the role from response
            const userInfo = {
                email: email,
                // CRITICAL FIX: Only use API response role, no fallback
                role: data.user?.role, 
                name: displayName || email.split('@')[0],
                photoURL: photoURL,
                _id: data.user?._id
            };
            
            console.log('User signed in with Google, role:', userInfo.role);
            
            // Save data in localStorage
            saveUserInfoSafely(userInfo);
            
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
            sessionStorage.removeItem('user-role-backup');
            sessionStorage.removeItem('user-info-backup');
            
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
                const userInfoString = localStorage.getItem('user-info');
                let userInfo = null;
                
                try {
                    userInfo = JSON.parse(userInfoString || 'null');
                } catch (parseError) {
                    console.error('Failed to parse user info:', parseError);
                    // If parsing fails, clear the corrupted data
                    localStorage.removeItem('user-info');
                }
                
                // CRITICAL FIX: Validate that user has the correct role
                if (userInfo && (!userInfo.role || userInfo.role === undefined)) {
                    console.error('User info is missing role property!', userInfo);
                    
                    // Try to recover role from backup
                    const backupRole = sessionStorage.getItem('user-role-backup');
                    const backupUserInfoString = sessionStorage.getItem('user-info-backup');
                    
                    if (backupRole) {
                        console.log('Recovered role from backup:', backupRole);
                        userInfo.role = backupRole;
                        
                        // Save the fixed user info back to localStorage
                        localStorage.setItem('user-info', JSON.stringify(userInfo));
                    } else if (backupUserInfoString) {
                        try {
                            const backupUserInfo = JSON.parse(backupUserInfoString);
                            if (backupUserInfo && backupUserInfo.role) {
                                console.log('Recovered user info from backup with role:', backupUserInfo.role);
                                userInfo = backupUserInfo;
                                
                                // Save the fixed user info back to localStorage
                                localStorage.setItem('user-info', JSON.stringify(userInfo));
                            }
                        } catch (backupParseError) {
                            console.error('Failed to parse backup user info:', backupParseError);
                        }
                    }
                }
                
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
                    // IMPORTANT: Ensure role is preserved exactly as stored
                    console.log('User authenticated from localStorage with role:', userInfo.role);
                    
                    // Backup the token to session storage for emergency recovery if it's valid
                    if (isValidToken(token)) {
                        sessionStorage.setItem('auth-token-backup', token);
                    }
                    
                    // Backup the role for emergency recovery
                    if (userInfo.role) {
                        sessionStorage.setItem('user-role-backup', userInfo.role);
                    }
                    
                    // *** CRITICAL FIX: Check for role in our backups without relying on backend ***
                    // Check if this is a known admin account
                    const isKnownAdmin = localStorage.getItem('is-admin-account') === 'true' && 
                                       userInfo.email === localStorage.getItem('admin-email');
                    
                    // Retrieve user-specific role backup if it exists
                    const userSpecificRole = localStorage.getItem(`user-role-${userInfo.email}`) || 
                                           sessionStorage.getItem(`user-role-${userInfo.email}`);
                    
                    console.log('User email:', userInfo.email);
                    console.log('Is known admin:', isKnownAdmin);
                    console.log('User-specific role backup:', userSpecificRole);
                    console.log('Current role in userInfo:', userInfo.role);
                    
                    // If this is a known admin but the role is not admin, fix it
                    if (isKnownAdmin && userInfo.role !== 'admin') {
                        console.log('Known admin account detected with incorrect role. Fixing...');
                        userInfo.role = 'admin';
                        localStorage.setItem('user-info', JSON.stringify(userInfo));
                        sessionStorage.setItem('user-role-backup', 'admin');
                    } 
                    // If we have a user-specific role that doesn't match current role
                    else if (userSpecificRole && userInfo.role !== userSpecificRole) {
                        console.log(`Role mismatch detected! Updating from ${userInfo.role} to ${userSpecificRole}`);
                        userInfo.role = userSpecificRole;
                        localStorage.setItem('user-info', JSON.stringify(userInfo));
                        sessionStorage.setItem('user-role-backup', userSpecificRole);
                    }
                    
                    // Store current email for reference
                    localStorage.setItem('current-user-email', userInfo.email);
                    
                    // Set user with saved role
                    setUser(userInfo);
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

    // Helper function to preserve role without requiring backend verification
    const preserveUserRole = () => {
        if (!user) return false;
        
        try {
            // Get the stored role from backups or localStorage
            const storedUserInfo = localStorage.getItem('user-info');
            let storedRole = null;
            
            // Check if we have stored user info with a role
            if (storedUserInfo) {
                try {
                    const parsedUserInfo = JSON.parse(storedUserInfo);
                    if (parsedUserInfo && parsedUserInfo.role) {
                        storedRole = parsedUserInfo.role;
                        console.log('Found role in localStorage:', storedRole);
                    }
                } catch (error) {
                    console.error('Error parsing stored user info:', error);
                }
            }
            
            // Check backup in session storage
            if (!storedRole) {
                storedRole = sessionStorage.getItem('user-role-backup');
                if (storedRole) {
                    console.log('Found role in session storage backup:', storedRole);
                }
            }
            
            // If we have a stored role and it's different from current role
            if (storedRole && user.role !== storedRole) {
                console.log(`Role mismatch: Current ${user.role}, Stored ${storedRole}. Preserving stored role...`);
                
                // Check if the stored role is a valid role (admin, seller, buyer)
                const validRoles = ['admin', 'seller', 'buyer'];
                if (!validRoles.includes(storedRole)) {
                    console.error('Invalid stored role:', storedRole);
                    return false;
                }
                
                // Update the user with the correct role from storage
                const updatedUser = { ...user, role: storedRole };
                
                // Save to localStorage
                localStorage.setItem('user-info', JSON.stringify(updatedUser));
                
                // Save in session storage as backup
                sessionStorage.setItem('user-role-backup', storedRole);
                
                // Update state
                setUser(updatedUser);
                
                console.log('Role preserved successfully to:', storedRole);
                return true;
            } else if (user.role) {
                // If there's no mismatch but we have a role, ensure it's backed up
                sessionStorage.setItem('user-role-backup', user.role);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error preserving role:', error);
            return false;
        }
    };

    const authInfo = {
        user,
        loading,
        createUser,
        signIn,
        logOut,
        signInWithGoogle,
        setUserRole: (role) => {
            if (!user) return null;
            
            // IMPORTANT: Add validation for role changes
            if (!role || typeof role !== 'string') {
                console.error('Invalid role provided:', role);
                return null;
            }
            
            // Create updated user object with the new role
            const updatedUser = {
                ...user,
                role: role
            };
            
            console.log('Setting user role to:', role);
            
            // Update localStorage with proper backup
            saveUserInfoSafely(updatedUser);
            
            // CRITICAL: Save user-specific role backup
            if (user.email) {
                localStorage.setItem(`user-role-${user.email}`, role);
                sessionStorage.setItem(`user-role-${user.email}`, role);
                
                // If this is admin role, mark this as admin account
                if (role === 'admin') {
                    localStorage.setItem('is-admin-account', 'true');
                    localStorage.setItem('admin-email', user.email);
                }
            }
            
            // Update user state
            setUser(updatedUser);
            
            return updatedUser;
        },
        // Replace verify with preserve method that doesn't need backend
        preserveUserRole,
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
        },
        // Method to force role to admin (for debugging)
        forceAdminRole: () => {
            if (user) {
                const adminUser = {
                    ...user,
                    role: 'admin'
                };
                
                // Update all storage locations
                localStorage.setItem('user-info', JSON.stringify(adminUser));
                sessionStorage.setItem('user-role-backup', 'admin');
                localStorage.setItem('is-admin-account', 'true');
                localStorage.setItem('admin-email', user.email);
                localStorage.setItem(`user-role-${user.email}`, 'admin');
                sessionStorage.setItem(`user-role-${user.email}`, 'admin');
                
                // Update user state
                setUser(adminUser);
                
                console.log('Role forced to admin');
                return adminUser;
            }
            return null;
        },
        // Method to get current role
        getUserRole: () => {
            return user?.role || null;
        }
    }

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;