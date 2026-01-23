import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './auth';

const ConfigContext = createContext({});

export const ConfigProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [settings, setSettings] = useState({
        aiApiKey: import.meta.env.VITE_AI_API_KEY || '',
        maxAIRequests: parseInt(import.meta.env.VITE_MAX_AI_REQUESTS) || 10,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for authentication to resolve
        if (authLoading) return;

        // If no user is logged in, use defaults (from .env) and stop loading
        if (!user || !db) {
            setLoading(false);
            return;
        }

        const configRef = doc(db, "system_config", "app_settings");

        // Listen to live updates from Firestore
        setLoading(true);
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(prev => ({ ...prev, ...docSnap.data() }));
            } else {
                // If config doesn't exist in DB, seed it from .env if the user is an Admin
                // to prevent non-admins from creating the config doc
                const initialSettings = {
                    aiApiKey: import.meta.env.VITE_AI_API_KEY || '',
                    maxAIRequests: parseInt(import.meta.env.VITE_MAX_AI_REQUESTS) || 10,
                };

                if (user?.role === 'Admin') {
                    setDoc(configRef, initialSettings);
                }
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching system config:", error);
            // On permission error or other failure, stop loading to allow the app to render
            setLoading(false);
        });

        return unsubscribe;
    }, [user, authLoading]);

    const updateSettings = async (newSettings) => {
        if (!db) return;
        const configRef = doc(db, "system_config", "app_settings");
        await setDoc(configRef, newSettings, { merge: true });
    };

    return (
        <ConfigContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
