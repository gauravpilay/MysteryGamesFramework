import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Brain, Cpu, Loader2, Star, User, ShieldAlert, AlertCircle, Info } from 'lucide-react';
import { callAI } from '../lib/ai';
import { useConfig } from '../lib/config';

const AIInterrogation = ({ node, onComplete, onFail, requestCount, onAIRequest }) => {
    const { settings } = useConfig();
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hello detective! Tell me how can I help you today?" }
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
        // Priority: DB Settings -> Node specific env var (legacy) -> .env fallback -> Local Storage
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
    }, [messages]);

    const [showLimitPopup, setShowLimitPopup] = useState(false);

    const MAX_REQUESTS = parseInt(settings.maxAIRequests) || 10;
    const isLimitReached = requestCount >= MAX_REQUESTS;

    const handleSendMessage = async () => {
        if (!input.trim() || isTyping) return;

        // Check limit
        if (isLimitReached && apiKey) {
            setShowLimitPopup(true);
            return;
        }

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsTyping(true);
        setError(null);

        if (!apiKey) {
            console.warn("AI Reference Key not found. Falling back to Simulation Mode.");
        } else {
            // Only count real AI requests
            onAIRequest();
        }

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
        <div className="flex flex-col h-[700px] w-full max-w-5xl bg-zinc-950 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 font-sans relative">
            {/* Ambient background effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

            {/* Top Bar / Header */}
            <div className="px-8 py-5 border-b border-indigo-500/20 bg-black/40 backdrop-blur-xl flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                        <div className="relative p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl shadow-inner">
                            <Brain className="w-6 h-6 text-indigo-400" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                            AI Neural Link <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5" /> Engine: {apiKey ? (provider === 'gemini' ? 'Gemini 2.0 Flash' : 'GPT-4 Turbo') : 'Simulation Sub-routine'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-zinc-800" />
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.1em]">{node.data.name || 'Unknown Suspect'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Signal Strength</p>
                        <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-indigo-500' : 'bg-zinc-800'}`}></div>
                            ))}
                        </div>
                    </div>

                    {score > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border border-amber-500/20 rounded-xl shadow-lg shadow-amber-500/5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{score} Bounty</span>
                        </div>
                    )}

                    <div className={`flex items-center gap-2 px-4 py-2 bg-${isLimitReached ? 'red' : 'indigo'}-500/5 border border-${isLimitReached ? 'red' : 'indigo'}-500/20 rounded-xl shadow-lg`}>
                        <Info className={`w-3.5 h-3.5 text-${isLimitReached ? 'red' : 'indigo'}-500`} />
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-black text-${isLimitReached ? 'red' : 'indigo'}-400 uppercase leading-none`}>
                                {MAX_REQUESTS - requestCount} Queries
                            </span>
                            <span className="text-[7px] text-zinc-600 uppercase font-bold">Remaining</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-white/5 mx-2"></div>

                    <button
                        onClick={() => onComplete()}
                        className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-[10px] font-black rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-white/5"
                    >
                        Finalize
                    </button>
                    <button onClick={() => onFail()} className="p-2.5 hover:bg-red-500/10 rounded-xl text-zinc-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0,transparent_100%)]"
            >
                <div className="flex flex-col gap-6">
                    {messages.map((msg, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`group relative max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-2 mb-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`p-1 rounded-md ${msg.role === 'user' ? 'bg-indigo-500/20' : 'bg-emerald-500/10'}`}>
                                        {msg.role === 'user' ? <ShieldAlert className="w-3 h-3 text-indigo-400" /> : <User className="w-3 h-3 text-emerald-500" />}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-indigo-400' : 'text-emerald-500'}`}>
                                        {msg.role === 'user' ? 'Interrogator Node' : (node.data.name || 'Suspect Entry')}
                                    </span>
                                </div>
                                <div className={`p-5 rounded-2xl border transition-all duration-500 ${msg.role === 'user'
                                    ? 'bg-indigo-600 border-indigo-400/50 text-white rounded-tr-none shadow-xl shadow-indigo-900/40'
                                    : 'bg-zinc-900/60 border-white/5 text-zinc-300 rounded-tl-none backdrop-blur-md group-hover:border-indigo-500/20'
                                    }`}>
                                    <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap selection:bg-white/20">{msg.text}</p>
                                </div>
                                <div className={`mt-1.5 flex transition-opacity opacity-0 group-hover:opacity-100 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-[7px] text-zinc-700 font-bold uppercase tracking-widest leading-none">Timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Suspect Calculating...</span>
                                </div>
                                <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl rounded-tl-none backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-4 backdrop-blur-md">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-0.5">Neural Interference Detected</p>
                            <p className="text-xs text-red-100/60 font-medium">{error}</p>
                        </div>
                        {error.includes("Reference Key") && (
                            <button
                                onClick={() => {
                                    const key = prompt("Please enter your AI API Key:");
                                    if (key) {
                                        localStorage.setItem('MYSTERY_AI_KEY', key);
                                        setError(null);
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest transition-all"
                            >
                                Re-sync Key
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Input Area / Action Console */}
            <div className="p-6 border-t border-white/5 bg-black/60 backdrop-blur-2xl z-10">
                <div className="relative flex items-center gap-4 max-w-5xl mx-auto">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-x-0 -top-12 flex justify-center opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[8px] font-black text-indigo-400 uppercase tracking-widest backdrop-blur-md">
                                Secure Line Active // 256-bit Encrypted
                            </div>
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="TRANSMIT INQUIRY TO SUSPECT..."
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-8 py-5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900/80 transition-all font-mono tracking-wide"
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isTyping}
                        className="p-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:grayscale text-white rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
                    >
                        <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
                <div className="mt-4 flex justify-center items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.3em]">Audio Feed: Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.3em]">Biometrics: Stable</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500/50">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Status: Waiting for input</span>
                    </div>
                </div>
            </div>

            {/* Limit Reached Popup Overlay */}
            <AnimatePresence>
                {showLimitPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-sm bg-zinc-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-500/10 text-center"
                        >
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Usage Limit Reached</h3>
                            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                                You have exhausted the maximum of <span className="text-red-400 font-bold">{MAX_REQUESTS}</span> AI-powered questions for this session to maintain secure operations.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => onComplete()}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest"
                                >
                                    Conclude Interrogation
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLimitPopup(false);
                                    }}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-black rounded-xl transition-all uppercase tracking-widest"
                                >
                                    Review Transcript
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIInterrogation;
