/**
 * AI Service for Mystery Game Framework
 * Supports Google Gemini and OpenAI ChatGPT
 */

export const callAI = async (provider, systemPrompt, userMessage, apiKey, imageData = null) => {
    // If no API key is provided, use a local simulation mode
    if (!apiKey || apiKey === 'SIMULATION_MODE') {
        return simulateResponse(systemPrompt, userMessage);
    }

    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const parts = [
            { text: `SYSTEM CONTEXT: ${systemPrompt}\n\nUSER QUESTION: ${userMessage}` }
        ];

        if (imageData) {
            // Split base64 to remove data:image/png;base64, prefix if present
            const base64Data = imageData.split(',')[1] || imageData;
            parts.push({
                inline_data: {
                    mime_type: "image/png",
                    data: base64Data
                }
            });
        }

        const body = {
            contents: [{ role: 'user', parts }],
            generationConfig: {
                temperature: 0.1, // Lower temperature for more structured JSON output
                maxOutputTokens: 4000,
                response_mime_type: "application/json" // Force JSON if possible
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Gemini API Error");
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            if (data.promptFeedback?.blockReason) {
                return `[AI Blocked: ${data.promptFeedback.blockReason}] The suspect refused to answer that question.`;
            }
            return "The suspect remains silent...";
        }

        return data.candidates[0].content.parts[0].text;

    } else if (provider === 'openai') {
        const url = "https://api.openai.com/v1/chat/completions";
        const body = {
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 500
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "OpenAI API Error");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    throw new Error("Unsupported AI Provider selected.");
};

/**
 * Local Simulation Mode
 * Provides basic responses based on keywords in the persona prompt
 */
const simulateResponse = (prompt, message) => {
    const msg = message.toLowerCase();

    // Support for 3D Floor Plan Simulation
    if (prompt.includes("3D Floor Plan Parser") || message.includes("floor plan")) {
        return JSON.stringify({
            rooms: [
                {
                    name: "Main Hallway",
                    color: "#2c3e50",
                    center: { x: 0, z: 0 },
                    walls: [
                        { x1: -5, z1: -5, x2: 5, z2: -5 },
                        { x1: 5, z1: -5, x2: 5, z2: 5 },
                        { x1: 5, z1: 5, x2: -5, z2: 5 },
                        { x1: -5, z1: 5, x2: -5, z2: -5 }
                    ],
                    doors: [
                        { x1: 5, z1: -1, x2: 5, z2: 1 }
                    ],
                    furniture: [
                        { type: "desk", position: { x: 0, z: -3 }, rotation: 0 },
                        { type: "chair", position: { x: 0, z: -2.2 }, rotation: Math.PI },
                        { type: "cabinet", position: { x: -4, z: 0 }, rotation: Math.PI / 2 },
                        { type: "lamp", position: { x: -4.5, z: -4.5 }, rotation: 0 },
                        { type: "plant", position: { x: 4.5, z: 4.5 }, rotation: 0 }
                    ],
                    people: [
                        { name: "John Doe", role: "Witness", position: { x: 2, z: 2 }, rotation: Math.PI / 4, description: "Standing nervously by the corner." }
                    ]
                },
                {
                    name: "Evidence Vault",
                    color: "#c0392b",
                    center: { x: 10, z: 0 },
                    walls: [
                        { x1: 5, z1: -4, x2: 15, z2: -4 },
                        { x1: 15, z1: -4, x2: 15, z2: 4 },
                        { x1: 15, z1: 4, x2: 5, z2: 4 }
                    ],
                    doors: [
                        { x1: 5, z1: -1, x2: 5, z2: 1 }
                    ],
                    furniture: [
                        { type: "box", position: { x: 10, z: 0 }, rotation: 0 },
                        { type: "cabinet", position: { x: 14, z: -3 }, rotation: 0 },
                        { type: "monitor", position: { x: 13, z: 2 }, rotation: -Math.PI / 2 }
                    ],
                    people: [
                        { name: "Agent Smith", role: "Staff", position: { x: 12, z: 0 }, rotation: 0, description: "Guarding the vault." }
                    ]
                }
            ]
        });
    }

    // Support for AI Case Generator Simulation
    if (systemPrompt.includes("Mystery Architect AI")) {
        return JSON.stringify({
            nodes: [
                {
                    id: "node-1",
                    type: "story",
                    position: { x: 0, y: 0 },
                    data: {
                        label: "The Beginning",
                        text: "You arrive at the scene of the crime. The air is thick with tension.",
                        actions: [
                            { id: "act-1", label: "Talk to Witness", variant: "primary" },
                            { id: "act-2", label: "Inspect the Safe", variant: "success" }
                        ]
                    }
                },
                {
                    id: "node-2",
                    type: "suspect",
                    position: { x: 400, y: -150 },
                    data: { label: "Chief Engineer", name: "Dr. Aris", role: "Maintenance Lead", alibi: "I was in the server room." }
                },
                {
                    id: "node-3",
                    type: "evidence",
                    position: { x: 400, y: 150 },
                    data: { label: "Safe Contents", description: "The safe is empty, but there is a strange residue on the dial.", variableId: "has_residue" }
                },
                {
                    id: "node-4",
                    type: "logic",
                    position: { x: 800, y: 0 },
                    data: { label: "Check Evidence", variable: "has_residue", operator: "==", value: "true", logicType: "if" }
                },
                {
                    id: "node-5",
                    type: "identify",
                    position: { x: 1200, y: 0 },
                    data: {
                        label: "Solve the Case",
                        culpritName: "Dr. Aris",
                        reasoning: "The chemical residue found on the safe matches the lubricant used only by the maintenance team lead."
                    }
                }
            ],
            edges: [
                { id: "e1-2", source: "node-1", target: "node-2", sourceHandle: "act-1" },
                { id: "e1-3", source: "node-1", target: "node-3", sourceHandle: "act-2" },
                { id: "e3-4", source: "node-3", target: "node-4" },
                { id: "e4-5", source: "node-4", target: "node-5", sourceHandle: "true" }
            ]
        });
    }

    // Basic common questions
    if (msg.includes("hello") || msg.includes("hi")) return "Hello. I'm busy, so make it quick.";
    if (msg.includes("who are you") || msg.includes("name")) {
        const nameMatch = prompt.match(/persona:\s*([^,.\n]+)/i);
        return nameMatch ? `My name is ${nameMatch[1].trim()}.` : "I am who I am.";
    }
    if (msg.includes("where") && (msg.includes("last night") || msg.includes("alibi"))) {
        const alibiMatch = prompt.match(/alibi:\s*([^,.\n]+)/i);
        return alibiMatch ? `I was ${alibiMatch[1].trim()}.` : "I was at home. Alone.";
    }
    if (msg.includes("liar") || msg.includes("lying")) return "You have no proof of that!";
    if (msg.includes("guilty") || msg.includes("kill") || msg.includes("murder")) return "I had nothing to do with that! Check my alibi.";
    if (msg.includes("secret") || msg.includes("hiding")) return "I don't know what you're talking about.";

    // Attempt to find any word from the prompt that matches the query for a "hint"
    const keywords = ["garden", "shed", "key", "safe", "money", "knife", "gun", "letter"];
    for (const word of keywords) {
        if (msg.includes(word) && prompt.toLowerCase().includes(word)) {
            return `You're asking about the ${word}? I... I don't have many details on that.`;
        }
    }

    return "[SIMULATION MODE] My character doesn't have a specific response for that, but I'm listening. (Developer: Add a real API Key for dynamic AI dialogue)";
};
