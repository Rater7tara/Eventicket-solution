import React, { createContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import app from '../firebase/firebase.config';

export const AuthContext = createContext(null);

const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Create a user with Firebase authentication and our API
    const createUser = async (email, password) => {
        setLoading(true);
        
        // We'll continue to use Firebase for authentication
        // Our custom API handling is in the Register component
        return createUserWithEmailAndPassword(auth, email, password);
    }

    // Sign in with our API and Firebase
    const signIn = async (email, password) => {
        setLoading(true);
        
        try {
            // First, try to sign in with our API
            const response = await fetch('http://localhost:5000/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.token) {
                // Save token to localStorage
                localStorage.setItem('access-token', data.token);
                
                // Continue with Firebase authentication for consistency
                return signInWithEmailAndPassword(auth, email, password);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Sign in with Google
    const signInWithGoogle = async () => {
        setLoading(true);
        
        try {
            // First sign in with Firebase Google auth
            const result = await signInWithPopup(auth, googleAuthProvider);
            
            if (result.user) {
                const { displayName, email, photoURL } = result.user;
                
                // Now register this user with our API
                const response = await fetch('http://localhost:5000/api/user/google-auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        name: displayName, 
                        email, 
                        photoURL,
                        // Add any additional required fields
                    })
                });
                
                const data = await response.json();
                
                if (data.token) {
                    // Save token to localStorage
                    localStorage.setItem('access-token', data.token);
                    return result;
                } else {
                    throw new Error(data.message || 'Google sign-in failed');
                }
            }
            
            return result;
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Log out from both Firebase and clear the token
    const logOut = async () => {
        setLoading(true);
        
        try {
            // Clear the token from localStorage
            localStorage.removeItem('access-token');
            
            // Also sign out from Firebase
            return signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Check if the user is authenticated on component mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, loggedUser => {
            console.log('Logged in user inside auth state observer', loggedUser);
            setUser(loggedUser);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        }
    }, []);

    // Check token validity
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('access-token');
            
            if (token) {
                try {
                    // Optional: verify token with your API
                    const response = await fetch('http://localhost:5000/api/user/verify-token', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (!data.valid) {
                        // Token is invalid, log out
                        localStorage.removeItem('access-token');
                        signOut(auth);
                    }
                } catch (error) {
                    console.error('Token verification error:', error);
                }
            }
        };
        
        verifyToken();
    }, []);

    const authInfo = {
        user,
        loading,
        createUser,
        signIn,
        logOut,
        signInWithGoogle
    }

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;