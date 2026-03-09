import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, X, ZoomIn, ZoomOut, Maximize, MousePointer2,
    Link2, FileText, Activity, Shield, Info,
    Move, Lock, Unlock, Search, Sparkles
} from 'lucide-react';

const SuspectWall = ({ nodes, edges, history, inventory, projectId, onClose, onOpenDossier }) => {
    const containerRef = useRef(null);
    const [canvasScale, setCanvasScale] = useState(0.85); // Start slightly zoomed out
    const [canvasPos, setCanvasPos] = useState({ x: 100, y: 100 });

    // Position Cache
    const [positions, setPositions] = useState(() => {
        const cached = localStorage.getItem(`suspect_wall_pos_${projectId}`);
        return cached ? JSON.parse(cached) : {};
    });

    // Helper to get effective position (cached or generated)
    const getEffectivePos = (id) => {
        if (positions[id]) return positions[id];
        // Persistent random seed based on ID string
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Slightly spread out to avoid clutter
        const x = 300 + (Math.abs(hash) % 1500);
        const y = 300 + (Math.abs(hash >> 8) % 1000);
        return { x, y };
    };

    const updatePosition = (id, x, y) => {
        setPositions(prev => {
            const next = { ...prev, [id]: { x, y } };
            localStorage.setItem(`suspect_wall_pos_${projectId}`, JSON.stringify(next));
            return next;
        });
    };

    // Filter Unlocked Suspects
    const unlockedSuspects = useMemo(() => {
        return nodes.filter(n => {
            if (n.type !== 'suspect') return false;
            // Unlocked if visited OR flag exists in inventory
            const isVisited = history.includes(n.id);
            const isFlagged = n.data?.variableId && inventory.has(n.data.variableId);
            return isVisited || isFlagged;
        });
    }, [nodes, history, inventory]);

    // Graph Connectivity Logic: Find direct and 1-hop connections between suspects
    const activeConnections = useMemo(() => {
        const unlockedIds = new Set(unlockedSuspects.map(s => s.id));
        const list = [];
        const processedPairs = new Set();

        // Index edges for faster lookup: source -> [targets]
        const sourceMap = new Map();
        edges.forEach(e => {
            if (!sourceMap.has(e.source)) sourceMap.set(e.source, []);
            sourceMap.get(e.source).push(e);
        });

        unlockedSuspects.forEach(s1 => {
            unlockedSuspects.forEach(s2 => {
                if (s1.id === s2.id) return;

                // Ensure each pair is only checked once regardless of direction
                const pairKey = [s1.id, s2.id].sort().join('-@-');
                if (processedPairs.has(pairKey)) return;

                // 1. Look for Direct Connection (S1 -> S2 or S2 -> S1)
                const direct = edges.find(e =>
                    (e.source === s1.id && e.target === s2.id) ||
                    (e.source === s2.id && e.target === s1.id)
                );

                if (direct) {
                    list.push(direct);
                    processedPairs.add(pairKey);
                } else {
                    // 2. Look for Indirect Connection (via ONE intermediate node)
                    // Pathway: S1 -> Intermediate -> S2 OR S2 -> Intermediate -> S1
                    const findHop = (src, dest) => {
                        const outEdges = sourceMap.get(src) || [];
                        for (const e1 of outEdges) {
                            const nextEdges = sourceMap.get(e1.target) || [];
                            const connection = nextEdges.find(e2 => e2.target === dest);
                            if (connection) return true;
                        }
                        return false;
                    };

                    if (findHop(s1.id, s2.id) || findHop(s2.id, s1.id)) {
                        list.push({
                            id: `hop-${pairKey}`,
                            source: s1.id,
                            target: s2.id,
                            label: "Potential Connection",
                            data: { note: "Indirect link discovered through investigation." }
                        });
                        processedPairs.add(pairKey);
                    }
                }
            });
        });

        return list;
    }, [unlockedSuspects, edges]);

    const handleZoom = (delta) => {
        setCanvasScale(prev => Math.min(Math.max(0.1, prev + delta), 2.5));
    };

    const resetView = () => {
        setCanvasScale(0.85);
        setCanvasPos({ x: 100, y: 100 });
    };

    return (
        <div className="fixed inset-0 z-[160] bg-transparent overflow-hidden flex flex-col font-sans select-none animate-in fade-in duration-500 backdrop-blur-xl">
            {/* Darker Ambient background grid */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                backgroundImage: `linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)`,
                backgroundSize: '80px 80px'
            }} />

            {/* Header / HUD */}
            <div className="h-20 border-b border-indigo-500/10 bg-black/90 backdrop-blur-2xl flex items-center justify-between px-8 shrink-0 relative z-50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                        <User className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Subj-Analysis.v1</span>
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Suspect Connections</h2>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center bg-zinc-900 border border-white/5 rounded-2xl p-1 shrink-0 h-12 px-3 shadow-inner">
                        <button onClick={() => handleZoom(-0.25)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-all hover:text-white" title="Zoom Out">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <button onClick={() => handleZoom(0.25)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-all hover:text-white" title="Zoom In">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <button onClick={resetView} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-all hover:text-white" title="Reset View">
                            <Maximize className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/40 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-600 transition-all shadow-xl group"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Interactive Board */}
            <div className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden" ref={containerRef}>
                <motion.div
                    className="absolute inset-0 w-[8000px] h-[8000px]" // Even bigger
                    drag
                    dragMomentum={false}
                    onDrag={(e, info) => setCanvasPos(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }))}
                    style={{
                        x: canvasPos.x,
                        y: canvasPos.y,
                        scale: canvasScale,
                        transformOrigin: '0 0'
                    }}
                >
                    {/* SVG Layer inside the same transform! */}
                    <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
                        <defs>
                            <filter id="glow-red">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {activeConnections.map(conn => (
                            <ConnectionLine
                                key={conn.id}
                                edge={conn}
                                p1={getEffectivePos(conn.source)}
                                p2={getEffectivePos(conn.target)}
                            />
                        ))}
                    </svg>

                    {unlockedSuspects.map(suspect => (
                        <SuspectCard
                            key={suspect.id}
                            suspect={suspect}
                            position={getEffectivePos(suspect.id)}
                            onUpdatePosition={(x, y) => updatePosition(suspect.id, x, y)}
                            onOpenDossier={() => onOpenDossier(suspect.id)}
                            scale={canvasScale}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Footer / Status */}
            <div className="h-12 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between px-8 text-[10px] font-mono text-zinc-500 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Sync: Active</span>
                    </div>
                    <span className="opacity-20">|</span>
                    <span>Localized Entities: {unlockedSuspects.length}</span>
                    <span className="opacity-20">|</span>
                    <span>Render Scale: {(canvasScale * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> Drag background to pan / Drag cards to Link</span>
                </div>
            </div>
        </div>
    );
};

const SuspectCard = ({ suspect, position, onUpdatePosition, onOpenDossier, scale }) => {
    return (
        <motion.div
            className="absolute z-10 w-72 cursor-grab active:cursor-grabbing"
            drag
            dragMomentum={false}
            onDrag={(e, info) => {
                // Update position relative to scale
                onUpdatePosition(position.x + info.delta.x / scale, position.y + info.delta.y / scale);
            }}
            initial={false}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 100 }}
        >
            <div className="bg-[#0c0d15] border border-white/5 rounded-[2rem] overflow-hidden shadow-[0_45px_100px_-20px_rgba(0,0,0,0.9)] group hover:border-red-500/40 transition-all duration-500">
                <div className="h-2 w-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]" />

                <div className="p-8 flex flex-col items-center">
                    <div className="relative w-44 h-44 mb-6 transition-all duration-700">
                        <div className="absolute inset-0 bg-red-600/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-full h-full rounded-full border-2 border-white/10 p-2 bg-zinc-950 shadow-2xl overflow-hidden">
                            {(suspect.data.image || suspect.data.images?.[0]) ? (
                                <img src={suspect.data.image || suspect.data.images[0]} alt={suspect.data.name || suspect.data.label} className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-full">
                                    <User className="w-16 h-16 text-zinc-700" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center w-full space-y-2">
                        <span className="text-[10px] font-black text-red-500 tracking-[0.3em] uppercase mb-1 block">Identified</span>
                        <h4 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{suspect.data.name || suspect.data.label || 'Unknown Suspect'}</h4>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{suspect.data.role || 'Shadow Record'}</p>

                        <div className="grid grid-cols-2 gap-3 mt-8 pt-8 border-t border-white/5">
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenDossier(); }}
                                className="px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 rounded-2xl text-[10px] font-black text-red-200 uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" /> Entry
                            </button>
                            <div className="flex items-center justify-center p-3 bg-zinc-900 border border-white/5 rounded-2xl">
                                <Activity className="w-4 h-4 text-zinc-700 group-hover:text-red-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-6 left-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <span className="text-[50px] font-black italic">#{suspect.id.slice(-3).toUpperCase()}</span>
                </div>
            </div>
        </motion.div>
    );
};

