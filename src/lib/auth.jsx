import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, getDocs, query, limit } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const syncUserToFirestore = async (user, isNewUser = false) => {
        if (!db) return;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // Check license limit if it's a new user
        if (!userSnap.exists()) {
            try {
                const licenseRef = doc(db, "system_config", "license");
                const licenseSnap = await getDoc(licenseRef);

                let allowedUsers = Infinity;
                if (licenseSnap.exists()) {
                    const licData = licenseSnap.data();
                    const data = licData.data || licData;

                    allowedUsers = data.number_of_users_allowed ||
                        (data.features && data.features.number_of_users_allowed) ||
                        Infinity;

                    if (Array.isArray(data.features)) {
                        const quantified = data.features.find(f =>
                            typeof f === 'string' && (f.startsWith('number_of_users_allowed:') || f.startsWith('number_of_users_allowed='))
                        );
                        if (quantified) {
                            const val = quantified.split(/[:=]/)[1];
                            const num = parseInt(val);
                            if (!isNaN(num)) allowedUsers = num;
                        }
                    }
                }

                if (allowedUsers !== Infinity) {
                    const usersColl = collection(db, "users");
                    const usersSnap = await getDocs(usersColl);
                    const currentCount = usersSnap.size;

                    if (currentCount >= allowedUsers) {
                        await signOut(auth);
                        throw new Error("Allowed user quota exhausted.");
                    }
                }
            } catch (e) {
                console.warn("[AUTH] License check failed or skipped.", e.message);
                if (e.message === "Allowed user quota exhausted.") throw e;
            }
        }

        if (!userSnap.exists()) {
            let isFirstUser = false;
            try {
                const usersColl = collection(db, "users");
                const usersSnap = await getDocs(query(usersColl, limit(1)));
                isFirstUser = usersSnap.empty;
            } catch (e) {
                console.warn("[AUTH] Could not verify if first user due to permissions.");
                isFirstUser = false;
            }

            await setDoc(userRef, {
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`,
                email: user.email,
                role: isFirstUser ? "Admin" : "User",
                status: isFirstUser ? 'active' : 'deactivated',
                createdAt: new Date().toISOString()
            });
        } else {
            const data = userSnap.data();
            const updates = {};
            if (!data.displayName && user.displayName) updates.displayName = user.displayName;
            if (!data.photoURL && user.photoURL) updates.photoURL = user.photoURL;

            if (Object.keys(updates).length > 0) {
                await updateDoc(userRef, updates);
            }
        }
    };

    const login = async () => {
        if (isAuthenticating) return;
        if (!auth) {
            setError("Firebase configuration missing. Using Mock Login.");
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
            await syncUserToFirestore(result.user);
        } catch (error) {
            console.error("Auth/Firestore Sync Error:", error);
            if (error.code === 'auth/popup-blocked') {
                setError("The login popup was blocked by your browser.");
            } else if (error.message === "Allowed user quota exhausted.") {
                setError(error.message);
            } else if (error.code !== 'auth/popup-closed-by-user') {
                setError(`Login issue: ${error.message}`);
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    const signUpWithEmail = async (email, password, displayName) => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        setError(null);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName) {
                await updateProfile(result.user, { displayName });
            }
            await syncUserToFirestore({ ...result.user, displayName }, true);
        } catch (error) {
            console.error("Signup Error:", error);
            setError(error.message);
            throw error;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const loginWithEmail = async (email, password) => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        setError(null);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await syncUserToFirestore(result.user);
        } catch (error) {
            console.error("Login Error:", error);
            setError(error.message);
            throw error;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const resetPassword = async (email) => {
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Reset Password Error:", error);
            setError(error.message);
            throw error;
        }
    };

    const logout = async () => {
        if (!auth) {
            setUser(null);
            return;
        }
        await signOut(auth);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            error,
            setError,
            signUpWithEmail,
            loginWithEmail,
            resetPassword,
            isAuthenticating
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
