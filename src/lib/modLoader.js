import { db } from './firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * ModLoader - Handles loading and integrating mods into the game
 */
class ModLoader {
    constructor() {
        this.loadedMods = new Map();
        this.activeTheme = null;
        this.activePlugins = [];
    }

    /**
     * Load a case mod and return the case data
     */
    async loadCaseMod(modId) {
        try {
            // Get mod from Firebase
            const modDoc = await getDoc(doc(db, 'marketplace_mods', modId));
            if (!modDoc.exists()) {
                throw new Error('Mod not found');
            }

            const mod = { id: modDoc.id, ...modDoc.data() };

            // Validate it's a case mod
            if (mod.type !== 'case') {
                throw new Error('Not a case mod');
            }

            // Increment view count
            await updateDoc(doc(db, 'marketplace_mods', modId), {
                views: increment(1)
            });

            // Parse case data
            const caseData = this.parseCaseData(mod);

            // Cache the loaded mod
            this.loadedMods.set(modId, caseData);

            return caseData;
        } catch (error) {
            console.error('Error loading case mod:', error);
            throw error;
        }
    }

    /**
     * Parse case data from mod
     */
    parseCaseData(mod) {
        // If mod has a packageUrl, it would download and parse the file
        // For now, we'll use the metadata to create a basic case structure
        return {
            id: mod.id,
            title: mod.title,
            description: mod.description,
            author: mod.author,
            version: mod.version,
            thumbnailUrl: mod.thumbnailUrl,
            // Case-specific data would come from uploaded files
            nodes: mod.caseData?.nodes || [],
            edges: mod.caseData?.edges || [],
            suspects: mod.caseData?.suspects || [],
            evidence: mod.caseData?.evidence || [],
            settings: mod.caseData?.settings || {}
        };
    }

    /**
     * Load character mod and return characters
     */
    async loadCharacterMod(modId) {
        try {
            const modDoc = await getDoc(doc(db, 'marketplace_mods', modId));
            if (!modDoc.exists()) {
                throw new Error('Mod not found');
            }

            const mod = { id: modDoc.id, ...modDoc.data() };

            if (mod.type !== 'character') {
                throw new Error('Not a character mod');
            }

            // Increment view count
            await updateDoc(doc(db, 'marketplace_mods', modId), {
                views: increment(1)
            });

            // Parse character data
            const characters = mod.characterData?.characters || [];

            this.loadedMods.set(modId, characters);

            return characters;
        } catch (error) {
            console.error('Error loading character mod:', error);
            throw error;
        }
    }

    /**
     * Load and apply theme mod
     */
    async loadThemeMod(modId) {
        try {
            const modDoc = await getDoc(doc(db, 'marketplace_mods', modId));
            if (!modDoc.exists()) {
                throw new Error('Mod not found');
            }

            const mod = { id: modDoc.id, ...modDoc.data() };

            if (mod.type !== 'theme') {
                throw new Error('Not a theme mod');
            }

            // Remove previous theme if any
            if (this.activeTheme) {
                this.unloadTheme(this.activeTheme);
            }

            // Apply new theme
            this.applyTheme(mod);
            this.activeTheme = modId;

            // Save preference
            localStorage.setItem('activeTheme', modId);

            // Increment view count
            await updateDoc(doc(db, 'marketplace_mods', modId), {
                views: increment(1)
            });

            return mod;
        } catch (error) {
            console.error('Error loading theme mod:', error);
            throw error;
        }
    }

    /**
     * Apply theme styles
     */
    applyTheme(mod) {
        const themeId = `mod-theme-${mod.id}`;

        // Remove existing theme style element
        const existingStyle = document.getElementById(themeId);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Create new style element
        const styleElement = document.createElement('style');
        styleElement.id = themeId;

        // Apply theme CSS
        if (mod.themeData?.css) {
            styleElement.innerHTML = mod.themeData.css;
        } else {
            // Generate basic theme from color scheme
            styleElement.innerHTML = this.generateThemeCSS(mod.themeData || {});
        }

        document.head.appendChild(styleElement);
    }

    /**
     * Generate CSS from theme data
     */
    generateThemeCSS(themeData) {
        const {
            primaryColor = '#6366f1',
            secondaryColor = '#8b5cf6',
            backgroundColor = '#000000',
            textColor = '#ffffff',
            accentColor = '#10b981'
        } = themeData;

        return `
            :root {
                --theme-primary: ${primaryColor};
                --theme-secondary: ${secondaryColor};
                --theme-background: ${backgroundColor};
                --theme-text: ${textColor};
                --theme-accent: ${accentColor};
            }
            
            .theme-bg-primary { background-color: ${primaryColor} !important; }
            .theme-bg-secondary { background-color: ${secondaryColor} !important; }
            .theme-text-primary { color: ${primaryColor} !important; }
            .theme-text-secondary { color: ${secondaryColor} !important; }
        `;
    }

