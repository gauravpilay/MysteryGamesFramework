/**
 * AI Service for Mystery Game Framework
 * Supports Google Gemini and OpenAI ChatGPT
 */

export const callAI = async (provider, systemPrompt, userMessage, apiKey) => {
    // If no API key is provided, use a local simulation mode
    if (!apiKey || apiKey === 'SIMULATION_MODE') {
        return simulateResponse(systemPrompt, userMessage);
    }

    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `SYSTEM CONTEXT: ${systemPrompt}\n\nUSER QUESTION: ${userMessage}` }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
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
