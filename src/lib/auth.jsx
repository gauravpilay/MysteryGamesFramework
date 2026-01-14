import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                if (db) {
                    const userRef = doc(db, "users", u.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUser({ ...u, ...userSnap.data() });
                    } else {
                        // If document doesn't exist yet but user is auth'd (race condition or first login), 
                        // we might wait or just set basic auth. 
                        // For now, set basic auth, login function creates the doc.
                        setUser(u);
                    }
                } else {
                    setUser(u);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        if (!auth) {
            alert("Firebase configuration missing. Using Mock Login. To enable Google Sign-In, please fill in the .env file and restart the server.");
            // Mock Login
            setUser({
                displayName: "Detective User",
                email: "detective@agency.com",
                photoURL: "https://ui.shadcn.com/avatars/01.png",
                uid: "mock-uid-123"
            });
            return;
        }
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (db) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        email: user.email,
                        role: "User",
                        createdAt: new Date()
                    });
                }
            }
        } catch (error) {
            console.error("Login failed", error);
            // Fallback for demo if popup fails (e.g. valid config but domain not allowed)
            alert("Firebase Login Failed. Check console. Logging in as Mock User.");
            setUser({
                displayName: "Detective User",
                email: "detective@agency.com",
                photoURL: "https://ui.shadcn.com/avatars/01.png",
                uid: "mock-uid-123"
            });
        }
    };

    const logout = async () => {
        if (!auth) {
            setUser(null);
            return;
        }
        await signOut(auth);
        setUser(null); // Ensure state clears
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
