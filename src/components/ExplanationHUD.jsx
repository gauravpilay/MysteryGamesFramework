import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ShieldCheck, ShieldAlert, Zap, AlertTriangle, TrendingUp, Search, Database, Fingerprint } from 'lucide-react';
import { Button } from './ui/shared';

const ExplanationHUD = ({ type, title, text, onClose, isSimultaneous }) => {
    const isCorrect = type === 'correct';

    const config = isCorrect ? {
        color: 'emerald',
        icon: ShieldCheck,
        badge: 'Validation Success',
        glow: 'shadow-emerald-500/20',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/50',
        accent: 'text-emerald-400',
        gradient: 'from-emerald-600 to-teal-500',
        headerBg: 'bg-emerald-950/40',
        button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        particleColor: 'bg-emerald-400'
    } : {
        color: 'rose',
        icon: ShieldAlert,
        badge: 'Analysis Error',
        glow: 'shadow-rose-500/20',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/50',
        accent: 'text-rose-400',
        gradient: 'from-rose-600 to-red-500',
        headerBg: 'bg-rose-950/40',
        button: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
        particleColor: 'bg-rose-400'
    };

    const Icon = config.icon;

    return (
        <div className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden`}>
            {/* Backdrop with blurring effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Dynamic Background Particles/Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className={`absolute -top-1/4 -right-1/4 w-full h-full bg-${config.color}-500/10 blur-[120px] rounded-full`}
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.15, 0.1],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity }}
                    className={`absolute -bottom-1/4 -left-1/4 w-full h-full bg-${config.color}-500/5 blur-[100px] rounded-full`}
                />
            </div>

            {/* The HUD Component */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    x: !isCorrect ? [0, -10, 10, -10, 10, 0] : 0
                }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{
                    type: "spring",
                    damping: 20,
                    stiffness: 200,
                    x: { duration: 0.4, ease: "easeInOut" }
                }}
                className={`relative w-full max-w-xl bg-zinc-950/90 border-2 ${config.border} rounded-[2.5rem] overflow-hidden shadow-2xl ${config.glow}`}
            >
                {/* Tech HUD Corners */}
                <div className={`absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 ${config.border} rounded-tl-xl opacity-50`} />
                <div className={`absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 ${config.border} rounded-tr-xl opacity-50`} />
                <div className={`absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 ${config.border} rounded-bl-xl opacity-50`} />
                <div className={`absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 ${config.border} rounded-br-xl opacity-50`} />

                {/* Scanning Light Effect */}
                <motion.div
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className={`absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-${config.color}-400/50 to-transparent z-10`}
                />

                <div className="flex flex-col h-full">
                    {/* Top Status Bar */}
                    <div className={`${config.headerBg} border-b ${config.border} px-8 py-6 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse shadow-[0_0_10px_currentColor]`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono ${config.accent}`}>
                                {config.badge}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-3 bg-zinc-800 rounded-full" />
                            <div className="w-1 h-5 bg-zinc-700 rounded-full" />
                            <div className="w-1 h-3 bg-zinc-800 rounded-full" />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-8 md:p-12 flex flex-col items-center text-center">
                        <motion.div
                            initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                            className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border-4 ${config.border} bg-black/60 shadow-inner relative group`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br from-${config.color}-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <Icon className={`w-12 h-12 ${config.accent} drop-shadow-[0_0_15px_currentColor]`} />

                            {/* Orbital Ring Path */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                <circle
                                    cx="48" cy="48" r="44"
                                    className={`stroke-${config.color}-500/20 fill-none`}
                                    strokeWidth="1"
                                />
                            </svg>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 leading-tight bg-gradient-to-br ${config.gradient} bg-clip-text text-transparent`}>
                                {title}
                            </h3>

                            <div className="flex items-center justify-center gap-4 mb-8">
                                <div className="h-px w-8 bg-zinc-800" />
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <Database className="w-3 h-3" /> System Evidence Log
                                </div>
                                <div className="h-px w-8 bg-zinc-800" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="w-full bg-black/40 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 mb-10 text-left relative overflow-hidden group"
                        >
                            {/* Decorative Grid Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                            <div className="relative z-10 flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-1.5 h-1.5 rounded-full ${config.accent.replace('text', 'bg')} mb-2`} />
                                    <div className="w-px flex-1 bg-gradient-to-b from-zinc-800 to-transparent" />
                                </div>
                                <div className="text-zinc-300 text-sm md:text-base leading-relaxed max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap font-medium">
                                    {text}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="w-full"
                        >
                            <Button
                                onClick={onClose}
                                className={`w-full h-16 uppercase font-black tracking-[0.2em] text-[11px] rounded-[1.25rem] shadow-2xl transition-all active:scale-95 group relative overflow-hidden ${config.button}`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {isCorrect ? (
                                        <>Advance Protocol <ShieldCheck className="w-5 h-5" /></>
                                    ) : (
                                        <>Re-evaluate Findings <Search className="w-5 h-5" /></>
                                    )}
                                </span>
                                {/* Hover Gradient Sweep */}
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                            </Button>
                        </motion.div>
                    </div>

                    {/* Technical Footer */}
                    <div className="bg-black/60 px-8 py-4 border-t border-white/5 flex justify-between items-center text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                        <span>Analysis ID: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><TrendingUp className="w-2 h-2" /> Synced</span>
                            <span className="flex items-center gap-1"><Fingerprint className="w-2 h-2" /> Encrypted</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ExplanationHUD;
