import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Card } from './ui/shared';
import { X, User, Search, Terminal, MessageSquare, FileText, ArrowRight, ArrowLeft, ShieldAlert, CheckCircle, AlertTriangle, Volume2, VolumeX, Image as ImageIcon, Briefcase, Star, MousePointerClick, Bell, HelpCircle, Clock, ZoomIn, LayoutGrid, ChevronRight, Fingerprint, Cpu, Activity, Shield, Hash, Box as BoxIcon, Radio, Lightbulb, Mail, Paperclip, Unlock, XCircle, Play, Pause, Square, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EvidenceBoard from './EvidenceBoard';
import AdvancedTerminal from './AdvancedTerminal';
import AIInterrogation from './AIInterrogation';
import ThreeDWorld from './ThreeDWorld';
import SuspectProfile from './SuspectProfile';
import CinematicCutscene from './CinematicCutscene';
import CaseClosedNewsReport from './CaseClosedNewsReport';
import DeepWebOS from './DeepWebOS';
import SuspectWall from './InteractiveSuspectWall';
import FeedbackModal from './FeedbackModal';
import FactDisplay from './FactDisplay';
import { CrazyWallGame } from './CrazyWallGame';
import ExplanationHUD from './ExplanationHUD';
import SuspectHubGrid from './SuspectHubGrid';
import { useChirpTTS, DEFAULT_CHIRP_VOICE } from '../lib/useChirpTTS';
import { useConfig } from '../lib/config';
import { useLicense } from '../lib/licensing';
import {
    checkLogicCondition as checkLogic,
    evaluateLogic as evalLogic,
    resolveNextNode as resolveNext,
    resolveEdgeTarget as resolveTarget
} from '../lib/gameLogic';

const BackgroundEffect = React.memo(({ isSimultaneous = false }) => (
    <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 pointer-events-none z-0 overflow-hidden bg-[#020205]`}>

        {/* NEO NOIR BACKGROUND IMAGE - THE BASE LAYER */}
        <div
            className="absolute inset-0 z-0 opacity-[0.45] mix-blend-luminosity brightness-[0.7] contrast-[1.2]"
            style={{
                backgroundImage: 'url("/neo_noir_bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        ></div>

        {/* Primary Moody Gradients - Adds depth and tint to the image */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_rgba(15,23,42,0.6)_0%,_transparent_50%),radial-gradient(circle_at_100%_0%,_rgba(30,10,10,0.4)_0%,_transparent_50%),radial-gradient(circle_at_50%_100%,_rgba(10,10,40,0.5)_0%,_transparent_80%)] z-[1]"></div>

        {/* Cinematic Grain Texture */}
        <div className="absolute inset-[-200%] opacity-[0.06] animate-grain pointer-events-none z-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}></div>

        {/* Animated Light Leaks */}
        <div className="absolute inset-0 z-[2]">
            <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-indigo-900/10 rounded-full blur-[120px] animate-light-leak opacity-20"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-rose-900/10 rounded-full blur-[120px] animate-light-leak opacity-20" style={{ animationDelay: '-10s' }}></div>
        </div>

        {/* Grid Floor/Wall - Perspective Hint */}
        <div className="absolute inset-0 opacity-[0.05] z-[3]" style={{
            backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.4) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            transform: 'perspective(1000px) rotateX(20deg) translateY(-10%) scale(1.2)',
        }}></div>

        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-400/5 to-transparent h-screen w-full animate-scanline opacity-[0.15] pointer-events-none mix-blend-screen z-[4]"></div>

        {/* Vignette - Ultra Soft but deepers to focus on center content */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_black_180%)] opacity-95 z-[5]"></div>

        {/* Horizontal Static noise lines */}
        <div className="absolute inset-0 opacity-[0.02] bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,rgba(255,255,255,0.1)_1px,rgba(255,255,255,0.1)_2px)] z-[6]"></div>
    </div>
));

const parseRichText = (input) => {
    if (!input) return "";
    // Bold: **text**
    let parsed = input.replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-black drop-shadow-sm">$1</b>');

    // Colors: [red]text[/red], [blue]text[/blue], etc.
    const colors = ['red', 'blue', 'green', 'yellow', 'indigo', 'orange', 'emerald', 'amber', 'rose', 'cyan'];
    colors.forEach(color => {
        const regex = new RegExp(`\\[${color}\\](.*?)\\[\\/${color}\\]`, 'g');
        // Mapping colors to Tailwind classes
        const colorMap = {
            red: 'text-red-500',
            blue: 'text-blue-400',
            green: 'text-emerald-400',
            yellow: 'text-amber-300',
            indigo: 'text-indigo-400',
            orange: 'text-orange-400',
            emerald: 'text-emerald-400',
            amber: 'text-amber-400',
            rose: 'text-rose-500',
            cyan: 'text-cyan-400'
        };
        parsed = parsed.replace(regex, `<span class="${colorMap[color]} font-bold">$1</span>`);
    });

    // Handle unclosed bold tags for a smoother typing experience
    if (parsed.includes('**') && !parsed.includes('</b>')) {
        parsed = parsed.replace(/\*\*(.*)$/, '<b class="text-white font-black">$1</b>');
    }

    return parsed;
};

const TypewriterText = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const index = useRef(0);

    useEffect(() => {
        setDisplayedText('');
        index.current = 0;

        if (!text) {
            if (onComplete) onComplete();
            return;
        }

        const timer = setInterval(() => {
            if (index.current < text.length) {
                setDisplayedText(text.slice(0, index.current + 1));
                index.current++;
            } else {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
        }, 12); // Slightly faster for longer texts

        return () => clearInterval(timer);
    }, [text]);

    return (
        <span className="relative">
            <span dangerouslySetInnerHTML={{ __html: parseRichText(displayedText) }} />
            <span className="animate-pulse text-indigo-500 ml-1">_</span>
        </span>
    );
};

/**
 * WordHighlightText — renders the full text with the currently-spoken word
 * highlighted in real time. Used when TTS is active (replaces TypewriterText).
 */
const WordHighlightText = ({ text, wordIndex, onComplete }) => {
    // Signal content ready immediately (no typewriter delay during narration)
    useEffect(() => { if (onComplete) onComplete(); }, []);

    if (!text) return null;

    // Split preserving whitespace so we can rejoin faithfully
    // Tokens alternate: word, whitespace, word, whitespace ...
    const tokens = text.split(/(\s+)/);
    let wIdx = -1;

    return (
        <span>
            {tokens.map((token, i) => {
                const isWhitespace = /^\s+$/.test(token);
                if (isWhitespace) return <span key={i}>{token}</span>;

                wIdx++;
                const isActive = wIdx === wordIndex;

                return (
                    <span
                        key={i}
                        className="relative transition-all duration-100"
                        style={{ display: 'inline' }}
                    >
                        {isActive && (
                            <span
                                className="absolute -inset-x-0.5 -inset-y-0.5 rounded-sm pointer-events-none z-0"
                                style={{
                                    background: 'rgba(99, 179, 237, 0.28)',
                                    boxShadow: '0 0 8px 2px rgba(59,130,246,0.35)',
                                }}
                            />
                        )}
                        <span
                            className={`relative z-10 transition-colors duration-100 ${isActive
                                ? 'text-blue-200 font-semibold'
                                : wIdx < wordIndex
                                    ? 'text-zinc-400'
                                    : 'text-zinc-200'
                                }`}
                        >
                            {token}
                        </span>
                    </span>
                );
            })}
        </span>
    );
};

// -- MINIGAME COMPONENTS --

const LockpickMinigame = ({ node, onSuccess, onFail }) => {
    const [pins, setPins] = useState(Array(parseInt(node.data.difficulty === 'hard' ? 7 : node.data.difficulty === 'medium' ? 5 : 3)).fill(false));
    const [currentPin, setCurrentPin] = useState(0);
    const [barPos, setBarPos] = useState(0);
    const [movingRight, setMovingRight] = useState(true);
    const requestRef = useRef();

    // Game Loop for Bar Movement
    useEffect(() => {
        const speed = node.data.difficulty === 'hard' ? 2 : 1.5;
        const animate = () => {
            setBarPos(prev => {
                let next = prev + (movingRight ? speed : -speed);
                if (next >= 100) { setMovingRight(false); next = 100; }
                if (next <= 0) { setMovingRight(true); next = 0; }
                return next;
            });
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [movingRight, node.data.difficulty]);

    const handlePick = () => {
        // Sweet spot is centered around 50% usually, or random? Random is better.
        // For simplicity, let's say the target zone moves or is static.
        // Static center is easiest for V1.
        const targetStart = 40;
        const targetEnd = 60;

        if (barPos >= targetStart && barPos <= targetEnd) {
            const newPins = [...pins];
            newPins[currentPin] = true;
            setPins(newPins);
            if (currentPin + 1 >= pins.length) {
                setTimeout(onSuccess, 500);
            } else {
                setCurrentPin(p => p + 1);
            }
        } else {
            // Failure reset
            setPins(pins.map(() => false));
            setCurrentPin(0);
            onFail();
        }
    };

    return (
        <div className="p-8 bg-zinc-900 h-full flex flex-col items-center justify-center border-t-4 border-amber-500">
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                <div className="p-2 border border-amber-500 rounded-lg"><Clock className="w-6 h-6" /></div>
                Lockpick Interface
            </h2>

            <div className="flex gap-4 mb-12">
                {pins.map((isSet, i) => (
                    <div key={i} className={`w-8 h-12 rounded-t-lg transition-all duration-300 ${isSet ? 'bg-amber-500 mt-0 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-zinc-800 mt-8 border-b-4 border-zinc-900'} border-x border-t border-white/10`}></div>
                ))}
            </div>

            <div className="w-full max-w-lg h-12 bg-black rounded-full border border-zinc-700 relative overflow-hidden mb-8" onClick={handlePick}>
                {/* Target Zone */}
                <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-green-500/20 border-x border-green-500/50 flex items-center justify-center">
                    <div className="w-1 h-full bg-green-500/50"></div>
                </div>

                {/* Moving Bar */}
                <div
                    className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_15px_white]"
                    style={{ left: `${barPos}%` }}
                ></div>
            </div>

            <p className="text-zinc-500 text-sm font-mono tracking-widest mb-4">CLICK WHEN ALIGNED</p>
        </div>
    );
};

const KeypadMinigame = ({ node, onSuccess }) => {
    const [input, setInput] = useState("");
    const [error, setError] = useState(false);
    const lockType = node.data.lockType || 'numeric';
    const targetCode = node.data.passcode || "";

    const handlePress = (key) => {
        if (key === 'CLR') {
            setInput("");
            setError(false);
        } else if (key === 'BACK') {
            setInput(prev => prev.slice(0, -1));
            setError(false);
        } else if (key === 'Enter') {
            if (input === targetCode) {
                onSuccess();
            } else {
                setError(true);
                setTimeout(() => {
                    setError(false);
                    // Optional: keep input or clear it? Keeping it feels more "mechanical"
                }, 1000);
            }
        } else {
            if (input.length < 12) setInput(prev => prev + key);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (error) return;
            const key = e.key;
            const code = e.code;

            // Handle functional keys
            if (key === 'Backspace') {
                e.preventDefault();
                handlePress('BACK');
            } else if (key === 'Escape') {
                e.preventDefault();
                handlePress('CLR');
            } else if (key === 'Enter' || code === 'NumpadEnter') {
                e.preventDefault();
                handlePress('Enter');
            } else {
                // Handle numeric/alphanumeric input
                let char = '';

                // Try to get digit from Numpad code first (works regardless of NumLock)
                if (code.startsWith('Numpad') && code.length === 7 && /^[0-9]$/.test(code[6])) {
                    char = code[6];
                } else if (/^[0-9]$/.test(key)) {
                    char = key;
                } else if (lockType === 'alphanumeric' && /^[a-zA-Z]$/.test(key) && key.length === 1) {
                    char = key.toUpperCase();
                }

                if (char) {
                    e.preventDefault();
                    handlePress(char);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [input, error, lockType]);

    return (
        <div className="p-8 bg-zinc-950 h-full flex flex-col items-center justify-center relative overflow-hidden pointer-events-auto">
            {/* Briefcase Leather Texture Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23111'/%3E%3Ccircle cx='50' cy='50' r='1' fill='%23333'/%3E%3C/svg%3E")` }}></div>

            <div className="relative w-full max-w-sm">
                {/* Briefcase Handle Base (Visual element) */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-8 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-3xl border-t border-x border-white/10 shadow-lg"></div>

                <div className="bg-zinc-900 border-[10px] border-zinc-800 rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.05)] overflow-hidden">
                    {/* Metal Top Plate */}
                    <div className="bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 p-6 flex items-center justify-between border-b border-black shadow-lg">
                        <div className="flex gap-2">
                            {[1, 2].map(i => <div key={i} className="w-4 h-4 rounded-full bg-black shadow-inner flex items-center justify-center"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div></div>)}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-black/50 rounded border border-white/5">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{lockType}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {[1, 2].map(i => <div key={i} className="w-4 h-4 rounded-full bg-black shadow-inner flex items-center justify-center"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div></div>)}
                        </div>
                    </div>

                    {/* Display Segment */}
                    <div className="p-8 bg-zinc-900/50">
                        <div className={`relative bg-black h-24 rounded-xl border-4 transition-all duration-300 flex items-center justify-center shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)]
                            ${error ? 'border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.3)]'}`}>

                            {/* LCD Glow */}
                            <div className={`absolute inset-0 opacity-10 transition-colors ${error ? 'bg-red-500' : 'bg-amber-500'}`}></div>

                            {error ? (
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                                    <span className="text-red-600 font-black text-xl tracking-[0.3em]">REJECTED</span>
                                    <span className="text-[8px] text-red-900 font-bold uppercase mt-1">Invalid Combination</span>
                                </motion.div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-4 overflow-hidden">
                                    {input.length > 0 ? (
                                        input.split('').map((char, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="w-8 h-12 bg-zinc-950/80 rounded-lg border border-white/5 flex items-center justify-center shadow-lg"
                                            >
                                                <span className="text-2xl font-mono font-bold text-amber-500/90 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                                                    {lockType === 'numeric' ? '•' : char}
                                                </span>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-4 text-zinc-800">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-12 border-2 border-zinc-800/30 rounded-lg flex items-center justify-center">?</div>)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Grid - Industrial Style */}
                    <div className="p-8 pt-0 flex flex-col gap-4">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Numerical/Alpha Layout */}
                            {[
                                '1', '2', '3',
                                '4', '5', '6',
                                '7', '8', '9',
                                'CLR', '0', 'BACK'
                            ].map((key) => (
                                <button
                                    key={key}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePress(key);
                                    }}
                                    className={`h-16 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center font-bold shadow-lg group relative overflow-hidden z-10
                                        ${key === 'CLR' ? 'bg-zinc-800 border-zinc-950 text-red-400 hover:text-red-300' :
                                            key === 'BACK' ? 'bg-zinc-800 border-zinc-950 text-amber-400 hover:text-amber-300' :
                                                'bg-gradient-to-b from-zinc-700 to-zinc-800 border-zinc-950 text-zinc-300 hover:text-white'}`}
                                >
                                    <span className={`text-${key.length > 3 ? 'xs' : 'xl'}`}>{key}</span>
                                    {lockType === 'alphanumeric' && key.length === 1 && (
                                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-tighter mt-0.5">
                                            {key === '2' ? 'ABC' : key === '3' ? 'DEF' : key === '4' ? 'GHI' : key === '5' ? 'JKL' : key === '6' ? 'MNO' : key === '7' ? 'PQRS' : key === '8' ? 'TUV' : key === '9' ? 'WXYZ' : ''}
                                        </span>
                                    )}
                                    {/* Screw Head Decal */}
                                    <div className="absolute top-1 right-1 w-1 h-1 bg-black/40 rounded-full"></div>
                                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-black/40 rounded-full"></div>
                                </button>
                            ))}
                        </div>

                        {/* Large Unlock Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePress('Enter');
                            }}
                            className="w-full h-20 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border-b-4 border-amber-900 rounded-2xl active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-4 group shadow-[0_10px_20px_-5px_rgba(245,158,11,0.4)] relative z-10"
                        >
                            <Unlock className="w-6 h-6 text-amber-950" />
                            <span className="text-amber-950 font-black text-lg tracking-widest uppercase">Release Latches</span>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>

                    {/* Bottom Rivets */}
                    <div className="bg-zinc-800 p-4 flex justify-between px-10">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-2.5 h-2.5 bg-black rounded-full shadow-inner"></div>)}
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="mt-8 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.5em]">LOCKED • SYSTEM ACTIVE</span>
            </div>
        </div>
    );
};

const DecryptionMinigame = ({ node, onSuccess }) => {
    const target = (node.data.targetPhrase || "PASSWORD").toUpperCase();
    const [revealed, setRevealed] = useState(Array(target.length).fill(false));
    const [chars, setChars] = useState(Array(target.length).fill('A'));

    // Cycle characters
    useEffect(() => {
        const interval = setInterval(() => {
            setChars(prev => prev.map((char, i) => {
                if (revealed[i]) return target[i];
                return String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }));
        }, 50); // Fast cycle
        return () => clearInterval(interval);
    }, [revealed, target]);

    const handleLock = (index) => {
        // In this minigame, you have to click the column to lock it? 
        // Or wait for it to be right? That's impossible at 50ms.
        // Let's make it: Click any "Lock" button stops a column. 
        // Actually simpler: "Matrix Code Match". 
        // User clicks "Inject Code" button when the *Highlighted* letter matches the target letter below it.
        // Let's do a simple "Click to Reveal" but with a cooldown or "Hacking Progress".

        // Revised Logic: User types the letter to lock it (Typing Game). 
        // Most intuitive for desktop/laptop.
    };

    // Typing listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            const char = e.key.toUpperCase();
            // Find first unrevealed index
            const nextIndex = revealed.findIndex(r => !r);
            if (nextIndex !== -1 && char === target[nextIndex]) {
                setRevealed(prev => {
                    const next = [...prev];
                    next[nextIndex] = true;
                    // Check success
                    if (next.every(r => r)) setTimeout(onSuccess, 500);
                    return next;
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [revealed, target, onSuccess]);

    return (
        <div className="p-8 bg-black h-full flex flex-col items-center justify-center font-mono border-t-4 border-lime-500">
            <h2 className="text-lime-500 mb-8 tracking-widest animate-pulse">DECRYPTION IN PROGRESS...</h2>

            <div className="flex gap-2">
                {chars.map((char, i) => (
                    <div key={i} className={`w-12 h-16 flex items-center justify-center text-3xl border rounded transition-colors duration-200
                        ${revealed[i] ? 'bg-lime-900/20 border-lime-500 text-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                        {revealed[i] ? target[i] : char}
                    </div>
                ))}
            </div>

            <p className="mt-12 text-zinc-500 text-xs tracking-widest">
                TYPE THE CHARACTERS TO LOCK SIGNAL
            </p>
        </div>
    );
};

const GamePreview = ({ nodes, edges, onClose, gameMetadata, onGameEnd, onNodeChange, isSimultaneous = false }) => {
    // Game State
    const [currentNodeId, setCurrentNodeId] = useState(null);

    // Notify parent of node changes for simultaneous view
    useEffect(() => {
        if (onNodeChange) {
            onNodeChange(currentNodeId);
        }
    }, [currentNodeId, onNodeChange]);
    const [isContentReady, setIsContentReady] = useState(false);
    const [inventory, setInventory] = useState(new Set());
    const [history, setHistory] = useState([]); // Array of distinct visited node IDs
    const [logs, setLogs] = useState([]);
    const [missionStarted, setMissionStarted] = useState(false);
    // Generic Modal State: can hold a node object or null
    const [activeModalNode, setActiveModalNode] = useState(null);
    // Accusation State
    const [showAccuseModal, setShowAccuseModal] = useState(false);
    const [accusationResult, setAccusationResult] = useState(null); // 'success' | 'failure' | null | 'timeout'
    const [activeAccusationNode, setActiveAccusationNode] = useState(null);
    // Suspect Choice State (Show strategy popup before entering profile)
    const [suspectChoiceNode, setSuspectChoiceNode] = useState(null);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [showEvidenceBoard, setShowEvidenceBoard] = useState(false);
    const [boardItems, setBoardItems] = useState([]);
    const [boardConnections, setBoardConnections] = useState([]);
    const [boardNotes, setBoardNotes] = useState([]);
    const [isConfronting, setIsConfronting] = useState(false);
    const [showCutscene, setShowCutscene] = useState(false);
    const [showNewsReport, setShowNewsReport] = useState(false);
    const [showDeepWeb, setShowDeepWeb] = useState(false);
    const [showSuspectWall, setShowSuspectWall] = useState(false);
    const [showCrazyWall, setShowCrazyWall] = useState(false);
    const [activeCrazyWallNode, setActiveCrazyWallNode] = useState(null);
    const [accusedName, setAccusedName] = useState('');
    const [activeExplanation, setActiveExplanation] = useState(null); // { title: string, type: 'correct'|'incorrect', text: string, onClose: function }
    const [showQuestionHelp, setShowQuestionHelp] = useState(false);

    // Logic/Outputs State
    const [nodeOutputs, setNodeOutputs] = useState({});

    // Feedback State
    const [showFeedback, setShowFeedback] = useState(false);
    const [pendingResultData, setPendingResultData] = useState(null);
    const [isQuitting, setIsQuitting] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // Timer State
    const initialTime = (gameMetadata?.timeLimit || 15) * 60; // Convert minutes to seconds
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [timeElapsed, setTimeElapsed] = useState(0); // Track total time even if no limit

    // Scoring State
    const [score, setScore] = useState(0);
    const [scoreDelta, setScoreDelta] = useState(null);
    const [flyingPoints, setFlyingPoints] = useState(null); // Separate state for large flying animation
    const [playerObjectiveScores, setPlayerObjectiveScores] = useState({}); // { objId: score }
    const [scoredNodes, setScoredNodes] = useState(new Set());
    const [aiRequestCount, setAiRequestCount] = useState(0);
    const [userAnswers, setUserAnswers] = useState(new Set()); // Set of selected option IDs for Question Nodes
    const [revealedHints, setRevealedHints] = useState(new Set()); // Set of hint IDs
    const lastNodeId = useRef(null);

    // Confrontation state — persisted across suspect modal open/close cycles
    // pendingConfrontation: { suspect, evidenceName, remainingCount } | null
    const [pendingConfrontation, setPendingConfrontation] = useState(null);
    // Per-suspect map of confronted evidence IDs: Map<suspectId, Set<evidenceId>>
    const [suspectConfrontedIds, setSuspectConfrontedIds] = useState(new Map());

    // Called by SuspectProfile when a confrontation succeeds, right before it navigates to the story node
    const handleConfrontationSuccess = ({ suspect, evidenceName, usedIds, remainingCount, storyNodeId }) => {
        // Persist ticked evidence IDs for this suspect
        setSuspectConfrontedIds(prev => {
            const next = new Map(prev);
            next.set(suspect.id, usedIds);
            return next;
        });
        // Always store pending confrontation (even if no remaining evidence)
        // so we can intercept the story node's Continue button
        setPendingConfrontation({ suspect, evidenceName, remainingCount, storyNodeId });
    };



    // Unique animation keys – increment every time an animation is fired so
    // React always sees a new key, even if the points value is the same.
    const animCounterRef = useRef(0);
    const [scoreDeltaKey, setScoreDeltaKey] = useState(0);
    const [flyingPointsKey, setFlyingPointsKey] = useState(0);

    // Helper wrappers so every caller just calls these instead of the raw setters
    const triggerScoreDelta = (val) => {
        animCounterRef.current += 1;
        setScoreDeltaKey(animCounterRef.current);
        setScoreDelta(val);
    };
    const triggerFlyingPoints = (val) => {
        animCounterRef.current += 1;
        setFlyingPointsKey(animCounterRef.current);
        setFlyingPoints(val);
    };

    // Clear score delta and flying points after animation
    useEffect(() => {
        if (scoreDelta !== null) {
            const timer = setTimeout(() => setScoreDelta(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [scoreDeltaKey]);

    useEffect(() => {
        if (flyingPoints !== null) {
            const timer = setTimeout(() => setFlyingPoints(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [flyingPointsKey]);

    // Timer Logic
    useEffect(() => {
        if (!missionStarted || accusationResult) return;

        const timer = setInterval(() => {
            // Always track elapsed time
            setTimeElapsed(prev => prev + 1);

            // only countdown and check timeout if time limit is enabled
            if (gameMetadata?.enableTimeLimit !== false) {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setAccusationResult('timeout');
                        setShowAccuseModal(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [missionStarted, accusationResult, gameMetadata?.enableTimeLimit]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Track visited nodes in history
    useEffect(() => {
        if (currentNodeId) {
            setHistory(prev => {
                if (prev.includes(currentNodeId)) return prev;
                return [...prev, currentNodeId];
            });
        }
    }, [currentNodeId]);

    const currentNode = useMemo(() =>
        nodes.find(n => n.id === currentNodeId),
        [currentNodeId, nodes]
    );

    // ── Chirp TTS: driven by current story node + system settings + license ──
    const { settings } = useConfig();
    const { hasFeature } = useLicense();
    // Logic check for audio features
    const caseTtsEnabled = gameMetadata?.enableTTS !== false; // Default to true if not specified
    const audioEnabled = hasFeature('enable_audio_support') && caseTtsEnabled;

    const isStoryNode = currentNode?.type === 'story';
    const ttsText = (isStoryNode && audioEnabled) ? (currentNode?.data?.text || currentNode?.data?.content || '') : '';
    const ttsGender = currentNode?.data?.ttsGender || 'female';
    const ttsRegion = currentNode?.data?.ttsRegion || 'us';
    const ttsPace = currentNode?.data?.ttsPace || 'normal';
    const ttsPitch = currentNode?.data?.ttsPitch || 'normal';
    const ttsAutoPlay = (isStoryNode && audioEnabled) ? !!currentNode?.data?.ttsEnabled : false;

    // Chirp uses the Central AI API Key (Settings → AI Intelligence Engine).
    // Enable Cloud Text-to-Speech API in the same GCP project as your Gemini key.
    const chirpApiKey = settings.aiApiKey || import.meta.env.VITE_AI_API_KEY || '';
    const chirpVoiceName = currentNode?.data?.chirpVoiceName || settings.chirpVoiceName || DEFAULT_CHIRP_VOICE;


    const { play: ttsPlay, pause: ttsPause, stop: ttsStop, status: ttsStatus,
        wordIndex: ttsWordIndex, voiceName: ttsVoiceName, voicesReady: ttsVoicesReady,
        isChirpMode } = useChirpTTS({
            text: ttsText,
            gender: ttsGender,
            region: ttsRegion,
            pace: ttsPace,
            pitch: ttsPitch,
            autoPlay: ttsAutoPlay,
            apiKey: chirpApiKey,
            voiceName: chirpVoiceName,
        });
    const ttsPlaying = ttsStatus === 'playing';
    const ttsPaused = ttsStatus === 'paused';
    // ─────────────────────────────────────────────────────────────────────────

    const addLog = (msg) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 50));
    };

    const rewardObjectivePoints = (node, points) => {
        const objIds = node.data.learningObjectiveIds || (node.data.learningObjectiveId ? [node.data.learningObjectiveId] : []);
        if (objIds.length === 0) return;

        const objectives = gameMetadata?.learningObjectives || gameMetadata?.meta?.learningObjectives;

        setPlayerObjectiveScores(prev => {
            const newScores = { ...prev };
            objIds.forEach(id => {
                let displayName = id;
                if (objectives) {
                    const [catId, idxStr] = id.split(':');
                    const cat = objectives.find(c => c.id === catId);
                    if (cat && cat.objectives && cat.objectives[parseInt(idxStr)]) {
                        const objEntry = cat.objectives[parseInt(idxStr)];
                        displayName = typeof objEntry === 'string' ? objEntry : (objEntry.learningObjective || id);
                    }
                }
                newScores[displayName] = (newScores[displayName] || 0) + points;
            });
            return newScores;
        });
    };

    // Initialize Game
    const isInitialized = useRef(false);
    useEffect(() => {
        if (isInitialized.current) return;

        // Find a suitable start node logic:
        // 1. Explicit ID 'start'
        let start = nodes.find(n => n.id.toLowerCase().includes('start'));

        // 2. Look for "Briefing" or "Start" in label (Common conventions)
        if (!start) {
            start = nodes.find(n => {
                const label = (n.data?.label || '').toLowerCase();
                return label.includes('briefing') || label === 'start' || label === 'mission start';
            });
        }

        // 3. Topology: Root Nodes (sorted by visual position)
        if (!start) {
            const targets = new Set(edges.map(e => e.target));
            const roots = nodes.filter(n => !targets.has(n.id));

            if (roots.length > 0) {
                // Sort by Y (top to bottom), then X to find top-left node
                roots.sort((a, b) => {
                    const ay = a.position?.y || 0;
                    const by = b.position?.y || 0;
                    if (Math.abs(ay - by) > 100) return ay - by; // distinct rows
                    return (a.position?.x || 0) - (b.position?.x || 0);
                });
                start = roots[0];
            }
        }

        // 4. Fallback: Top-most node overall
        if (!start && nodes.length > 0) {
            const sortedAll = [...nodes].sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
            start = sortedAll[0];
        }

        if (start) {
            setCurrentNodeId(start.id);
            isInitialized.current = true;

            const isBriefing = (start.data?.label || '').toLowerCase().includes('briefing');
            if (!isBriefing) setMissionStarted(true);

            if (['media', 'suspect', 'terminal', 'evidence', 'message', 'email', 'fact'].includes(start.type)) {
                setActiveModalNode(start);
                setInventory(prev => new Set([...prev, start.id]));
            }

            addLog(`Neural sync established. Data packet received.`);
        }
    }, [nodes, edges]);

    // Scoring Logic (Visit-based)
    useEffect(() => {
        if (!currentNode || !currentNode.data.score) return;

        // Terminal, Question, etc. award score on action, not visit.
        if (['terminal', 'question', 'identify', 'lockpick', 'keypad', 'decryption', 'interrogation'].includes(currentNode.type)) return;

        if (!scoredNodes.has(currentNode.id)) {
            const awards = Number(currentNode.data.score) || 0;
            setScore(s => s + awards);
            triggerScoreDelta(awards);

            // Objective Scoring
            rewardObjectivePoints(currentNode, awards);

            setScoredNodes(prev => new Set([...prev, currentNode.id]));
            addLog(`SCORE REWARD: +${awards} Points`);
        }
    }, [currentNode, scoredNodes]);



    // Navigation Options (Outgoing Edges) with Logic Look-ahead
    // We compute this whenever state changes to "see through" logic nodes
    const options = useMemo(() => {
        if (!currentNodeId) return [];

        const rawEdges = edges.filter(e => e.source === currentNodeId);
        const resolvedOptions = [];
        const processedLogicNodes = new Set(); // Prevent infinite recursion

        // Process all immediate edges
        rawEdges.forEach(edge => {
            processedLogicNodes.clear();
            const resolved = resolveTarget(edge, { nodes, edges, inventory, nodeOutputs, history, processedLogicNodes });
            if (resolved) {
                resolvedOptions.push({
                    ...edge,
                    target: resolved.target,
                    id: edge.id + '_resolved_' + resolved.id
                });
            }
        });

        // Filter duplicates (multiple logic paths leading to same node)
        const uniqueTargets = [];
        const seenTargets = new Set();
        resolvedOptions.forEach(opt => {
            if (!seenTargets.has(opt.target)) {
                seenTargets.add(opt.target);
                uniqueTargets.push(opt);
            }
        });

        return uniqueTargets;
    }, [currentNodeId, edges, inventory, nodeOutputs, history, nodes]);



    // Helper to evaluate logic conditions
    const checkLogicCondition = (condition) => checkLogic(condition, inventory, history);



    // Effect to handle "Auto-traverse" nodes (Logic) or State Updates (Evidence)
    useEffect(() => {
        if (!currentNode) return;

        // 1. Evidence & Suspects: Auto-collect
        if (currentNode.type === 'evidence' || currentNode.type === 'suspect' || currentNode.type === 'email' || currentNode.type === 'fact') {
            const flag = currentNode.data.variableId || currentNode.data.condition || currentNode.id;
            if (!inventory.has(flag)) {
                setInventory(prev => new Set([...prev, flag]));
                if (currentNode.type === 'evidence' || currentNode.type === 'email' || currentNode.type === 'fact') {
                    const evidenceName = currentNode.data.factTitle || currentNode.data.displayName || currentNode.data.label;
                    addLog(`INTEL DISCOVERED: ${evidenceName}`);
                } else {
                    addLog(`SUSPECT ENCOUNTERED: ${currentNode.data.name}`);
                }
            }
        }

        // 2. Logic: Auto-redirect (Start Node Fallback)
        if (currentNode.type === 'logic') {
            const isTrue = evaluateLogic(currentNode);

            // Find edges
            const trueEdge = options.find(e => e.sourceHandle === 'true' || e.label === 'True' || e.label === 'true');
            const falseEdge = options.find(e => e.sourceHandle === 'false' || e.label === 'False' || e.label === 'false');

            // WHILE (Wait) Handling
            if (currentNode.data.logicType === 'while' && !isTrue) {
                return;
            }

            let nextEdge = isTrue ? trueEdge : falseEdge;

            // Fallback for unlabeled edges
            if (!nextEdge && options.length > 0) {
                // If logic handled recursively in option click, this usually won't run, 
                // but for initial load or special cases:
                nextEdge = isTrue ? options[0] : (options.length > 1 ? options[1] : null);
            }

            if (nextEdge) {
                // Immediate transition to avoid rendering the logic node screen
                // We use a minimal timeout to ensure state stability but effectively instant
                setTimeout(() => setCurrentNodeId(nextEdge.target), 0);
            } else {
                addLog(`LOGIC STOP: No path for result ${isTrue}`);
            }
        }

        // 3. Setter: Auto-update and redirect
        if (currentNode.type === 'setter') {
            const { variableId, operation, value } = currentNode.data;
            if (variableId) {
                let valToSet = value;
                if (String(value).toLowerCase() === 'true') valToSet = true;
                if (String(value).toLowerCase() === 'false') valToSet = false;

                let currentVal = nodeOutputs[variableId];
                if (currentVal === undefined && inventory.has(variableId)) currentVal = true;

                let finalVal = valToSet;
                if (operation === 'toggle') finalVal = !currentVal;
                else if (operation === 'increment') finalVal = (parseInt(currentVal) || 0) + (parseInt(value) || 1);
                else if (operation === 'decrement') finalVal = (parseInt(currentVal) || 0) - (parseInt(value) || 1);

                setNodeOutputs(prev => ({ ...prev, [variableId]: finalVal }));

                // Sync Inventory
                if (finalVal === true) setInventory(prev => new Set([...prev, variableId]));
                else if (finalVal === false) setInventory(prev => {
                    const next = new Set(prev);
                    next.delete(variableId);
                    return next;
                });

                addLog(`SETTER (Auto): ${variableId} = ${finalVal}`);
            }

            // Move Next
            const outEdges = options;
            if (outEdges.length > 0 && outEdges[0].target !== currentNodeId) {
                setCurrentNodeId(outEdges[0].target);
            }
        }

        // Reset content ready state ONLY on new node entry
        if (lastNodeId.current !== currentNode.id) {
            if (currentNode.type === 'story') {
                setIsContentReady(false);
            } else {
                setIsContentReady(true);
            }
            lastNodeId.current = currentNode.id;
        }
    }, [currentNode?.id, inventory, options, nodeOutputs]);

    // ...

    // Helper to evaluate logic for a given node
    const evaluateLogic = (node, inv = inventory, out = nodeOutputs) => evalLogic(node, inv, out);


    const handleOptionClick = (targetId) => {
        ttsStop();

        // ── PRE-ENRICH INVENTORY before calling resolveNext ──────────────────────
        // The departing node (currentNode) may have a variableId flag that needs to
        // be visible to any Logic Gate that resolveNext is about to traverse.
        // If we don't add it NOW, the Logic Gate evaluates with stale inventory and
        // routes incorrectly (e.g. going back to the parent instead of showing the
        // success message after visiting all required child story nodes).
        const preInventory = new Set(inventory);
        if (currentNode?.data?.variableId) {
            preInventory.add(currentNode.data.variableId);
        }

        // Now resolveNext sees the flag from the node we're departing
        const result = resolveNext(targetId, { nodes, edges, inventory: preInventory, nodeOutputs, history });
        const { nodeId, node, intermediateIds, localInventory, localOutputs, stateChanged, audioToPlay } = result;

        // ── Gather ALL flag IDs to commit this transition ─────────────────────────
        const flagsToAdd = new Set(preInventory); // Start from the pre-enriched base

        // Destination node + all silently-traversed intermediate nodes
        const allNodesInJump = [node, ...intermediateIds.map(id => nodes.find(n => n.id === id))].filter(Boolean);

        allNodesInJump.forEach(n => {
            flagsToAdd.add(n.id);
            if (n.data?.variableId) flagsToAdd.add(n.data.variableId);
            if ((n.type === 'evidence' || n.type === 'email') && n.data?.condition) {
                flagsToAdd.add(n.data.condition);
            }

            // Award Scores for discoveries (even silent ones)
            if (n.data?.score && !scoredNodes.has(n.id)) {
                const awards = Number(n.data.score) || 0;
                setScore(s => s + awards);
                triggerScoreDelta(awards);
                rewardObjectivePoints(n, awards);
                setScoredNodes(prev => new Set([...prev, n.id]));
                addLog(`DISCOVERY: Found ${n.data.displayName || n.data.label || 'clue'}`);
            }
        });
        intermediateIds.forEach(id => flagsToAdd.add(id));

        // ── Commit everything atomically (one single setInventory call) ────────────
        // If resolveNext mutated state via Setter nodes, merge on top of its result
        const baseInventory = stateChanged ? localInventory : inventory;
        setInventory(new Set([...baseInventory, ...flagsToAdd]));
        if (stateChanged) setNodeOutputs(localOutputs);

        if (audioToPlay) {
            const url = typeof audioToPlay === 'object' ? audioToPlay.url : audioToPlay;
            const volume = typeof audioToPlay === 'object' ? (audioToPlay.volume ?? 0.5) : 0.5;
            setAudioSource(url);
            setAudioVolume(volume);
            addLog(`AUDIO: Background track started.`);
        } else if (node && node.data?.bgMusicUrl) {
            setAudioSource(node.data.bgMusicUrl);
            setAudioVolume(node.data.bgMusicVolume ?? 0.5);
            addLog(`AUDIO: Background track changed.`);
        }

        // Add current and intermediates to history
        setHistory(prev => {
            const newHistory = [...prev, currentNodeId];
            return [...newHistory, ...intermediateIds];
        });

        setCurrentNodeId(nodeId);


        // Handle Type-Specific UI logic
        if (node && node.type === 'suspect') {
            setSuspectChoiceNode(node);
        } else if (node && ['evidence', 'terminal', 'message', 'media', 'notification', 'question', 'lockpick', 'decryption', 'keypad', 'interrogation', 'threed', 'email', 'fact'].includes(node.type)) {
            setActiveModalNode(node);
            if (node.type === 'question') setUserAnswers(new Set());
        } else if (node && node.type === 'cutscene') {
            setShowCutscene(true);
        } else if (node && node.type === 'deepweb') {
            setShowDeepWeb(true);
        } else if (node && node.type === 'crazywall') {
            setActiveCrazyWallNode(node);
            setShowCrazyWall(true);
        } else if (node && node.type === 'identify') {
            setActiveAccusationNode(node);
            setShowAccuseModal(true);
            setAccusationResult(null);
        } else {
            setActiveModalNode(null);
            setIsConfronting(false);
        }
    };

    const handleTerminalSubmit = (input, forceSuccess = false) => {
        // specific for terminal node
        if (!activeModalNode || activeModalNode.type !== 'terminal') return;

        const expected = activeModalNode.data.command || '';
        const isLegacyMatch = expected && input.trim() === expected.trim();

        if (forceSuccess || isLegacyMatch || input.includes('grep')) {
            addLog(`COMMAND SUCCESS: ${input}`);

            const next = options[0];
            if (next) {
                // Add to inventory that we beat this terminal
                // Add to inventory that we beat this terminal
                const successIds = [activeModalNode.id];
                if (activeModalNode.data.variableId) successIds.push(activeModalNode.data.variableId);
                setInventory(prev => new Set([...prev, ...successIds]));
                setNodeOutputs(prev => ({ ...prev, [activeModalNode.id]: input, [activeModalNode.data.label]: input }));

                // Award Score for Terminal Hack
                if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                    const awardedS = Number(activeModalNode.data.score) || 0;
                    setScore(s => s + awardedS);
                    triggerScoreDelta(awardedS);
                    triggerFlyingPoints(awardedS);

                    // Objective Scoring
                    rewardObjectivePoints(activeModalNode, awardedS);

                    setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                    addLog(`HACK REWARD: +${awardedS} Points`);
                }

                // Close modal and move to next
                setActiveModalNode(null); // Close first
                handleOptionClick(next.target);
            }
        } else {
            addLog(`COMMAND FAILED: Access Denied.`);
            // Penalty
            const penalty = Number(activeModalNode.data.penalty) || 0;
            if (penalty > 0) {
                setScore(s => s - penalty);
                triggerScoreDelta(-penalty);
                triggerFlyingPoints(-penalty);
                addLog(`HACK PROTECTION DETECTED: -${penalty} Points`);

                rewardObjectivePoints(activeModalNode, -penalty);
            }
        }
    };

    const handleAccuse = (suspect) => {
        setAccusedName(suspect.data.name || 'Unknown');
        // Logic to check if correct.
        let isCorrect = false;

        if (activeAccusationNode && activeAccusationNode.data) {
            // Updated Logic: Check against the Identify Node's 'correctCulpritName'
            const correctName = (activeAccusationNode.data.culpritName || "").toLowerCase().trim();
            const suspectName = (suspect.data.name || "").toLowerCase().trim();

            if (correctName && suspectName.includes(correctName)) {
                isCorrect = true;
            } else if (correctName === suspectName) {
                isCorrect = true;
            }
        } else {
            // Fallback Legacy Logic
            isCorrect = suspect.data.isKiller === true || suspect.data.isCulprit === true;

            // Hardcoded check for the sample case "The Digital Insider"
            if (suspect.data.name?.includes('Ken Sato') && !nodes.some(n => n.data.isKiller)) {
                isCorrect = true;
            }
        }

        if (isCorrect) {
            if (activeAccusationNode && activeAccusationNode.data.score) {
                const awardedS = Number(activeAccusationNode.data.score) || 0;
                setScore(s => s + awardedS);
                triggerScoreDelta(awardedS);
                triggerFlyingPoints(awardedS);
                addLog(`CASE CLOSED: +${awardedS} Points`);

                rewardObjectivePoints(activeAccusationNode, awardedS);
            }
            setAccusationResult('success');
        } else {
            if (activeAccusationNode && activeAccusationNode.data.penalty) {
                const penalty = Number(activeAccusationNode.data.penalty) || 0;
                setScore(s => s - penalty);
                triggerScoreDelta(-penalty);
                triggerFlyingPoints(-penalty);
                addLog(`WRONG ACCUSATION: -${penalty} Points`);

                rewardObjectivePoints(activeAccusationNode, -penalty);
            }
            setAccusationResult('failure');
        }
    };

    const handleQuestionSubmit = () => {
        if (!activeModalNode || activeModalNode.type !== 'question') return;

        const options = activeModalNode.data.options || [];
        const correctIds = new Set(options.filter(o => o.isCorrect).map(o => o.id));
        const selectedIds = userAnswers;

        // Check if sets are equal
        const isCorrect = correctIds.size === selectedIds.size &&
            [...correctIds].every(id => selectedIds.has(id));

        if (isCorrect) {
            addLog(`QUESTION SOLVED: ${activeModalNode.data.label}`);

            const rawScore = Number(activeModalNode.data.score) || 0;

            // Always trigger feedback animation on success for feel-good factor
            // If score is 0, show a nominal +100 for visual impact if it's a major gate
            triggerFlyingPoints(rawScore || 100);

            // Award actual points only once
            if (rawScore > 0 && !scoredNodes.has(activeModalNode.id)) {
                setScore(s => s + rawScore);
                triggerScoreDelta(rawScore);

                // Objective Scoring (Reward)
                rewardObjectivePoints(activeModalNode, rawScore);

                setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                addLog(`QUIZ REWARD: +${rawScore} Points`);
            }

            // Collect explanations from correct options (use generic fallback if none provided)
            const explanations = options
                .filter(o => o.isCorrect && o.explanation && o.explanation.trim())
                .map(o => o.explanation);

            const explanationText = explanations.length > 0
                ? explanations.join("\n\n")
                : "You identified the correct answer. Well done, detective.";

            // Capture node id before state is cleared to avoid stale closure
            const sourceNodeId = activeModalNode.id;

            // Give the "flying points" a lot of time to shine before the HUD appears
            setTimeout(() => {
                setActiveExplanation({
                    title: "Excellent",
                    type: "correct",
                    text: explanationText,
                    onClose: () => {
                        setActiveExplanation(null);
                        // Advance to next node
                        const nodeOptions = edges.filter(e => e.source === sourceNodeId);
                        setActiveModalNode(null);
                        if (nodeOptions.length > 0) {
                            handleOptionClick(nodeOptions[0].target);
                        }
                    }
                });
            }, 1500);
        } else {
            addLog(`QUESTION FAILED: Incorrect Answer.`);

            // Collect explanations from selected incorrect options (use generic fallback if none provided)
            const explanations = options
                .filter(o => selectedIds.has(o.id) && o.explanation && o.explanation.trim())
                .map(o => o.explanation);

            const explanationText = explanations.length > 0
                ? explanations.join("\n\n")
                : "That's not the right answer. Review the evidence and try again.";

            setActiveExplanation({
                title: "Sorry! That was not the correct answer",
                type: "incorrect",
                text: explanationText,
                onClose: () => setActiveExplanation(null)
            });

            // Apply penalty if defined
            const penalty = Number(activeModalNode.data.penalty) || 0;
            if (penalty > 0) {
                setScore(s => s - penalty);
                triggerScoreDelta(-penalty);
                triggerFlyingPoints(-penalty);
                addLog(`QUIZ PROTECTION: -${penalty} Points`);

                rewardObjectivePoints(activeModalNode, -penalty);
            }
        }
    };

    const handleRevealHint = (hint) => {
        if (revealedHints.has(hint.id)) return;

        // Deduct points
        const penalty = Number(hint.penalty) || 0;
        setScore(s => s - penalty);
        triggerScoreDelta(-penalty);

        // Track revealed hint
        setRevealedHints(prev => new Set([...prev, hint.id]));

        // Log it
        addLog(`HINT USED: -${hint.penalty} Pts deducted.`);
    };

    const getAvatarColor = (name) => {
        const colors = [
            'from-red-500 to-orange-500',
            'from-blue-500 to-cyan-500',
            'from-green-500 to-emerald-500',
            'from-purple-500 to-pink-500',
            'from-yellow-500 to-amber-500',
            'from-indigo-500 to-violet-500',
        ];
        const str = String(name || 'Unk');
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // Finalize Game and Report
    const handleFinish = () => {
        const timeSpent = timeElapsed;
        const resultData = {
            score,
            objectiveScores: playerObjectiveScores,
            outcome: accusationResult || 'aborted',
            timeSpentSeconds: timeSpent
        };

        setPendingResultData(resultData);
        setShowFeedback(true);
        ttsStop();
    };

    const handleFeedbackSubmit = (feedback) => {
        const finalData = {
            ...pendingResultData,
            feedback
        };

        setShowFeedback(false);
        if (onGameEnd) {
            onGameEnd(finalData);
        } else {
            onClose();
        }
    };

    const handleFeedbackSkip = () => {
        setShowFeedback(false);
        if (onGameEnd) {
            onGameEnd(pendingResultData);
        } else {
            onClose();
        }
    };

    const handleAbort = () => {
        const timeSpent = timeElapsed;
        setPendingResultData({
            score,
            objectiveScores: playerObjectiveScores,
            outcome: 'aborted',
            timeSpentSeconds: timeSpent
        });
        setIsQuitting(true);
        setShowFeedback(true);
        ttsStop();
        setShowQuitConfirm(false);
    };

    const handleCloseModal = React.useCallback(() => {
        if (!activeModalNode) return;

        const MODAL_TYPES = ['suspect', 'evidence', 'terminal', 'message', 'media', 'notification', 'question', 'lockpick', 'decryption', 'keypad', 'identify', 'interrogation', 'threed', 'email'];
        const SKIP_TYPES = ['logic', 'setter', 'music', ...MODAL_TYPES];

        // If the modal node is the current navigational node, closing it should revert to the previous narrative
        if (activeModalNode.id === currentNodeId) {
            if (history.length > 0) {
                // Find the last node in history that is a "STABLE" narrative node (Story)
                // We skip logic nodes AND other modal nodes to find the background narrative
                const backtrack = [...history].reverse();
                const lastStoryNodeId = backtrack.find(id => {
                    const node = nodes.find(n => n.id === id);
                    return node && node.type === 'story' && node.id !== activeModalNode.id;
                });

                if (lastStoryNodeId) {
                    setCurrentNodeId(lastStoryNodeId);
                    // Clean up history to before that story node
                    const targetIndex = history.lastIndexOf(lastStoryNodeId);
                    if (targetIndex !== -1) {
                        setHistory(prev => prev.slice(0, targetIndex));
                    }
                } else {
                    // Fallback: If no story node found in history, try any non-skip node
                    const lastStableNodeId = backtrack.find(id => {
                        const node = nodes.find(n => n.id === id);
                        return node && !SKIP_TYPES.includes(node.type) && node.id !== activeModalNode.id;
                    });

                    if (lastStableNodeId) {
                        setCurrentNodeId(lastStableNodeId);
                        const targetIndex = history.lastIndexOf(lastStableNodeId);
                        setHistory(prev => prev.slice(0, targetIndex));
                    } else if (history.length > 0) {
                        // Desperation: Go back one step regardless
                        setCurrentNodeId(history[history.length - 1]);
                        setHistory(prev => prev.slice(0, -1));
                    }
                }
            } else {
                // No history! Try to find the nearest story node as a narrative home
                const storyNode = nodes.find(n => n.type === 'story');
                if (storyNode && storyNode.id !== activeModalNode.id) {
                    setCurrentNodeId(storyNode.id);
                }
            }
        }

        setActiveModalNode(null);
        setIsConfronting(false);
    }, [activeModalNode, currentNodeId, history, nodes, setCurrentNodeId, setHistory]);

    const handleGoBack = React.useCallback(() => {
        ttsStop();
        if (history.length > 0) {
            const newHistory = [...history];
            const prevId = newHistory.pop();
            setHistory(newHistory);
            setCurrentNodeId(prevId);

            const node = nodes.find(n => n.id === prevId);
            if (node && ['suspect', 'evidence', 'terminal', 'message', 'media', 'notification', 'question', 'lockpick', 'decryption', 'keypad', 'interrogation', 'threed', 'email', 'fact'].includes(node.type)) {
                setActiveModalNode(node);
                if (node.type === 'question') setUserAnswers(new Set());
            } else if (node && node.type === 'cutscene') {
                setShowCutscene(true);
            } else if (node && node.type === 'deepweb') {
                setShowDeepWeb(true);
            } else if (node && node.type === 'crazywall') {
                setActiveCrazyWallNode(node);
                setShowCrazyWall(true);
            } else if (node && node.type === 'identify') {
                setActiveAccusationNode(node);
                setShowAccuseModal(true);
                setAccusationResult(null);
            } else {
                setActiveModalNode(null);
                setIsConfronting(false);
                setShowCutscene(false);
                setShowDeepWeb(false);
                setShowCrazyWall(false);
                setShowAccuseModal(false);
            }
            return true;
        }
        return false;
    }, [history, nodes, setCurrentNodeId, setHistory]);

    const handleBackAction = React.useCallback(() => {
        if (showFeedback) return false;

        // Priority 1: If mission is active, browser back should always warn about progress loss
        if (missionStarted && !showQuitConfirm) {
            setShowQuitConfirm(true);
            return true;
        }

        // Priority 2: Closing UI layers / Overlays (If mission not started or we are already confirming)
        if (showQuitConfirm) { setShowQuitConfirm(false); return true; }
        if (activeExplanation) {
            if (activeExplanation.onClose) activeExplanation.onClose();
            setActiveExplanation(null);
            return true;
        }
        if (showQuestionHelp) { setShowQuestionHelp(false); return true; }
        if (zoomedImage) { setZoomedImage(null); return true; }
        if (activeModalNode) { handleCloseModal(); return true; }
        if (showAccuseModal) { setShowAccuseModal(false); return true; }
        if (showCrazyWall) { setShowCrazyWall(false); return true; }
        if (showSuspectWall) { setShowSuspectWall(false); return true; }
        if (showDeepWeb) { setShowDeepWeb(false); return true; }
        if (showEvidenceBoard) { setShowEvidenceBoard(false); return true; }
        if (showNewsReport) { setShowNewsReport(false); return true; }
        if (showCutscene) { setShowCutscene(false); return true; }

        return false; // Actually leave the game
    }, [
        activeExplanation, showQuitConfirm, showQuestionHelp, zoomedImage,
        activeModalNode, showAccuseModal, showCrazyWall, showSuspectWall,
        showDeepWeb, showEvidenceBoard, showNewsReport, showCutscene,
        showFeedback, missionStarted, handleCloseModal, history.length, handleGoBack
    ]);

    // -- BROWSER BACK BUTTON SUPPORT --
    const backActionRef = useRef(null);
    backActionRef.current = handleBackAction;

    useEffect(() => {
        // Push a dummy state to trap the first "Back" button press
        // This only happens once on mount
        window.history.pushState({ gameSession: true }, "");

        const onPopState = (e) => {
            if (backActionRef.current) {
                const handled = backActionRef.current();
                if (handled) {
                    // Since we handled it and stayed in the game, push state again to remain trapped
                    window.history.pushState({ gameSession: true }, "");
                } else {
                    // If not handled (nothing left to back out of), proceed to exit
                    onClose();
                }
            }
        };

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [onClose]);

    // Helper to get nice labels for buttons
    const getEdgeLabel = (node) => {
        if (!node) return "Continue";
        if (node.type === 'story') return node.data.label || "Start Dialogue";
        if (node.type === 'evidence') return `Analyze Evidence: ${node.data.label}`;
        if (node.type === 'terminal') return `Command Interface: ${node.data.label}`;
        if (node.type === 'message') return `Decrypted Msg: ${node.data.label}`;
        if (node.type === 'question') return `Decision: ${node.data.label}`;
        if (node.type === 'email') return `Read Email: ${node.data.subject || node.data.label}`;
        if (node.type === 'action') return node.data.label || "Execute Action";
        return `Navigate to ${node.data.label || 'Next Objective'}`;
    }



    // Render Node Content (Background / Story)
    const renderContent = () => {
        if (!currentNode) return <div className="text-zinc-500 animate-pulse">Initializing Neural Link...</div>;

        const { type, data } = currentNode;

        if (type === 'action') {
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <MousePointerClick className="w-12 h-12 text-indigo-400 animate-pulse" />
                        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 uppercase tracking-tighter drop-shadow-2xl">
                            {data.label || "Requested Action"}
                        </h2>
                    </div>
                    <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-md border-t-4 border-t-indigo-600 shadow-2xl">
                        <p className="text-zinc-400 text-center uppercase tracking-[0.2em] text-xs font-bold">
                            Interactive node active // proceed with selection below
                        </p>
                    </Card>
                </div>
            )
        }

        if (type !== 'story') {
            return (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <div className="animate-pulse text-zinc-500 text-sm tracking-widest uppercase font-mono">
                        secure link established // accessing subsystem...
                    </div>
                </div>
            )
        }



        // Story Node (Briefing or Narrative)
        const isBriefing = (data?.label || "").toLowerCase().includes('briefing') || history.length === 0;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                {isBriefing && (
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-sm"
                        >
                            TOP SECRET // CLEARANCE LEVEL 5
                        </motion.div>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 uppercase tracking-tighter drop-shadow-2xl"
                        >
                            {data.label}
                        </motion.h1>
                    </div>
                )}

                {!isBriefing && (
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <FileText className="w-12 h-12 text-indigo-400 animate-pulse" />
                        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 uppercase tracking-tighter drop-shadow-2xl">{data.label}</h2>
                    </div>
                )}

                <Card className="bg-zinc-900/40 border-zinc-800/50 p-8 backdrop-blur-xl border-t-4 border-t-red-600 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:border-zinc-700/50 transition-colors duration-500">
                    <p className="text-zinc-200 leading-loose whitespace-pre-wrap text-lg md:text-xl font-light font-mono">
                        {(ttsAutoPlay || ttsPlaying || ttsPaused || ttsStatus === 'done') ? (
                            <WordHighlightText
                                text={data.text || data.content || ''}
                                wordIndex={ttsWordIndex}
                                onComplete={() => setIsContentReady(true)}
                            />
                        ) : (
                            <TypewriterText
                                text={data.text || data.content || ''}
                                onComplete={() => setIsContentReady(true)}
                            />
                        )}
                    </p>
                </Card>
            </div>
        );
    };

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const [audioSource, setAudioSource] = useState(null);
    const [audioVolume, setAudioVolume] = useState(0.5);
    const audioRef = useRef(null);

    // Audio Control Loop
    useEffect(() => {
        if (!audioRef.current || !audioSource) return;

        audioRef.current.src = audioSource;
        audioRef.current.loop = true;
        audioRef.current.volume = isMuted ? 0 : audioVolume;

        if (!isMuted) {
            audioRef.current.play().catch(e => console.log("Audio autoplay blocked:", e));
        }
    }, [audioSource]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = isMuted ? 0 : audioVolume;
        if (isMuted) audioRef.current.pause();
        else if (audioSource) audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }, [isMuted, audioSource, audioVolume]);

    // Handle Music Nodes & Node-specific background music
    useEffect(() => {
        if (!currentNode) return;

        if (currentNode.type === 'music') {
            if (currentNode.data.url) {
                setAudioSource(currentNode.data.url);
                setAudioVolume(currentNode.data.volume ?? 0.5);
                addLog(`AUDIO: Now playing background track.`);
            }

            // Auto advance
            const edgesOut = options.filter(e => e.source === currentNode.id);
            if (edgesOut.length > 0) {
                setTimeout(() => handleOptionClick(edgesOut[0].target), 500);
            }
        } else if (currentNode.data?.bgMusicUrl) {
            setAudioSource(currentNode.data.bgMusicUrl);
            setAudioVolume(currentNode.data.bgMusicVolume ?? 0.5);
            addLog(`AUDIO: Background track changed.`);
        }
    }, [currentNode?.id]);

    return (
        <div className={`${isSimultaneous ? 'absolute w-full h-full' : 'fixed inset-0 z-50'} bg-black flex flex-col font-sans overflow-hidden`}>
            <BackgroundEffect isSimultaneous={isSimultaneous} />
            {/* Audio Player (Hidden) */}
            <audio ref={audioRef} />

            {/* Header */}
            <div className="h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-3 md:px-6 shrink-0 relative z-[600]">
                <div className="flex items-center gap-2 md:gap-3">
                    {history.length > 0 && !showFeedback && (
                        <button
                            onClick={handleGoBack}
                            className="px-3 md:px-5 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all duration-500 rounded-2xl border border-indigo-500/20 hover:border-indigo-400 shadow-xl group flex items-center gap-2 md:gap-3 active:scale-95 whitespace-nowrap"
                            title="Go Back"
                        >
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/40 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </div>
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Previous Scene</span>
                        </button>
                    )}
                    <div className="bg-red-600 px-1.5 md:px-2 py-1 rounded text-[8px] md:text-xs font-bold text-white uppercase tracking-widest animate-pulse shrink-0">
                        Active
                    </div>
                    {/* Score Display - Enhanced UI */}
                    <div className="relative">
                        <AnimatePresence>
                            {scoreDelta !== null && (
                                <motion.div
                                    key={scoreDeltaKey}
                                    initial={{ opacity: 0, y: 4, scale: 0.7 }}
                                    animate={{ opacity: 1, y: -38, scale: 1 }}
                                    exit={{ opacity: 0, y: -64, scale: 0.85 }}
                                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-[110]"
                                >
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-sm backdrop-blur-md border shadow-lg whitespace-nowrap
                                        ${scoreDelta > 0
                                            ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200 shadow-indigo-900/40'
                                            : 'bg-rose-500/20 border-rose-400/40 text-rose-300 shadow-rose-900/40'
                                        }`}
                                    >
                                        <span className="text-base">{scoreDelta > 0 ? '▲' : '▼'}</span>
                                        <span>{scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.div
                            layout
                            className="flex items-center gap-2 md:gap-4 px-2 md:px-5 py-1.5 md:py-2.5 bg-zinc-900/40 border border-amber-500/20 rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-xl group hover:border-amber-500/40 transition-all duration-500 overflow-hidden relative"
                        >
                            {/* Animated background shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                            <div className="relative hidden sm:block">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.15, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0 bg-amber-500 blur-xl opacity-20"
                                />
                                <div className="relative p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-inner group-hover:rotate-6 transition-transform duration-300">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[7px] md:text-[9px] text-amber-500/50 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] leading-none mb-0.5 md:mb-1">Score</span>
                                <div className="flex items-center gap-1">
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={score}
                                            initial={{ y: 15, opacity: 0, filter: 'blur(5px)' }}
                                            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                            exit={{ y: -15, opacity: 0, filter: 'blur(5px)' }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="text-lg md:text-2xl font-black text-white font-mono tracking-wider drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                        >
                                            {score}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span className="text-[8px] md:text-[10px] font-bold text-amber-500/40 self-end mb-0.5">PTS</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {gameMetadata?.enableTimeLimit !== false && (
                        <div className={`${isSimultaneous ? 'relative mx-auto mt-2' : 'fixed top-2 left-1/2 -translate-x-1/2'} px-4 py-1.5 md:px-8 md:py-3 rounded-xl border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-[601] flex items-center gap-2 md:gap-3 backdrop-blur-xl transition-all duration-300 ${timeLeft < 60 || !missionStarted ? 'bg-red-950/90 border-red-500 text-red-500' : 'bg-black/90 border-indigo-500 text-indigo-400'}`}>
                            <Clock className={`w-4 h-4 md:w-6 md:h-6 ${timeLeft < 60 ? 'animate-pulse' : ''}`} />
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[7px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em] opacity-80 mb-0.5 md:mb-1">
                                    {missionStarted ? "Time" : "Timer"}
                                </span>
                                <span className="font-mono text-xl md:text-3xl font-black tracking-widest drop-shadow-lg">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5 md:gap-3">
                    {/* ── TTS Narrator Control (story nodes only, requires enable_audio_support license) ── */}
                    {isStoryNode && ttsText && audioEnabled && (
                        <motion.div
                            key={currentNodeId + '-tts'}
                            initial={{ opacity: 0, scale: 0.85, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.85, width: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="flex items-center gap-1.5 bg-zinc-900/60 border border-blue-500/20 rounded-full px-2 py-1 overflow-hidden mr-1"
                        >
                            {/* Mini waveform */}
                            <div className="flex items-center gap-[2px] h-4">
                                {[0.4, 0.8, 0.5, 1.0, 0.6, 0.9, 0.4].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-[2px] rounded-full bg-blue-400"
                                        animate={ttsPlaying ? {
                                            scaleY: [h * 0.3, h, h * 0.5, h * 0.9, h * 0.3],
                                        } : { scaleY: 0.2 }}
                                        transition={{
                                            duration: 0.7,
                                            delay: i * 0.07,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                        style={{ height: 14, transformOrigin: 'center' }}
                                    />
                                ))}
                            </div>

                            {/* Voice label + Chirp badge — shown only on md+ screens */}
                            <span className="hidden md:flex items-center gap-1 text-[8px] font-black text-blue-400/70 uppercase tracking-widest whitespace-nowrap max-w-[110px] truncate">
                                {isChirpMode && (
                                    <span className="text-[7px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black tracking-normal shrink-0">Chirp</span>
                                )}
                                {ttsVoiceName ? ttsVoiceName.split('-').pop() || ttsVoiceName.split(' ')[0] : 'Narrator'}
                            </span>

                            {/* Play / Pause button */}
                            <motion.button
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); ttsPlaying ? ttsPause() : ttsPlay(); }}
                                disabled={!ttsVoicesReady && !ttsPlaying}
                                title={ttsPlaying ? 'Pause narration' : ttsPaused ? 'Resume narration' : 'Play narration'}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 border ${ttsPlaying
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                    : ttsPaused
                                        ? 'bg-amber-600/90 border-amber-500 text-white'
                                        : 'bg-zinc-800 border-zinc-700 text-blue-400 hover:bg-blue-900/40 hover:border-blue-600'
                                    } disabled:opacity-40`}
                            >
                                {ttsPlaying
                                    ? <Pause className="w-3 h-3 fill-current" />
                                    : <Play className="w-3 h-3 fill-current translate-x-px" />}
                            </motion.button>

                            {/* Stop — only if active */}
                            {(ttsPlaying || ttsPaused) && (
                                <motion.button
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 28 }}
                                    exit={{ opacity: 0, width: 0 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); ttsStop(); }}
                                    title="Stop narration"
                                    className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-800 transition-all shrink-0"
                                >
                                    <Square className="w-3 h-3 fill-current" />
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {/* Audio Controls */}
                    {audioSource && (
                        <motion.div
                            className="flex items-center gap-0 md:gap-1 bg-zinc-900/40 border border-white/5 rounded-full px-1 overflow-hidden"
                            initial="initial"
                            whileHover="hover"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-8 h-8 md:w-10 md:h-10 transition-colors shrink-0 ${isMuted ? "text-red-500 hover:bg-red-500/10" : "text-green-500 hover:bg-green-500/10"}`}
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
                            </Button>

                            <motion.div
                                variants={{
                                    initial: { width: 0, opacity: 0, marginLeft: 0 },
                                    hover: { width: "auto", opacity: 1, marginLeft: 8, marginRight: 12 }
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="flex items-center shrink-0"
                            >
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={audioVolume}
                                    onChange={(e) => {
                                        setAudioVolume(parseFloat(e.target.value));
                                        if (isMuted && parseFloat(e.target.value) > 0) setIsMuted(false);
                                    }}
                                    className="w-16 md:w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </motion.div>
                        </motion.div>
                    )}


                    {/* Evidence Board Button */}
                    {missionStarted && (
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    const hubNode = nodes.find(n =>
                                        n.type === 'story' &&
                                        (n.data?.label?.toLowerCase().includes('hub') || n.data?.label?.toLowerCase().includes('investigation'))
                                    );
                                    if (hubNode) {
                                        handleOptionClick(hubNode.id);
                                        setShowEvidenceBoard(false);
                                        setActiveModalNode(null);
                                    } else {
                                        // Fallback: search for first node with suspect options
                                        const suspectedHub = nodes.find(n =>
                                            edges.filter(e => e.source === n.id)
                                                .some(e => nodes.find(tn => tn.id === e.target)?.type === 'suspect')
                                        );
                                        if (suspectedHub) handleOptionClick(suspectedHub.id);
                                    }
                                }}
                                className="relative group bg-zinc-900/90 border border-red-500/20 text-red-500 hover:text-red-400 px-2 md:px-3 h-8 md:h-9 shadow-lg shadow-red-900/20 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl-full opacity-50 pulse-simple" />
                                <User className="w-3 h-3 md:w-4 md:h-4 md:mr-2 relative z-10" />
                                <span className="relative z-10 uppercase font-black text-[8px] md:text-[10px] tracking-tighter md:tracking-widest">Hub</span>
                            </Button>

                        </div>
                    )}

                    {missionStarted && (
                        <Button
                            variant="outline"
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 uppercase tracking-wider text-[10px] md:text-xs font-bold px-2 md:px-3 h-8 md:h-9"
                            onClick={() => { setShowAccuseModal(true); setAccusationResult(null); }}
                        >
                            <ShieldAlert className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Identify Culprit</span>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="w-8 h-8 md:w-10 md:h-10" onClick={() => {
                        if (activeModalNode) handleCloseModal();
                        else if (showSuspectWall) setShowSuspectWall(false);
                        else if (showEvidenceBoard) setShowEvidenceBoard(false);
                        else if (showAccuseModal) setShowAccuseModal(false);
                        else if (zoomedImage) setZoomedImage(null);
                        else {
                            setShowQuitConfirm(true);
                        }
                    }}>
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                </div>
            </div>

            {/* Content Area - Scrolls vertically */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentNode?.id || 'loading'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`${options.some(e => nodes.find(n => n.id === e.target)?.type === 'suspect') ? 'max-w-none w-full px-2 md:px-8' : 'max-w-4xl mx-auto w-full'} pb-20`}
                    >
                        {renderContent()}

                        {/* Begin Mission Button (Only for Briefing Node) */}
                        {currentNode && ((currentNode.data?.label || "").toLowerCase().includes('briefing') || history.length === 0) && !missionStarted ? (
                            <div className="mt-12 flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                                <Button
                                    onClick={() => setMissionStarted(true)}
                                    className="px-8 py-5 text-base font-black tracking-[0.3em] bg-red-600 hover:bg-red-500 text-white border-t border-white/20 shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-105 transition-all duration-300 uppercase relative group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <span className="relative z-10 flex items-center gap-3">
                                        Begin Mission
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        ) : (
                            /* Actions / Choices */
                            // Only show actions if content is ready (text finished typing)
                            // AND if it's not a Logic/Music node (which should be auto-traversing)
                            isContentReady && !['logic', 'music'].includes(currentNode.type) && (
                                <div className="mt-8 animate-in fade-in zoom-in-95 duration-500">
                                    {/* ── Confrontation story node: replace normal buttons ── */}
                                    {pendingConfrontation?.storyNodeId === currentNodeId ? (() => {
                                        // Find where "Continue" would normally go
                                        const continueTarget = options[0]?.target ?? null;
                                        return (
                                            <div className="flex flex-col gap-3">
                                                {/* Present More Evidence — only if remainingCount > 0 */}
                                                {pendingConfrontation.remainingCount > 0 && (
                                                    <motion.button
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.05 }}
                                                        onClick={() => {
                                                            const susp = pendingConfrontation.suspect;
                                                            setPendingConfrontation(null);
                                                            setActiveModalNode({ ...susp, _initialTab: 'evidence' });
                                                        }}
                                                        className="w-full text-left rounded-2xl cursor-pointer p-4 flex items-center gap-4
                                                            bg-gradient-to-r from-amber-500/30 via-amber-400/10 to-transparent
                                                            border border-amber-500/40 hover:border-amber-400
                                                            hover:from-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]
                                                            transition-all duration-500 group relative overflow-hidden shadow-xl"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                        <div className="rounded-xl bg-black/40 p-2.5 border border-white/10 group-hover:rotate-6 transition-transform shrink-0">
                                                            <Briefcase className="w-5 h-5 text-amber-400 transition-colors duration-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col">
                                                            <div className="text-[8px] font-black tracking-[0.2em] uppercase mb-1 text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                MORE EVIDENCE AVAILABLE
                                                            </div>
                                                            <div className="text-amber-100 drop-shadow-md text-base md:text-lg font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] truncate">
                                                                Present More Evidence
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shrink-0">
                                                            <ArrowRight className="w-3 h-3 text-amber-400 transition-all" />
                                                        </div>
                                                    </motion.button>
                                                )}

                                                {/* No, I'm good for now / Continue — acts as the normal Continue */}
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: pendingConfrontation.remainingCount > 0 ? 0.12 : 0.05 }}
                                                    onClick={() => {
                                                        setPendingConfrontation(null);
                                                        if (continueTarget) handleOptionClick(continueTarget);
                                                    }}
                                                    className={`w-full text-left rounded-2xl cursor-pointer p-3 flex items-center gap-3 md:gap-4
                                                        transition-all duration-500 group relative overflow-hidden
                                                        ${pendingConfrontation.remainingCount === 0
                                                            ? 'bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-400/60 hover:bg-indigo-600/30'
                                                            : 'bg-zinc-950/40 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/60'
                                                        }`}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                    <div className={`rounded-xl p-3 border border-white/10 group-hover:rotate-6 transition-transform shrink-0
                                                        ${pendingConfrontation.remainingCount === 0 ? 'bg-indigo-500/10' : 'bg-zinc-950/40'}`}
                                                    >
                                                        <ArrowRight className={`w-4 h-4 transition-colors duration-500
                                                            ${pendingConfrontation.remainingCount === 0
                                                                ? 'text-indigo-400 group-hover:text-indigo-300'
                                                                : 'text-zinc-400 group-hover:text-indigo-400'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
                                                        {pendingConfrontation.remainingCount === 0 ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-indigo-400/70 group-hover:text-indigo-300/90 transition-colors mb-0.5">
                                                                    Proceed
                                                                </span>
                                                                <span className="text-indigo-200 group-hover:text-white text-sm md:text-base font-black tracking-wide uppercase transition-all duration-500">
                                                                    Continue
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-zinc-400 group-hover:text-white text-sm md:text-base font-bold tracking-tight truncate transition-all duration-500">
                                                                No, I'm good for now
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shrink-0">
                                                        <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-all" />
                                                    </div>
                                                </motion.button>
                                            </div>
                                        );
                                    })() : options.some(e => nodes.find(n => n.id === e.target)?.type === 'suspect') ? (
                                        // Linked Grid Layout for Suspects in Hub
                                        <SuspectHubGrid
                                            options={options}
                                            nodes={nodes}
                                            edges={edges}
                                            onSuspectClick={(targetNode) => setSuspectChoiceNode(targetNode)}
                                            getAvatarColor={getAvatarColor}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {(() => {
                                                // Prepare combined list of interactables (Actions defined in data + Generic Edges)
                                                const actions = currentNode.data?.actions || [];
                                                const usedEdges = new Set();

                                                // 1. Explicit Actions
                                                const actionItems = actions.map((action, actionIdx) => {
                                                    let edge = options.find(e => e.sourceHandle === action.id);

                                                    // Intelligent Fallback:
                                                    // 1. Map to default edge if not explicitly wired.
                                                    if (!edge) {
                                                        const defaultEdge = options.find(e =>
                                                            (!e.sourceHandle || e.sourceHandle === 'null') &&
                                                            !usedEdges.has(e.id)
                                                        );

                                                        if (defaultEdge) {
                                                            edge = defaultEdge;
                                                        } else if (actions.length === 1 && options.length === 1 && !usedEdges.has(options[0].id)) {
                                                            // Desperation Fallback: 1 Action, 1 Edge -> Just Link Them
                                                            edge = options[0];
                                                        } else if (options[actionIdx] && !usedEdges.has(options[actionIdx].id)) {
                                                            // Index Fallback: If AI just listed edges in order, map them by index
                                                            edge = options[actionIdx];
                                                        }
                                                    }

                                                    if (edge) usedEdges.add(edge.id);
                                                    return {
                                                        isAction: true,
                                                        id: action.id,
                                                        label: action.label,
                                                        variant: action.variant,
                                                        target: edge ? edge.target : null,
                                                        edgeId: edge ? edge.id : null
                                                    };
                                                });

                                                // 2. Remaining Edges (Default/Standard Exits)
                                                // STRICT MODE: If custom actions exist, hide generic buttons.
                                                const standardItems = (actions.length > 0)
                                                    ? []
                                                    : options
                                                        .filter(e => !usedEdges.has(e.id))
                                                        .map(edge => ({
                                                            isAction: false,
                                                            id: edge.id,
                                                            target: edge.target,
                                                            edgeId: edge.id
                                                        }));

                                                const allItems = [...actionItems, ...standardItems];

                                                if (allItems.length === 0) return null;

                                                return allItems.map((item, idx) => {
                                                    // Default Styles
                                                    let icon = ArrowRight;
                                                    let color = "text-indigo-400";
                                                    let bg = "bg-indigo-500/10";
                                                    let actionLabel = "PROCEED";
                                                    let title = "";

                                                    // Resolve Target Node info if it exists
                                                    let targetNode = item.target ? nodes.find(n => n.id === item.target) : null;

                                                    // Handle Music Node skipping
                                                    let displayNode = targetNode;
                                                    while (displayNode && displayNode.type === 'music') {
                                                        const outEdges = edges.filter(e => e.source === displayNode.id);
                                                        if (outEdges.length > 0) {
                                                            const next = nodes.find(n => n.id === outEdges[outEdges.length - 1].target); // simplistic next
                                                            if (next) displayNode = next;
                                                            else break;
                                                        } else break;
                                                    }

                                                    if (displayNode) {
                                                        title = displayNode.data.label || displayNode.data.name || "Continue";

                                                        // Type-based icons / colors
                                                        if (displayNode.type === 'story') {
                                                            icon = FileText;
                                                            color = "text-blue-400";
                                                            bg = "bg-blue-500/10";
                                                            actionLabel = "NARRATIVE";
                                                        } else if (displayNode.type === 'suspect') {
                                                            icon = User;
                                                            color = "text-red-400";
                                                            bg = "bg-red-500/10";
                                                            actionLabel = "INVESTIGATE";
                                                            title = displayNode.data.name || title;
                                                        } else if (displayNode.type === 'evidence') {
                                                            icon = Search;
                                                            color = "text-yellow-400";
                                                            bg = "bg-yellow-500/10";
                                                            actionLabel = "EXAMINE";
                                                        } else if (displayNode.type === 'media') {
                                                            icon = ImageIcon;
                                                            color = "text-orange-400";
                                                            bg = "bg-orange-500/10";
                                                            actionLabel = "VIEW ASSET";
                                                        } else if (displayNode.type === 'terminal') {
                                                            icon = Terminal;
                                                            color = "text-green-400";
                                                            bg = "bg-green-500/10";
                                                            actionLabel = "HACK TERMINAL";
                                                        } else if (displayNode.type === 'message') {
                                                            icon = MessageSquare;
                                                            color = "text-violet-400";
                                                            bg = "bg-violet-500/10";
                                                            actionLabel = "INCOMING";
                                                            actionLabel = "INCOMING";
                                                        } else if (displayNode.type === 'question') {
                                                            icon = HelpCircle;
                                                            color = "text-fuchsia-400";
                                                            bg = "bg-fuchsia-500/10";
                                                            actionLabel = "QUIZ";
                                                        } else if (displayNode.type === 'action') {
                                                            icon = MousePointerClick;
                                                            color = "text-indigo-400";
                                                            bg = "bg-indigo-500/10";
                                                            actionLabel = "INTERACTION";
                                                        } else if (displayNode.type === 'email') {
                                                            icon = Mail;
                                                            color = "text-blue-200";
                                                            bg = "bg-blue-600/20";
                                                            actionLabel = "ENCRYPTED INTEL";
                                                            title = displayNode.data.subject || title;
                                                        } else if (displayNode.type === 'fact') {
                                                            icon = Lightbulb;
                                                            color = "text-amber-400";
                                                            bg = "bg-amber-500/10";
                                                            actionLabel = "INFORMATION";
                                                        }
                                                    }

                                                    // Override if it is an Explicit Action
                                                    if (item.isAction) {
                                                        icon = MousePointerClick;
                                                        title = item.label;
                                                        actionLabel = "";
                                                        // Base style: Sleeker, refined border, sophisticated hover
                                                        const baseShadow = "transition-all duration-500 hover:tracking-widest border border-white/10 backdrop-blur-md shadow-2xl";

                                                        switch (item.variant) {
                                                            case 'danger':
                                                                color = "text-red-100";
                                                                bg = `bg-gradient-to-r from-red-600/40 via-red-500/10 to-transparent border-red-500/30 hover:border-red-400 hover:from-red-600/60 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)] ${baseShadow}`;
                                                                break;
                                                            case 'primary':
                                                                color = "text-indigo-100";
                                                                bg = `bg-gradient-to-r from-indigo-600/40 via-indigo-500/10 to-transparent border-indigo-500/30 hover:border-indigo-400 hover:from-indigo-600/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] ${baseShadow}`;
                                                                break;
                                                            case 'success':
                                                                color = "text-emerald-100";
                                                                bg = `bg-gradient-to-r from-emerald-500/40 via-emerald-400/10 to-transparent border-emerald-500/30 hover:border-emerald-400 hover:from-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] ${baseShadow}`;
                                                                break;
                                                            case 'warning':
                                                                color = "text-amber-100";
                                                                bg = `bg-gradient-to-r from-amber-400/40 via-amber-300/10 to-transparent border-amber-300/30 hover:border-amber-200 hover:from-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] ${baseShadow}`;
                                                                break;
                                                            case 'mystic':
                                                                color = "text-purple-100";
                                                                bg = `bg-gradient-to-r from-purple-600/40 via-purple-500/10 to-transparent border-purple-500/30 hover:border-purple-400 hover:from-purple-600/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] ${baseShadow}`;
                                                                break;
                                                            case 'tech':
                                                                color = "text-cyan-100";
                                                                bg = `bg-gradient-to-r from-cyan-400/40 via-cyan-300/10 to-transparent border-cyan-500/30 hover:border-cyan-400 hover:from-cyan-400/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] ${baseShadow}`;
                                                                break;
                                                            default:
                                                                color = "text-zinc-100";
                                                                bg = `bg-gradient-to-r from-zinc-700/40 via-zinc-600/10 to-transparent border-zinc-700/30 hover:border-zinc-500 hover:from-zinc-700/60 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] ${baseShadow}`;
                                                                break;
                                                        }
                                                    }

                                                    // "Disabled" state look
                                                    if (!item.target) {
                                                        color = "text-zinc-600";
                                                        bg = "bg-zinc-800/20";
                                                        title = item.label || "Locked Path";
                                                        actionLabel = "UNAVAILABLE";
                                                    }

                                                    const Icon = icon;

                                                    return (
                                                        <motion.button
                                                            key={`${item.id}-${idx}`}
                                                            data-testid={`option-${item.target}`}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.08, ease: "easeOut" }}
                                                            whileHover={item.target ? { x: 8 } : {}}
                                                            whileTap={item.target ? { scale: 0.99 } : {}}
                                                            onClick={() => item.target && handleOptionClick(item.target)}
                                                            disabled={!item.target}
                                                            className={`w-full text-left rounded-2xl transition-all duration-500 group relative overflow-hidden flex items-center gap-3 md:gap-4
                                                            ${!item.target ? 'cursor-not-allowed border border-white/5 opacity-40 p-3' : 'cursor-pointer'}
                                                            ${item.isAction && item.target
                                                                    ? `${bg} p-3 md:p-4 border-t border-white/10 shadow-xl`
                                                                    : "bg-zinc-950/40 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/60 p-3"
                                                                }`}
                                                        >
                                                            {/* Delicate light flare effect on hover */}
                                                            {item.target && (
                                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                            )}

                                                            <div className={`rounded-xl ${item.isAction ? 'bg-black/40' : bg} ${item.isAction ? 'p-2.5' : 'p-3'} border border-white/10 ${item.target && 'group-hover:rotate-6'} transition-transform shrink-0`}>
                                                                <Icon className={`${item.isAction ? 'w-5 h-5' : 'w-4 h-4'} ${color} transition-colors duration-500`} />
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
                                                                {actionLabel && (
                                                                    <div className={`text-[8px] font-black tracking-[0.2em] uppercase mb-1 ${color} opacity-40 group-hover:opacity-100 transition-opacity`}>
                                                                        {actionLabel}
                                                                    </div>
                                                                )}
                                                                <div className={`truncate transition-all duration-500 ${item.isAction ? `${color} drop-shadow-md text-base md:text-lg font-bold uppercase tracking-[0.15em] md:tracking-[0.2em]` : 'text-zinc-400 group-hover:text-white text-sm md:text-base font-bold tracking-tight'}`}>
                                                                    {title}
                                                                </div>
                                                            </div>

                                                            {item.target && (
                                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shrink-0">
                                                                    <ArrowRight className={`w-3 h-3 ${item.isAction ? color : 'text-zinc-600 group-hover:text-white'} transition-all`} />
                                                                </div>
                                                            )}
                                                        </motion.button>

                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Floating "Present More Evidence" offer — shown after confrontation story plays */}
            <AnimatePresence>
                {pendingConfrontation && !activeModalNode && pendingConfrontation.storyNodeId !== currentNodeId && (
                    <motion.div
                        initial={{ opacity: 0, y: 80 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        className={`${isSimultaneous ? 'absolute' : 'fixed'} bottom-6 left-1/2 -translate-x-1/2 z-[140] w-full max-w-xl px-4`}
                    >
                        <div className="bg-zinc-950/95 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-5 shadow-2xl shadow-amber-900/20 flex items-center gap-5">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                <Briefcase className="w-6 h-6 text-amber-400" />
                            </div>
                            {/* Message */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] mb-0.5">
                                    More Evidence Available
                                </p>
                                <p className="text-sm text-zinc-200 font-medium truncate">
                                    You have{' '}
                                    <span className="text-amber-400 font-black">
                                        {pendingConfrontation.remainingCount} more piece{pendingConfrontation.remainingCount !== 1 ? 's' : ''}
                                    </span>{' '}
                                    to present to{' '}
                                    <span className="text-white font-black">{pendingConfrontation.suspect.data.name}</span>.
                                </p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => {
                                        const susp = pendingConfrontation.suspect;
                                        setPendingConfrontation(null);
                                        // Re-open suspect profile directly on Confrontation tab
                                        setActiveModalNode({ ...susp, _initialTab: 'evidence' });
                                    }}
                                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-amber-900/30 whitespace-nowrap"
                                >
                                    Present Now
                                </button>
                                <button
                                    onClick={() => setPendingConfrontation(null)}
                                    className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-white/5"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {/* Subtle animated glow line */}
                        <div className="absolute inset-x-8 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generic Interaction Modal (Replaces Suspect Modal) */}
            <AnimatePresence>
                {activeModalNode && (
                    <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md`}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`bg-zinc-950/40 border p-0 rounded-3xl relative overflow-hidden shadow-2xl transition-all duration-500 backdrop-blur-2xl
                                ${activeModalNode.type === 'suspect'
                                    ? 'border-indigo-500/30 shadow-[0_0_60px_rgba(99,102,241,0.1)]'
                                    : 'border-zinc-800/40 shadow-black/80'}
                                max-h-[95vh] flex flex-col
                                ${(activeModalNode.type === 'threed' || activeModalNode.type === 'suspect' || activeModalNode.type === 'interrogation' || activeModalNode.type === 'question' || activeModalNode.type === 'email' || activeModalNode.type === 'fact') ? 'max-w-6xl w-full h-[95vh] md:h-[85vh]' : 'max-w-3xl w-full'}`}
                        >
                            {/* Modal Close Button - Elevated to top priority */}
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 z-[250] p-2 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/5 hover:border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {activeModalNode.type === 'email' && (
                                <div className="p-0 bg-[#f3f4f6] flex flex-col w-full h-full min-h-0 text-zinc-900 font-sans">
                                    <div className="bg-[#2563eb] p-4 text-white flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-white/90" />
                                            <h2 className="text-sm font-bold tracking-tight truncate max-w-[200px] md:max-w-md">
                                                {activeModalNode.data.subject || 'New Message Received'}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white border-b border-zinc-200 shrink-0">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                                {(activeModalNode.data.sender || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                                                    <h3 className="font-bold text-zinc-900 truncate">{activeModalNode.data.sender || 'Unknown Sender'}</h3>
                                                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{new Date().toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 truncate">To: {activeModalNode.data.recipient || 'player@detective.net'}</p>
                                            </div>
                                        </div>
                                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight leading-tight">
                                            {activeModalNode.data.subject}
                                        </h1>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
                                        <div className="max-w-3xl mx-auto">
                                            <div className="prose prose-sm md:prose-base prose-zinc prose-p:leading-relaxed text-zinc-800 whitespace-pre-wrap font-serif">
                                                {activeModalNode.data.body}
                                            </div>

                                            {activeModalNode.data.images && activeModalNode.data.images.length > 0 && (
                                                <div className="mt-12 space-y-6">
                                                    <div className="flex items-center gap-2 text-zinc-400 mb-4 pb-2 border-b border-zinc-100">
                                                        <Paperclip className="w-4 h-4" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">{activeModalNode.data.images.length} Attachments</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {activeModalNode.data.images.map((url, i) => (
                                                            <div
                                                                key={i}
                                                                className="group relative aspect-video bg-zinc-100 rounded-xl overflow-hidden shadow-sm border border-zinc-200 cursor-pointer"
                                                                onClick={() => setZoomedImage(url)}
                                                            >
                                                                <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={`Attachment ${i + 1}`} />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <div className="bg-white/90 backdrop-blur-sm text-zinc-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">View Image</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end shrink-0">
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.15em] text-[11px] h-11 px-8 shadow-lg transition-all rounded-xl"
                                            onClick={() => {
                                                if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                                                    setScore(s => s + activeModalNode.data.score);
                                                    triggerScoreDelta(activeModalNode.data.score);
                                                    rewardObjectivePoints(activeModalNode, activeModalNode.data.score);
                                                    setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                                                    addLog(`EMAIL INTEL REWARD: +${activeModalNode.data.score} Points`);
                                                }
                                                const next = options[0] || edges.find(e => e.source === activeModalNode.id);
                                                setActiveModalNode(null);
                                                if (next) handleOptionClick(next.target);
                                            }}
                                        >
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {activeModalNode.type === 'suspect' && (
                                <SuspectProfile
                                    suspect={activeModalNode}
                                    inventory={inventory}
                                    nodes={nodes}
                                    edges={edges}
                                    onClose={() => setActiveModalNode(null)}
                                    onNavigate={handleOptionClick}
                                    onLog={addLog}
                                    isSimultaneous={isSimultaneous}
                                    onConfrontationSuccess={handleConfrontationSuccess}
                                    confrontedIds={suspectConfrontedIds.get(activeModalNode.id) ?? new Set()}
                                    initialTab={activeModalNode._initialTab || 'dossier'}
                                    history={history}
                                />
                            )}
                            {activeModalNode.type === 'evidence' && (
                                <div className="p-4 md:p-8 border-t-4 border-yellow-500 bg-zinc-900/50 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-4 md:mb-6">
                                        <div className="flex items-center gap-3 text-yellow-500">
                                            <Search className="w-6 h-6 md:w-8 md:h-8" />
                                            <h2 className="text-xl md:text-2xl font-bold text-white uppercase">Evidence Logged</h2>
                                        </div>

                                    </div>

                                    <Card className="p-4 md:p-8 bg-black border-yellow-900/30 mb-6">
                                        {activeModalNode.data.image && (
                                            <div className="w-full mb-6 rounded-lg overflow-hidden border border-yellow-900/50 shadow-2xl relative group">
                                                <img src={activeModalNode.data.image} alt="Evidence" className="w-full h-auto object-contain max-h-[400px]" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setZoomedImage(activeModalNode.data.image)}>
                                                    <div className="flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transform scale-95 group-hover:scale-100 transition-transform">
                                                        <ZoomIn className="w-5 h-5" />
                                                        <span className="text-sm font-bold uppercase tracking-wider">Zoom In</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <h3 className="text-xl md:text-2xl font-bold text-yellow-200 mb-4">{activeModalNode.data.displayName || activeModalNode.data.label}</h3>
                                        <p className="text-zinc-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap">{activeModalNode.data.description}</p>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            className="bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase tracking-[0.15em] text-[11px] h-11 px-8 shadow-[0_8px_20px_rgba(234,179,8,0.2)] hover:shadow-[0_12px_30px_rgba(234,179,8,0.3)] transition-all border-t border-white/20 rounded-xl"
                                            onClick={() => {
                                                const next = options[0];
                                                setActiveModalNode(null);
                                                if (next) handleOptionClick(next.target);
                                            }}
                                        >
                                            Process & Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Terminal Layout */}
                            {activeModalNode.type === 'terminal' && (
                                <AdvancedTerminal
                                    node={activeModalNode}
                                    edges={edges}
                                    onComplete={(cmd) => handleTerminalSubmit(cmd, true)}
                                    onFail={() => handleCloseModal()}
                                    addLog={addLog}
                                />
                            )}

                            {activeModalNode.type === 'interrogation' && (
                                <AIInterrogation
                                    node={activeModalNode}
                                    requestCount={aiRequestCount}
                                    onAIRequest={() => {
                                        setAiRequestCount(prev => prev + 1);
                                    }}
                                    onComplete={() => {
                                        // Handle score/points if needed
                                        if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                                            const awardedS = Number(activeModalNode.data.score) || 0;
                                            setScore(s => s + awardedS);
                                            triggerScoreDelta(awardedS);
                                            triggerFlyingPoints(awardedS);
                                            // Objective Scoring
                                            rewardObjectivePoints(activeModalNode, awardedS);
                                            setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                                            addLog(`INTERROGATION REWARD: +${awardedS} Points`);
                                        }

                                        const next = options[0];
                                        if (next) {
                                            setActiveModalNode(null);
                                            handleOptionClick(next.target);
                                        } else {
                                            handleCloseModal();
                                        }
                                    }}
                                    onFail={() => handleCloseModal()}
                                    isSimultaneous={isSimultaneous}
                                />
                            )}

                            {/* Message Layout */}
                            {activeModalNode.type === 'message' && (
                                <div className="p-8 bg-zinc-900 border-t-4 border-violet-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-violet-400">
                                            <MessageSquare className="w-6 h-6" />
                                            <h2 className="text-xl font-bold text-white uppercase">Incoming Transmission</h2>
                                        </div>

                                    </div>

                                    <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative">
                                        <div className="absolute top-4 right-4 text-xs font-bold text-zinc-600 uppercase">ENCRYPTED</div>
                                        <span className="text-xs font-bold text-indigo-400 block mb-2">FROM: {activeModalNode.data.sender || 'Unknown'}</span>
                                        <p className="text-zinc-200 text-lg font-mono leading-relaxed whitespace-pre-wrap">{activeModalNode.data.message || activeModalNode.data.content}</p>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            variant="outline"
                                            className="border-violet-500/50 text-violet-200 hover:bg-violet-500/10 hover:border-violet-400 font-bold uppercase tracking-widest text-xs"
                                            onClick={() => {
                                                // Use raw edge to ensure setter nodes are processed
                                                const rawEdges = edges.filter(e => e.source === activeModalNode.id);
                                                setActiveModalNode(null);
                                                if (rawEdges.length > 0) {
                                                    handleOptionClick(rawEdges[0].target);
                                                }
                                            }}
                                        >
                                            Close Transmission
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Media Layout */}
                            {activeModalNode.type === 'media' && (
                                <div className="p-0 bg-black flex flex-col w-full h-full min-h-0">
                                    <div className="relative p-6 border-b border-orange-500/30 flex items-start justify-between bg-zinc-900 overflow-hidden shrink-0">
                                        {/* Background Decoration */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-transparent to-transparent pointer-events-none" />

                                        <div className="relative flex items-center gap-4 z-10">
                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                                <ImageIcon className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-orange-500 uppercase">Secure Asset</span>
                                                </div>
                                                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                                                    {activeModalNode.data.label}
                                                </h2>
                                            </div>
                                        </div>


                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center min-h-0">
                                        {activeModalNode.data.mediaType === 'video' ? (
                                            <div className="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl mb-6 shrink-0">
                                                {(activeModalNode.data.url?.includes('youtube.com') || activeModalNode.data.url?.includes('youtu.be')) ? (
                                                    <iframe
                                                        src={activeModalNode.data.url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                                                        className="w-full h-full"
                                                        allow="autoplay; encrypted-media"
                                                        allowFullScreen
                                                        title="Video Asset"
                                                    />
                                                ) : (
                                                    <video controls src={activeModalNode.data.url} className="w-full h-full" />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full max-w-3xl mb-6 flex justify-center shrink-0">
                                                <img
                                                    src={activeModalNode.data.url}
                                                    alt="Asset"
                                                    className="max-w-full max-h-[60vh] h-auto w-auto mx-auto rounded-lg border border-zinc-800 shadow-2xl block"
                                                />
                                            </div>
                                        )}

                                        <div className="w-full max-w-3xl bg-zinc-900/80 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm shrink-0">
                                            <h3 className="text-orange-200 font-bold mb-2">{activeModalNode.data.label}</h3>
                                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{activeModalNode.data.text}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end shrink-0 z-20">
                                        <Button
                                            className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-[0.15em] text-[11px] h-11 px-8 shadow-[0_8px_20px_rgba(249,115,22,0.2)] hover:shadow-[0_12px_30px_rgba(249,115,22,0.3)] transition-all border-t border-white/20 rounded-xl"
                                            onClick={() => {
                                                // Use raw edge to ensure setter nodes are processed
                                                const rawEdges = edges.filter(e => e.source === activeModalNode.id);
                                                setActiveModalNode(null);
                                                if (rawEdges.length > 0) {
                                                    handleOptionClick(rawEdges[0].target);
                                                }
                                            }}
                                        >
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Notification Layout */}
                            {activeModalNode.type === 'notification' && (
                                <div className="p-8 bg-zinc-900 border-t-4 border-sky-500 h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(14,165,233,0.15)] animate-pulse">
                                        <Bell className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-6 tracking-tight uppercase">{activeModalNode.data.label || 'System Notification'}</h2>
                                    <p className="text-zinc-300 text-lg leading-relaxed mb-10 max-w-lg font-medium whitespace-pre-wrap">
                                        {activeModalNode.data.message}
                                    </p>
                                    <Button
                                        className={`w-full max-w-xs h-12 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 transform hover:scale-[1.02] active:scale-95 group overflow-hidden relative shadow-2xl border-t border-white/10 rounded-xl ${activeModalNode.data.buttonStyle === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-red-900/40 text-white' :
                                            activeModalNode.data.buttonStyle === 'primary' ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-blue-900/40 text-white' :
                                                activeModalNode.data.buttonStyle === 'success' ? 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 shadow-emerald-900/40 text-white' :
                                                    activeModalNode.data.buttonStyle === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-amber-900/40 text-black' :
                                                        'bg-white text-black hover:bg-zinc-100 shadow-white/10 font-bold'
                                            }`}
                                        onClick={() => {
                                            // Use raw edge to ensure setter nodes are processed
                                            const rawEdges = edges.filter(e => e.source === activeModalNode.id);
                                            setActiveModalNode(null);
                                            if (rawEdges.length > 0) {
                                                handleOptionClick(rawEdges[0].target);
                                            }
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {activeModalNode.data.buttonText || "Continue"}
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>

                                </div>
                            )}

                            {/* Question Layout */}
                            {activeModalNode.type === 'question' && (
                                <div className="p-8 bg-zinc-900 border-t-4 border-fuchsia-500 h-full min-h-0 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-fuchsia-400">
                                            {/* <HelpCircle className="w-8 h-8" /> */}
                                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Challenge / Quiz</h2>
                                        </div>

                                        {/* Protocol intelligence (Help) button */}
                                        {activeModalNode.data.helpContent && (
                                            <button
                                                onClick={() => setShowQuestionHelp(true)}
                                                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/30 hover:border-indigo-500/40 transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                                title="Help"
                                            >
                                                <Info className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest hidden sm:inline">Help</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        {activeModalNode.data.image && (
                                            <div className="w-full mb-6 rounded-xl overflow-hidden border border-fuchsia-900/30 shadow-2xl relative group">
                                                <img src={activeModalNode.data.image} alt="Question Visual" className="w-full h-auto object-contain max-h-[300px]" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setZoomedImage(activeModalNode.data.image)}>
                                                    <div className="flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transform scale-95 group-hover:scale-100 transition-transform">
                                                        <ZoomIn className="w-5 h-5" />
                                                        <span className="text-sm font-bold uppercase tracking-wider">Expand Visual</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xl text-white font-medium leading-relaxed mb-8 whitespace-pre-wrap">
                                            {activeModalNode.data.question}
                                        </p>

                                        <div className="space-y-3">
                                            {(activeModalNode.data.options || []).map((opt) => {
                                                const isSelected = userAnswers.has(opt.id);
                                                return (
                                                    <div
                                                        key={opt.id}
                                                        onClick={() => {
                                                            const newSet = new Set(activeModalNode.data.selectionType === 'multi' ? userAnswers : []);
                                                            if (newSet.has(opt.id)) newSet.delete(opt.id);
                                                            else newSet.add(opt.id);
                                                            setUserAnswers(newSet);
                                                        }}
                                                        className={`p-4 rounded-lg border text-lg cursor-pointer transition-all flex items-center gap-4 ${isSelected
                                                            ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/10'
                                                            : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-zinc-600'}`}>
                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                        </div>
                                                        {opt.text}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Hints Section */}
                                        {activeModalNode.data.hints && activeModalNode.data.hints.length > 0 && (
                                            <div className="mt-8 space-y-4">
                                                <div className="flex items-center gap-2 text-amber-500/80 mb-2">
                                                    <Lightbulb className="w-4 h-4" />
                                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Strategy Intel / Hints</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {activeModalNode.data.hints.map((hint, idx) => {
                                                        const isRevealed = revealedHints.has(hint.id);
                                                        return (
                                                            <div
                                                                key={hint.id}
                                                                className={`p-4 rounded-xl border transition-all duration-500 relative overflow-hidden group ${isRevealed
                                                                    ? 'bg-amber-950/20 border-amber-500/30'
                                                                    : 'bg-zinc-950 border-zinc-800 hover:border-amber-500/40 cursor-pointer'
                                                                    }`}
                                                                onClick={() => !isRevealed && handleRevealHint(hint)}
                                                            >
                                                                {isRevealed ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Decrypted Intel #{idx + 1}</span>
                                                                        <p className="text-white text-sm leading-relaxed">{hint.text}</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:animate-pulse">
                                                                                <Star className="w-4 h-4 text-amber-500" />
                                                                            </div>
                                                                            <span className="text-sm font-bold text-zinc-400 group-hover:text-amber-200 transition-colors">Analyze Hint #{idx + 1}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
                                                                            <span className="text-[10px] font-black text-red-400">-{hint.penalty} PTS</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Decorative glow */}
                                                                {!isRevealed && (
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-end">
                                        <Button
                                            id="quiz-submit-btn"
                                            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-10 h-12 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 transform hover:scale-[1.02] active:scale-95 group overflow-hidden relative shadow-2xl border-t border-white/20 rounded-xl"
                                            onClick={handleQuestionSubmit}
                                            disabled={userAnswers.size === 0}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Submit Answer
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Lockpick Minigame Layout */}
                            {activeModalNode.type === 'lockpick' && (
                                <LockpickMinigame
                                    node={activeModalNode}
                                    onSuccess={() => {
                                        // Set Success Variable
                                        if (activeModalNode.data.variableId) {
                                            setInventory(prev => new Set([...prev, activeModalNode.data.variableId]));
                                            setNodeOutputs(prev => ({ ...prev, [activeModalNode.data.variableId]: true }));
                                        }
                                        // Use raw edge to ensure setter nodes are processed
                                        const rawEdges = edges.filter(e => e.source === activeModalNode.id);
                                        setActiveModalNode(null);
                                        if (rawEdges.length > 0) {
                                            handleOptionClick(rawEdges[0].target);
                                        }
                                    }}
                                    onFail={() => {
                                        // Maybe damage score or just retry? For now, retry is standard.
                                        addLog("LOCKPICK FAILED: Tumblers reset.");
                                    }}
                                />
                            )}

                            {/* Keypad Minigame Layout */}
                            {activeModalNode.type === 'keypad' && (
                                <KeypadMinigame
                                    node={activeModalNode}
                                    onSuccess={() => {
                                        if (activeModalNode.data.variableId) {
                                            setInventory(prev => new Set([...prev, activeModalNode.data.variableId]));
                                            setNodeOutputs(prev => ({ ...prev, [activeModalNode.data.variableId]: true }));
                                        }
                                        // Use raw edge to ensure setter nodes are processed
                                        const rawEdges = edges.filter(e => e.source === activeModalNode.id);
                                        setActiveModalNode(null);
                                        if (rawEdges.length > 0) {
                                            handleOptionClick(rawEdges[0].target);
                                        }
                                    }}
                                />
                            )}

                            {/* Decryption Minigame Layout */}
                            {activeModalNode.type === 'decryption' && (
                                <DecryptionMinigame
                                    node={activeModalNode}
                                    onSuccess={() => {
                                        if (activeModalNode.data.variableId) {
                                            setInventory(prev => new Set([...prev, activeModalNode.data.variableId]));
                                            setNodeOutputs(prev => ({ ...prev, [activeModalNode.data.variableId]: true }));
                                        }
                                        // Use raw edge to ensure setter nodes are processed
                                        const rawEdges = edges.filter(e => e.source === activeModalNode.id);
                                        setActiveModalNode(null);
                                        if (rawEdges.length > 0) {
                                            handleOptionClick(rawEdges[0].target);
                                        }
                                    }}
                                />
                            )}

                            {/* Enhanced Fact / Info Layout */}
                            {activeModalNode.type === 'fact' && (
                                <FactDisplay
                                    fact={activeModalNode}
                                    parseRichText={parseRichText}
                                    onZoomImage={setZoomedImage}
                                    onConfirm={() => {
                                        if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                                            const awardedS = Number(activeModalNode.data.score) || 0;
                                            setScore(s => s + awardedS);
                                            triggerScoreDelta(awardedS);
                                            triggerFlyingPoints(awardedS);
                                            rewardObjectivePoints(activeModalNode, awardedS);
                                            setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                                            addLog(`FACT DISCOVERED: +${awardedS} Points`);
                                        }
                                        const rawEdges = edges.filter(e => e.source === activeModalNode.id);
                                        setActiveModalNode(null);
                                        if (rawEdges.length > 0) handleOptionClick(rawEdges[0].target);
                                    }}
                                />
                            )}

                            {/* 3D Holodeck Experience */}
                            {activeModalNode.type === 'threed' && (
                                <div className="flex-1 w-full min-h-[60vh] relative overflow-hidden rounded-b-2xl">
                                    <ThreeDWorld
                                        layout={activeModalNode.data.layout}
                                        onClose={() => handleCloseModal()}
                                    />
                                </div>
                            )}

                        </motion.div>
                    </div>
                )
                }

                {/* Suspect Strategy Choice Modal */}
                {suspectChoiceNode && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#0c0c12] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col relative"
                        >
                            {/* Header / Suspect Info */}
                            <div className="relative h-44 md:h-56 bg-zinc-900 border-b border-white/5 overflow-hidden">
                                {suspectChoiceNode.data?.image ? (
                                    <img src={suspectChoiceNode.data.image} alt="Suspect" className="w-full h-full object-cover opacity-60" />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(suspectChoiceNode.data?.name || 'Unknown')} opacity-20`} />
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-[#0c0c12] to-transparent">
                                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-[0.05em] drop-shadow-2xl">
                                        {suspectChoiceNode.data?.name || "Subject Profile"}
                                    </h2>
                                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1">Select Engagement Strategy</p>
                                </div>
                                <button
                                    onClick={() => setSuspectChoiceNode(null)}
                                    className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white rounded-full border border-white/5 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Options */}
                            <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-zinc-950/40">
                                {/* Talk Strategy */}
                                <button
                                    onClick={() => {
                                        setActiveModalNode({ ...suspectChoiceNode, _initialTab: 'action' });
                                        setSuspectChoiceNode(null);
                                    }}
                                    className="group relative flex flex-col gap-4 p-6 md:p-8 bg-zinc-900/40 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all text-left overflow-hidden shadow-xl"
                                >
                                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors duration-500" />
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                                        <MessageSquare className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest leading-none mb-2">Talk to Suspect</h3>
                                        <p className="text-zinc-500 text-xs font-medium leading-relaxed uppercase tracking-wider">
                                            Access the subject's dossier, review biometric data, and engage in standard dialogue.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                        Initialize Protocol <ArrowRight className="w-3 h-3" />
                                    </div>
                                </button>

                                {/* Confront Strategy */}
                                <button
                                    onClick={() => {
                                        setActiveModalNode({ ...suspectChoiceNode, _initialTab: 'evidence' });
                                        setSuspectChoiceNode(null);
                                    }}
                                    className="group relative flex flex-col gap-4 p-6 md:p-8 bg-zinc-900/40 rounded-2xl border border-white/5 hover:border-amber-500/50 transition-all text-left overflow-hidden shadow-xl"
                                >
                                    <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-500" />
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-500">
                                        <Briefcase className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest leading-none mb-2">Confront Evidence</h3>
                                        <p className="text-zinc-500 text-xs font-medium leading-relaxed uppercase tracking-wider">
                                            Present gathered files and clues directly. Challenge discrepancies in their story.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                        Begin Interrogation <ArrowRight className="w-3 h-3" />
                                    </div>
                                </button>
                            </div>

                            {/* Footer Status */}
                            <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Neural Link Established</span>
                                </div>
                                <span className="text-[9px] font-black text-zinc-700 font-mono tracking-widest">ENCRYPTED // SESSION ID {Math.floor(Math.random() * 900000) + 100000}</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Image Zoom Lightbox */}
            < AnimatePresence >
                {zoomedImage && (
                    <div
                        className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center cursor-pointer`}
                        onClick={() => setZoomedImage(null)}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                            className="absolute top-6 right-6 p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-full z-[210] transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-[95vw] max-h-[95vh] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={zoomedImage}
                                alt="Zoomed Asset"
                                className="max-w-full max-h-[90vh] object-contain rounded border border-zinc-800 shadow-2xl"
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Evidence Board (Crazy Wall) */}
            <AnimatePresence>
                {showEvidenceBoard && (
                    <EvidenceBoard
                        inventory={inventory}
                        nodes={nodes}
                        history={history}
                        onClose={() => setShowEvidenceBoard(false)}
                        boardItems={boardItems}
                        setBoardItems={setBoardItems}
                        connections={boardConnections}
                        setConnections={setBoardConnections}
                        notes={boardNotes}
                        setNotes={setBoardNotes}
                        onOpenDossier={(nodeId) => {
                            const node = nodes.find(n => n.id === nodeId);
                            if (node) {
                                setActiveModalNode(node);
                                setShowEvidenceBoard(false);
                            }
                        }}
                        isSimultaneous={isSimultaneous}
                    />
                )}
            </AnimatePresence>

            {/* Interactive Suspect Wall */}

            {/* Accusation Modal */}
            < AnimatePresence >
                {showAccuseModal && (
                    <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md`}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    <ShieldAlert className="w-8 h-8 text-red-600" />
                                    Identify The Culprit
                                </h2>
                                <Button variant="ghost" onClick={() => {
                                    if (accusationResult === 'success' || accusationResult === 'timeout') {
                                        handleFinish();
                                    } else {
                                        setShowAccuseModal(false);
                                    }
                                }}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                {!accusationResult && (
                                    <>
                                        <p className="text-zinc-400 text-center mb-8 max-w-lg mx-auto">
                                            Review the evidence carefully. Selecting the wrong suspect will result in immediate termination of the investigation.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {nodes.filter(n => n.type === 'suspect').map((suspect) => {
                                                const sName = suspect.data?.name || suspect.data?.label || 'Unknown';
                                                return (
                                                    <button
                                                        key={suspect.id}
                                                        onClick={() => handleAccuse(suspect)}
                                                        className="group relative flex flex-col items-center p-6 bg-zinc-900/50 border border-zinc-900 hover:border-red-500/50 rounded-xl transition-all hover:bg-zinc-900"
                                                    >
                                                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(sName)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden`}>
                                                            {(suspect.data?.image || suspect.data?.images?.[0]) ? (
                                                                <img src={suspect.data.image || suspect.data.images[0]} className="w-full h-full object-cover" alt={sName} />
                                                            ) : (
                                                                <span className="text-3xl font-bold text-white shadow-black drop-shadow-lg">{sName.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{sName}</h3>
                                                        <p className="text-xs text-zinc-500 uppercase tracking-wider">{suspect.data?.role || 'Suspect'}</p>
                                                        <div className="absolute inset-0 border-2 border-red-500/0 group-hover:border-red-500/20 rounded-xl transition-colors pointer-events-none"></div>
                                                    </button>
                                                );
                                            })}
                                            {nodes.filter(n => n.type === 'suspect').length === 0 && (
                                                <div className="col-span-full text-center text-zinc-500 py-10">
                                                    No suspects found in database.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {accusationResult === 'success' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500 w-full">
                                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 border-4 border-green-500">
                                            <CheckCircle className="w-12 h-12 text-green-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">CASE CLOSED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl mb-6">
                                            Excellent work, Detective. The culprit has been identified and apprehended.
                                        </p>

                                        {/* Performance Report */}
                                        <LearningReport
                                            scores={playerObjectiveScores}
                                            objectives={gameMetadata?.learningObjectives || []}
                                        />

                                        {activeAccusationNode && activeAccusationNode.data.reasoning && (
                                            <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg max-w-xl w-full text-left mt-6">
                                                <h4 className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Case Resolution</h4>
                                                <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{activeAccusationNode.data.reasoning}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                            <Button
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider h-14 px-8 shadow-xl"
                                                onClick={() => setShowNewsReport(true)}
                                            >
                                                <Radio className="w-5 h-5 mr-3 animate-pulse" />
                                                View Live News Report
                                            </Button>
                                            <Button
                                                className="bg-white text-black hover:bg-zinc-200 h-14 px-8 font-bold"
                                                onClick={handleFinish}
                                            >
                                                Return to Headquarters
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {accusationResult === 'failure' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500 w-full">
                                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-4 border-red-500">
                                            <X className="w-12 h-12 text-red-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">MISSION FAILED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl">
                                            You accused the wrong person. The real perpetrator escaped while you were distracted.
                                        </p>

                                        {/* Performance Report */}
                                        <LearningReport
                                            scores={playerObjectiveScores}
                                            objectives={gameMetadata?.learningObjectives || []}
                                        />

                                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                            <Button
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider h-14 px-8"
                                                onClick={() => setShowNewsReport(true)}
                                            >
                                                <Radio className="w-5 h-5 mr-3" />
                                                View Final Report
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-zinc-700 hover:bg-zinc-800 h-14"
                                                onClick={() => setAccusationResult(null)}
                                            >
                                                Review Evidence
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="h-14"
                                                onClick={handleFinish}
                                            >
                                                Accept Failure
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {accusationResult === 'timeout' && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500 w-full">
                                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-4 border-red-500">
                                            <AlertTriangle className="w-12 h-12 text-red-500" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-4">TIME EXPIRED</h2>
                                        <p className="text-xl text-zinc-300 max-w-xl">
                                            The operational window has closed. The culprit has escaped jurisdiction.
                                        </p>

                                        {/* Performance Report */}
                                        <LearningReport
                                            scores={playerObjectiveScores}
                                            objectives={gameMetadata?.learningObjectives || []}
                                        />

                                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                            <Button
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider h-14 px-8"
                                                onClick={() => setShowNewsReport(true)}
                                            >
                                                <Radio className="w-5 h-5 mr-3" />
                                                View News Archive
                                            </Button>
                                            <Button
                                                className="bg-white text-black hover:bg-zinc-200 h-14 px-8"
                                                onClick={handleFinish}
                                            >
                                                Abort Mission
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Deep Web Investigation OS */}
            <AnimatePresence>
                {showDeepWeb && currentNode && currentNode.type === 'deepweb' && (
                    <DeepWebOS
                        data={currentNode.data}
                        onComplete={() => {
                            setShowDeepWeb(false);
                            // Advance to next node if simple path
                            if (options.length > 0) {
                                handleOptionClick(options[0].target);
                            }
                        }}
                        isSimultaneous={isSimultaneous}
                    />
                )}
            </AnimatePresence>

            {/* ── Plot Reveal Crazy Wall ─────────────────────────────────────── */}
            <AnimatePresence>
                {showCrazyWall && activeCrazyWallNode && (
                    <CrazyWallGame
                        node={activeCrazyWallNode}
                        nodes={nodes}
                        onComplete={(awardedScore) => {
                            const completedId = activeCrazyWallNode?.id;
                            setShowCrazyWall(false);
                            // Award points
                            const awards = Number(awardedScore) || 0;
                            if (awards > 0) {
                                setScore(s => s + awards);
                                triggerScoreDelta(awards);
                                triggerFlyingPoints(awards);
                                rewardObjectivePoints(activeCrazyWallNode, awards);
                                addLog(`PLOT REVEALED: +${awards} Points`);
                            }
                            setActiveCrazyWallNode(null);

                            // Advance to next node using direct edge search for robustness
                            const nextEdges = edges.filter(e => e.source === completedId);
                            if (nextEdges.length > 0) {
                                setTimeout(() => handleOptionClick(nextEdges[0].target), 600);
                            }
                        }}
                        addLog={addLog}
                    />
                )}
            </AnimatePresence>

            {/* Cinematic Cutscene */}
            <AnimatePresence>
                {showCutscene && currentNode && currentNode.type === 'cutscene' && (
                    <CinematicCutscene
                        storyText={currentNode.data.text || ''}
                        characterName={currentNode.data.characterName}
                        characterImage={currentNode.data.characterImage}
                        mood={currentNode.data.mood || 'neutral'}
                        cameraAngle={currentNode.data.cameraAngle || 'medium'}
                        onComplete={() => {
                            setShowCutscene(false);
                            setIsContentReady(true);

                            // Auto-advance to next node after cutscene
                            const outEdges = options.filter(e => e.source === currentNode.id);
                            if (outEdges.length > 0) {
                                setTimeout(() => handleOptionClick(outEdges[0].target), 500);
                            }
                        }}
                        autoPlay={true}
                        showControls={true}
                        isSimultaneous={isSimultaneous}
                    />
                )}
            </AnimatePresence>

            {/* News Report Overlay */}
            <AnimatePresence>
                {showNewsReport && (
                    <CaseClosedNewsReport
                        gameMetadata={gameMetadata}
                        logs={logs}
                        score={score}
                        accusationResult={accusationResult}
                        culpritName={accusedName}
                        objectiveScores={playerObjectiveScores}
                        onClose={() => {
                            setShowNewsReport(false);
                            handleFinish();
                        }}
                        isSimultaneous={isSimultaneous}
                    />
                )}
            </AnimatePresence>

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={showFeedback}
                onClose={handleFeedbackSkip}
                onSubmit={handleFeedbackSubmit}
                caseTitle={gameMetadata?.title || "Unknown Mission"}
                isSimultaneous={isSimultaneous}
            />

            {/* Quit Confirmation Dialog */}
            <AnimatePresence>
                {showQuitConfirm && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-zinc-950 border border-red-500/30 p-10 rounded-[2.5rem] max-w-lg w-full shadow-[0_0_80px_rgba(239,68,68,0.2)] relative overflow-hidden text-center"
                        >
                            {/* Warning Icon with Glow */}
                            <div className="flex justify-center mb-8">
                                <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center relative">
                                    <AlertTriangle className="w-10 h-10 text-red-500" />
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-red-500/20 blur-xl"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Terminate Mission?</h2>
                            <p className="text-zinc-400 text-lg font-medium leading-relaxed mb-10 px-4">
                                Quitting now will cause you to <span className="text-red-400 font-bold uppercase">lose all current game progress</span>.
                                If you want to go back to the <span className="text-indigo-400 font-bold">Previous Scene</span>, please use the <span className="text-white font-bold">Back option in the header</span> instead.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowQuitConfirm(false)}
                                    className="py-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
                                >
                                    Stay in Game
                                </button>
                                <button
                                    onClick={handleAbort}
                                    className="py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
                                >
                                    Yes, Terminate
                                </button>
                            </div>

                            {/* Decorative background number */}
                            <span className="absolute -bottom-10 -right-10 text-[200px] font-black text-white/[0.02] pointer-events-none select-none">!</span>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Question Intelligence Protocol (Help) Popup */}
            <AnimatePresence>
                {showQuestionHelp && activeModalNode?.data.helpContent && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowQuestionHelp(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-zinc-950 border border-indigo-500/30 p-8 rounded-3xl max-w-lg w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative Background Items */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-600/10 blur-3xl rounded-full -ml-12 -mb-12"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                        <Info className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">Additional Information</h3>
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl mb-8">
                                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap italic font-serif text-lg">
                                        "{activeModalNode.data.helpContent}"
                                    </p>
                                </div>

                                <Button
                                    onClick={() => setShowQuestionHelp(false)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] h-12 rounded-xl border-t border-white/20 shadow-xl"
                                >
                                    Okay
                                </Button>
                            </div>

                            {/* Technical Corners */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500/20 rounded-tl-3xl"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-500/20 rounded-tr-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500/20 rounded-bl-3xl"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500/20 rounded-br-3xl"></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Enhanced Explanation HUD */}
            <AnimatePresence>
                {activeExplanation && (
                    <ExplanationHUD
                        type={activeExplanation.type}
                        title={activeExplanation.title}
                        text={activeExplanation.text}
                        onClose={activeExplanation.onClose}
                        isSimultaneous={isSimultaneous}
                    />
                )}
            </AnimatePresence>

            {/* Flying Score Effect */}
            <AnimatePresence>
                {flyingPoints !== null && (
                    <motion.div
                        key={flyingPointsKey}
                        initial={{ opacity: 0, y: 0, scale: 0.1, x: '-50%', filter: 'blur(20px)' }}
                        animate={{ opacity: 1, y: -250, scale: 2.2, x: '-50%', filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 4, y: -500, filter: 'blur(40px)', x: '-50%' }}
                        transition={{
                            duration: 1.8,
                            ease: [0.16, 1, 0.3, 1],
                            scale: { type: 'spring', stiffness: 100, damping: 12 },
                            filter: { duration: 0.4 }
                        }}
                        className="fixed left-1/2 top-1/2 z-[10000] font-black pointer-events-none text-center whitespace-nowrap select-none drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]"
                        style={{
                            fontSize: '96px',
                            lineHeight: 1,
                            background: flyingPoints > 0
                                ? 'linear-gradient(180deg, #fff 0%, #bcff00 40%, #5efd0b 70%, #00ff00 100%)'
                                : 'linear-gradient(160deg, #fecdd3 0%, #fb7185 40%, #f43f5e 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: 'none',
                            filter: flyingPoints > 0
                                ? 'drop-shadow(0 0 35px rgba(188,255,0,0.8)) drop-shadow(0 0 15px rgba(94,253,11,0.5))'
                                : 'drop-shadow(0 0 32px rgba(244,63,94,0.7)) drop-shadow(0 0 12px rgba(251,113,133,0.5))'
                        }}
                    >
                        {flyingPoints > 0 ? `+${flyingPoints}` : flyingPoints}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

// Learning Report Component
const LearningReport = ({ scores, objectives }) => {
    if (!objectives || objectives.length === 0) return null;

    // Aggregate scores by category
    const categoryStats = objectives.map(cat => {
        let catScore = 0;
        let interactionCount = 0;

        cat.objectives.forEach((obj, idx) => {
            const objId = `${cat.id}:${idx}`;
            if (scores[objId]) {
                catScore += scores[objId];
                interactionCount++;
            }
        });

        return { ...cat, totalScore: catScore, interactionCount };
    }).filter(c => c.interactionCount > 0 || c.totalScore !== 0);

    if (categoryStats.length === 0) return null;

    return (
        <div className="w-full max-w-2xl bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Performance Report
            </h3>

            <div className="space-y-4">
                {categoryStats.map(cat => (
                    <div key={cat.id} className="relative">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-bold text-zinc-300 uppercase">{cat.category}</span>
                            <span className={`font-mono font-bold ${cat.totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {cat.totalScore > 0 ? '+' : ''}{cat.totalScore} PTS
                            </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${cat.totalScore >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, Math.abs(cat.totalScore))}%` }}
                            />
                        </div>
                        {/* Areas for Improvement / Feedback */}
                        {cat.totalScore < 0 && (
                            <p className="text-[10px] text-red-400 mt-1 italic">
                                Area for Improvement: Review {cat.category} fundamentals. High error rate detected.
                            </p>
                        )}
                        {cat.totalScore > 0 && (
                            <p className="text-[10px] text-green-500/70 mt-1 italic">
                                Strong performance in this sector.
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GamePreview;
