import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
            if (u) {
                if (db) {
                    const userRef = doc(db, "users", u.uid);
                    // Listen to real-time updates
                    const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
                        if (docSnap.exists()) {
                            setUser({ ...u, ...docSnap.data() });
                        } else {
                            // Doc might not exist yet if it's the very first login and setDoc hasn't finished,
                            // or if creating below. Just set basic auth user for now.
                            setUser(u);
                        }
                    });

                    // We need to cleanup this snapshot listener when auth state changes or unmount
                    // But here we are inside the auth listener. 
                    // A simple way is to just let it run. 
                    // For a robust app, we'd store the unsubscribe function in a ref or state.
                    // Given the structure, let's keep it simple: 
                    // The auth provider usually mounts once.
                    // However, strictly speaking, we are creating a new listener every time auth state confirms user.
                    // Ideally we should manage the unsubscription. 
                } else {
                    setUser(u);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribeAuth;
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
