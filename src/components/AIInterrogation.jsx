import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Brain, Cpu, Loader2, Star, User, ShieldAlert, AlertCircle, Info, Radio, Activity, Terminal } from 'lucide-react';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';
import { useLicense } from '../lib/licensing';

const AIInterrogation = ({ node, onComplete, onFail, requestCount, onAIRequest }) => {
    const { settings } = useConfig();
    const { licenseData, getFeatureValue } = useLicense();
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Neural link established. Interrogation protocol initialized. Subject is ready for questioning. What is your first inquiry, Detective?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    const provider = node.data.aiProvider || 'gemini';
    const systemPrompt = node.data.systemPrompt || "You are a suspect in a mystery game. Be cautious and realistic.";
    const score = node.data.score || 0;

    // Get API Key from environment or settings or localStorage
    const getApiKey = () => {
        if (settings.aiApiKey) return settings.aiApiKey;
        const envKey = import.meta.env[node.data.apiKeyVar];
        if (envKey) return envKey;
        const dotEnvKey = import.meta.env.VITE_AI_API_KEY;
        if (dotEnvKey) return dotEnvKey;
        return localStorage.getItem('MYSTERY_AI_KEY');
    };

    const apiKey = getApiKey();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const [showLimitPopup, setShowLimitPopup] = useState(false);

    const getEffectiveLimit = () => {
        // Try to get from license using the new helper function
        const licenseLimit = getFeatureValue('num_of_tact_questions');
        if (licenseLimit !== null && licenseLimit !== undefined) {
            const parsed = parseInt(licenseLimit);
            if (!isNaN(parsed)) return parsed;
        }

        // Fallback to system settings
        const settingsLimit = settings.maxAIRequests;
        if (settingsLimit !== undefined && settingsLimit !== null) {
            const parsed = parseInt(settingsLimit);
            if (!isNaN(parsed)) return parsed;
        }

        // Default fallback
        return 10;
    };

    const MAX_REQUESTS = getEffectiveLimit();
    const isLimitReached = requestCount >= MAX_REQUESTS;

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        // Re-calculate inside handler to ensure we have the most up-to-date props/context
        const currentLimit = getEffectiveLimit();
        const currentLimitReached = requestCount >= currentLimit;

        if (currentLimitReached) {
            setShowLimitPopup(true);
            return;
        }

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsTyping(true);
        setError(null);

        onAIRequest();

        try {
            const response = await callAI(provider, systemPrompt, userMsg, apiKey || 'SIMULATION_MODE');
            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        } catch (err) {
            console.error("AI Error:", err);
            setError(err.message || "Failed to get response from AI provider.");
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-zinc-950 rounded-2xl overflow-hidden font-sans relative">
            {/* AMBIENT BACKGROUND EFFECTS */}
            <div className="absolute inset-0 bg-[#020202] pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5"></div>
            </div>

            {/* LEFT PROFILE STRIP (Vertical Sidebar) */}
            <div className="w-full md:w-80 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 relative z-10 backdrop-blur-3xl">
                <div className="p-4 md:p-8 flex flex-col items-center">
                    {/* AVATAR HEXAGON/DIAMOND */}
                    <div className="relative mb-4 md:mb-6">
                        <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>
                        <div className="w-24 h-24 md:w-32 md:h-32 relative">
                            {/* Animated tech ring */}
                            <svg className="absolute -inset-2 w-[144px] h-[144px] animate-[spin_10s_linear_infinite]">
                                <circle cx="72" cy="72" r="70" stroke="currentColor" strokeWidth="1" fill="none" className="text-indigo-500/20" strokeDasharray="10 20" />
                            </svg>
                            <div className="w-full h-full bg-zinc-900 border-2 border-indigo-500/30 rounded-3xl rotate-45 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                                <div className="-rotate-45 flex flex-col items-center">
                                    <User className="w-16 h-16 text-indigo-400 opacity-60" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter mb-1">{node.data.name || 'Unknown Subject'}</h3>
                        <div className="flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Status: Connected</span>
                        </div>
                    </div>

                    {/* BIOMETRICS GRID */}
                    <div className="grid grid-cols-2 gap-3 w-full mt-6 md:mt-10">
                        <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl flex flex-col gap-1">
                            <Activity className="w-3 h-3 text-red-500/50" />
                            <span className="text-[8px] font-black text-zinc-600 uppercase">Heart Rate</span>
                            <span className="text-xs font-mono text-zinc-400">84 BPM</span>
                        </div>
                        <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl flex flex-col gap-1">
                            <Radio className="w-3 h-3 text-emerald-500/50" />
                            <span className="text-[8px] font-black text-zinc-600 uppercase">Neural Lag</span>
                            <span className="text-xs font-mono text-zinc-400">12ms</span>
                        </div>
                    </div>

                    {/* REMAINING QUERIES */}
                    <div className="w-full mt-6 md:mt-8 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <Brain className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Query Buffer</span>
                            <span className="text-sm font-mono font-black text-white">{MAX_REQUESTS - requestCount} / {MAX_REQUESTS}</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((MAX_REQUESTS - requestCount) / MAX_REQUESTS) * 100}%` }}
                                className="h-full bg-gradient-to-r from-red-500 via-indigo-500 to-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-4 md:p-8 border-t border-white/5 space-y-3 md:space-y-4">
                    {score > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{score} Bounty Points</span>
                        </div>
                    )}
                    <button
                        onClick={() => onComplete()}
                        className="w-full py-3 md:py-4 bg-white text-black text-[10px] md:text-[11px] font-black rounded-xl hover:bg-zinc-200 transition-all uppercase tracking-[0.2em] shadow-2xl shadow-white/5 active:scale-95"
                    >
                        Conclude Link
                    </button>
                    <button
                        onClick={() => onFail()}
                        className="w-full py-3 text-[9px] font-black text-zinc-600 hover:text-red-400 uppercase tracking-widest transition-colors"
                    >
                        Emergency Abort
                    </button>
                </div>
            </div>

            {/* MAIN INTERFACE: MESSAGES & INPUT */}
            <div className="flex-1 flex flex-col h-full relative z-10">
                {/* HUD HEADER */}
                <div className="h-12 md:h-16 px-4 md:px-8 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Operation Node</span>
                            <span className="text-xs font-bold text-white uppercase tracking-tight">C-LINK // ALPHA-7</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">AI Engine</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">
                                {apiKey ? (provider === 'gemini' ? 'Gemini 2.0 FLASH' : 'GPT-4 TURBO') : 'PROXIED_SIMULATION'}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar"
                >
                    <div className="max-w-3xl mx-auto space-y-8 pb-12">
                        {messages.map((msg, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {/* Header Info */}
                                    <div className={`flex items-center gap-3 mb-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-6 h-6 rounded-lg ${msg.role === 'user' ? 'bg-indigo-500/20' : 'bg-white/10'} flex items-center justify-center p-1.5`}>
                                            {msg.role === 'user' ? <ShieldAlert className="w-full h-full text-indigo-400" /> : <Terminal className="w-full h-full text-zinc-400" />}
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-indigo-400' : 'text-zinc-500'}`}>
                                            {msg.role === 'user' ? 'INTERROGATOR_MAIN' : 'SUBJECT_REPLY'}
                                        </span>
                                    </div>

                                    {/* Bubble */}
                                    <div className={`relative p-3.5 md:p-5 rounded-2xl border transition-all duration-300 ${msg.role === 'user'
                                        ? 'bg-indigo-600/90 border-indigo-400/50 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] rounded-tr-none'
                                        : 'bg-zinc-900 border-white/5 text-zinc-200 backdrop-blur-xl shadow-xl rounded-tl-none hover:border-white/10'
                                        }`}>
                                        <p className="text-sm md:text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="flex flex-col items-start max-w-[80%]">
                                    <div className="flex items-center gap-2 mb-2 px-1 text-emerald-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Processing Signal...</span>
                                    </div>
                                    <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[0, 0.15, 0.3].map((delay, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, delay }}
                                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* INPUT CONSOLE */}
                <div className="p-4 md:p-8 border-t border-white/5 bg-black/40 backdrop-blur-3xl shrink-0">
                    <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-4 relative">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-focus-within:bg-indigo-500/10 transition-colors pointer-events-none"></div>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="TYPE SIGNAL..."
                                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-8 py-3.5 md:py-5 text-sm text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500/50 transition-all font-mono tracking-wider relative z-10 shadow-inner"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isTyping}
                            className="p-3.5 md:p-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:grayscale text-white rounded-xl md:rounded-2xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.2)] active:scale-95 group relative overflow-hidden"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                            <Send className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em]">
                        <div className="flex gap-6">
                            <span>Signal: 256-BIT_ENC</span>
                            <span>Direct Line: Node_82</span>
                        </div>
                        <div className="animate-pulse">Waiting for transmit Command_</div>
                    </div>
                </div>
            </div>

            {/* Error Overlay */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg z-[100] px-4"
                    >
                        <div className="p-6 bg-red-950/90 border border-red-500/50 rounded-2xl backdrop-blur-xl shadow-2xl shadow-red-950 flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 leading-none">Transmission Failure</p>
                                <p className="text-xs text-red-100/60 truncate">{error}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LIMIT POPUP */}
            <AnimatePresence>
                {showLimitPopup && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[40px] p-10 shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 bg-red-500/10 rounded-3xl border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Neural Saturation</h3>
                            <p className="text-sm text-zinc-400 mb-10 leading-relaxed px-4">
                                The subject has reached cognitive limit. Further interrogation requires re-initialization from a physical node.
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={() => onComplete()}
                                    className="w-full py-4 bg-white text-black text-xs font-black rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest"
                                >
                                    Review Transcript
                                </button>
                                <button
                                    onClick={() => setShowLimitPopup(false)}
                                    className="w-full py-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIInterrogation;
