import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, getDocs, query, limit } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const hasLoadedOnce = React.useRef(false);

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
                        setLoading(false);
                    }, (error) => {
                        console.error("User doc sync error:", error);
                        setUser(u);
                        setLoading(false);
                    });
                } else {
                    setUser(u);
                    setLoading(false);
                }
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    const login = async () => {
        if (isAuthenticating) return;

        if (!auth) {
            alert("Firebase configuration missing. Using Mock Login.");
            setUser({
                displayName: "Detective User",
                email: "detective@agency.com",
                photoURL: "https://ui.shadcn.com/avatars/01.png",
                uid: "mock-uid-123",
                role: "Admin"
            });
            return;
        }

        setIsAuthenticating(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (db) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    let isFirstUser = false;
                    try {
                        // Check if this is the first user - attempt a limited query
                        // This might fail due to security rules (listing users is usually restricted)
                        const usersColl = collection(db, "users");
                        const usersSnap = await getDocs(query(usersColl, limit(1)));
                        isFirstUser = usersSnap.empty;
                    } catch (e) {
                        console.warn("[AUTH] Could not verify if first user due to permissions. Defaulting to 'User' role.");
                        isFirstUser = false;
                    }

                    await setDoc(userRef, {
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        email: user.email,
                        role: isFirstUser ? "Admin" : "User",
                        status: 'active',
                        createdAt: new Date().toISOString()
                    });
                } else {
                    // Update if missing profile info
                    const data = userSnap.data();
                    const updates = {};
                    if (!data.displayName && user.displayName) updates.displayName = user.displayName;
                    if (!data.photoURL && user.photoURL) updates.photoURL = user.photoURL;

                    if (Object.keys(updates).length > 0) {
                        try {
                            await updateDoc(userRef, updates);
                        } catch (e) {
                            console.warn("[AUTH] Failed to update user profile info:", e.message);
                        }
                    }
                }
            }
        } catch (error) {
            // If the error is permission-denied but we ALREADY have result.user (unlikely for catch but possible in some flows)
            // Or if it's just a Firestore error after successful Auth, we might not want to show a scary "Login Failed" alert

            console.error("Auth/Firestore Sync Error:", error);

            if (error.code === 'auth/popup-blocked') {
                alert("The login popup was blocked by your browser. Please allow popups for this site and try again.");
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.warn("Popup request cancelled (possible duplicate call or manual closure)");
            } else if (error.code === 'permission-denied') {
                // Special case: Auth succeeded but Firestore failed
                console.error("Firestore Permission Denied. User authenticated but profile sync failed.");
                // We don't alert here because onAuthStateChanged will still try to pick up the user
            } else if (error.code !== 'auth/popup-closed-by-user') {
                alert(`Login process encountered an issue: ${error.message}`);
            }
        } finally {
            setIsAuthenticating(false);
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
