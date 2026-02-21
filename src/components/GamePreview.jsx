import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Card } from './ui/shared';
import { X, User, Search, Terminal, MessageSquare, FileText, ArrowRight, ShieldAlert, CheckCircle, AlertTriangle, Volume2, VolumeX, Image as ImageIcon, Briefcase, Star, MousePointerClick, Bell, HelpCircle, Clock, ZoomIn, LayoutGrid, ChevronRight, Fingerprint, Cpu, Activity, Shield, Hash, Box as BoxIcon, Radio, Lightbulb, Mail, Paperclip, Unlock, XCircle, Play, Pause, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EvidenceBoard from './EvidenceBoard';
import AdvancedTerminal from './AdvancedTerminal';
import AIInterrogation from './AIInterrogation';
import ThreeDWorld from './ThreeDWorld';
import SuspectProfile from './SuspectProfile';
import CinematicCutscene from './CinematicCutscene';
import CaseClosedNewsReport from './CaseClosedNewsReport';
import DeepWebOS from './DeepWebOS';
import FeedbackModal from './FeedbackModal';
import FactDisplay from './FactDisplay';
import { useChirpTTS, DEFAULT_CHIRP_VOICE } from '../lib/useChirpTTS';
import { useConfig } from '../lib/config';
import { useLicense } from '../lib/licensing';
import {
    checkLogicCondition as checkLogic,
    evaluateLogic as evalLogic,
    resolveNextNode as resolveNext,
    resolveEdgeTarget as resolveTarget
} from '../lib/gameLogic';

const BackgroundEffect = ({ isSimultaneous = false }) => (
    <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 pointer-events-none z-0 overflow-hidden`}>
        <style>
            {`
            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            .animate-scanline {
                animation: scanline 8s linear infinite;
            }
            `}
        </style>
        {/* Dark Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>

        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}></div>

        {/* Scanline Animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-screen w-full animate-scanline opacity-20 pointer-events-none mix-blend-overlay"></div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_50%,_black_100%)] opacity-80"></div>
    </div>
);

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
    const [zoomedImage, setZoomedImage] = useState(null);
    const [showEvidenceBoard, setShowEvidenceBoard] = useState(false);
    const [boardItems, setBoardItems] = useState([]);
    const [boardConnections, setBoardConnections] = useState([]);
    const [boardNotes, setBoardNotes] = useState([]);
    const [isConfronting, setIsConfronting] = useState(false);
    const [showCutscene, setShowCutscene] = useState(false);
    const [showNewsReport, setShowNewsReport] = useState(false);
    const [showDeepWeb, setShowDeepWeb] = useState(false);
    const [accusedName, setAccusedName] = useState('');
    const [activeExplanation, setActiveExplanation] = useState(null); // { title: string, type: 'correct'|'incorrect', text: string, onClose: function }

    // Logic/Outputs State
    const [nodeOutputs, setNodeOutputs] = useState({});

    // Feedback State
    const [showFeedback, setShowFeedback] = useState(false);
    const [pendingResultData, setPendingResultData] = useState(null);
    const [isQuitting, setIsQuitting] = useState(false);

    // Timer State
    const initialTime = (gameMetadata?.timeLimit || 15) * 60; // Convert minutes to seconds
    const [timeLeft, setTimeLeft] = useState(initialTime);

    // Scoring State
    const [score, setScore] = useState(0);
    const [scoreDelta, setScoreDelta] = useState(null);
    const [playerObjectiveScores, setPlayerObjectiveScores] = useState({}); // { objId: score }
    const [scoredNodes, setScoredNodes] = useState(new Set());
    const [aiRequestCount, setAiRequestCount] = useState(0);
    const [userAnswers, setUserAnswers] = useState(new Set()); // Set of selected option IDs for Question Nodes
    const [revealedHints, setRevealedHints] = useState(new Set()); // Set of hint IDs
    const lastNodeId = useRef(null);


    // Clear score delta after animation
    useEffect(() => {
        if (scoreDelta) {
            const timer = setTimeout(() => setScoreDelta(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [scoreDelta]);

    // Timer Logic
    useEffect(() => {
        if (!missionStarted || accusationResult) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setAccusationResult('timeout');
                    setShowAccuseModal(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [missionStarted, accusationResult]);

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

        // Terminal nodes award score on hack success, not visit.
        if (currentNode.type === 'terminal') return;

        if (!scoredNodes.has(currentNode.id)) {
            setScore(s => s + currentNode.data.score);
            setScoreDelta(currentNode.data.score);

            // Objective Scoring
            rewardObjectivePoints(currentNode, currentNode.data.score);

            setScoredNodes(prev => new Set([...prev, currentNode.id]));
            addLog(`SCORE REWARD: +${currentNode.data.score} Points`);
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
        const result = resolveNext(targetId, { nodes, edges, inventory, nodeOutputs, history });
        const { nodeId, node, intermediateIds, localInventory, localOutputs, stateChanged, audioToPlay } = result;

        // Commit State Changes
        if (stateChanged) {
            setInventory(localInventory);
            setNodeOutputs(localOutputs);
        }

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

        // Global Inventory Update: track visited nodes and their Logic IDs
        const idsToAdd = [nodeId, ...intermediateIds];
        [node, ...intermediateIds.map(id => nodes.find(n => n.id === id))].forEach(n => {
            if (n && n.data?.variableId) idsToAdd.push(n.data.variableId);
            if (n && n.type === 'evidence' && n.data.condition) idsToAdd.push(n.data.condition);
        });
        setInventory(prev => new Set([...prev, ...idsToAdd]));

        // Handle Type-Specific UI logic
        if (node && ['suspect', 'evidence', 'terminal', 'message', 'media', 'notification', 'question', 'lockpick', 'decryption', 'keypad', 'interrogation', 'threed', 'email', 'fact'].includes(node.type)) {
            setActiveModalNode(node);
            if (node.type === 'question') setUserAnswers(new Set());
        } else if (node && node.type === 'cutscene') {
            setShowCutscene(true);
        } else if (node && node.type === 'deepweb') {
            setShowDeepWeb(true);
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
                    setScore(s => s + activeModalNode.data.score);
                    setScoreDelta(activeModalNode.data.score);

                    // Objective Scoring
                    rewardObjectivePoints(activeModalNode, activeModalNode.data.score);

                    setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                    addLog(`HACK REWARD: +${activeModalNode.data.score} Points`);
                }

                // Close modal and move to next
                setActiveModalNode(null); // Close first
                handleOptionClick(next.target);
            }
        } else {
            addLog(`COMMAND FAILED: Access Denied.`);
            // Penalty
            const penalty = activeModalNode.data.penalty || 0;
            if (penalty > 0) {
                setScore(s => Math.max(0, s - penalty));
                setScoreDelta(-penalty);
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
                setScore(s => s + activeAccusationNode.data.score);
                setScoreDelta(activeAccusationNode.data.score);
                addLog(`CASE CLOSED: +${activeAccusationNode.data.score} Points`);

                rewardObjectivePoints(activeAccusationNode, activeAccusationNode.data.score);
            }
            setAccusationResult('success');
        } else {
            if (activeAccusationNode && activeAccusationNode.data.penalty) {
                const penalty = activeAccusationNode.data.penalty;
                setScore(s => Math.max(0, s - penalty));
                setScoreDelta(-penalty);
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
            // Award points
            if (activeModalNode.data.score && !scoredNodes.has(activeModalNode.id)) {
                setScore(s => s + (activeModalNode.data.score || 0));
                setScoreDelta(activeModalNode.data.score || 0);

                // Objective Scoring (Reward)
                rewardObjectivePoints(activeModalNode, activeModalNode.data.score || 0);

                setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                addLog(`QUIZ REWARD: +${activeModalNode.data.score} Points`);
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
            setActiveExplanation({
                title: "Excellent Intuition",
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
            const penalty = activeModalNode.data.penalty || 0;
            if (penalty > 0) {
                setScore(s => Math.max(0, s - penalty));
                setScoreDelta(-penalty);
                addLog(`QUIZ PROTECTION: -${penalty} Points`);

                rewardObjectivePoints(activeModalNode, -penalty);
            }
        }
    };

    const handleRevealHint = (hint) => {
        if (revealedHints.has(hint.id)) return;

        // Deduct points
        setScore(s => Math.max(0, s - (hint.penalty || 0)));
        setScoreDelta(-(hint.penalty || 0));

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
        const timeSpent = initialTime - timeLeft;
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

    const handleCloseModal = () => {
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
    };

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

                <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-md border-t-4 border-t-red-600 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:border-zinc-700 transition-colors duration-500">
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
            <div className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-3 md:px-6 shrink-0 relative z-[100]">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-red-600 px-1.5 md:px-2 py-1 rounded text-[8px] md:text-xs font-bold text-white uppercase tracking-widest animate-pulse shrink-0">
                        Active
                    </div>
                    {/* Score Display - Enhanced UI */}
                    <div className="relative">
                        <AnimatePresence>
                            {scoreDelta && (
                                <motion.div
                                    key={score + (scoreDelta || 0)}
                                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, y: -40, scale: 1.2 }}
                                    exit={{ opacity: 0, y: -80, scale: 1 }}
                                    className={`absolute left-1/2 -translate-x-1/2 font-black text-xl pointer-events-none z-[110] drop-shadow-lg ${scoreDelta > 0 ? 'text-amber-400' : 'text-red-500'}`}
                                >
                                    {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
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

                    {/* Timer Logic - Always Visible & Prominent */}
                    <div className={`${isSimultaneous ? 'relative mx-auto mt-2' : 'fixed top-2 left-1/2 -translate-x-1/2'} px-4 py-1.5 md:px-8 md:py-3 rounded-xl border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-[120] flex items-center gap-2 md:gap-3 backdrop-blur-xl transition-all duration-300 ${timeLeft < 60 || !missionStarted ? 'bg-red-950/90 border-red-500 text-red-500' : 'bg-black/90 border-indigo-500 text-indigo-400'}`}>
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
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowEvidenceBoard(true)}
                            className="bg-zinc-800 border border-zinc-700 text-amber-500 hover:text-amber-400 px-2 md:px-3 h-8 md:h-9"
                        >
                            <LayoutGrid className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Crazy Wall</span>
                        </Button>
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
                        else if (showEvidenceBoard) setShowEvidenceBoard(false);
                        else if (showAccuseModal) setShowAccuseModal(false);
                        else if (zoomedImage) setZoomedImage(null);
                        else {
                            const timeSpent = initialTime - timeLeft;
                            setPendingResultData({
                                score,
                                objectiveScores: playerObjectiveScores,
                                outcome: 'aborted',
                                timeSpentSeconds: timeSpent
                            });
                            setIsQuitting(true);
                            setShowFeedback(true);
                            ttsStop();
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
                        className="max-w-4xl mx-auto w-full pb-20"
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
                                    {options.some(e => nodes.find(n => n.id === e.target)?.type === 'suspect') ? (
                                        // Grid Layout for Suspects
                                        <div className="space-y-4">
                                            {/* Only show label if NOT in the dedicated view (fallback) */}
                                            {!(missionStarted && currentNode && currentNode.data.label.toLowerCase().includes('briefing')) && (
                                                <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold tracking-wider uppercase">
                                                    <User className="w-4 h-4" />
                                                    <span>Suspect Database Matches ({options.filter(e => nodes.find(n => n.id === e.target)?.type === 'suspect').length})</span>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {options.map((edge, i) => {
                                                    const targetNode = nodes.find(n => n.id === edge.target);
                                                    if (!targetNode || targetNode.type !== 'suspect') return null;

                                                    return (
                                                        <motion.button
                                                            key={edge.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            onClick={() => setActiveModalNode(targetNode)}
                                                            className="group text-left relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-0 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
                                                        >
                                                            <div className={`h-24 bg-gradient-to-br ${getAvatarColor(targetNode.data.name || 'Unk')} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                                                            <div className="absolute top-4 left-4">
                                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(targetNode.data.name || 'Unk')} flex items-center justify-center shadow-lg border-2 border-zinc-900`}>
                                                                    <span className="text-white font-bold text-lg">
                                                                        {(targetNode.data.name || '?').charAt(0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 pt-2">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate pr-2">
                                                                            {targetNode.data.name}
                                                                        </h3>
                                                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                                                                            {targetNode.data.role}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4 flex items-center text-xs text-zinc-600 group-hover:text-zinc-400">
                                                                    <span>Review Profile</span>
                                                                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
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

            {/* Generic Interaction Modal (Replaces Suspect Modal) */}
            <AnimatePresence>
                {activeModalNode && (
                    <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`bg-zinc-950 border border-zinc-800 p-0 rounded-2xl relative overflow-hidden shadow-2xl shadow-black max-h-[95vh] flex flex-col transition-all duration-500 ${(activeModalNode.type === 'threed' || activeModalNode.type === 'suspect' || activeModalNode.type === 'interrogation' || activeModalNode.type === 'question' || activeModalNode.type === 'email' || activeModalNode.type === 'fact') ? 'max-w-6xl w-full h-[95vh] md:h-[85vh]' : 'max-w-3xl w-full'}`}
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
                                                    setScoreDelta(activeModalNode.data.score);
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
                                            setScore(s => s + activeModalNode.data.score);
                                            setScoreDelta(activeModalNode.data.score);
                                            // Objective Scoring
                                            rewardObjectivePoints(activeModalNode, activeModalNode.data.score);
                                            setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                                            addLog(`INTERROGATION REWARD: +${activeModalNode.data.score} Points`);
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
                                            <HelpCircle className="w-8 h-8" />
                                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Challenge / Quiz</h2>
                                        </div>

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
                                            setScore(s => s + activeModalNode.data.score);
                                            setScoreDelta(activeModalNode.data.score);
                                            rewardObjectivePoints(activeModalNode, activeModalNode.data.score);
                                            setScoredNodes(prev => new Set([...prev, activeModalNode.id]));
                                            addLog(`FACT DISCOVERED: +${activeModalNode.data.score} Points`);
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
            < AnimatePresence >
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
            </AnimatePresence >

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
                                            {nodes.filter(n => n.type === 'suspect').map((suspect) => (
                                                <button
                                                    key={suspect.id}
                                                    onClick={() => handleAccuse(suspect)}
                                                    className="group relative flex flex-col items-center p-6 bg-zinc-900/50 border border-zinc-900 hover:border-red-500/50 rounded-xl transition-all hover:bg-zinc-900"
                                                >
                                                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(suspect.data.name)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                        <span className="text-3xl font-bold text-white shadow-black drop-shadow-lg">{suspect.data.name.charAt(0)}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{suspect.data.name}</h3>
                                                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{suspect.data.role}</p>
                                                    <div className="absolute inset-0 border-2 border-red-500/0 group-hover:border-red-500/20 rounded-xl transition-colors pointer-events-none"></div>
                                                </button>
                                            ))}
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

            {/* Explanation Modal */}
            <AnimatePresence>
                {activeExplanation && (
                    <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl`}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`w-full max-w-lg bg-zinc-950 border ${activeExplanation.type === 'correct' ? 'border-green-500/50 shadow-green-500/10' : 'border-red-500/50 shadow-red-500/10'} rounded-2xl overflow-hidden shadow-2xl relative flex flex-col`}
                        >
                            <div className={`h-2 w-full ${activeExplanation.type === 'correct' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border-2 ${activeExplanation.type === 'correct' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    {activeExplanation.type === 'correct' ? (
                                        <CheckCircle className="w-8 h-8 text-green-500 animate-pulse" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-red-500 animate-pulse" />
                                    )}
                                </div>
                                <h3 className={`text-2xl font-black uppercase tracking-tighter mb-4 ${activeExplanation.type === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                                    {activeExplanation.title}
                                </h3>
                                <div className="text-zinc-300 text-sm leading-relaxed mb-8 max-h-[40vh] overflow-y-auto px-2 custom-scrollbar whitespace-pre-wrap">
                                    {activeExplanation.text}
                                </div>
                                <Button
                                    onClick={activeExplanation.onClose}
                                    className={`w-full h-12 uppercase font-black tracking-widest text-xs rounded-xl shadow-lg transform transition-all active:scale-95 ${activeExplanation.type === 'correct' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                                >
                                    {activeExplanation.type === 'correct' ? 'Continue Investigation' : 'Re-analyze Evidence'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
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
