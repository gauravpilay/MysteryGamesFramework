import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Info, ShieldAlert, BookOpen, Microscope, User, ZoomIn, ArrowRight, Share2, Bookmark, Clock, Database, Globe } from 'lucide-react';
import { Button } from './ui/shared';

const CATEGORY_CONFIG = {
    general: {
        icon: Info,
        color: 'amber',
        label: 'Intelligence Report',
        bgGradient: 'from-amber-500/10 via-zinc-900/50 to-black',
        accent: 'text-amber-400',
        border: 'border-amber-500/30'
    },
    historical: {
        icon: BookOpen,
        color: 'stone',
        label: 'Archival Record',
        bgGradient: 'from-stone-500/10 via-zinc-900/50 to-black',
        accent: 'text-stone-400',
        border: 'border-stone-500/30'
    },
    scientific: {
        icon: Microscope,
        color: 'emerald',
        label: 'Forensic Analysis',
        bgGradient: 'from-emerald-500/10 via-zinc-900/50 to-black',
        accent: 'text-emerald-400',
        border: 'border-emerald-500/30'
    },
    secret: {
        icon: ShieldAlert,
        color: 'red',
        label: 'TOP SECRET DECLASSIFIED',
        bgGradient: 'from-red-500/20 via-zinc-900/50 to-black',
        accent: 'text-red-500',
        border: 'border-red-500/50'
    },
    biographical: {
        icon: User,
        color: 'indigo',
        label: 'Subject Dossier',
        bgGradient: 'from-indigo-500/10 via-zinc-900/50 to-black',
        accent: 'text-indigo-400',
        border: 'border-indigo-500/30'
    },
    technical: {
        icon: Database,
        color: 'cyan',
        label: 'System Log / Data',
        bgGradient: 'from-cyan-500/10 via-zinc-900/50 to-black',
        accent: 'text-cyan-400',
        border: 'border-cyan-500/30'
    }
};

const IMPORTANCE_BADGES = {
    trivial: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    normal: 'bg-blue-900/40 text-blue-300 border-blue-500/30',
    important: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
    critical: 'bg-red-900/60 text-red-200 border-red-500/50 animate-pulse'
};

