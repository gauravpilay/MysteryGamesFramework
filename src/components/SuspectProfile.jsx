import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Activity, MessageSquare, Search, Terminal, ChevronRight, Briefcase, ShieldAlert, Fingerprint, Dna, AlertTriangle, Eye, Zap, Target, Mail, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const getAvatarColor = (name) => {
    const colors = [
        'from-indigo-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-pink-600',
        'from-cyan-500 to-blue-600',
        'from-violet-500 to-fuchsia-600'
    ];
    const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const getEdgeLabel = (targetNode) => {
    if (!targetNode) return 'Continue';
    if (targetNode.type === 'interrogation') return targetNode.data.label || 'Begin Interrogation';
    if (targetNode.type === 'story') return targetNode.data.label || 'Continue Investigation';
    return targetNode.data.label || targetNode.type;
};

// Particle component for floating effects
const Particle = ({ delay = 0 }) => (
    <motion.div
        className="absolute w-1 h-1 bg-indigo-500 rounded-full"
        initial={{ opacity: 0, y: 100, x: Math.random() * 100 - 50 }}
        animate={{
            opacity: [0, 1, 0],
            y: -100,
            x: Math.random() * 100 - 50
        }}
        transition={{
            duration: 3,
            delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2
        }}
    />
);

// DNA Helix Animation Component
const DNAHelix = () => (
    <div className="absolute right-0 top-0 bottom-0 w-32 overflow-hidden opacity-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-2 h-2 bg-indigo-500 rounded-full"
                style={{
                    left: '50%',
                    top: `${i * 5}%`
                }}
                animate={{
                    x: [Math.sin(i * 0.5) * 30, Math.sin(i * 0.5 + Math.PI) * 30],
                    opacity: [0.3, 1, 0.3]
                }}
                transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />
        ))}
    </div>
);

// Fingerprint Scanner Effect
const FingerprintScanner = ({ active }) => (
    <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.3 }}
    >
        <motion.div
            className="relative w-32 h-32"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-indigo-500 rounded-full"
                    style={{
                        transform: `scale(${1 + i * 0.15})`,
                        opacity: 0.1 - i * 0.01
                    }}
                    animate={{
                        scale: [1 + i * 0.15, 1 + (i + 1) * 0.15],
                        opacity: [0.1 - i * 0.01, 0]
                    }}
                    transition={{
                        duration: 2,
                        delay: i * 0.25,
                        repeat: Infinity,
                        ease: 'easeOut'
                    }}
                />
            ))}
        </motion.div>
    </motion.div>
);

