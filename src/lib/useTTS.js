/**
 * useTTS.js — Mystery Games Framework
 *
 * Human-quality Text-to-Speech using Web Speech API.
 *
 * HIGHLIGHTING STRATEGY:
 *   Chrome's Google voices do NOT fire word-boundary events.
 *   We use a timer-based word advancement as the primary mechanism,
 *   and onboundary events only as a sync/correction signal when they DO fire.
 *
 *   Average speaking rate at rate=1.0 ≈ 2.3 words/second.
 *   We calculate msPerWord from the rate setting and advance a counter.
 *
 * OTHER FEATURES:
 *   - Neural voice priority (Google → Microsoft → Apple → system)
 *   - Single utterance for natural prosody
 *   - Text pre-processing for breath cues
 *   - Chrome 15-second keep-alive workaround
 *   - Immediate cancel on text change (node navigation)
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Voice database ────────────────────────────────────────────────────────────

const VOICE_PREFS = {
    us: {
        female: ['google us english', 'samantha', 'zira', 'aria', 'jenny',
            'michelle', 'monica', 'allison', 'ava', 'victoria', 'female', 'woman'],
        male: ['google us english male', 'ryan', 'guy', 'davis', 'christopher',
            'eric', 'roger', 'alex', 'fred', 'tom', 'david', 'male', 'man'],
    },
    uk: {
        female: ['google uk english female', 'hazel', 'libby', 'mia', 'sonia',
            'kate', 'emily', 'female', 'woman'],
        male: ['google uk english male', 'ryan', 'thomas', 'oliver', 'george',
            'daniel', 'male', 'man'],
    },
    in: {
        female: ['google हिन्दी', 'heera', 'swara', 'raveena', 'neerja',
            'aditi', 'priya', 'female', 'woman'],
        male: ['rishi', 'sameer', 'hemant', 'udayan', 'kabir', 'male', 'man'],
    },
    au: {
        female: ['google australian english', 'karen', 'natasha', 'catherine', 'female', 'woman'],
        male: ['google australian english male', 'lee', 'adam', 'male', 'man'],
    },
};

const LOCALES = {
    us: ['en-US', 'en'],
    uk: ['en-GB', 'en-AU', 'en'],
    in: ['en-IN', 'hi-IN', 'en-US', 'en'],
    au: ['en-AU', 'en-GB', 'en'],
};

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

        for (let i = 0; i < prefs.length; i++) {
            if (name.includes(prefs[i].toLowerCase())) { score += (prefs.length - i) * 10; break; }
        }
        for (let i = 0; i < locales.length; i++) {
            if (lang.startsWith(locales[i].toLowerCase())) { score += (locales.length - i) * 6; break; }
        }

        if (name.includes('neural') || name.includes('natural')) score += 25;
        if (name.includes('google')) score += 20;
        if (name.includes('microsoft')) score += 18;
        if (['samantha', 'allison', 'ava', 'daniel', 'karen', 'moira', 'tessa'].some(k => name.includes(k))) score += 15;

        const isFemale = ['female', 'woman', 'zira', 'samantha', 'heera', 'karen', 'aria',
            'jenny', 'hazel', 'libby', 'tessa', 'moira', 'ava', 'swara'].some(k => name.includes(k));
        const isMale = ['male', 'man', 'david', 'rishi', 'daniel', 'george',
            'eric', 'roger', 'ryan', 'alex', 'tom', 'fred'].some(k => name.includes(k));
        if (gender === 'female' && isMale && !isFemale) score -= 15;
        if (gender === 'male' && isFemale && !isMale) score -= 15;
        if (!v.localService) score += 5;

        return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || null;
}

// ── Text pre-processing ───────────────────────────────────────────────────────

function addBreathCues(text) {
    return text
        .replace(/\s+(but|however|although|though|yet|while|whereas|meanwhile)\s+/gi, (m, w) => `, ${w} `)
        .replace(/\.\.\./g, '…')
        .replace(/--/g, '—')
        .replace(/\n\n+/g, '. ')
        .replace(/\n/g, ', ')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\[.*?\](.*?)\[\/.*?\]/g, '$1')
        .trim();
}

// ── Rate / pitch mapping ──────────────────────────────────────────────────────

const PACE_RATE = { slow: 0.82, normal: 0.90, fast: 1.05 };
const TONE_PITCH = { low: 0.90, normal: 1.00, high: 1.08 };

// Words per second at speech rate 1.0. Measured empirically on common voices.
const WPS_AT_RATE_1 = 2.3;

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
    const [wordIndex, setWordIndex] = useState(-1);
    const [voiceName, setVoiceName] = useState('');
    const [voicesReady, setVoicesReady] = useState(false);

    const keepAliveRef = useRef(null);
    const wordTimerRef = useRef(null);   // interval for timer-based word advance
    const wordIdxRef = useRef(-1);     // mirrors wordIndex for use in closures
    const totalWordsRef = useRef(0);      // total word count of current text
    const msPerWordRef = useRef(435);    // ms between word advances
    const isMounted = useRef(true);
    const speakRef = useRef(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // ── Voices ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof speechSynthesis === 'undefined') return;
        const onReady = () => setVoicesReady(true);
        if (speechSynthesis.getVoices().length > 0) onReady();
        else {
            speechSynthesis.addEventListener('voiceschanged', onReady);
            return () => speechSynthesis.removeEventListener('voiceschanged', onReady);
        }
    }, []);

    // ── Word timer helpers ────────────────────────────────────────────────────
    const stopWordTimer = useCallback(() => {
        if (wordTimerRef.current) {
            clearInterval(wordTimerRef.current);
            wordTimerRef.current = null;
        }
    }, []);

    /** Start advancing wordIndex from `fromWord` every msPerWord ms. */
    const startWordTimer = useCallback((fromWord) => {
        stopWordTimer();
        wordIdxRef.current = fromWord;
        setWordIndex(fromWord);

        wordTimerRef.current = setInterval(() => {
            if (!isMounted.current) return;
            wordIdxRef.current += 1;
            if (wordIdxRef.current < totalWordsRef.current) {
                setWordIndex(wordIdxRef.current);
            } else {
                stopWordTimer();
            }
        }, msPerWordRef.current);
    }, [stopWordTimer]);

    // ── Chrome keep-alive ─────────────────────────────────────────────────────
    const stopKeepAlive = useCallback(() => {
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
        }
    }, []);

    const startKeepAlive = useCallback(() => {
        stopKeepAlive();
        keepAliveRef.current = setInterval(() => {
            if (typeof speechSynthesis !== 'undefined' &&
                speechSynthesis.speaking && !speechSynthesis.paused) {
                speechSynthesis.pause();
                setTimeout(() => {
                    if (typeof speechSynthesis !== 'undefined') speechSynthesis.resume();
                }, 50);
            }
        }, 12000);
    }, [stopKeepAlive]);

    // ── Core speak ────────────────────────────────────────────────────────────
    const speak = useCallback(() => {
        if (typeof speechSynthesis === 'undefined' || !text) return;

        speechSynthesis.cancel();
        stopWordTimer();

        const processedText = addBreathCues(text);
        const originalWords = text.trim().split(/\s+/).filter(Boolean);

        totalWordsRef.current = originalWords.length;

        const rate = PACE_RATE[pace] ?? 0.90;
        const wps = WPS_AT_RATE_1 * rate;
        msPerWordRef.current = Math.round(1000 / wps); // e.g. ~435ms at rate=0.90

        const utter = new SpeechSynthesisUtterance(processedText);
        utter.rate = rate;
        utter.pitch = TONE_PITCH[pitch] ?? 1.00;
        utter.volume = 1.0;

        const voice = pickVoice(region, gender);
        if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
            setVoiceName(voice.name);
        } else {
            setVoiceName('System Voice');
        }

        // onstart — begin timer-based word advancement
        utter.onstart = () => {
            if (!isMounted.current) return;
            setStatus('playing');
            startKeepAlive();
            // Kick off the timer from word 0
            startWordTimer(0);
        };

        // onboundary — sync timer when browser DOES provide boundary events
        // (Safari, Edge and some Windows voices). Not fired by Google voices in Chrome,
        // but we handle both cases gracefully.
        utter.onboundary = (e) => {
            if (!isMounted.current || e.name !== 'word') return;
            // Compute how many space-delimited tokens appear before this charIndex
            const spokenSoFar = processedText.slice(0, e.charIndex);
            const processedWords = spokenSoFar.trim().split(/\s+/).filter(Boolean);
            // Map processed word count → original word index (may differ slightly after breath-cue insertions)
            // Clamp so we never exceed the original word count
            const syncIdx = Math.min(processedWords.length, originalWords.length - 1);
            // Restart the timer from the synced position
            startWordTimer(syncIdx);
        };

        utter.onend = () => {
            if (!isMounted.current) return;
            stopWordTimer();
            stopKeepAlive();
            setWordIndex(-1);
            setStatus('done');
            if (onEnd) onEnd();
        };

        utter.onerror = (e) => {
            stopWordTimer();
            stopKeepAlive();
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            console.warn('[TTS] Speech error:', e.error);
            if (isMounted.current) setStatus('idle');
        };

        speechSynthesis.speak(utter);
    }, [text, gender, region, pace, pitch, onEnd,
        startKeepAlive, stopKeepAlive, startWordTimer, stopWordTimer]);

    // ── Public controls ───────────────────────────────────────────────────────
    const play = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        if (status === 'paused') {
            speechSynthesis.resume();
            setStatus('playing');
            startKeepAlive();
            // Resume word timer from where it paused
            startWordTimer(wordIdxRef.current);
            return;
        }
        setStatus('playing');
        setTimeout(() => speak(), 80);
    }, [status, speak, startKeepAlive, startWordTimer]);

    const pause = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        stopWordTimer();
        stopKeepAlive();
        speechSynthesis.pause();
        setStatus('paused');
    }, [stopWordTimer, stopKeepAlive]);

    const stop = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        stopWordTimer();
        stopKeepAlive();
        speechSynthesis.cancel();
        setWordIndex(-1);
        wordIdxRef.current = -1;
        setStatus('idle');
    }, [stopWordTimer, stopKeepAlive]);

    // Keep speakRef current on every render
    useEffect(() => { speakRef.current = speak; });

    // ── Stop immediately when text changes (node navigation) ─────────────────
    // Declared BEFORE autoPlay effect so it runs first — cancels old utterance
    // synchronously, then autoPlay schedules the new one after 800ms.
    useEffect(() => {
        if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
        stopWordTimer();
        stopKeepAlive();
        setWordIndex(-1);
        wordIdxRef.current = -1;
        setStatus('idle');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    // ── Auto-play ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoPlay || !voicesReady || !text) return;
        const t = setTimeout(() => {
            if (isMounted.current && speakRef.current) speakRef.current();
        }, 800);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, voicesReady, text]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopWordTimer();
            stopKeepAlive();
            if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { play, pause, stop, status, wordIndex, voiceName, voicesReady };
}