const FactDisplay = ({ fact, onConfirm, onZoomImage, parseRichText }) => {
    const { data } = fact;
    const category = data.category || 'general';
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
    const CategoryIcon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`relative flex flex-col w-full h-full bg-zinc-950 overflow-hidden font-sans`}
        >
            {/* Advanced Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-20">
                <style>
                    {`
                    @keyframes scanline-fact {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(100vh); }
                    }
                    .animate-scanline-fact {
                        animation: scanline-fact 10s linear infinite;
                    }
                    `}
                </style>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-20 w-full animate-scanline-fact" />
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-br ${config.bgGradient} blur-[120px] opacity-40`} />
                <div className={`absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-tr ${config.bgGradient} blur-[100px] opacity-20`} />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Header - Advanced HUD Style */}
            <div className={`relative z-10 p-6 md:p-8 border-b border-white/5 bg-black/40 backdrop-blur-md shrink-0`}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <motion.div
                            initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            className={`p-4 rounded-2xl bg-black/60 border ${config.border} shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.05)] relative group`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-20 rounded-2xl`} />
                            <CategoryIcon className={`w-8 h-8 ${config.accent} relative z-10`} />

                            {/* Animated Scanner line on icon */}
                            <motion.div
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className={`absolute left-0 right-0 h-px bg-white/20 z-20 shadow-[0_0_10px_white]`}
                            />
                        </motion.div>

                        <div className="space-y-1">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <span className={`text-[10px] font-black tracking-[0.4em] ${config.accent} uppercase drop-shadow-sm`}>
                                    {config.label}
                                </span>
                                <div className={`h-px w-12 bg-gradient-to-r from-${config.color}-500/50 to-transparent`} />
                                <span className={cn("text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider", IMPORTANCE_BADGES[data.importance || 'normal'])}>
                                    {data.importance || 'Normal'}
                                </span>
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none pt-1"
                            >
                                {data.factTitle || data.label || 'Unknown Intelligence'}
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center gap-4 text-zinc-500 text-[10px] font-mono pt-2"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-zinc-600" />
                                    <span>TIMESTAMP: {new Date().toLocaleTimeString()}</span>
                                </div>
                                {data.source && (
                                    <div className="flex items-center gap-1.5">
                                        <Database className="w-3 h-3 text-zinc-600" />
                                        <span>SOURCE: <span className="text-zinc-400">{data.source}</span></span>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-zinc-400 hover:text-white">
                            <Bookmark className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-zinc-400 hover:text-white">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar relative z-10">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
                    {/* Left Side: Media Gallery */}
                    <div className="lg:w-5/12 space-y-6">
                        {data.images && data.images.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {data.images.map((url, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + (i * 0.15) }}
                                        className="group relative bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer ring-1 ring-white/5 ring-inset"
                                        onClick={() => onZoomImage(url)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <img src={url} className="w-full h-auto object-contain group-hover:scale-110 transition-transform duration-1000" alt={`Evidence ${i + 1}`} />

                                        {/* Dynamic Corner Decals */}
                                        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/40 z-20 group-hover:border-white transition-colors" />
                                        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/40 z-20 group-hover:border-white transition-colors" />

                                        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest shadow-2xl">
                                                <ZoomIn className="w-4 h-4" /> Analyze Detail
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="aspect-square rounded-3xl border-2 border-dashed border-white/5 bg-white/5 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                                <Globe className="w-12 h-12 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">No localized visual data</p>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Narrative Content */}
                    <div className="lg:w-7/12">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
                        >
                            {/* Grid Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                            <div className="prose prose-invert max-w-none relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-8 h-8 rounded-full border ${config.border} flex items-center justify-center`}>
                                        <div className={`w-2 h-2 rounded-full ${config.accent.replace('text', 'bg')} animate-pulse`} />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Transcribed Narrative</span>
                                </div>

                                <div
                                    className="whitespace-pre-wrap font-sans text-zinc-200 text-xl md:text-2xl leading-relaxed font-medium md:tracking-wide selection:bg-amber-500/30"
                                    dangerouslySetInnerHTML={{ __html: parseRichText(data.text) || 'Information is currently classified or missing from this node.' }}
                                />
                            </div>

                            {/* Technical Meta Footer in the content box */}
                            <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-6 items-center">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Status</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[11px] text-emerald-500/80 font-mono font-bold uppercase">Verified Payload</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Encryption</span>
                                    <span className="text-[11px] text-zinc-400 font-mono font-bold uppercase">AES-256 Quantum</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Clearance</span>
                                    <span className={`text-[11px] ${data.importance === 'critical' ? 'text-red-500' : 'text-amber-500'} font-mono font-bold uppercase`}>Level {data.importance === 'critical' ? '5' : '3'} Authorization</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 md:p-10 border-t border-white/5 bg-black/60 backdrop-blur-xl shrink-0 relative z-20">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {data.score > 0 && (
                            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30">
                                <div className="p-1.5 bg-amber-500 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                    <ArrowRight className="w-4 h-4 text-black font-black" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-none">Experience Gained</p>
                                    <p className="text-xl font-black text-amber-400">+{data.score} <span className="text-xs opacity-60">XP</span></p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        className={`${config.accent.replace('text', 'bg')} hover:opacity-90 active:scale-95 text-black font-black uppercase tracking-[0.2em] text-[12px] h-14 px-12 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] transition-all rounded-2xl flex items-center gap-3 border-none`}
                        onClick={onConfirm}
                    >
                        Index intelligence <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

// Helper for class merging
function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}

export default FactDisplay;
