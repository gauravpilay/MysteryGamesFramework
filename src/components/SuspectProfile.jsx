import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Shield, Activity, MessageSquare, Search, Terminal,
    ChevronRight, Briefcase, ShieldAlert, Fingerprint, Dna,
    AlertTriangle, Eye, Zap, Target, Mail, X, Lightbulb,
    ArrowDown, Sparkles, FileText, Info, AlertCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

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

// -- UI COMPONENTS --

const TabButton = ({ active, onClick, icon: Icon, label, badge, color = 'indigo' }) => {
    const colorClasses = {
        indigo: {
            active: 'bg-indigo-600 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]',
            text: 'text-indigo-400',
            glow: 'shadow-[0_0_30px_rgba(99,102,241,0.3)]',
            icon: 'text-indigo-400'
        },
        amber: {
            active: 'bg-amber-600 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]',
            text: 'text-amber-400',
            glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
            icon: 'text-amber-400'
        },
        rose: {
            active: 'bg-rose-600 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]',
            text: 'text-rose-400',
            glow: 'shadow-[0_0_30px_rgba(225,29,72,0.3)]',
            icon: 'text-rose-400'
        }
    }[color];

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center gap-2 py-6 transition-all relative group overflow-hidden border-r border-white/5 last:border-r-0 ${active
                ? `text-white ${colorClasses.active} ${colorClasses.glow}`
                : 'text-zinc-500 hover:text-zinc-300 bg-black/20 hover:bg-white/5'
                }`}
        >
            {/* Hover Glow Effect */}
            {!active && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-${color === 'indigo' ? 'indigo' : color === 'amber' ? 'amber' : 'rose'}-500/10 to-transparent transition-opacity duration-500`} />
            )}
            <Icon className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] ${active ? 'text-white' : colorClasses.icon}`} />
            <div className="flex flex-col items-center">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${active ? 'text-white/60' : 'text-zinc-600'}`}>Analyze</span>
                <span className="text-[14px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {badge > 0 && (
                <div className={`absolute top-4 right-6 px-1.5 py-0.5 rounded-md text-[9px] font-black ${active ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 border border-white/10'
                    }`}>
                    {badge}
                </div>
            )}
            {active && (
                <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-white/40"
                    initial={false}
                />
            )}
        </button>
    );
};

const ThreatIndicator = ({ suspect }) => {
    const role = (suspect.data.role || '').toLowerCase();
    let level = 'low';
    let value = 30;

    if (role.includes('criminal') || role.includes('killer') || role.includes('murderer')) {
        level = 'critical';
        value = 90;
    } else if (role.includes('suspect') || role.includes('interest')) {
        level = 'high';
        value = 70;
    } else if (role.includes('witness')) {
        level = 'medium';
        value = 45;
    }

    const config = {
        low: { color: 'emerald', label: 'Verified Low Risk', icon: Shield },
        medium: { color: 'amber', label: 'Person of Interest', icon: Info },
        high: { color: 'orange', label: 'Primary Suspect', icon: AlertCircle },
        critical: { color: 'red', label: 'Critical Threat', icon: ShieldAlert }
    }[level];

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <config.icon className={`w-4 h-4 text-${config.color}-500`} />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Risk Analysis</span>
                </div>
                <span className={`text-[10px] font-black text-${config.color}-400 uppercase tracking-widest`}>{config.label}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <motion.div
                    className={`h-full bg-gradient-to-r from-${config.color}-600 to-${config.color}-400`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
                <span>0% Stable</span>
                <span>Threat Level: {value}%</span>
                <span>100% Critical</span>
            </div>
        </div>
    );
};

