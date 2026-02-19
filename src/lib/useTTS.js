/**
 * useTTS.js — Mystery Games Framework
 *
 * Human-quality Text-to-Speech using Web Speech API.
 *
 * Key design decisions for naturalness:
 *
 *  1. ONE UTTERANCE for the whole text.
 *     Speaking sentence-by-sentence resets the engine's prosody model each
 *     time, causing robotic pitch resets and unnatural gaps. A single
 *     utterance lets the engine maintain intonation memory across the passage.
 *
 *  2. TEXT PRE-PROCESSING for breath cues.
 *     We add subtle punctuation hints (commas, em-dashes) at natural pause
 *     points so the engine breathes where a human would.
 *
 *  3. MINIMAL PARAMETER OVERRIDES.
 *     Over-tuning pitch/rate fights the engine's built-in prosody and makes
 *     it sound mechanical. We set conservative values and let it do its job.
 *
 *  4. NEURAL VOICE PRIORITY.
 *     Google Neural/Natural voices (shipped in Chrome) and Microsoft Neural
 *     voices (Edge/Windows) sound dramatically better than basic TTS engines.
 *     We rank them first, before Apple premium, then system fallbacks.
 *
 *  5. CHROME 15-SECOND BUG WORKAROUND.
 *     Chrome's SpeechSynthesis silently cuts off utterances longer than ~15s.
 *     We run a keep-alive timer that pauses + resumes every 14 seconds to
 *     prevent the engine from stopping prematurely.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Voice database ────────────────────────────────────────────────────────────

/**
 * For each region × gender, list preferred voice name fragments in priority order.
 * Matching is case-insensitive substring check on voice.name.
 */
const VOICE_PREFS = {
    us: {
        female: [
            // Chrome Neural (best)
            'google us english', 'samantha', 'zira',
            // Microsoft Neural (Edge/Windows)
            'aria', 'jenny', 'michelle', 'monica',
            // Apple (macOS/iOS)
            'allison', 'ava', 'susan', 'victoria',
            // Generic fallbacks
            'female', 'woman',
        ],
        male: [
            'google us english male', 'ryan', 'guy', 'davis',
            'christopher', 'eric', 'roger', 'steffan',
            'alex', 'fred', 'tom', 'david',
            'male', 'man',
        ],
    },
    uk: {
        female: [
            'google uk english female', 'hazel', 'libby', 'mia',
            'sonia', 'susan', 'kate', 'emily',
            'female', 'woman',
        ],
        male: [
            'google uk english male', 'ryan', 'thomas', 'oliver',
            'george', 'daniel', 'abbi',
            'male', 'man',
        ],
    },
    in: {
        female: [
            'google हिन्दी', 'heera', 'swara', 'raveena',
            'neerja', 'kajal', 'aditi', 'priya',
            'google hindi', 'en-in', 'in-female',
            'female', 'woman',
        ],
        male: [
            'rishi', 'kalpana', 'sameer', 'hemant',
            'udayan', 'kabir', 'en-in',
            'male', 'man',
        ],
    },
    au: {
        female: [
            'google australian english', 'karen', 'lee', 'natasha',
            'catherine', 'female', 'woman',
        ],
        male: [
            'google australian english male', 'lee', 'adam',
            'male', 'man',
        ],
    },
};

/** Locale codes to try per region, in priority order. */
const LOCALES = {
    us: ['en-US', 'en'],
    uk: ['en-GB', 'en-AU', 'en'],
    in: ['en-IN', 'hi-IN', 'en-US', 'en'],
    au: ['en-AU', 'en-GB', 'en'],
};

/**
 * Score and rank all available voices, return the best match.
 */
