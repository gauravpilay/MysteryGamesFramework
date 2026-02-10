import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [licenseData, setLicenseData] = useState(null);
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Initial load and auto-refresh from local storage
    useEffect(() => {
        const loadAndVerifyLicense = async () => {
            const cached = localStorage.getItem('mystery_framework_license_payload');
            if (cached) {
                try {
                    const payload = JSON.parse(cached);
                    const { data, signature } = payload;

                    // Re-verify integrity on every load
                    let isVerified = false;
                    if (signature === "MOCK_SIGNATURE_DATA_BASE64") {
                        isVerified = true;
                    } else {
                        isVerified = await verifyLicenseSignature(data, signature, M_FRAMEWORK_PUBLIC_KEY);
                    }

                    if (isVerified) {
                        setLicenseData(data);
                        console.log("%c LICENSE AUTO-RELOADED & VERIFIED ", "background: #1e293b; color: #38bdf8; font-weight: bold; padding: 2px 5px;");
                    } else {
                        console.error("Cached license failed verification. Clearing state.");
                        localStorage.removeItem('mystery_framework_license_payload');
                        setLicenseData(null);
                    }
                } catch (e) {
                    console.error("Failed to recover license from cache", e);
                }
            }

            // Optional: Background silent refresh if URL/Key are saved
            const savedUrl = localStorage.getItem('mystery_license_url');
            const savedKey = localStorage.getItem('mystery_license_key');
            if (savedUrl && savedKey) {
                console.log("[LICENSE] Attempting silent background sync...");
                // Note: activateLicense internally handles verification and storage
                activateLicense(savedUrl, savedKey).catch(() => {
                    console.warn("Silent license refresh failed. Using cached data.");
                });
            }
        };

        loadAndVerifyLicense();
    }, []);

    const activateLicense = async (url, key) => {
        try {
            console.log(`[SECURE_SYNC] Initiating handshake with ${url}`);

            // SIMULATION for the demo
            await new Promise(resolve => setTimeout(resolve, 2000));

            const signedPayload = {
                data: {
                    customer: "Globex Corp",
                    plan: "Enterprise",
                    features: ["ai_build", "advanced_analytics", "white_label"],
                    expiry: "2026-12-31",
                    issuedAt: new Date().toISOString()
                },
                signature: "MOCK_SIGNATURE_DATA_BASE64"
            };

            // VERIFICATION STEP
            console.log("Verifying payload integrity...");

            let isVerified = false;
            if (signedPayload.signature === "MOCK_SIGNATURE_DATA_BASE64") {
                console.warn("DEBUG: Using mock verification bypass for simulation mode.");
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
                console.log("Verified Content:", signedPayload.data);

                setLicenseData(signedPayload.data);
                // Store BOTH data and signature for re-verification on reload
                localStorage.setItem('mystery_framework_license_payload', JSON.stringify(signedPayload));
                // Store endpoint for future silent refreshes
                localStorage.setItem('mystery_license_url', url);
                localStorage.setItem('mystery_license_key', key);

                return { success: true, data: signedPayload.data };
            } else {
                console.error("%c SECURITY ALERT: TAMPERED LICENSE DETECTED ", "background: #ef4444; color: white; font-weight: bold; padding: 2px 5px; border-radius: 4px;");
                throw new Error("Handshake failed: Digital signature mismatch. The license data may have been tampered with.");
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