// -- HINT COMPONENT --
const ConfrontationHint = ({ count, onDismiss }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-6 left-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-indigo-400/30"
    >
        <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest">Evidence Match Available</p>
                <p className="text-[10px] opacity-80 uppercase tracking-wider">You have {count} file{count !== 1 ? 's' : ''} that might trigger a breakthrough.</p>
            </div>
        </div>
        <button
            onClick={onDismiss}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
        >
            Dismiss
        </button>
    </motion.div>
);

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
    const [activeTab, setActiveTab] = useState('dossier');
    const [suspectDismissal, setSuspectDismissal] = useState(null);
    const [showHint, setShowHint] = useState(false);

    // Derived Data
    const collectedEvidence = useMemo(() => {
        const seenIds = new Map();
        Array.from(inventory).forEach(entry => {
            const node = nodes.find(n =>
                (n.id === entry || n.data?.variableId === entry || n.data?.condition === entry) &&
                (n.type === 'evidence' || n.type === 'email' || n.type === 'fact')
            );
            if (node && !seenIds.has(node.id)) seenIds.set(node.id, node);
        });
        return Array.from(seenIds.values());
    }, [inventory, nodes]);

    const navigationOptions = useMemo(() => {
        // Build a set of all evidence/email/fact labels and displayNames in the game
        // so we can exclude edges that are evidence-confrontation links.
        // Those edges are recognised because their label matches an evidence node's name.
        const evidenceLabels = new Set();
        nodes.forEach(n => {
            if (n.type === 'evidence' || n.type === 'email' || n.type === 'fact') {
                if (n.data?.label) evidenceLabels.add(n.data.label.toLowerCase());
                if (n.data?.displayName) evidenceLabels.add(n.data.displayName.toLowerCase());
            }
        });

        return edges.filter(e => {
            if (e.source !== suspect.id) return false;
            if (e.label === 'Default') return false;

            // Exclude edges whose label matches an evidence item — those belong in the
            // Confrontation tab, not here.
            const edgeLabel = (e.label || '').toLowerCase();
            if (edgeLabel && evidenceLabels.has(edgeLabel)) return false;

            return true;
        });
    }, [edges, suspect.id, nodes]);

    // Hint Logic
    useEffect(() => {
        const hintKey = 'confrontation_hint_shown';
        if (!localStorage.getItem(hintKey) && collectedEvidence.length > 0) {
            const timer = setTimeout(() => setShowHint(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [collectedEvidence]);

    const handleDismissHint = () => {
        setShowHint(false);
        localStorage.setItem('confrontation_hint_shown', 'true');
    };

    const handleConfront = (eNode) => {
        const match = edges.find(e =>
            e.source === suspect.id &&
            (e.label?.toLowerCase() === eNode.data.label?.toLowerCase() ||
                e.data?.evidenceId === eNode.id ||
                e.label?.toLowerCase() === (eNode.data.displayName || '').toLowerCase())
        );

        const evidenceName = eNode.data.displayName || eNode.data.label;

        if (match) {
            onLog(`⚡ BREAKTHROUGH: Successfully confronted ${suspect.data.name} with ${evidenceName}.`);
            onClose();
            onNavigate(match.target);
        } else {
            onLog(`💬 DISMISSAL: ${suspect.data.name} claims to know nothing about ${evidenceName}.`);
            setSuspectDismissal({ evidenceName });
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-zinc-100 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[#020205] pointer-events-none" />

            {/* Dynamic Ambient Background Tints */}
            <AnimatePresence>
                {activeTab === 'dossier' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-indigo-900/10 pointer-events-none"
                    />
                )}
                {activeTab === 'evidence' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-amber-900/15 pointer-events-none"
                    />
                )}
                {activeTab === 'action' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-rose-900/15 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Floating Atmospheric Blobs */}
            <div className={`absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br ${getAvatarColor(suspect.data.name)} opacity-[0.05] blur-[120px] rounded-full animate-pulse pointer-events-none`} />
            <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

            {/* Modern Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.4) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
            }} />

            {/* Neural Scanner Sweep */}
            <motion.div
                className="absolute inset-x-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-40 w-full pointer-events-none z-0"
                animate={{ y: ['-100%', '1000%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />

            {/* HEADER - CLEAN & POWERFUL */}
            <div className="relative border-b border-white/10 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black backdrop-blur-3xl shrink-0 p-10 overflow-hidden">
                {/* Decorative corner glow */}
                <div className={`absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br ${getAvatarColor(suspect.data.name)} opacity-10 blur-[120px] pointer-events-none`} />
                <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <div className="flex items-center gap-8 max-w-7xl mx-auto">
                    {/* Avatar */}
                    <div className="relative group">
                        <motion.div
                            className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent">
                            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border-2 border-white/5 relative">
                                {suspect.data.image ? (
                                    <img src={suspect.data.image} alt={suspect.data.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 md:w-16 md:h-16 text-zinc-700" />
                                )}
                                <div className={`absolute inset-0 bg-gradient-to-br ${getAvatarColor(suspect.data.name)} ${suspect.data.image ? 'opacity-20' : 'opacity-10'}`} />
                                <motion.div
                                    className="absolute inset-x-0 h-1 bg-indigo-500/20"
                                    animate={{ y: ['-100%', '300%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-950 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 rounded-md text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Classified Dossier</span>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">#S-{suspect.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none relative group">
                                {suspect.data.name}
                                <span className={`absolute -inset-x-4 -inset-y-2 bg-gradient-to-r ${getAvatarColor(suspect.data.name)} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-700`} />
                            </h1>
                            <div className="flex items-center gap-4 mt-6">
                                <div className="px-4 py-2 bg-zinc-800/80 border border-white/10 rounded-xl shadow-lg flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[11px] font-black text-zinc-200 uppercase tracking-widest leading-none">
                                        {suspect.data.role || 'Person of Interest'}
                                    </span>
                                </div>
                                <div className="h-4 w-px bg-white/10" />
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Fingerprint className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[10px] font-mono tracking-tighter uppercase opacity-60">Signature: {suspect.id.substring(0, 16)}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Close Action */}
                    <div className="flex flex-col gap-3 shrink-0">
                        {/* <button
                            onClick={onClose}
                            className="flex items-center gap-3 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all group shadow-lg shadow-red-500/5 active:scale-95"
                        > */}
                        {/* <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Conclude</span> */}
                        {/* <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                                <X className="w-5 h-5 text-white" />
                            </div> */}
                        {/* </button> */}
                        <div className="flex items-center justify-end gap-2 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Target Locked</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-950/90 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex">
                    <TabButton
                        active={activeTab === 'dossier'}
                        onClick={() => setActiveTab('dossier')}
                        icon={FileText}
                        label="Dossier"
                        color="indigo"
                    />
                    <TabButton
                        active={activeTab === 'evidence'}
                        onClick={() => setActiveTab('evidence')}
                        icon={Briefcase}
                        label="Confrontation"
                        badge={collectedEvidence.length}
                        color="amber"
                    />
                    {navigationOptions.length > 0 && (
                        <TabButton
                            active={activeTab === 'action'}
                            onClick={() => setActiveTab('action')}
                            icon={Zap}
                            label="Special Actions"
                            color="rose"
                        />
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="max-w-7xl mx-auto p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dossier' && (
                            <motion.div
                                key="dossier"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
                            >
                                {/* Left Side: Testimony */}
                                <div className="lg:col-span-12">
                                    <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 border-2 border-white/5 border-l-indigo-500 border-l-[6px] rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Intercepted</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-6">
                                            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                                <MessageSquare className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Official Testimony</h3>
                                                <p className="text-xl md:text-2xl text-zinc-100 font-medium leading-relaxed italic tracking-tight">
                                                    "{suspect.data.alibi || 'I have already told you everything I know. I was at home working, alone, like I always am.'}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                            <ThreatIndicator suspect={suspect} />

                                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Fingerprint className="w-5 h-5 text-indigo-400" />
                                                    <span className="text-xs font-black text-white uppercase tracking-widest">Biometric Analysis</span>
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: 'Voice Stress', color: 'orange', value: 65 },
                                                        { label: 'Pulse Consistency', color: 'indigo', value: 82 }
                                                    ].map(stat => (
                                                        <div key={stat.label}>
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">{stat.label}</span>
                                                                <span className="text-[9px] font-mono text-zinc-400">{stat.value}%</span>
                                                            </div>
                                                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className={`h-full bg-${stat.color}-500`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${stat.value}%` }}
                                                                    transition={{ delay: 0.5 }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'evidence' && (
                            <motion.div
                                key="evidence"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Challenge Testimony</h2>
                                        <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] mt-1">Select gathered evidence to present to the suspect</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <Search className="w-4 h-4 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{collectedEvidence.length} Items Available</span>
                                    </div>
                                </div>

                                {collectedEvidence.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/30 rounded-[3rem] border border-white/5 border-dashed">
                                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                                            <Briefcase className="w-10 h-10 text-zinc-600" />
                                        </div>
                                        <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No evidence files found</p>
                                        <p className="text-xs text-zinc-600 uppercase tracking-wide mt-2">Investigate the case more thoroughly to find clues</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {collectedEvidence.map((e, idx) => (
                                            <motion.button
                                                key={e.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => handleConfront(e)}
                                                className="group text-left bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/50 rounded-3xl overflow-hidden transition-all shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1"
                                            >
                                                <div className="aspect-video relative overflow-hidden bg-black">
                                                    {(e.data.image || (e.type === 'email' && e.data.images?.[0])) ? (
                                                        <img
                                                            src={e.data.image || e.data.images[0]}
                                                            className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                                                            alt={e.data.label}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                            {e.type === 'email' ? <Mail className="w-12 h-12 text-zinc-700" /> : <Fingerprint className="w-12 h-12 text-zinc-700" />}
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                                                    <div className="absolute bottom-4 left-5">
                                                        <span className="px-2 py-1 bg-zinc-900/90 backdrop-blur rounded-lg text-[8px] font-black text-zinc-400 uppercase tracking-widest border border-white/10">
                                                            {e.type.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h4 className="text-base font-black text-white uppercase tracking-tight mb-2 group-hover:text-amber-400 transition-colors">
                                                        {e.data.displayName || e.data.label}
                                                    </h4>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-2">
                                                        Tap to Present Clue <ChevronRight className="w-3 h-3 text-amber-500" />
                                                    </p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'action' && (
                            <motion.div
                                key="actions"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex flex-col gap-6">
                                    {navigationOptions.map(option => {
                                        // Look up the target node to use its configured label/title
                                        const targetNode = nodes.find(n => n.id === option.target);
                                        const nodeTitle = targetNode?.data?.label || option.label || option.target;
                                        const nodeType = targetNode?.type;
                                        const subtitle = option.label && option.label !== nodeTitle
                                            ? option.label
                                            : nodeType
                                                ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1)
                                                : 'Action';

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    onClose();
                                                    onNavigate(option.target);
                                                }}
                                                className="group flex items-center justify-between p-8 bg-zinc-900 hover:bg-indigo-600 border border-white/10 hover:border-indigo-400 rounded-[2rem] transition-all shadow-2xl hover:-translate-y-1"
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div className="w-16 h-16 bg-indigo-500/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                                                        <Zap className="w-8 h-8 text-indigo-400 group-hover:text-white" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-[10px] font-black text-indigo-400 group-hover:text-indigo-200 uppercase tracking-[0.3em] block mb-1">
                                                            {subtitle}
                                                        </span>
                                                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{nodeTitle}</h4>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-8 h-8 text-zinc-700 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Hint Overlay */}
            <AnimatePresence>
                {showHint && (
                    <ConfrontationHint count={collectedEvidence.length} onDismiss={handleDismissHint} />
                )}
            </AnimatePresence>

            {/* Dismissal Response */}
            <AnimatePresence>
                {suspectDismissal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => setSuspectDismissal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(suspect.data.name)} flex items-center justify-center`}>
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Suspect Response</span>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{suspect.data.name}</h3>
                                    </div>
                                </div>
                                <div className="p-8 bg-zinc-900/50 border-l-4 border-red-500 rounded-xl mb-8">
                                    <p className="text-xl text-zinc-100 font-medium leading-relaxed italic">
                                        "I don't know anything about this <span className="text-amber-400 font-black not-italic">{suspectDismissal.evidenceName}</span>.
                                        You're wasting your time."
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSuspectDismissal(null)}
                                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-colors border border-white/5"
                                >
                                    Terminate Discussion
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer with Scan Status */}
            <div className="p-4 border-t border-white/5 bg-zinc-900/30 flex items-center justify-between px-8 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                    <span>Neural Link Active</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>Latency: 12ms</span>
                    <span className="text-zinc-700">|</span>
                    <span>Encrypted Connection: SHA-512</span>
                </div>
            </div>
        </div>
    );
}
