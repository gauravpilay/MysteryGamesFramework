/**
 * useChirpTTS.js — Mystery Games Framework
 *
 * Google Chirp HD Text-to-Speech hook.
 *
 * STRATEGY:
 *   When a Google TTS API key is provided (from system settings) **and** the
 *   license flag `enable_audio_support` is active, this hook uses the
 *   Google Cloud Text-to-Speech REST API with the specified Chirp HD voice.
 *
 *   Fallback (no API key): The original Web Speech API path from useTTS.js
 *   is preserved so offline / dev environments continue to work.
 *
 * HIGHLIGHTING:
 *   For Chirp playback (via HTMLAudioElement) we use the same timer-based
 *   word advancement as useTTS.js.  Boundary events are not available from
 *   the REST path, but the timer gives a realistic feel.
 *
 * CHIRP HD VOICES (examples):
 *   en-US-Chirp3-HD-Aoede  (warm female)
 *   en-US-Chirp3-HD-Puck   (neutral male)
 *   en-US-Chirp3-HD-Kore   (crisp female)
 *   en-US-Chirp3-HD-Charon (baritone male)
 *   en-US-Chirp3-HD-Fenrir (narrative male)
 *   en-US-Chirp3-HD-Leda   (narrator female)
 *   en-US-Chirp3-HD-Orus   (deep male)
 *   en-US-Chirp3-HD-Zephyr (breathy female)
 *
 * Public interface — identical to useTTS:
 *   { play, pause, stop, status, wordIndex, voiceName, voicesReady }
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// All available Chirp 3 HD voices (Google Cloud TTS)
export const CHIRP_HD_VOICES = [
    { name: 'en-US-Chirp3-HD-Aoede', label: 'Aoede — Warm Female (US)' },
    { name: 'en-US-Chirp3-HD-Kore', label: 'Kore — Crisp Female (US)' },
    { name: 'en-US-Chirp3-HD-Leda', label: 'Leda — Narrator Female (US)' },
    { name: 'en-US-Chirp3-HD-Zephyr', label: 'Zephyr — Breathy Female (US)' },
    { name: 'en-US-Chirp3-HD-Puck', label: 'Puck — Neutral Male (US)' },
    { name: 'en-US-Chirp3-HD-Charon', label: 'Charon — Baritone Male (US)' },
    { name: 'en-US-Chirp3-HD-Fenrir', label: 'Fenrir — Narrative Male (US)' },
    { name: 'en-US-Chirp3-HD-Orus', label: 'Orus — Deep Male (US)' },
    { name: 'en-GB-Chirp3-HD-Aoede', label: 'Aoede — Warm Female (UK)' },
    { name: 'en-GB-Chirp3-HD-Charon', label: 'Charon — Baritone Male (UK)' },
    { name: 'en-AU-Chirp3-HD-Aoede', label: 'Aoede — Warm Female (AU)' },
    { name: 'en-AU-Chirp3-HD-Puck', label: 'Puck — Neutral Male (AU)' },
    { name: 'en-IN-Chirp3-HD-Aoede', label: 'Aoede — Warm Female (IN)' },
    { name: 'en-IN-Chirp3-HD-Puck', label: 'Puck — Neutral Male (IN)' },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const GOOGLE_TTS_ENDPOINT =
    'https://texttospeech.googleapis.com/v1/text:synthesize';

// Default Chirp HD voice if nothing is configured
export const DEFAULT_CHIRP_VOICE = 'en-US-Chirp3-HD-Aoede';

// Words-per-second estimate at normal pace for timing the word highlight
const WPS_AT_RATE_1 = 3.2;

// ── Text pre-processing (mirrors useTTS.js) ───────────────────────────────────

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

// ── Web Speech API fallback (from useTTS.js) ──────────────────────────────────

const VOICE_PREFS = {
    us: {
        female: ['google us english', 'samantha', 'zira', 'aria', 'jenny', 'michelle', 'monica'],
        male: ['google us english male', 'ryan', 'guy', 'davis', 'christopher', 'eric', 'roger'],
    },
};
const LOCALES = { us: ['en-US', 'en'] };

function pickWebVoice(region = 'us', gender = 'female') {
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
        return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || null;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}  opts.text        Text to narrate
 * @param {string}  opts.gender      'female' | 'male' (used for Web Speech fallback)
 * @param {string}  opts.region      'us' | 'uk' | 'in' | 'au'
 * @param {string}  opts.pace        'slow' | 'normal' | 'fast'
 * @param {string}  opts.pitch       'low' | 'normal' | 'high'
 * @param {boolean} opts.autoPlay    Auto-start playback when text changes
 * @param {function} opts.onEnd      Called when narration finishes
 * @param {string}  opts.apiKey      Google Cloud TTS API key (enables Chirp path)
 * @param {string}  opts.voiceName   Chirp HD voice name (e.g. 'en-US-Chirp3-HD-Aoede')
 */
