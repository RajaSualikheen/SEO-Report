import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Import from your central firebase.js
import { useNavigate } from 'react-router-dom';

// 1. Create the context
const AuthContext = createContext();

// 2. Create a custom hook for easy access to the context
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Create the Provider component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Add a loading state
    const navigate = useNavigate();

    // This listener runs only once and manages the user state for the whole app
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false); // Set loading to false once we have a user or null
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/"); // Navigate to home after logout
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // The value provided to all children components
    const value = {
        currentUser,
        handleLogout
    };

    // We don't render the app until we've checked for a user
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};