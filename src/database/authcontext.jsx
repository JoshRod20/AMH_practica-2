import React, { createContext, useContext, useState, useEffect, Children } from "react";
import {getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { appfirebase } from "./firebaseconfig";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ Children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const auth = getAuth(appfirebase);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        const auth = getAuth(appfirebase);
        await signOut(auth);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, logout }}>
            { Children }
        </AuthContext.Provider>
    );
};