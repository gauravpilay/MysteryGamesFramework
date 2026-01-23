import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Brain, Cpu, Loader2, Star, User, ShieldAlert, AlertCircle, Info } from 'lucide-react';
import { callAI } from '../lib/ai';

const AIInterrogation = ({ node, onComplete, onFail, requestCount, onAIRequest }) => {
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

    // Get API Key from environment or localStorage
    const getApiKey = () => {
        const envKey = import.meta.env[node.data.apiKeyVar] || import.meta.env.VITE_AI_API_KEY;
        if (envKey) return envKey;
        return localStorage.getItem('MYSTERY_AI_KEY');
    };

    const apiKey = getApiKey();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const [showLimitPopup, setShowLimitPopup] = useState(false);

    const MAX_REQUESTS = parseInt(import.meta.env.VITE_MAX_AI_REQUESTS) || 10;
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
        <div className="flex flex-col h-[600px] w-full max-w-4xl bg-zinc-950 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 font-sans">
            {/* Header */}
            <div className="px-6 py-4 border-b border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Brain className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Interrogation</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Cpu className="w-3 h-3" /> {apiKey ? (provider === 'gemini' ? 'Google Gemini 2.0' : 'OpenAI ChatGPT') : 'Simulation Mode'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                            <span className="text-[10px] text-indigo-500/80 font-black uppercase tracking-widest italic">{node.data.label}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {score > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 uppercase">{score} PTS Available</span>
                        </div>
                    )}
                    {apiKey && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 bg-${isLimitReached ? 'red' : 'indigo'}-500/10 border border-${isLimitReached ? 'red' : 'indigo'}-500/30 rounded-full`}>
                            <Info className={`w-3 h-3 text-${isLimitReached ? 'red' : 'indigo'}-500`} />
                            <span className={`text-[9px] font-black text-${isLimitReached ? 'red' : 'indigo'}-400 uppercase`}>
                                {MAX_REQUESTS - requestCount} Qs Left
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => onComplete()}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                        End Session
                    </button>
                    <button onClick={() => onFail()} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.03)_0,transparent_100%)]"
            >
                {messages.map((msg, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] p-4 rounded-2xl border ${msg.role === 'user'
                            ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-lg shadow-indigo-500/20'
                            : 'bg-zinc-900/80 border-white/10 text-zinc-300 rounded-tl-none backdrop-blur-md'
                            }`}>
                            <div className="flex items-center gap-2 mb-1.5 opacity-50">
                                {msg.role === 'user' ? (
                                    <span className="text-[9px] font-black uppercase tracking-widest">Agent (You)</span>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Suspect</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">System Error</p>
                            <p className="text-xs text-red-200/70 font-medium">{error}</p>
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
                                className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-lg uppercase"
                            >
                                Enter Key
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-zinc-900/30">
                <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask the suspect something (e.g., 'Where were you last night?')..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isTyping}
                        className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale text-white rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="mt-3 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] animate-pulse">
                    AI Interrogation Active // Secure Link Established
                </p>
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
