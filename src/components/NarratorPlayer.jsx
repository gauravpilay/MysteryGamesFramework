/**
 * NarratorPlayer.jsx — Floating TTS control bar for Story Nodes
 *
 * Rendered as a portal on top of everything. Shows:
 *  - Animated waveform bars (when playing)
 *  - Voice label (e.g. "Samantha · US · Female")
 *  - Play / Pause / Stop buttons
 *  - Pace + region mini-labels
 *  - Dismiss button
 *
 * Usage:
 *   <NarratorPlayer
 *       text={data.text}
 *       gender={data.ttsGender}
 *       region={data.ttsRegion}
 *       pace={data.ttsPace}
 *       pitch={data.ttsPitch}
 *       autoPlay={data.ttsEnabled}
 *       nodeKey={currentNodeId}      ← resets TTS when node changes
 *   />
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Volume2, VolumeX, Mic, Mic2 } from 'lucide-react';
import { useChirpTTS as useChirpTTSHook } from '../lib/useChirpTTS';

// ── Waveform bars ─────────────────────────────────────────────────────────────

const WaveBar = ({ delay, playing }) => (
    <motion.div
        className="w-[3px] rounded-full bg-blue-400"
        animate={playing ? {
            scaleY: [0.3, 1.4, 0.5, 1.2, 0.4, 1.0, 0.3],
            opacity: [0.6, 1, 0.7, 1, 0.6, 1, 0.6],
        } : {
            scaleY: 0.25,
            opacity: 0.3,
        }}
        transition={{
            duration: 0.9,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
        }}
        style={{ height: 24, transformOrigin: 'center' }}
    />
);

const Waveform = ({ playing, count = 12 }) => (
    <div className="flex items-center gap-[3px] h-7">
        {Array.from({ length: count }).map((_, i) => (
            <WaveBar key={i} delay={i * 0.06} playing={playing} />
        ))}
    </div>
);

// ── Region / gender labels ────────────────────────────────────────────────────

const REGION_LABELS = { us: '🇺🇸 US', uk: '🇬🇧 UK', in: '🇮🇳 IN', au: '🇦🇺 AU' };
const PACE_LABELS = { slow: 'Slow', normal: 'Normal', fast: 'Fast' };

// ── Main component ────────────────────────────────────────────────────────────

export default function NarratorPlayer({
    text,
    gender = 'female',
    region = 'us',
    pace = 'normal',
    pitch = 'normal',
    autoPlay = false,
    nodeKey,          // used to reset when node changes
    apiKey = '',      // Google Cloud TTS API key (optional, enables Chirp)
    voiceName: configuredVoice = '',  // Chirp HD voice name
}) {
    const { play, pause, stop, status, voiceName, voicesReady, isChirpMode } = useChirpTTSHook({
        text,
        gender,
        region,
        pace,
        pitch,
        autoPlay,
        onEnd: () => { },
        apiKey,
        voiceName: configuredVoice,
    });

    const isPlaying = status === 'playing';
    const isPaused = status === 'paused';
    const isIdle = status === 'idle' || status === 'done';

    // Stop TTS when the node changes (nodeKey prop)
    useEffect(() => {
        return () => stop();
    }, [nodeKey]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!text) return null;

    const playerEl = (
        <AnimatePresence>
            <motion.div
                key="narrator-player"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300]"
                style={{ width: 'min(540px, calc(100vw - 32px))' }}
            >
                {/* Outer glow */}
                <motion.div
                    className="absolute -inset-3 rounded-[2rem] blur-2xl pointer-events-none"
                    animate={{
                        background: isPlaying
                            ? ['rgba(59,130,246,0.20)', 'rgba(99,102,241,0.30)', 'rgba(59,130,246,0.20)']
                            : 'rgba(59,130,246,0.08)',
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Card */}
                <div className="relative bg-zinc-950/95 border border-white/10 rounded-[1.5rem] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Shimmer top accent */}
                    <motion.div
                        className="absolute top-0 inset-x-0 h-px"
                        animate={{
                            background: isPlaying
                                ? ['linear-gradient(90deg,transparent,#3b82f6,#818cf8,#3b82f6,transparent)',
                                    'linear-gradient(90deg,transparent,#818cf8,#3b82f6,#818cf8,transparent)']
                                : 'linear-gradient(90deg,transparent,#3b82f620,transparent)',
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />

                    {/* Subtle radial grid */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }} />

                    <div className="relative px-5 py-4">
                        {/* Top row: icon + labels + waveform */}
                        <div className="flex items-center gap-4 mb-3">
                            {/* Mic icon with pulse when playing */}
                            <div className="relative shrink-0">
                                {isPlaying && (
                                    <motion.div
                                        className="absolute -inset-2 rounded-full bg-blue-500/20"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                )}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isPlaying
                                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/40'
                                    : 'bg-zinc-900 border-zinc-700'
                                    }`}>
                                    <Mic2 className={`w-4 h-4 ${isPlaying ? 'text-white' : 'text-zinc-500'}`} />
                                </div>
                            </div>

                            {/* Label column */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-0.5 flex items-center gap-1.5">
                                    AI Narrator
                                    {isChirpMode && (
                                        <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black tracking-normal">Chirp HD</span>
                                    )}
                                </p>
                                <p className="text-xs font-bold text-white truncate leading-none">
                                    {voiceName || 'Loading voices…'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                        {REGION_LABELS[region] || region}
                                    </span>
                                    <span className="text-zinc-700">·</span>
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                        {gender}
                                    </span>
                                    <span className="text-zinc-700">·</span>
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                        {PACE_LABELS[pace] || pace}
                                    </span>
                                </div>
                            </div>

                            {/* Waveform */}
                            <div className="shrink-0">
                                <Waveform playing={isPlaying} count={10} />
                            </div>
                        </div>

                        {/* Status indicator bar */}
                        <div className="h-px bg-white/5 mb-3 rounded-full overflow-hidden">
                            {isPlaying && (
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-400"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                                />
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-3">
                            {/* Stop */}
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={stop}
                                disabled={isIdle}
                                className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Stop"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </motion.button>

                            {/* Play / Pause (main CTA) */}
                            <motion.button
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={isPlaying ? pause : play}
                                disabled={!voicesReady && !isPlaying}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all border font-black ${isPlaying
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40 hover:bg-blue-500'
                                    : isPaused
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-amber-900/40 hover:bg-amber-500'
                                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 text-white shadow-blue-900/40 hover:from-blue-500 hover:to-indigo-600'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play Narration'}
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 fill-current" />
                                ) : (
                                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                                )}
                            </motion.button>

                            {/* Restart */}
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={play}
                                className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all"
                                title="Restart narration"
                            >
                                <Volume2 className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* State label */}
                        <p className="text-center text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-3">
                            {isPlaying
                                ? '▶ NARRATING'
                                : isPaused
                                    ? '⏸ PAUSED — TAP ▶ TO RESUME'
                                    : status === 'done'
                                        ? '✓ COMPLETE — TAP ▶ TO REPLAY'
                                        : !voicesReady
                                            ? '⋯ LOADING VOICES'
                                            : 'TAP ▶ TO HEAR THIS NARRATIVE'}
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    return typeof document !== 'undefined'
        ? ReactDOM.createPortal(playerEl, document.body)
        : null;
}
