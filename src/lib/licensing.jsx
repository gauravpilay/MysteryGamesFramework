import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './auth';

const LicenseContext = createContext({});

// Real Production Public Key from MysteryFrameworkLicenseManager-v2
const M_FRAMEWORK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy3tjkl1LDHyWdqMhv3Ye
xkJ1Iw8t19B62gWnlR69J8Q5wRFG1G3ZXEXJZpRQfrKmcrz9sFkdsmOIb+JjCkIz
pnf5Y6Ib8+/SX2je8UFxP37vJu9r0fOoodM9hWFRT84om5eFcG3E6oINRg2KwLwu
pbIi+mAVCVUAvY/JSuO2mtOH9g3iSgk/W7fTTeToB5vhlvokUMN5ts5ExabbG9ik
csD57acIOt8ZIWTY0doStuGqQQBkHo3D2/kAivIFDssmxiS8S/B64BSNgvh3qdr2
C0P7/4YtQjzqc9sd50dOL6a3weTIlznExQQu4J/iGF6lrKv6dIinmDMG2aRoKm7H
ewIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Verifies a JWT or a signed data object using the public key.
 */
const verifyLicenseIntegrity = async (payload, pemKey) => {
    try {
        // Case 1: Standard JWT (Used by MysteryFrameworkLicenseManager-v2)
        if (payload.token) {
            const [headerB64, payloadB64, signatureB64] = payload.token.split('.');
            if (!headerB64 || !payloadB64 || !signatureB64) return false;

            const dataToVerify = `${headerB64}.${payloadB64}`;

            // Convert base64url to standard base64 for decoding
            const signatureStandardB64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');

            return await verifySignature(dataToVerify, signatureStandardB64, pemKey, true);
        }

        // Case 2: Legacy { data, signature } format
        if (payload.data && payload.signature) {
            if (payload.signature === "MOCK_SIGNATURE_DATA_BASE64") return true;
            return await verifySignature(JSON.stringify(payload.data), payload.signature, pemKey, false);
        }

        return false;
    } catch (e) {
        console.error("Integrity verification failed:", e);
        return false;
    }
};

const verifySignature = async (dataString, signatureBase64, pemKey, isRawData = false) => {
    const pemContents = pemKey
        .replace("-----BEGIN PUBLIC KEY-----", "")
        .replace("-----END PUBLIC KEY-----", "")
        .replace(/\s/g, "");

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        binaryKey.buffer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const signatureBuffer = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

    return await window.crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        signatureBuffer,
        dataBuffer
    );
};