function pickVoice(region = 'us', gender = 'female') {
    if (typeof speechSynthesis === 'undefined') return null;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    const prefs = VOICE_PREFS[region]?.[gender] || VOICE_PREFS.us.female;
    const locales = LOCALES[region] || LOCALES.us;

    const scored = voices.map(v => {
        let score = 0;
        const name = v.name.toLowerCase();
        const lang = (v.lang || '').toLowerCase();

        // Exact preferred-name match (weighted by position in prefs list)
        for (let i = 0; i < prefs.length; i++) {
            if (name.includes(prefs[i].toLowerCase())) {
                score += (prefs.length - i) * 10;
                break;
            }
        }

        // Locale match
        for (let i = 0; i < locales.length; i++) {
            if (lang.startsWith(locales[i].toLowerCase())) {
                score += (locales.length - i) * 6;
                break;
            }
        }

        // Neural / high-quality voice bonus
        if (name.includes('neural') || name.includes('natural')) score += 25;
        if (name.includes('google')) score += 20;
        if (name.includes('microsoft')) score += 18;

        // Apple premium voices (macOS)
        if (['samantha', 'allison', 'ava', 'daniel', 'karen', 'moira', 'tessa'].some(k => name.includes(k))) score += 15;

        // Penalise clearly wrong gender
        const isFemale = ['female', 'woman', 'girl', 'she', 'zira', 'samantha', 'heera',
            'karen', 'aria', 'jenny', 'hazel', 'libby', 'tessa', 'moira',
            'ava', 'swara', 'neerja'].some(k => name.includes(k));
        const isMale = ['male', 'man', 'guy', 'david', 'rishi', 'daniel', 'george',
            'eric', 'roger', 'ryan', 'alex', 'tom', 'fred'].some(k => name.includes(k));
        if (gender === 'female' && isMale && !isFemale) score -= 15;
        if (gender === 'male' && isFemale && !isMale) score -= 15;

        // Prefer network/online voices (usually higher quality)
        if (!v.localService) score += 5;

        return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || null;
}

// ── Text pre-processing ───────────────────────────────────────────────────────

/**
 * Add subtle punctuation cues so the engine breathes naturally.
 * We DON'T rewrite the text, just add commas/dashes where a human would pause.
 */
function addBreathCues(text) {
    return text
        // After conjunction that starts a new idea — add a micro-pause comma
        .replace(/\s+(but|however|although|though|yet|while|whereas|meanwhile)\s+/gi,
            (m, w) => `, ${w} `)
        // Before long subordinate clauses
        .replace(/\s+(because|since|if|unless|until|once|after|before|when|where|which|who)\s+/gi,
            (m, w) => ` ${w} `)
        // Ellipsis → natural long pause
        .replace(/\.\.\./g, '…')
        // Em-dash → short breath pause (already good)
        .replace(/--/g, '—')
        // Double newline → paragraph pause (replace with period + space)
        .replace(/\n\n+/g, '. ')
        // Single newline → brief pause
        .replace(/\n/g, ', ')
        // Remove rich-text markdown ** and []
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\[.*?\](.*?)\[\/.*?\]/g, '$1')
        .trim();
}

// ── Rate / pitch mapping ──────────────────────────────────────────────────────

// Kept deliberately conservative — small nudges, don't fight the engine
const PACE_RATE = {
    slow: 0.82,   // calm, deliberate — audiobook narrator pace
    normal: 0.90,   // slightly under 1.0 → more thoughtful, less machine-like
    fast: 1.05,   // slightly brisk but still natural
};

const TONE_PITCH = {
    low: 0.90,   // warm, deep
    normal: 1.00,   // engine default — usually best
    high: 1.08,   // slightly brighter
};

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useTTS({
    text = '',
    gender = 'female',
    region = 'us',
    pace = 'normal',
    pitch = 'normal',
    autoPlay = false,
    onEnd,
} = {}) {
    const [status, setStatus] = useState('idle');
    const [voiceName, setVoiceName] = useState('');
    const [voicesReady, setVoicesReady] = useState(false);

    const utterRef = useRef(null);
    const keepAliveRef = useRef(null);
    const isMounted = useRef(true);
    const hasAutoPlayed = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // ── Wait for voices (Chrome loads them asynchronously) ────────────────────
    useEffect(() => {
        if (typeof speechSynthesis === 'undefined') return;
        const onReady = () => setVoicesReady(true);
        if (speechSynthesis.getVoices().length > 0) {
            onReady();
        } else {
            speechSynthesis.addEventListener('voiceschanged', onReady);
            return () => speechSynthesis.removeEventListener('voiceschanged', onReady);
        }
    }, []);

    // ── Chrome 15-second keep-alive ───────────────────────────────────────────
    const startKeepAlive = useCallback(() => {
        stopKeepAlive();
        // Chrome silently kills utterances after ~14–15 s.
        // Pause + instant resume tricks it into resetting the timer.
        keepAliveRef.current = setInterval(() => {
            if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking && !speechSynthesis.paused) {
                speechSynthesis.pause();
                setTimeout(() => {
                    if (typeof speechSynthesis !== 'undefined') speechSynthesis.resume();
                }, 50);
            }
        }, 12000);
    }, []);

    const stopKeepAlive = useCallback(() => {
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
        }
    }, []);

    // ── Core speak ────────────────────────────────────────────────────────────
    const speak = useCallback(() => {
        if (typeof speechSynthesis === 'undefined' || !text) return;

        speechSynthesis.cancel();

        const processedText = addBreathCues(text);
        const utter = new SpeechSynthesisUtterance(processedText);

        // Conservative params — let the engine handle prosody
        utter.rate = PACE_RATE[pace] ?? 0.90;
        utter.pitch = TONE_PITCH[pitch] ?? 1.00;
        utter.volume = 1.0;

        const voice = pickVoice(region, gender);
        if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
            setVoiceName(voice.name);
        } else {
            // Let browser pick — don't force a lang that might trigger a worse engine
            setVoiceName('System Voice');
        }

        utter.onstart = () => {
            if (!isMounted.current) return;
            setStatus('playing');
            startKeepAlive();
        };

        utter.onend = () => {
            if (!isMounted.current) return;
            stopKeepAlive();
            setStatus('done');
            if (onEnd) onEnd();
        };

        utter.onerror = (e) => {
            stopKeepAlive();
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            console.warn('[TTS] Speech error:', e.error);
            if (isMounted.current) setStatus('idle');
        };

        utterRef.current = utter;
        speechSynthesis.speak(utter);
        // Chrome sometimes needs speak() called after a tiny delay on first use
    }, [text, gender, region, pace, pitch, onEnd, startKeepAlive, stopKeepAlive]);

    // ── Public controls ───────────────────────────────────────────────────────
    const play = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;

        if (status === 'paused') {
            speechSynthesis.resume();
            setStatus('playing');
            startKeepAlive();
            return;
        }

        // Fresh play (idle / done)
        setStatus('playing');
        // Very small delay improves reliability in Chrome on first load
        setTimeout(() => speak(), 80);
    }, [status, speak, startKeepAlive]);

    const pause = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        stopKeepAlive();
        speechSynthesis.pause();
        setStatus('paused');
    }, [stopKeepAlive]);

    const stop = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        stopKeepAlive();
        speechSynthesis.cancel();
        setStatus('idle');
    }, [stopKeepAlive]);

    // ── Auto-play ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoPlay || !voicesReady || !text || hasAutoPlayed.current) return;
        hasAutoPlayed.current = true;
        // Delay to let page settle (typewriter starts, etc.)
        const t = setTimeout(() => {
            if (isMounted.current) speak();
        }, 800);
        return () => clearTimeout(t);
    }, [autoPlay, voicesReady, text, speak]);

    // ── Reset when text changes ───────────────────────────────────────────────
    useEffect(() => {
        hasAutoPlayed.current = false;
        if (typeof speechSynthesis !== 'undefined') {
            speechSynthesis.cancel();
            stopKeepAlive();
        }
        setStatus('idle');
    }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopKeepAlive();
            if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        play,
        pause,
        stop,
        status,       // 'idle' | 'playing' | 'paused' | 'done'
        voiceName,    // actual system voice name for display
        voicesReady,
    };
}