const ConnectionLine = ({ edge, p1, p2 }) => {
    if (!p1 || !p2) return null;

    // Hit the centers (Card width 288, approximate height 400)
    const x1 = p1.x + 144;
    const y1 = p1.y + 200;
    const x2 = p2.x + 144;
    const y2 = p2.y + 200;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const label = edge.label || "";
    const note = edge.data?.note || "";
    const hasDetail = label || note;
    const isIndirect = edge.id.startsWith('hop-');

    return (
        <g className="connection-group group">
            <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isIndirect ? "#4f46e5" : "#dc2626"}
                strokeWidth={isIndirect ? "1" : "2"}
                strokeDasharray={isIndirect ? "10 10" : "15 5"}
                className={`${isIndirect ? 'opacity-10' : 'opacity-20'} group-hover:opacity-60 transition-all duration-500`}
            />
            <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isIndirect ? "#4f46e5" : "#dc2626"}
                strokeWidth="10"
                className="opacity-0 group-hover:opacity-20 transition-all duration-500 blur-2xl"
            />

            {hasDetail && (
                <foreignObject x={midX - 100} y={midY - 40} width="200" height="80" className="overflow-visible pointer-events-none">
                    <div className="flex flex-col items-center justify-center h-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-black/95 border border-white/10 group-hover:border-red-500/30 backdrop-blur-2xl px-5 py-2.5 rounded-[1.5rem] shadow-2xl flex flex-col items-center gap-1 border-t-2 border-t-red-600 transition-all"
                        >
                            {label && (
                                <span className="text-[11px] font-black text-white uppercase tracking-widest">{label}</span>
                            )}
                            {note && (
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.05em] text-center leading-tight max-w-[170px]">
                                    {note}
                                </span>
                            )}
                        </motion.div>
                    </div>
                </foreignObject>
            )}
        </g>
    );
};

export default SuspectWall;
