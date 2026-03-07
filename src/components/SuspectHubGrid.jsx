import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Search, Move } from 'lucide-react';

const SuspectHubGrid = ({ options, nodes, edges, onSuspectClick, getAvatarColor }) => {
    const containerRef = useRef(null);
    const [cardPositions, setCardPositions] = useState({});

    // Filter to only suspect options
    const suspectOptions = useMemo(() => {
        return options.map(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!targetNode || targetNode.type !== 'suspect') return null;
            return { edge, node: targetNode };
        }).filter(Boolean);
    }, [options, nodes]);

    // Initialize positions in a loose grid if not set
    useEffect(() => {
        if (Object.keys(cardPositions).length > 0) return;

        const initialPositions = {};
        const cols = window.innerWidth < 768 ? 1 : 3;
        const spacingX = 320;
        const spacingY = 320;

        suspectOptions.forEach(({ node }, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            initialPositions[node.id] = {
                x: col * spacingX,
                y: row * spacingY
            };
        });
        setCardPositions(initialPositions);
    }, [suspectOptions]);

    const updateCardPos = (id, deltaX, deltaY) => {
        setCardPositions(prev => ({
            ...prev,
            [id]: {
                x: (prev[id]?.x || 0) + deltaX,
                y: (prev[id]?.y || 0) + deltaY
            }
        }));
    };

    // Connection Logic
    const activeConnections = useMemo(() => {
        const list = [];
        const processedPairs = new Set();

        const sourceMap = new Map();
        edges.forEach(e => {
            if (!sourceMap.has(e.source)) sourceMap.set(e.source, []);
            sourceMap.get(e.source).push(e);
        });

        suspectOptions.forEach(({ node: s1 }) => {
            suspectOptions.forEach(({ node: s2 }) => {
                if (s1.id === s2.id) return;
                const pairKey = [s1.id, s2.id].sort().join('-@-');
                if (processedPairs.has(pairKey)) return;

                const direct = edges.find(e =>
                    (e.source === s1.id && e.target === s2.id) ||
                    (e.source === s2.id && e.target === s1.id)
                );

                if (direct) {
                    list.push({ ...direct, type: 'direct' });
                    processedPairs.add(pairKey);
                } else {
                    const findHop = (src, dest) => {
                        const outEdges = sourceMap.get(src) || [];
                        for (const e1 of outEdges) {
                            const nextEdges = sourceMap.get(e1.target) || [];
                            if (nextEdges.some(e2 => e2.target === dest)) return true;
                        }
                        return false;
                    };

                    if (findHop(s1.id, s2.id) || findHop(s2.id, s1.id)) {
                        list.push({
                            id: `hop-${pairKey}`,
                            source: s1.id,
                            target: s2.id,
                            type: 'indirect',
                            label: "Potential Connection",
                            data: { note: "Indirect link discovered through investigation." }
                        });
                        processedPairs.add(pairKey);
                    }
                }
            });
        });
        return list;
    }, [suspectOptions, edges]);

    return (
        <div className="space-y-4 relative w-full" ref={containerRef}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-red-500 text-sm font-black tracking-[0.2em] uppercase">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                    <span>Interactive Crime Scene Hub // Drag to Organize</span>
                </div>
                <div className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Move className="w-3 h-3" /> Manual Arrangement Active
                </div>
            </div>

            {/* Canvas Area for Draggable Cards */}
            <div className="relative min-h-[600px] w-full bg-black/20 rounded-[2.5rem] border border-white/5 overflow-visible p-8">
                {/* Ambient Grid under cards */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[2.5rem]" style={{
                    backgroundImage: `linear-gradient(to right, #ef4444 1px, transparent 1px), linear-gradient(to bottom, #ef4444 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} />

                {/* Crime Scene Threads (SVG Layer) */}
                <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
                    <defs>
                        <filter id="thread-glow">
                            <feGaussianBlur stdDeviation="3" result="glow" />
                            <feMerge>
                                <feMergeNode in="glow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {activeConnections.map(conn => {
                        const p1 = cardPositions[conn.source];
                        const p2 = cardPositions[conn.target];
                        if (!p1 || !p2) return null;

                        // Center offsets (Card is 288x320)
                        const offset = { x: 144, y: 160 };
                        const x1 = p1.x + offset.x;
                        const y1 = p1.y + offset.y;
                        const x2 = p2.x + offset.x;
                        const y2 = p2.y + offset.y;

                        const midX = (x1 + x2) / 2;
                        const midY = (y1 + y2) / 2;

                        const isIndirect = conn.type === 'indirect';
                        const label = conn.label || "";
                        const note = conn.data?.note || "";
                        const hasDetail = label || note;

                        return (
                            <g key={conn.id} className="connection-group group">
                                {/* Outer Glow */}
                                <line
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={isIndirect ? "#4f46e5" : "#ef4444"}
                                    strokeWidth="8"
                                    className="opacity-10 blur-xl transition-all"
                                />
                                {/* Main "Red Thread" */}
                                <line
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={isIndirect ? "#6366f1" : "#dc2626"}
                                    strokeWidth={isIndirect ? "1" : "3"}
                                    strokeDasharray={isIndirect ? "10 10" : "none"}
                                    strokeLinecap="round"
                                    filter="url(#thread-glow)"
                                    className="opacity-60 transition-all duration-300"
                                />
                                {/* Internal Core Brightness */}
                                {!isIndirect && (
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke="#fca5a5"
                                        strokeWidth="1"
                                        className="opacity-40 transition-all"
                                    />
                                )}

                                {/* Connection Label & Note */}
                                {hasDetail && (
                                    <foreignObject x={midX - 100} y={midY - 40} width="200" height="80" className="overflow-visible pointer-events-none">
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className={`bg-zinc-950/95 border ${isIndirect ? 'border-indigo-500/30' : 'border-red-500/30'} backdrop-blur-2xl px-4 py-2 rounded-2xl shadow-2xl flex flex-col items-center gap-1 border-t-2 ${isIndirect ? 'border-t-indigo-600' : 'border-t-red-600'} transition-all`}
                                            >
                                                {label && (
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-0.5">{label}</span>
                                                )}
                                                {note && (
                                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-[0.05em] text-center leading-tight max-w-[170px]">
                                                        {note}
                                                    </span>
                                                )}
                                            </motion.div>
                                        </div>
                                    </foreignObject>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Draggable Suspect Cards */}
                {suspectOptions.map(({ edge, node }, i) => {
                    const pos = cardPositions[node.id] || { x: 0, y: 0 };

                    return (
                        <motion.div
                            key={node.id}
                            drag
                            dragMomentum={false}
                            onDrag={(e, info) => updateCardPos(node.id, info.delta.x, info.delta.y)}
                            initial={false}
                            animate={{ x: pos.x, y: pos.y }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute z-10 w-72 touch-none cursor-grab active:cursor-grabbing"
                        >
                            <div className="group relative bg-[#0c0d15] border border-white/5 rounded-[2rem] overflow-hidden shadow-[0_45px_100px_-20px_rgba(0,0,0,0.8)] hover:border-red-500/40 transition-all duration-500">
                                <div className="h-1.5 w-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]" />

                                <div className="p-6 flex flex-col items-center">
                                    <div className="relative w-32 h-32 mb-4 transition-all duration-700">
                                        <div className="absolute inset-0 bg-red-600/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative w-full h-full rounded-full border-2 border-white/5 p-1.5 bg-zinc-950 overflow-hidden">
                                            {node.data.image ? (
                                                <img src={node.data.image} alt={node.data.name} className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all" />
                                            ) : (
                                                <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(node.data.name || 'Unk')} flex items-center justify-center`}>
                                                    <span className="text-white font-black text-2xl">
                                                        {(node.data.name || '?').charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center w-full">
                                        <h3 className="text-lg font-black text-white group-hover:text-red-500 transition-colors uppercase tracking-tight">
                                            {node.data.name}
                                        </h3>
                                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-4">
                                            {node.data.role || 'Investigatory Subject'}
                                        </p>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSuspectClick(node); }}
                                            className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[9px] font-black text-red-200 uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <Search className="w-3.5 h-3.5" /> Open File
                                        </button>
                                    </div>
                                </div>

                                {/* Drag Handle Decor */}
                                <div className="absolute top-4 right-4 text-zinc-800 group-hover:text-red-900/40 transition-colors">
                                    <Move className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default SuspectHubGrid;