// Threat Level Indicator
const ThreatLevel = ({ suspect }) => {
    // Calculate threat level based on suspect characteristics
    let threatValue = 30; // Base threat
    let threatLevel = 'low';

    // Increase threat based on role
    const role = suspect.data.role?.toLowerCase() || '';
    if (role.includes('criminal') || role.includes('murderer') || role.includes('killer')) {
        threatValue += 40;
    } else if (role.includes('suspect') || role.includes('person of interest')) {
        threatValue += 20;
    } else if (role.includes('witness')) {
        threatValue += 10;
    }

    // Determine threat level
    if (threatValue >= 75) {
        threatLevel = 'critical';
    } else if (threatValue >= 55) {
        threatLevel = 'high';
    } else if (threatValue >= 35) {
        threatLevel = 'medium';
    } else {
        threatLevel = 'low';
    }

    const levels = {
        low: { color: 'emerald', label: 'LOW RISK', description: 'Cooperative witness' },
        medium: { color: 'amber', label: 'MODERATE', description: 'Person of interest' },
        high: { color: 'orange', label: 'HIGH RISK', description: 'Primary suspect' },
        critical: { color: 'red', label: 'CRITICAL', description: 'Dangerous individual' }
    };

    const threat = levels[threatLevel];

    return (
        <div className="relative">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-3 h-3 text-${threat.color}-500`} />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Threat Assessment</span>
            </div>
            <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r from-${threat.color}-500 to-${threat.color}-600`}
                    initial={{ width: 0 }}
                    animate={{ width: `${threatValue}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                />
                <motion.div
                    className={`absolute inset-y-0 left-0 bg-${threat.color}-400`}
                    animate={{
                        opacity: [0.5, 1, 0.5],
                        width: ['0%', `${threatValue}%`, `${threatValue}%`]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>
            <div className="flex justify-between mt-1">
                <span className={`text-[9px] font-bold text-${threat.color}-500 uppercase`}>{threat.label}</span>
                <span className={`text-[9px] font-mono text-zinc-500`}>{threat.description}</span>
            </div>
        </div>
    );
};

export default function SuspectProfile({
    suspect,
    inventory,
    nodes,
    edges,
    onClose,
    onNavigate,
    onLog,
    isSimultaneous = false
}) {
    const [scanActive, setScanActive] = useState(false);
    const [showParticles, setShowParticles] = useState(true);
    const [previewEvidence, setPreviewEvidence] = useState(null);

    useEffect(() => {
        // Activate scan effect on mount
        setScanActive(true);
        const timer = setTimeout(() => setScanActive(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            {/* Multi-layer Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black pointer-events-none"></div>
            <div className={`absolute inset-0 bg-gradient-to-tr ${getAvatarColor(suspect.data.name)} opacity-[0.05] blur-3xl pointer-events-none`}></div>

            {/* Animated Grid */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
            }}></div>

            {/* Scanline Effect */}
            <motion.div
                className="absolute inset-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none z-10"
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            {/* Floating Particles */}
            {showParticles && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <Particle key={i} delay={i * 0.2} />
                    ))}
                </div>
            )}

            {/* DNA Helix Background */}
            <DNAHelix />

            {/* HERO HEADER SECTION - ENHANCED */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative border-b border-white/10 bg-gradient-to-b from-zinc-900/90 to-transparent backdrop-blur-2xl shrink-0 overflow-hidden"
            >
                {/* Top Accent Bars */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                <div className="absolute top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 p-6 md:p-12 relative">
                    {/* Enhanced Holographic Profile Image */}
                    <motion.div
                        className="relative shrink-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        {/* Outer Glow Rings */}
                        <motion.div
                            className="absolute -inset-8 rounded-full"
                            animate={{
                                background: [
                                    'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                                    'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
                                    'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
                                    'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)'
                                ]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />

                        {/* Rotating Ring */}
                        <motion.div
                            className="absolute -inset-6 border-2 border-indigo-500/30 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                        </motion.div>

                        {/* Main Profile Container */}
                        <div className="relative w-28 h-28 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 p-1 shadow-2xl">
                            <div className={`w-full h-full rounded-full bg-gradient-to-br ${getAvatarColor(suspect.data.name)} opacity-20 absolute inset-0`}></div>
                            <div className="w-full h-full rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center relative overflow-hidden border-2 border-white/10">
                                <User className="w-12 h-12 md:w-24 md:h-24 text-white/40 relative z-10" />

                                {/* Holographic Shimmer */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent"
                                    animate={{ y: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                />

                                {/* Fingerprint Scanner Overlay */}
                                <FingerprintScanner active={scanActive} />
                            </div>
                        </div>

                        {/* Enhanced Status Indicator */}
                        <motion.div
                            className="absolute -bottom-2 -right-2 px-4 py-2 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full backdrop-blur-md shadow-lg"
                            animate={{
                                boxShadow: [
                                    '0 0 20px rgba(16, 185, 129, 0.3)',
                                    '0 0 40px rgba(16, 185, 129, 0.5)',
                                    '0 0 20px rgba(16, 185, 129, 0.3)'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="flex items-center gap-2">
                                <motion.div
                                    className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">ACTIVE</span>
                            </div>
                        </motion.div>

                        {/* Biometric Scan Lines */}
                        <motion.div
                            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: scanActive ? [0, 1, 0] : 0 }}
                            transition={{ duration: 2, repeat: scanActive ? Infinity : 0 }}
                        >
                            <div className="absolute inset-0 border-2 border-indigo-500 rounded-full animate-ping"></div>
                        </motion.div>
                    </motion.div>

                    {/* Identity & Role - Enhanced */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3 drop-shadow-2xl relative"
                                >
                                    {suspect.data.name}
                                    {/* Text Glow Effect */}
                                    <motion.span
                                        className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 blur-sm"
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {suspect.data.name}
                                    </motion.span>
                                </motion.h1>

                                <div className="flex flex-col md:flex-row items-center gap-3">
                                    {/* Role Badge - Enhanced */}
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: 1 }}
                                        className="px-4 py-1.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/40 rounded-full backdrop-blur-md shadow-lg relative overflow-hidden"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                        />
                                        <span className="text-xs font-black text-red-400 uppercase tracking-wider relative z-10">{suspect.data.role}</span>
                                    </motion.div>

                                    {/* ID Badge */}
                                    <div className="px-3 py-1.5 bg-zinc-800/70 border border-white/20 rounded-full backdrop-blur-md shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <Fingerprint className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[10px] font-mono text-zinc-300">ID: {suspect.id.substring(0, 8).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Quick Stats Bar */}
                        <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mt-6 flex-wrap">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl backdrop-blur-md shadow-lg"
                            >
                                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-300">VERIFIED</span>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl backdrop-blur-md shadow-lg"
                            >
                                <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-amber-300">MONITORED</span>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-md shadow-lg"
                            >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-300">TRACKED</span>
                            </motion.div>
                        </div>

                        {/* Threat Level Indicator */}
                        <div className="mt-4 max-w-md">
                            <ThreatLevel suspect={suspect} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-8 md:space-y-12">

                    {/* TESTIMONY SECTION - ENHANCED */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 flex items-center justify-center shadow-lg"
                            >
                                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                            </motion.div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Intercepted Testimony</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Audio Intelligence • Classified</p>
                            </div>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="relative group"
                        >
                            {/* Glow Effect */}
                            <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl blur-3xl"></div>

                            <div className="relative p-6 md:p-12 bg-gradient-to-br from-zinc-900/60 to-black/60 border-2 border-white/10 border-l-indigo-500 border-l-[6px] rounded-2xl md:rounded-3xl backdrop-blur-3xl shadow-2xl overflow-hidden">
                                {/* Animated Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
                                        backgroundSize: '30px 30px'
                                    }}></div>
                                </div>

                                {/* Recording Indicator */}
                                <div className="absolute top-4 md:top-6 right-4 md:right-8 flex items-center gap-4">
                                    <motion.div
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                                        <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[.3em]">REC</span>
                                    </motion.div>
                                </div>

                                <p className="text-base md:text-lg font-medium text-white/95 leading-relaxed italic tracking-tight mb-6 relative z-10 whitespace-pre-wrap">
                                    "{suspect.data.alibi || "I have nothing to say to you. I was nowhere near the scene when it happened."}"
                                </p>

                                {/* Analysis Footer */}
                                <div className="flex items-center justify-between border-t-2 border-white/10 pt-6 relative z-10">
                                    <div className="flex gap-8">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Authenticity</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-amber-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '60%' }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-amber-500 uppercase">60%</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Stress Level</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-red-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '85%' }}
                                                        transition={{ duration: 1, delay: 0.7 }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-red-500 uppercase">HIGH</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                        <span className="text-[10px] font-mono text-zinc-400">TS: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.section>

                    {/* GRID LAYOUT FOR CONFRONTATION & INTERROGATION */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* CONFRONTATION PANEL - ENHANCED */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/30 flex items-center justify-center shadow-lg"
                                >
                                    <Search className="w-5 h-5 text-amber-400" />
                                </motion.div>
                                <div>
                                    <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-[0.2em]">Evidence Confrontation</h3>
                                    <p className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-wider">Field Operative Tools • Case Files</p>
                                </div>
                            </div>

                            <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mb-6 px-1">
                                SELECT EVIDENCE TO CHALLENGE THE SUBJECT'S TESTIMONY
                            </p>

                            <div className="bg-zinc-950/50 border-2 border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl backdrop-blur-3xl min-h-[400px] md:min-h-[500px] relative overflow-hidden flex flex-col">
                                {/* Animated Grid Background */}
                                <div className="absolute inset-0 opacity-[0.02]" style={{
                                    backgroundImage: 'linear-gradient(rgba(245, 158, 11, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.5) 1px, transparent 1px)',
                                    backgroundSize: '30px 30px'
                                }}></div>

                                {(() => {
                                    const collectedEvidence = Array.from(inventory)
                                        .map(id => nodes.find(n => n.id === id && (n.type === 'evidence' || n.type === 'email')))
                                        .filter(Boolean);

                                    if (collectedEvidence.length === 0) {
                                        return (
                                            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 relative z-10">
                                                <div className="p-8 bg-zinc-900/50 rounded-full mb-6 border-2 border-zinc-800">
                                                    <Briefcase className="w-12 h-12 text-zinc-600" />
                                                </div>
                                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">NO CASE EVIDENCE</p>
                                                <p className="text-[9px] text-zinc-600 mt-2 uppercase">Collect files in the field to use here</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
                                            {collectedEvidence.map((eNode, index) => (
                                                <motion.button
                                                    key={eNode.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    whileHover={{ y: -5 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="group relative flex flex-col bg-zinc-900/80 border border-white/10 rounded-xl md:rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 text-left shadow-xl"
                                                    onClick={() => {
                                                        const match = edges.find(e =>
                                                            e.source === suspect.id &&
                                                            (e.label?.toLowerCase() === eNode.data.label?.toLowerCase() || e.data?.evidenceId === eNode.id)
                                                        );
                                                        if (match) {
                                                            const evidenceName = eNode.data.displayName || eNode.data.label;
                                                            onLog(`⚡ BREAKTHROUGH: Confronted subject with ${evidenceName}.`);
                                                            onClose();
                                                            onNavigate(match.target);
                                                        } else {
                                                            const evidenceName = eNode.data.displayName || eNode.data.label;
                                                            onLog(`❌ DISMISSAL: Subject ignored the ${evidenceName}.`);
                                                        }
                                                    }}
                                                >
                                                    {/* Evidence Image Thumbnail */}
                                                    <div className="aspect-[16/10] md:aspect-video relative overflow-hidden bg-black shrink-0">
                                                        {(eNode.data.image || (eNode.type === 'email' && eNode.data.images?.[0])) ? (
                                                            <img
                                                                src={eNode.data.image || eNode.data.images[0]}
                                                                alt={eNode.data.displayName || eNode.data.label}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                                                {eNode.type === 'email' ?
                                                                    <Mail className="w-10 h-10 text-zinc-700 group-hover:text-amber-500 transition-colors" /> :
                                                                    <Fingerprint className="w-10 h-10 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                                                                }
                                                            </div>
                                                        )}

                                                        {/* Scanning Animation */}
                                                        <motion.div
                                                            className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent h-12 w-full opacity-0 group-hover:opacity-100"
                                                            animate={{ y: ['-100%', '300%'] }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                        />

                                                        {/* Preview Overlay Button */}
                                                        <div
                                                            className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-amber-500/20 hover:border-amber-500/50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewEvidence(eNode);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 text-white" />
                                                        </div>

                                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                                                            <div className="flex items-center gap-2">
                                                                <Target className="w-3 h-3 text-amber-500" />
                                                                <span className="text-[8px] font-mono text-amber-400 tracking-widest uppercase truncate">Ref: CASE-{eNode.id.substring(0, 6)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Evidence Details */}
                                                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                                                        <div>
                                                            <h4 className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider mb-1 group-hover:text-amber-400 transition-colors">
                                                                {eNode.data.displayName || eNode.data.label}
                                                            </h4>
                                                            <p className="text-[9px] text-zinc-500 uppercase font-bold leading-tight line-clamp-2">
                                                                {eNode.data.description || "Intelligence data ready for confrontation"}
                                                            </p>
                                                        </div>

                                                        {/* Action Reveal */}
                                                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                                            <span className="text-[8px] font-black text-amber-500/50 uppercase tracking-[0.2em] group-hover:text-amber-400 transition-colors">Confront</span>
                                                            <motion.div
                                                                animate={{ x: [0, 5, 0] }}
                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                            >
                                                                <ChevronRight className="w-4 h-4 text-amber-500" />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* Corner Decals */}
                                <div className="absolute top-0 right-0 w-20 h-20 border-t border-r border-amber-500/10 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-20 h-20 border-b border-l border-amber-500/10 pointer-events-none"></div>
                            </div>
                        </motion.div>

                        {/* DIALOGUE PANEL - ENHANCED */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 flex items-center justify-center shadow-lg"
                                >
                                    <Terminal className="w-5 h-5 text-indigo-400" />
                                </motion.div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Interrogation Threads</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Neural Pathways • Cognitive Analysis</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {(() => {
                                    const collectedEvidenceIds = Array.from(inventory)
                                        .map(id => nodes.find(n => n.id === id && n.type === 'evidence'))
                                        .filter(Boolean)
                                        .map(e => e.id);

                                    const nodeActions = suspect.data.actions || [];

                                    const dialogueEdges = edges.filter(e => {
                                        if (e.source !== suspect.id) return false;
                                        if (e.label?.startsWith('evidence:')) return false;
                                        if (e.data?.isEvidenceLink) return false;

                                        // Filter out any edge that matches an evidence node (by ID or label)
                                        // These are reserved for the "Evidence Confrontation" flow
                                        const isEvidenceLink = nodes.some(n =>
                                            (n.type === 'evidence' || n.type === 'email') && (
                                                e.label?.toLowerCase() === n.data.label?.toLowerCase() ||
                                                e.data?.evidenceId === n.id ||
                                                e.label === n.id
                                            )
                                        );

                                        return !isEvidenceLink;
                                    });

                                    const handledEdgeIds = new Set();

                                    const actionThreads = nodeActions.map((action, actionIdx) => {
                                        let edge = dialogueEdges.find(e => e.sourceHandle === action.id);
                                        if (!edge && dialogueEdges[actionIdx]) {
                                            edge = dialogueEdges[actionIdx];
                                        }
                                        if (edge) handledEdgeIds.add(edge.id);
                                        return { id: action.id, label: action.label, target: edge?.target };
                                    }).filter(t => t.target);

                                    const genericThreads = dialogueEdges.filter(e => !handledEdgeIds.has(e.id)).map(e => {
                                        const targetNode = nodes.find(n => n.id === e.target);
                                        return { id: e.id, label: e.label || getEdgeLabel(targetNode), target: e.target };
                                    });

                                    const allThreads = [...actionThreads, ...genericThreads];

                                    if (allThreads.length === 0) {
                                        return (
                                            <div className="h-[400px] flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-black/30 backdrop-blur-sm">
                                                <motion.div
                                                    animate={{ rotate: [0, 360] }}
                                                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                                    className="p-6 bg-zinc-900 rounded-2xl mb-6 border border-zinc-800"
                                                >
                                                    <ShieldAlert className="w-10 h-10 text-zinc-700" />
                                                </motion.div>
                                                <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em]">Neural Paths Exhausted</p>
                                                <p className="text-zinc-700 text-[10px] mt-2">No further interrogation options available</p>
                                            </div>
                                        );
                                    }

                                    return allThreads.map((thread, index) => (
                                        <motion.button
                                            key={thread.id}
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.02, x: 5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => { onClose(); onNavigate(thread.target); }}
                                            className="w-full flex items-center justify-between p-4 md:p-8 bg-gradient-to-r from-white/5 to-transparent border-2 border-white/10 hover:border-indigo-500/50 hover:from-indigo-500/10 hover:to-purple-500/10 rounded-xl md:rounded-[1.5rem] transition-all group overflow-hidden relative shadow-xl"
                                        >
                                            {/* Animated Background */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                                            />

                                            {/* Bottom Accent Line */}
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                                            <div className="flex items-center gap-3 md:gap-6 relative z-10">
                                                {/* Icon Container */}
                                                <motion.div
                                                    whileHover={{ rotate: 90 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-2xl bg-gradient-to-br from-zinc-900 to-black border-2 border-white/10 flex items-center justify-center group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:border-indigo-500 transition-all duration-500 shadow-lg group-hover:shadow-indigo-500/50 shrink-0"
                                                >
                                                    <ChevronRight className="w-5 h-5 md:w-7 md:h-7 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                </motion.div>

                                                <div className="flex flex-col items-start text-left">
                                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[.3em] mb-1.5 leading-none opacity-70">Cognitive Probe</span>
                                                    <span className="text-sm font-black text-zinc-400 group-hover:text-white transition-colors tracking-tight uppercase leading-tight">
                                                        {thread.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Arrow Indicator */}
                                            <motion.div
                                                animate={{ x: [0, 5, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronRight className="w-6 h-6 text-indigo-400" />
                                            </motion.div>
                                        </motion.button>
                                    ));
                                })()}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            {/* Evidence Preview Modal */}
            <AnimatePresence>
                {previewEvidence && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`${isSimultaneous ? 'absolute' : 'fixed'} inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl`}
                        onClick={() => setPreviewEvidence(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                        {previewEvidence.type === 'email' ? <Mail className="w-5 h-5 text-amber-500" /> : <Search className="w-5 h-5 text-amber-500" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                            {previewEvidence.data.displayName || previewEvidence.data.label}
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">
                                            {previewEvidence.type === 'email' ? 'Digital Intelligence' : 'Physical Evidence'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewEvidence(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-zinc-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {(previewEvidence.data.image || (previewEvidence.type === 'email' && previewEvidence.data.images?.[0])) && (
                                    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
                                        <img
                                            src={previewEvidence.data.image || previewEvidence.data.images[0]}
                                            className="w-full h-full object-cover"
                                            alt="Evidence"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {previewEvidence.type === 'email' && (
                                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5 text-[10px]">
                                            <div>
                                                <p className="text-zinc-500 uppercase font-black mb-1 opacity-50">From</p>
                                                <p className="text-white font-mono truncate">{previewEvidence.data.sender || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-zinc-500 uppercase font-black mb-1 opacity-50">To</p>
                                                <p className="text-white font-mono truncate">{previewEvidence.data.recipient || 'Surveillance Hack'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-zinc-500 uppercase font-black mb-1 opacity-50">Subject</p>
                                                <p className="text-white font-mono">{previewEvidence.data.subject || 'CORRUPTED FILE'}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <p className="text-zinc-300 text-lg leading-relaxed font-serif whitespace-pre-wrap">
                                            {previewEvidence.type === 'email' ? previewEvidence.data.body : previewEvidence.data.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex gap-4">
                                <button
                                    onClick={() => setPreviewEvidence(null)}
                                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all"
                                >
                                    Close Analysis
                                </button>
                                <button
                                    onClick={() => {
                                        const eNode = previewEvidence;
                                        setPreviewEvidence(null);
                                        const match = edges.find(e =>
                                            e.source === suspect.id &&
                                            (e.label?.toLowerCase() === eNode.data.label?.toLowerCase() || e.data?.evidenceId === eNode.id)
                                        );
                                        if (match) {
                                            const evidenceName = eNode.data.displayName || eNode.data.label;
                                            onLog(`⚡ BREAKTHROUGH: Confronted subject with ${evidenceName}.`);
                                            onClose();
                                            onNavigate(match.target);
                                        } else {
                                            const evidenceName = eNode.data.displayName || eNode.data.label;
                                            onLog(`❌ DISMISSAL: Subject ignored the ${evidenceName}.`);
                                        }
                                    }}
                                    className="flex-2 py-4 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all shadow-lg shadow-amber-900/20 px-10"
                                >
                                    Confront Subject
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
