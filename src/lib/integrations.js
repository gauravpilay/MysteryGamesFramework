/**
 * integrations.js
 * Handles outbound communications to external systems (LMS, Webhooks, etc.)
 */

export const triggerWebhook = async (webhook, data) => {
    if (!webhook || !webhook.url || !webhook.enabled) return null;

    console.log(`[INTEGRATION] Triggering hook: ${webhook.name} -> ${webhook.url}`);

    try {
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(webhook.secret && { 'X-Hook-Secret': webhook.secret }),
                ...(webhook.headers || {})
            },
            body: JSON.stringify({
                event: 'game_completed',
                timestamp: new Date().toISOString(),
                ...data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`[INTEGRATION] Hook success:`, result);
        return { success: true, result };
    } catch (error) {
        console.error(`[INTEGRATION] Hook failed:`, error);
        return { success: false, error: error.message };
    }
};

export const triggerAllHooks = async (hooks, event, data) => {
    if (!hooks || !Array.isArray(hooks)) return [];

    const activeHooks = hooks.filter(h => h.enabled && (h.events || ['game_completed']).includes(event));

    return Promise.all(activeHooks.map(h => triggerWebhook(h, data)));
};