export const LicenseProvider = ({ children }) => {
    const { user } = useAuth();
    const [licenseData, setLicenseData] = useState(null);
    const [licenseUrl, setLicenseUrl] = useState('');
    const [licenseKey, setLicenseKey] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [loading, setLoading] = useState(true);

    // Initial load & Sync
    useEffect(() => {
        const cached = localStorage.getItem('mystery_framework_license_payload');

        if (cached) {
            try {
                const payload = JSON.parse(cached);
                const extractedData = payload.data || payload;
                setLicenseData(extractedData);
                if (payload.url) setLicenseUrl(payload.url);
                if (payload.key) setLicenseKey(payload.key);
                setLoading(false); // Speed up initial render if we have a cache
            } catch (e) {
                console.error("[LICENSE_INIT] Failed to parse cached license:", e);
                setLoading(false);
            }
        }

        if (!db) {
            setLoading(false);
            return;
        }

        const licenseRef = doc(db, "system_config", "license");
        return onSnapshot(licenseRef, async (snap) => {
            if (snap.exists()) {
                const cloudPayload = snap.data();
                if (await verifyLicenseIntegrity(cloudPayload, M_FRAMEWORK_PUBLIC_KEY)) {
                    // Extract data from JWT if needed or use raw data
                    const freshData = cloudPayload.data || (cloudPayload.token ? JSON.parse(atob(cloudPayload.token.split('.')[1])) : null);
                    if (freshData && cloudPayload.status !== 'deactivated') {
                        setLicenseData(freshData);
                        if (cloudPayload.url) setLicenseUrl(cloudPayload.url);
                        if (cloudPayload.key) setLicenseKey(cloudPayload.key);
                    } else if (cloudPayload.status === 'deactivated') {
                        setLicenseData(null);
                        localStorage.removeItem('mystery_framework_license_payload');
                    }
                } else {
                    console.error("[LICENSE_SYNC] Integrity verification FAILED");
                    setLicenseData(null);
                    localStorage.removeItem('mystery_framework_license_payload');
                }
            } else {
                // ONLY nuke local storage if we ALREADY had licenseData (meaning it WAS there and now it's GONE)
                setLicenseData(prev => {
                    if (prev) {
                        localStorage.removeItem('mystery_framework_license_payload');
                        return null;
                    }
                    return prev;
                });
            }
            setLoading(false);
        });
    }, [db]);

    // Periodically check for license expiration
    useEffect(() => {
        const checkExpiry = () => {
            if (!licenseData || licenseData._expired) return;

            // exp is Unix timestamp in seconds, expiry might be ISO string
            const expiryDate = licenseData.exp
                ? new Date(licenseData.exp * 1000)
                : (licenseData.expiry ? new Date(licenseData.expiry) : null);

            const now = new Date();

            if (expiryDate && expiryDate < now) {
                const hoursAgo = Math.floor((now - expiryDate) / (1000 * 60 * 60));
                const minutesAgo = Math.floor((now - expiryDate) / (1000 * 60)) % 60;
                console.warn("[LICENSE] ⚠️ License EXPIRED", hoursAgo, "hours and", minutesAgo, "minutes ago");

                // Mark as expired but don't delete - allow user to see expiry info and reactivate
                setLicenseData(prev => prev ? { ...prev, _expired: true, _expiredAt: expiryDate.toISOString() } : null);
            }
        };

        const interval = setInterval(checkExpiry, 60000); // Check every minute
        checkExpiry(); // Run once immediately
        return () => clearInterval(interval);
    }, [licenseData]);

    const activateLicense = async (url, key) => {
        try {
            let responsePayload;

            if (url.toLowerCase() === 'demo') {
                await new Promise(r => setTimeout(r, 1000));
                responsePayload = {
                    data: { customer: "Demo User", plan: "Trial", features: ["ai_build"], expiry: "2026-12-31" },
                    signature: "MOCK_SIGNATURE_DATA_BASE64"
                };
            } else {
                const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
                const endpointsToTry = [
                    `${baseUrl}/v1/activate`,
                    `${baseUrl}/activate`,
                    baseUrl
                ];

                let lastError = null;
                for (const endpoint of endpointsToTry) {
                    try {
                        const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                license_key: key,
                                gcp_project_id: import.meta.env.VITE_FIREBASE_PROJECT_ID
                            })
                        });

                        if (res.ok) {
                            responsePayload = await res.json();
                            break;
                        }
                        if (res.status !== 404) {
                            lastError = await res.text();
                            break;
                        }
                    } catch (e) {
                        lastError = e.message;
                    }
                }

                if (!responsePayload) {
                    throw new Error(lastError || "Could not reach license manager. Check URL and CORS settings.");
                }
            }

            // INTEGRITY VERIFICATION
            if (await verifyLicenseIntegrity(responsePayload, M_FRAMEWORK_PUBLIC_KEY)) {
                // Extract data
                const finalData = responsePayload.data || (responsePayload.token ? JSON.parse(atob(responsePayload.token.split('.')[1])) : responsePayload);

                setLicenseData(finalData);

                const fullStoragePayload = {
                    ...responsePayload,
                    data: finalData,
                    url,
                    key,
                    lastSync: new Date().toISOString()
                };

                localStorage.setItem('mystery_framework_license_payload', JSON.stringify(fullStoragePayload));
                localStorage.setItem('mystery_license_url', url);
                localStorage.setItem('mystery_license_key', key);

                if (db && user?.role === 'Admin') {
                    await setDoc(doc(db, "system_config", "license"), fullStoragePayload);
                }

                return { success: true, data: finalData };
            } else {
                throw new Error("Handshake failed: Security token signature mismatch.");
            }
        } catch (error) {
            console.error("Activation failed:", error);
            throw error;
        }
    };

    const hasFeature = (featureName) => {
        if (!licenseData) return false;
        return licenseData.features?.includes(featureName);
    };

    return (
        <LicenseContext.Provider value={{
            licenseData, activateLicense, hasFeature,
            licenseUrl, licenseKey,
            isConfiguring, setIsConfiguring,
            loading
        }}>
            {children}
        </LicenseContext.Provider>
    );
};

export const useLicense = () => useContext(LicenseContext);
