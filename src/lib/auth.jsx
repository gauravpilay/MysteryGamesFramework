import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        let unsubscribeSnapshot = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
            // Clear existing snapshot listener if any
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (u) {
                if (db) {
                    const userRef = doc(db, "users", u.uid);
                    unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();

                            // Check for depth equality before setting state to avoid flickering
                            setUser(prev => {
                                const next = { ...u, ...data };
                                if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
                                return next;
                            });

                            // Auto-sync missing profile info
                            if ((!data.displayName && u.displayName) || (!data.photoURL && u.photoURL)) {
                                updateDoc(userRef, {
                                    displayName: data.displayName || u.displayName,
                                    photoURL: data.photoURL || u.photoURL
                                }).catch(() => { });
                            }
                        } else {
                            setUser(u);
                        }
                    });
                } else {
                    setUser(u);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
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
                    // Check if this is the first user
                    const usersColl = collection(db, "users");
                    const usersSnap = await getDocs(usersColl);
                    const isFirstUser = usersSnap.empty;

                    await setDoc(userRef, {
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        email: user.email,
                        role: isFirstUser ? "Admin" : "User",
                        createdAt: new Date().toISOString()
                    });
                } else {
                    // Update if missing
                    const data = userSnap.data();
                    const updates = {};
                    if (!data.displayName && user.displayName) updates.displayName = user.displayName;
                    if (!data.photoURL && user.photoURL) updates.photoURL = user.photoURL;

                    if (Object.keys(updates).length > 0) {
                        await updateDoc(userRef, updates);
                    }
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