export function useChirpTTS({
    text = '',
    gender = 'female',
    region = 'us',
    pace = 'normal',
    pitch = 'normal',
    autoPlay = false,
    onEnd,
    apiKey = '',
    voiceName: configuredVoiceName = DEFAULT_CHIRP_VOICE,
} = {}) {
    const [status, setStatus] = useState('idle');        // 'idle' | 'loading' | 'playing' | 'paused' | 'done'
    const [wordIndex, setWordIndex] = useState(-1);
    const [voiceName, setVoiceName] = useState('');
    const [voicesReady, setVoicesReady] = useState(false);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const audioRef = useRef(null);         // HTMLAudioElement for Chirp path
    const audioBlobUrl = useRef('');       // ObjectURL for current audio
    const wordTimerRef = useRef(null);
    const wordIdxRef = useRef(-1);
    const totalWordsRef = useRef(0);
    const msPerWordRef = useRef(400);
    const isMounted = useRef(true);
    const speakRef = useRef(null);
    const keepAliveRef = useRef(null);
    const useChirpPath = !!(apiKey && configuredVoiceName);

    const activeTextRef = useRef(text);
    useEffect(() => {
        activeTextRef.current = text;
    }, [text]);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // ── Web Speech voices ready detection ────────────────────────────────────
    useEffect(() => {
        if (useChirpPath) {
            setVoicesReady(true); // Chirp is always ready (network-based)
            return;
        }
        if (typeof speechSynthesis === 'undefined') return;
        const onReady = () => setVoicesReady(true);
        if (speechSynthesis.getVoices().length > 0) onReady();
        else {
            speechSynthesis.addEventListener('voiceschanged', onReady);
            return () => speechSynthesis.removeEventListener('voiceschanged', onReady);
        }
    }, [useChirpPath]);

    // ── Word timer ────────────────────────────────────────────────────────────
    const stopWordTimer = useCallback(() => {
        if (wordTimerRef.current) {
            clearInterval(wordTimerRef.current);
            wordTimerRef.current = null;
        }
    }, []);

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

    // ── Chrome keep-alive (Web Speech only) ───────────────────────────────────
    const stopKeepAlive = useCallback(() => {
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
        }
    }, []);

    const startKeepAlive = useCallback(() => {
        if (useChirpPath) return;
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
    }, [useChirpPath, stopKeepAlive]);

    // ── Release audio blob URL ────────────────────────────────────────────────
    const releaseAudioBlob = useCallback(() => {
        if (audioBlobUrl.current) {
            URL.revokeObjectURL(audioBlobUrl.current);
            audioBlobUrl.current = '';
        }
    }, []);

    // ── Pace → speaking rate ──────────────────────────────────────────────────
    const PACE_RATE = { slow: 0.82, normal: 0.90, fast: 1.05 };
    const PITCH_MAP = { low: 0.90, normal: 1.00, high: 1.08 };

    // ── CHIRP PATH: fetch audio from Google TTS REST API ─────────────────────
    const speakChirp = useCallback(async () => {
        const trimmedKey = apiKey.trim();
        if (!text || !trimmedKey) return;
        const textAtStart = text;

        if (isMounted.current) setStatus('loading');

        const processedText = addBreathCues(text);
        const originalWords = text.trim().split(/\s+/).filter(Boolean);
        totalWordsRef.current = originalWords.length;

        const speakingRate = PACE_RATE[pace] ?? 0.90;

        const wps = WPS_AT_RATE_1 * speakingRate;
        msPerWordRef.current = Math.round(1000 / wps);

        // Determine language code from voice name
        // e.g. 'en-US-Chirp3-HD-Aoede' → language code 'en-US'
        const langCode = configuredVoiceName.split('-').slice(0, 2).join('-') || 'en-US';

        const audioConfig = {
            audioEncoding: 'MP3',
            speakingRate,
        };

        // Note: Chirp voices currently do not support the 'pitch' parameter.
        // Including it causes a 400 error.

        const requestBody = {
            input: { text: processedText },
            voice: {
                languageCode: langCode,
                name: configuredVoiceName,
            },
            audioConfig,
        };

        try {
            const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${trimmedKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Google TTS API error ${response.status}: ${errText}`);
            }

            // Guard against text change during fetch
            if (!isMounted.current || activeTextRef.current !== textAtStart) return;

            const { audioContent } = await response.json();
            if (!audioContent) throw new Error('Empty audio response');

            // Decode base64 → Blob → ObjectURL
            const binary = atob(audioContent);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });

            releaseAudioBlob();
            const blobUrl = URL.createObjectURL(blob);
            audioBlobUrl.current = blobUrl;

            // Final guard before starting playback
            if (!isMounted.current || activeTextRef.current !== textAtStart) {
                URL.revokeObjectURL(blobUrl);
                return;
            }

            // Create or reuse audio element
            if (!audioRef.current) audioRef.current = new Audio();
            const audio = audioRef.current;
            audio.src = blobUrl;
            audio.volume = 1.0;

            audio.onplay = () => {
                if (!isMounted.current) return;
                setStatus('playing');
                startWordTimer(0);
            };

            audio.onended = () => {
                if (!isMounted.current) return;
                stopWordTimer();
                setWordIndex(-1);
                setStatus('done');
                releaseAudioBlob();
                if (onEnd) onEnd();
            };

            audio.onerror = (e) => {
                stopWordTimer();
                console.warn('[ChirpTTS] Audio error:', e);
                if (isMounted.current) setStatus('idle');
            };

            setVoiceName(configuredVoiceName);
            await audio.play();

        } catch (err) {
            console.warn('[ChirpTTS] Synthesis failed, falling back to Web Speech:', err.message);
            // Graceful fallback
            if (isMounted.current) {
                setStatus('idle');
                // trigger web speech as fallback
                speakWebRef.current?.();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, apiKey, configuredVoiceName, pace, pitch, onEnd, startWordTimer, stopWordTimer, releaseAudioBlob]);

    // ── WEB SPEECH PATH ───────────────────────────────────────────────────────
    const speakWeb = useCallback(() => {
        if (typeof speechSynthesis === 'undefined' || !text) return;

        speechSynthesis.cancel();
        stopWordTimer();

        const processedText = addBreathCues(text);
        const originalWords = text.trim().split(/\s+/).filter(Boolean);
        totalWordsRef.current = originalWords.length;

        const rate = PACE_RATE[pace] ?? 0.90;
        const wps = WPS_AT_RATE_1 * rate;
        msPerWordRef.current = Math.round(1000 / wps);

        const utter = new SpeechSynthesisUtterance(processedText);
        utter.rate = rate;
        utter.pitch = PITCH_MAP[pitch] ?? 1.00;
        utter.volume = 1.0;

        const voice = pickWebVoice(region, gender);
        if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
            setVoiceName(voice.name);
        } else {
            setVoiceName('System Voice');
        }

        utter.onstart = () => {
            if (!isMounted.current) return;
            setStatus('playing');
            startKeepAlive();
            startWordTimer(0);
        };

        utter.onboundary = (e) => {
            if (!isMounted.current || e.name !== 'word') return;
            const spokenSoFar = processedText.slice(0, e.charIndex);
            const processedWords = spokenSoFar.trim().split(/\s+/).filter(Boolean);
            const syncIdx = Math.min(processedWords.length, originalWords.length - 1);
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
            console.warn('[WebSpeech] Error:', e.error);
            if (isMounted.current) setStatus('idle');
        };

        speechSynthesis.speak(utter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, gender, region, pace, pitch, onEnd, startKeepAlive, stopKeepAlive, startWordTimer, stopWordTimer]);

    // Keep refs current
    const speakWebRef = useRef(speakWeb);
    useEffect(() => { speakWebRef.current = speakWeb; });
    useEffect(() => { speakRef.current = useChirpPath ? speakChirp : speakWeb; });

    // ── Public controls ───────────────────────────────────────────────────────
    const play = useCallback(() => {
        if (status === 'paused') {
            if (useChirpPath && audioRef.current) {
                audioRef.current.play();
                setStatus('playing');
                startWordTimer(wordIdxRef.current);
            } else if (!useChirpPath && typeof speechSynthesis !== 'undefined') {
                speechSynthesis.resume();
                setStatus('playing');
                startKeepAlive();
                startWordTimer(wordIdxRef.current);
            }
            return;
        }
        setStatus(useChirpPath ? 'loading' : 'playing');
        setTimeout(() => speakRef.current?.(), 80);
    }, [status, useChirpPath, startKeepAlive, startWordTimer]);

    const pause = useCallback(() => {
        stopWordTimer();
        if (useChirpPath && audioRef.current) {
            audioRef.current.pause();
        } else if (!useChirpPath && typeof speechSynthesis !== 'undefined') {
            stopKeepAlive();
            speechSynthesis.pause();
        }
        setStatus('paused');
    }, [useChirpPath, stopWordTimer, stopKeepAlive]);

    const stop = useCallback(() => {
        stopWordTimer();
        if (useChirpPath) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            releaseAudioBlob();
        } else {
            stopKeepAlive();
            if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
        }
        setWordIndex(-1);
        wordIdxRef.current = -1;
        setStatus('idle');
    }, [useChirpPath, stopWordTimer, stopKeepAlive, releaseAudioBlob]);

    // ── Stop immediately when text changes (node navigation) ─────────────────
    useEffect(() => {
        if (useChirpPath) {
            if (audioRef.current) audioRef.current.pause();
            releaseAudioBlob();
        } else if (typeof speechSynthesis !== 'undefined') {
            speechSynthesis.cancel();
        }
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
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            releaseAudioBlob();
            if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        play,
        pause,
        stop,
        status,
        wordIndex,
        voiceName,
        voicesReady,
        isChirpMode: useChirpPath,
    };
}
