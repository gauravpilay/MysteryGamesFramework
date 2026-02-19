/**
 * useTTS.js — Mystery Games Framework
 * Text-to-Speech hook using Web Speech API.
 *
 * Features:
 *  - Smart voice selection: region (US, IN, UK, AU) × gender (male/female)
 *  - Dynamic modulation: pitch/rate vary on punctuation (. ! ? , — ...)
 *  - Word-boundary tracking for live highlight index
 *  - Play / pause / stop controls
 *  - Auto-read on mount when `autoPlay` is true
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Voice selection helpers ──────────────────────────────────────────────────

/** Locale code priority lists for each region. We try each until a matching
 *  system voice is found; fall back gracefully. */
const LOCALE_MAP = {
    us: ['en-US'],
    uk: ['en-GB'],
    in: ['en-IN', 'hi-IN', 'en-US'],
    au: ['en-AU', 'en-US'],
};

/**
 * Pick the best SpeechSynthesisVoice from what the browser has.
 * Priority: exact locale match → gender keyword match → any English fallback.
 */
function pickVoice(region = 'us', gender = 'female') {
    if (typeof speechSynthesis === 'undefined') return null;

    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    const locales = LOCALE_MAP[region] || ['en-US'];
    const genderKeywords = gender === 'female'
        ? ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'heera', 'veena', 'karen', 'moira', 'tessa', 'fiona']
        : ['male', 'man', 'guy', 'david', 'mark', 'rishi', 'daniel', 'lee', 'tom', 'fred', 'jorge'];

    // Score each voice
    const scored = voices.map(v => {
        let score = 0;
        const nameLower = v.name.toLowerCase();
        const langLower = (v.lang || '').toLowerCase();

        // Locale match
        for (let i = 0; i < locales.length; i++) {
            if (langLower.startsWith(locales[i].toLowerCase())) {
                score += (10 - i * 3); // earlier locale = higher score
                break;
            }
        }
        // English bonus
        if (langLower.startsWith('en')) score += 2;

        // Gender keyword
        if (genderKeywords.some(k => nameLower.includes(k))) score += 5;

        // Known high-quality voices
        if (['google', 'microsoft', 'apple'].some(k => nameLower.includes(k))) score += 3;

        return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || null;
}

// ── Modulation helpers ───────────────────────────────────────────────────────

const PACE_TO_RATE = { slow: 0.75, normal: 0.95, fast: 1.3 };
const PITCH_TO_VALUE = { low: 0.7, normal: 1.0, high: 1.3 };

/**
 * Detect the "emotion" of a sentence and return a pitch/rate adjustment.
 * This creates natural voice modulation without needing SSML.
 */
function getModulation(sentence) {
    const s = sentence.trim();
    if (!s) return { pitchDelta: 0, rateDelta: 0 };

    const isQuestion = s.endsWith('?');
    const isExclaim = s.endsWith('!');
    const isEllipsis = s.endsWith('...') || s.endsWith('…');
    const isInterjection = /^(wait|stop|listen|no|yes|oh|ah|hey|look|careful|run|help|impossible|unbelievable)/i.test(s);

    if (isQuestion) return { pitchDelta: +0.15, rateDelta: -0.05 };
    if (isExclaim && isInterjection) return { pitchDelta: +0.2, rateDelta: +0.1 };
    if (isExclaim) return { pitchDelta: +0.1, rateDelta: +0.05 };
    if (isEllipsis) return { pitchDelta: -0.1, rateDelta: -0.15 };
    return { pitchDelta: 0, rateDelta: 0 };
}

// ── Split text into speakable sentences ──────────────────────────────────────

function splitToSentences(text) {
    // Split on sentence-final punctuation, keeping the delimiter
    return text
        .split(/(?<=[.!?…]+)\s+|(?<=\.{3})\s+/)
        .map(s => s.trim())
        .filter(Boolean);
}

// ── Main Hook ────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}  opts.text        - The full narrative text to speak
 * @param {string}  opts.gender      - 'female' | 'male'
 * @param {string}  opts.region      - 'us' | 'uk' | 'in' | 'au'
 * @param {string}  opts.pace        - 'slow' | 'normal' | 'fast'
 * @param {string}  opts.pitch       - 'low' | 'normal' | 'high'
 * @param {boolean} opts.autoPlay    - Auto-start on mount
 * @param {function} opts.onEnd      - Callback when narration finishes
 */
export function useTTS({ text = '', gender = 'female', region = 'us', pace = 'normal', pitch = 'normal', autoPlay = false, onEnd } = {}) {
    const [status, setStatus] = useState('idle');      // 'idle' | 'playing' | 'paused' | 'done'
    const [wordIndex, setWordIndex] = useState(-1);    // current word position in original text
    const [voiceName, setVoiceName] = useState('');    // human-readable label for UI
    const [voicesReady, setVoicesReady] = useState(false);

    const utterRef = useRef(null);
    const sentenceQueue = useRef([]);
    const sentIdx = useRef(0);
    const wordOffset = useRef(0);  // char offset of current sentence start in original text
    const isMounted = useRef(true);
    const hasAutoPlayed = useRef(false);

    // Track mounting
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Wait for voices to load (async on Chrome)
    useEffect(() => {
        if (typeof speechSynthesis === 'undefined') return;
        const set = () => setVoicesReady(true);
        if (speechSynthesis.getVoices().length) {
            set();
        } else {
            speechSynthesis.addEventListener('voiceschanged', set);
            return () => speechSynthesis.removeEventListener('voiceschanged', set);
        }
    }, []);

    // Speak one sentence from the queue
    const speakSentence = useCallback((idx) => {
        if (!isMounted.current) return;
        const sentences = sentenceQueue.current;
        if (idx >= sentences.length) {
            setStatus('done');
            setWordIndex(-1);
            if (onEnd) onEnd();
            return;
        }

        const sentence = sentences[idx];
        const { pitchDelta, rateDelta } = getModulation(sentence);

        const baseRate = PACE_TO_RATE[pace] ?? 0.95;
        const basePitch = PITCH_TO_VALUE[pitch] ?? 1.0;

        const utter = new SpeechSynthesisUtterance(sentence);
        utter.rate = Math.max(0.5, Math.min(2.0, baseRate + rateDelta));
        utter.pitch = Math.max(0.5, Math.min(2.0, basePitch + pitchDelta));
        utter.volume = 1.0;

        const voice = pickVoice(region, gender);
        if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
            setVoiceName(voice.name);
        } else {
            setVoiceName('System Default');
        }

        // Word boundary — map back to original text position
        utter.onboundary = (e) => {
            if (!isMounted.current) return;
            if (e.name === 'word') {
                const charInSentence = e.charIndex;
                const globalChar = wordOffset.current + charInSentence;
                // Count words up to globalChar in original text
                const before = text.slice(0, globalChar);
                const wIdx = before.split(/\s+/).length - 1;
                setWordIndex(wIdx);
            }
        };

        utter.onend = () => {
            if (!isMounted.current) return;
            // Advance char offset by sentence length + separator
            const sentLen = sentence.length;
            wordOffset.current += sentLen + 1;
            sentIdx.current = idx + 1;
            speakSentence(idx + 1);
        };

        utter.onerror = (e) => {
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            console.warn('[TTS] Error:', e.error);
            setStatus('idle');
        };

        utterRef.current = utter;
        speechSynthesis.speak(utter);
    }, [text, gender, region, pace, pitch, onEnd]);

    const play = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        if (status === 'paused') {
            speechSynthesis.resume();
            setStatus('playing');
            return;
        }
        // Fresh start
        speechSynthesis.cancel();
        sentenceQueue.current = splitToSentences(text);
        sentIdx.current = 0;
        wordOffset.current = 0;
        setStatus('playing');
        setWordIndex(-1);
        speakSentence(0);
    }, [status, text, speakSentence]);

    const pause = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        speechSynthesis.pause();
        setStatus('paused');
    }, []);

    const stop = useCallback(() => {
        if (typeof speechSynthesis === 'undefined') return;
        speechSynthesis.cancel();
        setStatus('idle');
        setWordIndex(-1);
        sentIdx.current = 0;
        wordOffset.current = 0;
    }, []);

    // Auto-play when enabled and voices ready
    useEffect(() => {
        if (!autoPlay || !voicesReady || !text || hasAutoPlayed.current) return;
        hasAutoPlayed.current = true;
        // small delay so page finishes rendering
        const t = setTimeout(play, 600);
        return () => clearTimeout(t);
    }, [autoPlay, voicesReady, text, play]);

    // Stop on unmount
    useEffect(() => {
        return () => {
            if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
        };
    }, []);

    // Reset if text changes
    useEffect(() => {
        hasAutoPlayed.current = false;
        stop();
    }, [text]); // intentionally omit stop from deps to avoid loop

    return { play, pause, stop, status, wordIndex, voiceName, voicesReady };
}
