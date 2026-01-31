import { motion } from 'framer-motion';
import { User, Shield, Activity, MessageSquare, Search, Terminal, ChevronRight, Briefcase, ShieldAlert } from 'lucide-react';

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

export default function SuspectProfile({
    suspect,
    inventory,
    nodes,
    edges,
    onClose,
    onNavigate,
    onLog
}) {
    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black pointer-events-none"></div>
            <div className={`absolute inset-0 bg-gradient-to-tr ${getAvatarColor(suspect.data.name)} opacity-[0.03] blur-3xl pointer-events-none`}></div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_0%,rgba(99,102,241,0.03)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scanline_8s_linear_infinite] pointer-events-none z-10"></div>

            {/* HERO HEADER SECTION */}
            <div className="relative border-b border-white/5 bg-gradient-to-b from-zinc-900/80 to-transparent backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-8 p-8 md:p-12">
                    {/* Holographic Profile Image */}
                    <div className="relative shrink-0">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 p-1 shadow-2xl">
                            <div className={`w-full h-full rounded-full bg-gradient-to-br ${getAvatarColor(suspect.data.name)} opacity-20 absolute inset-0`}></div>
                            <div className="w-full h-full rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center relative overflow-hidden border-2 border-white/10">
                                <User className="w-16 h-16 md:w-20 md:h-20 text-white/40" />
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent animate-[shimmer_3s_linear_infinite]"></div>
                            </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full backdrop-blur-sm">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[9px] font-black text-emerald-400 uppercase">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Identity & Role */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2 drop-shadow-2xl"
                                >
                                    {suspect.data.name}
                                </motion.h1>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="px-4 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full backdrop-blur-sm">
                                        <span className="text-xs font-black text-red-400 uppercase tracking-wider">{suspect.data.role}</span>
                                    </div>
                                    <div className="px-3 py-1 bg-zinc-800/50 border border-white/10 rounded-full backdrop-blur-sm">
                                        <span className="text-[10px] font-mono text-zinc-400">ID: {suspect.id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Bar */}
                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-xs font-bold text-zinc-300">Verified</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                                <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span className="text-xs font-bold text-zinc-300">Monitored</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs font-bold text-zinc-300">Responsive</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">

                    {/* TESTIMONY SECTION */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">Intercepted Testimony</h3>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl blur-2xl"></div>
                            <div className="relative p-10 bg-zinc-900/40 border border-white/5 border-l-indigo-500 border-l-[6px] rounded-3xl backdrop-blur-3xl shadow-2xl">
                                <div className="absolute top-6 right-8 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_2s_linear_infinite]"></div>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[.2em] whitespace-nowrap">Source: Audio Intelligence</span>
                                    </div>
                                </div>

                                <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed italic tracking-tight mb-6">
                                    "{suspect.data.alibi || "I have nothing to say to you. I was nowhere near the scene when it happened."}"
                                </p>

                                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                    <div className="flex gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Authenticity</span>
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Inconclusive</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Tone Analysis</span>
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Defensive</span>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                        <span className="text-[9px] font-mono text-zinc-500">TS: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* GRID LAYOUT FOR CONFRONTATION & INTERROGATION */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* CONFRONTATION PANEL */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-amber-500" />
                                </div>
                                <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">Confrontation</h3>
                            </div>

                            <div className="bg-black/60 border border-white/10 rounded-[2rem] p-12 shadow-2xl backdrop-blur-xl min-h-[450px] relative overflow-hidden">
                                {/* Grid Accent */}
                                <div className="absolute inset-0 biometric-grid opacity-[0.03] pointer-events-none"></div>

                                {(() => {
                                    const collectedEvidence = Array.from(inventory)
                                        .map(id => nodes.find(n => n.id === id && n.type === 'evidence'))
                                        .filter(Boolean);

                                    if (collectedEvidence.length === 0) {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center py-24 opacity-40">
                                                <div className="p-8 bg-zinc-900/50 rounded-full mb-6 border border-zinc-800 animate-pulse">
                                                    <Briefcase className="w-12 h-12 text-zinc-600" />
                                                </div>
                                                <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em]">Awaiting Evidence Log</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                                            {collectedEvidence.map(eNode => (
                                                <motion.button
                                                    key={eNode.id}
                                                    whileHover={{ y: -15, rotate: 1, scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        const match = edges.find(e =>
                                                            e.source === suspect.id &&
                                                            (e.label?.toLowerCase() === eNode.data.label?.toLowerCase() || e.data?.evidenceId === eNode.id)
                                                        );
                                                        if (match) {
                                                            onLog(`BREAKTHROUGH: Confronted subject with ${eNode.data.label}.`);
                                                            onClose();
                                                            onNavigate(match.target);
                                                        } else {
                                                            onLog(`DISMISSAL: Subject ignored the ${eNode.data.label}.`);
                                                        }
                                                    }}
                                                    className="relative group flex flex-col items-center"
                                                >
                                                    {/* High-Fidelity Photo Card */}
                                                    <div className="w-full bg-zinc-900 border-x-4 border-t-4 border-b-[24px] border-white/90 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 group-hover:border-amber-400">
                                                        <div className="aspect-square relative overflow-hidden">
                                                            {eNode.data.image ? (
                                                                <img src={eNode.data.image} alt={eNode.data.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                            ) : (
                                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                                    <Search className="w-16 h-16 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                                                                </div>
                                                            )}
                                                            {/* Technical Overlays */}
                                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-sm rounded border border-white/10 flex items-center gap-1">
                                                                <span className="text-[7px] font-mono text-white tracking-widest uppercase">SCAN_SIG: {eNode.id.substring(0, 4)}</span>
                                                            </div>
                                                            {/* Scanning Line */}
                                                            <div className="absolute inset-0 bg-indigo-500/10 h-1 w-full animate-[scanline_3s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none"></div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 flex flex-col items-center">
                                                        <div className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2 group-hover:text-amber-400 transition-colors">{eNode.data.label}</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-0.5 w-6 bg-amber-500/30"></div>
                                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Evidence Logged</span>
                                                            <div className="h-0.5 w-6 bg-amber-500/30"></div>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>

                        {/* DIALOGUE PANEL */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Terminal className="w-5 h-5 text-indigo-500" />
                                </div>
                                <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">Interrogation Threads</h3>
                            </div>

                            <div className="space-y-5">
                                {(() => {
                                    // Get collected evidence IDs to filter them out from interrogation threads
                                    const collectedEvidenceIds = Array.from(inventory)
                                        .map(id => nodes.find(n => n.id === id && n.type === 'evidence'))
                                        .filter(Boolean)
                                        .map(e => e.id);

                                    const nodeActions = suspect.data.actions || [];

                                    // Filter out evidence-based edges - they're shown in confrontation section
                                    const dialogueEdges = edges.filter(e => {
                                        if (e.source !== suspect.id) return false;
                                        if (e.label?.startsWith('evidence:')) return false;
                                        if (e.data?.isEvidenceLink) return false;

                                        // Also exclude edges that match evidence by label or evidenceId
                                        const hasEvidenceMatch = collectedEvidenceIds.some(evidenceId => {
                                            const evidence = nodes.find(n => n.id === evidenceId);
                                            return e.label?.toLowerCase() === evidence?.data?.label?.toLowerCase() ||
                                                e.data?.evidenceId === evidenceId;
                                        });

                                        return !hasEvidenceMatch;
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
                                            <div className="h-[300px] flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
                                                <div className="p-3 bg-zinc-900 rounded-xl mb-4">
                                                    <ShieldAlert className="w-6 h-6 text-zinc-700" />
                                                </div>
                                                <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em]">Neural Paths Exhausted</p>
                                            </div>
                                        );
                                    }

                                    return allThreads.map((thread) => (
                                        <button
                                            key={thread.id}
                                            onClick={() => { onClose(); onNavigate(thread.target); }}
                                            className="w-full flex items-center justify-between p-7 bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/10 rounded-[1.5rem] transition-all group overflow-hidden relative shadow-2xl"
                                        >
                                            {/* Hover Background Shine */}
                                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-500 shadow-inner group-hover:shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                                                    <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[.3em] mb-1 leading-none opacity-60">Cognitive Probe</span>
                                                    <span className="text-lg font-black text-zinc-400 group-hover:text-white transition-colors tracking-tight uppercase leading-tight">
                                                        {thread.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ));
                                })()}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