    /**
     * Unload theme
     */
    unloadTheme(modId) {
        const themeId = `mod-theme-${modId}`;
        const styleElement = document.getElementById(themeId);
        if (styleElement) {
            styleElement.remove();
        }
    }

    /**
     * Load and activate plugin mod
     */
    async loadPluginMod(modId) {
        try {
            const modDoc = await getDoc(doc(db, 'marketplace_mods', modId));
            if (!modDoc.exists()) {
                throw new Error('Mod not found');
            }

            const mod = { id: modDoc.id, ...modDoc.data() };

            if (mod.type !== 'plugin') {
                throw new Error('Not a plugin mod');
            }

            // Load plugin functionality
            const plugin = this.initializePlugin(mod);
            this.activePlugins.push({ id: modId, plugin });

            // Save to active plugins
            const activePlugins = JSON.parse(localStorage.getItem('activePlugins') || '[]');
            if (!activePlugins.includes(modId)) {
                activePlugins.push(modId);
                localStorage.setItem('activePlugins', JSON.stringify(activePlugins));
            }

            // Increment view count
            await updateDoc(doc(db, 'marketplace_mods', modId), {
                views: increment(1)
            });

            return plugin;
        } catch (error) {
            console.error('Error loading plugin mod:', error);
            throw error;
        }
    }

    /**
     * Initialize plugin
     */
    initializePlugin(mod) {
        const plugin = {
            id: mod.id,
            name: mod.title,
            version: mod.version,
            config: mod.pluginData?.config || {},
            hooks: mod.pluginData?.hooks || {},

            // Plugin API
            onLoad: () => {
                console.log(`Plugin ${mod.title} loaded`);
                if (mod.pluginData?.onLoad) {
                    // Execute plugin load function
                    try {
                        // In production, this would be sandboxed
                        eval(mod.pluginData.onLoad);
                    } catch (error) {
                        console.error('Plugin load error:', error);
                    }
                }
            },

            onUnload: () => {
                console.log(`Plugin ${mod.title} unloaded`);
                if (mod.pluginData?.onUnload) {
                    try {
                        eval(mod.pluginData.onUnload);
                    } catch (error) {
                        console.error('Plugin unload error:', error);
                    }
                }
            }
        };

        // Execute onLoad
        plugin.onLoad();

        return plugin;
    }

    /**
     * Get all installed mods of a specific type
     */
    async getInstalledMods(type = null) {
        const installedIds = JSON.parse(localStorage.getItem('installedMods') || '[]');
        const mods = [];

        for (const modId of installedIds) {
            try {
                const modDoc = await getDoc(doc(db, 'marketplace_mods', modId));
                if (modDoc.exists()) {
                    const mod = { id: modDoc.id, ...modDoc.data() };
                    if (!type || mod.type === type) {
                        mods.push(mod);
                    }
                }
            } catch (error) {
                console.error(`Error loading mod ${modId}:`, error);
            }
        }

        return mods;
    }

    /**
     * Get purchased mods for a user
     */
    async getPurchasedMods(userId) {
        const purchases = JSON.parse(localStorage.getItem(`purchases_${userId}`) || '[]');
        return purchases;
    }

    /**
     * Check if user has purchased a mod
     */
    hasPurchased(modId, userId) {
        const purchases = JSON.parse(localStorage.getItem(`purchases_${userId}`) || '[]');
        return purchases.includes(modId);
    }

    /**
     * Record a purchase
     */
    recordPurchase(modId, userId, price) {
        const purchases = JSON.parse(localStorage.getItem(`purchases_${userId}`) || '[]');
        if (!purchases.includes(modId)) {
            purchases.push(modId);
            localStorage.setItem(`purchases_${userId}`, JSON.stringify(purchases));
        }

        // Also add to installed mods
        const installed = JSON.parse(localStorage.getItem('installedMods') || '[]');
        if (!installed.includes(modId)) {
            installed.push(modId);
            localStorage.setItem('installedMods', JSON.stringify(installed));
        }

        // Record purchase transaction
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.push({
            modId,
            userId,
            price,
            date: new Date().toISOString(),
            status: 'completed'
        });
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    /**
     * Unload all mods
     */
    unloadAll() {
        // Unload theme
        if (this.activeTheme) {
            this.unloadTheme(this.activeTheme);
            this.activeTheme = null;
        }

        // Unload plugins
        this.activePlugins.forEach(({ plugin }) => {
            if (plugin.onUnload) {
                plugin.onUnload();
            }
        });
        this.activePlugins = [];

        // Clear cache
        this.loadedMods.clear();
    }
}

// Export singleton instance
export const modLoader = new ModLoader();
export default ModLoader;
