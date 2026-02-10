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

export const LicenseProvider = ({ children }) => {
    const [licenseData, setLicenseData] = useState(null);
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Initial load from local storage if available (for persistence across refreshes)
    useEffect(() => {
        const cached = localStorage.getItem('mystery_framework_license');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setLicenseData(parsed);
                console.log("License restored from cache:", parsed);
            } catch (e) {
                console.error("Failed to parse cached license", e);
            }
        }
    }, []);

    const activateLicense = async (url, key) => {
        try {
            console.log(`Contacting License Manager at: ${url} with key: ${key}`);

            // In a real scenario, this would be a fetch call:
            // const response = await fetch(`${url}/activate`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ licenseKey: key })
            // });
            // const encryptedData = await response.json();

            // SIMULATION for the demo
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mocking the "encrypted" signed JSON response
            const mockSignedJson = {
                data: {
                    customer: "Globex Corp",
                    plan: "Enterprise",
                    features: ["ai_build", "advanced_analytics", "white_label", "multi_user"],
                    expiry: "2026-12-31",
                    issuedAt: new Date().toISOString()
                },
                signature: "SIGNATURE_OF_DATA"
            };

            // Verification logic (simplified simulation for now)
            // In reality, use window.crypto.subtle or a library to verify the signature
            console.log("Verifying signature with public key...");
            const isVerified = true; // Assume verification succeeds for this demo

            if (isVerified) {
                console.log("License verified successfully! Received JSON:", mockSignedJson.data);
                setLicenseData(mockSignedJson.data);
                localStorage.setItem('mystery_framework_license', JSON.stringify(mockSignedJson.data));
                return { success: true, data: mockSignedJson.data };
            } else {
                throw new Error("Signature verification failed. Data may have been tampered with.");
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
