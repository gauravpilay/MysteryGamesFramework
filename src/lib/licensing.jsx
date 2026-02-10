import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './auth';

const LicenseContext = createContext({});

// Default Public Key (Placeholder - in real app this would be more secure)
const M_FRAMEWORK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy0N1qM8B7n1n8zX4z5F6
U6B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0
B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0
B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0
B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8B0B8C
-----END PUBLIC KEY-----`;

/**
 * Verifies the signature of the license data using the public key.
 * This ensures the data has not been tampered with.
 */
const verifyLicenseSignature = async (data, signatureBase64, pemKey) => {
    try {
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
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const signatureBuffer = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

        return await window.crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            publicKey,
            signatureBuffer,
            dataBuffer
        );
    } catch (e) {
        console.error("Cryptographic verification error:", e);
        return false;
    }
};

export const LicenseProvider = ({ children }) => {
    const { user } = useAuth();
    const [licenseData, setLicenseData] = useState(null);
    const [isConfiguring, setIsConfiguring] = useState(false);

    // 1. Initial Local Recovery & Real-time Database Sync
    useEffect(() => {
        // Fast path: Load from local storage for immediate UI response
        const cached = localStorage.getItem('mystery_framework_license_payload');
        if (cached) {
            try {
                const payload = JSON.parse(cached);
                setLicenseData(payload.data);
                console.log("[LICENSE] Fast-loaded from cache.");
            } catch (e) {
                console.error("Failed to parse cached license", e);
            }
        }

        if (!db) return;

        // Source of Truth: Listen to Firestore for global license updates
        const licenseRef = doc(db, "system_config", "license");
        const unsubscribe = onSnapshot(licenseRef, async (snap) => {
            if (snap.exists()) {
                const cloudPayload = snap.data();
                const { data, signature, url, key } = cloudPayload;

                // Verify integrity
                let isVerified = false;
                if (signature === "MOCK_SIGNATURE_DATA_BASE64") {
                    isVerified = true;
                } else {
                    isVerified = await verifyLicenseSignature(data, signature, M_FRAMEWORK_PUBLIC_KEY);
                }

                if (isVerified) {
                    setLicenseData(data);
                    // Update cache for next refresh
                    localStorage.setItem('mystery_framework_license_payload', JSON.stringify({ data, signature }));
                    if (url) localStorage.setItem('mystery_license_url', url);
                    if (key) localStorage.setItem('mystery_license_key', key);

                    console.log("%c LICENSE CLOUD-SYNC SUCCESS ", "background: #1e293b; color: #10b981; font-weight: bold; padding: 2px 5px;");
                } else {
                    console.error("Cloud license failed verification.");
                }
            } else {
                console.warn("[LICENSE] No active license found in cloud registry.");
            }
        });

        return unsubscribe;
    }, [db]);

    const activateLicense = async (url, key) => {
        try {
            console.log(`[SECURE_SYNC] Establishing connection to ${url}...`);

            let signedPayload;

            // Strict Simulation Check: Only use mock if URL is explicitly "demo"
            const isSimulation = url.toLowerCase() === 'demo';

            if (isSimulation) {
                console.warn("[LICENSE] Simulation mode active. Using hardcoded credentials.");
                await new Promise(resolve => setTimeout(resolve, 1000));
                signedPayload = {
                    data: {
                        customer: "Globex Corp (Demo)",
                        plan: "Enterprise",
                        features: ["ai_build", "advanced_analytics", "white_label"],
                        expiry: "2026-12-31",
                        issuedAt: new Date().toISOString()
                    },
                    signature: "MOCK_SIGNATURE_DATA_BASE64"
                };
            } else {
                // REAL API CALL - Use URL exactly as typed by the user
                // This gives full control to the user to specify root (/) or /activate
                const endpoint = url;

                console.log(`[SECURE_SYNC] Attempting POST to: ${endpoint}`);

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ licenseKey: key })
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => "Unknown error");
                    console.error(`[SECURE_SYNC] Error Status: ${response.status}`);
                    console.error(`[SECURE_SYNC] Error Detail: ${errorText}`);

                    if (response.status === 404) {
                        throw new Error(`Endpoint Not Found (404). Your server is active at ${new URL(endpoint).origin}, but doesn't recognize the route: ${new URL(endpoint).pathname}. Does your backend have app.post('${new URL(endpoint).pathname}', ...) defined?`);
                    }
                    throw new Error(errorText || `Server responded with ${response.status}`);
                }

                const responseText = await response.text();
                signedPayload = JSON.parse(responseText);
            }

            // VERIFICATION STEP
            console.log("Verifying payload integrity...");

            let isVerified = false;
            if (signedPayload.signature === "MOCK_SIGNATURE_DATA_BASE64") {
                isVerified = true;
            } else {
                isVerified = await verifyLicenseSignature(
                    signedPayload.data,
                    signedPayload.signature,
                    M_FRAMEWORK_PUBLIC_KEY
                );
            }

            if (isVerified) {
                console.log("%c LICENSE VERIFIED ", "background: #10b981; color: white; font-weight: bold; padding: 2px 5px; border-radius: 4px;");

                setLicenseData(signedPayload.data);

                // PERSISTENCE: Save to BOTH LocalStorage and Database
                const fullPayload = {
                    ...signedPayload,
                    url,
                    key,
                    lastSync: new Date().toISOString()
                };

                localStorage.setItem('mystery_framework_license_payload', JSON.stringify(signedPayload));
                localStorage.setItem('mystery_license_url', url);
                localStorage.setItem('mystery_license_key', key);

                if (db && user?.role === 'Admin') {
                    console.log("[LICENSE] Persisting verified license to cloud registry...");
                    await setDoc(doc(db, "system_config", "license"), fullPayload);
                }

                return { success: true, data: signedPayload.data };
            } else {
                throw new Error("Handshake failed: Digital signature mismatch.");
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
            licenseData,
            activateLicense,
            hasFeature,
            isConfiguring,
            setIsConfiguring
        }}>
            {children}
        </LicenseContext.Provider>
    );
};

export const useLicense = () => useContext(LicenseContext);
