import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Move, ZoomIn, ZoomOut, Target, Database, Search, Shield, ExternalLink, ChevronRight } from 'lucide-react';

const SuspectHubGrid = ({ options, nodes, edges, onSuspectClick, getAvatarColor }) => {
    const containerRef = useRef(null);
    const [cardPositions, setCardPositions] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [scale, setScale] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);

    // Filter to only suspect options
    const suspectOptions = useMemo(() => {
        return options.map(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!targetNode || targetNode.type !== 'suspect') return null;
            return { edge, node: targetNode };
        }).filter(Boolean);
    }, [options, nodes]);

    // Grid initialization with higher density
    useEffect(() => {
        if (Object.keys(cardPositions).length > 0) return;

        const initialPositions = {};
        const isMobile = window.innerWidth < 768;
        const cols = isMobile ? 2 : 5; // More compact grid
        const spacingX = isMobile ? 180 : 260;
        const spacingY = 240;

        suspectOptions.forEach(({ node }, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;

            initialPositions[node.id] = {
                x: col * spacingX + 60,
                y: row * spacingY + 60
            };
        });
        setCardPositions(initialPositions);
        setTimeout(() => setIsLoaded(true), 300);
    }, [suspectOptions]);

    const updateCardPos = (id, deltaX, deltaY) => {
        setCardPositions(prev => ({
            ...prev,
            [id]: {
                x: (prev[id]?.x || 0) + deltaX / scale,
                y: (prev[id]?.y || 0) + deltaY / scale
            }
        }));
    };

    const resetLayout = () => {
        const newPositions = {};
        const isMobile = window.innerWidth < 768;
        const cols = isMobile ? 2 : 5;
        const spacingX = isMobile ? 180 : 260;
        const spacingY = 240;

        suspectOptions.forEach(({ node }, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            newPositions[node.id] = {
                x: col * spacingX + 60,
                y: row * spacingY + 60
            };
        });
        setCardPositions(newPositions);
        setScale(1);
        setSelectedId(null);
    };

    const handleNodeClick = (node) => {
        if (selectedId === node.id) {
            onSuspectClick(node);
        } else {
            setSelectedId(node.id);
        }
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
                            id: `hop-${pairKey}`, source: s1.id, target: s2.id,
                            type: 'indirect', label: "Intel Match"
                        });
                        processedPairs.add(pairKey);
                    }
                }
            });
        });
        return list;
    }, [suspectOptions, edges]);

    return (
        <div className="space-y-4 relative w-full select-none" ref={containerRef}>
            {/* Header HUD */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-2 border-red-600 pl-4 py-1">
                <div>
                    <div className="flex items-center gap-2 text-red-500 mb-0.5">
                        <Activity className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">TACTICAL NETWORK</span>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Investigation Hub</h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-900 border border-white/5 rounded-lg p-1 mr-2 shadow-inner">
                        <button onClick={() => setScale(s => Math.max(0.4, s - 0.1))} className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white"><ZoomOut className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white"><ZoomIn className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={resetLayout} className="px-3 py-1.5 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest transition-all">Reset Layout</button>
                    <div className="px-3 py-1.5 bg-red-600/10 border border-red-500/20 rounded-lg text-[9px] font-black text-red-500 uppercase flex items-center gap-2">
                        <Database className="w-3 h-3" /> {suspectOptions.length} Subjects
                    </div>
                </div>
            </div>

            {/* Tactical Battlefield */}
            <div
                className="relative h-[600px] w-full bg-[#020308] rounded-[2.5rem] border border-white/10 overflow-auto shadow-[inset_0_0_100px_rgba(0,0,0,1)] custom-scrollbar"
                onClick={() => setSelectedId(null)}
            >
                <motion.div
                    style={{ scale }}
                    className="relative w-[3000px] h-[3000px] origin-top-left p-20"
                >
                    {/* Background Detail */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
                        backgroundImage: `radial-gradient(circle, #6366f1 1.5px, transparent 1.5px)`,
                        backgroundSize: '30px 30px'
                    }} />

                    {/* SVG Connections Layer */}
                    <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
                        <defs>
                            <filter id="neon-glow">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {activeConnections.map(conn => {
                            const p1 = cardPositions[conn.source];
                            const p2 = cardPositions[conn.target];
                            if (!p1 || !p2) return null;

                            // Precise offsets for w-44 compact cards (176px wide, portrait centered at ~60px height)
                            const x1 = p1.x + 88;
                            const y1 = p1.y + 60;
                            const x2 = p2.x + 88;
                            const y2 = p2.y + 60;

                            const isSelected = selectedId === conn.source || selectedId === conn.target;
                            const isIndirect = conn.type === 'indirect';
                            const label = conn.label || "";
                            const note = conn.data?.note || "";

                            return (
                                <g key={conn.id} className="transition-all duration-500">
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={isIndirect ? "#4f46e5" : "#ef4444"}
                                        strokeWidth={isSelected ? "12" : "6"}
                                        className={`${isSelected ? 'opacity-20' : 'opacity-0'} blur-xl`}
                                    />
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={isSelected ? (isIndirect ? "#818cf8" : "#f87171") : (isIndirect ? "#4f46e5" : "#ef4444")}
                                        strokeWidth={isSelected ? "2.5" : "1"}
                                        strokeDasharray={isIndirect ? "8 6" : "none"}
                                        filter={isSelected ? "url(#neon-glow)" : "none"}
                                        className={`${selectedId && !isSelected ? 'opacity-5' : 'opacity-40'} transition-opacity`}
                                    />
                                    {/* Always-visible Connection Intel Label */}
                                    {label && (
                                        <foreignObject x={(x1 + x2) / 2 - 100} y={(y1 + y2) / 2 - 30} width="200" height="60" className="overflow-visible pointer-events-none">
                                            <div className="flex items-center justify-center h-full">
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{
                                                        scale: isSelected ? 1.3 : 0.9,
                                                        opacity: isSelected ? 1 : (selectedId ? 0.3 : 0.8)
                                                    }}
                                                    className={`px-3 py-1.5 bg-black/95 border-2 ${isIndirect ? 'border-indigo-500/50' : 'border-red-500/50'} rounded-xl shadow-2xl flex flex-col items-center border-t-4 ${isIndirect ? 'border-indigo-600' : 'border-red-600'} pointer-events-none backdrop-blur-md`}
                                                >
                                                    <span className={`font-black text-white uppercase tracking-[0.2em] transition-all ${isSelected ? 'text-[11px]' : 'text-[8px]'}`}>
                                                        {label}
                                                    </span>
                                                    {isSelected && note && (
                                                        <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest text-center mt-1">
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

                    {/* Expandable Dossier Cards */}
                    <AnimatePresence>
                        {suspectOptions.map(({ edge, node }, i) => {
                            const pos = cardPositions[node.id] || { x: 0, y: 0 };
                            const isSelected = selectedId === node.id;
                            const isRelated = selectedId && activeConnections.some(c =>
                                (c.source === selectedId && c.target === node.id) ||
                                (c.target === selectedId && c.source === node.id)
                            );

                            return (
                                <motion.div
                                    key={node.id}
                                    drag
                                    dragMomentum={false}
                                    onDrag={(e, info) => updateCardPos(node.id, info.delta.x, info.delta.y)}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{
                                        x: pos.x,
                                        y: pos.y,
                                        scale: isSelected ? 1.6 : 1,
                                        opacity: selectedId ? (isSelected || isRelated ? 1 : 0.4) : 1
                                    }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    whileHover={{ zIndex: 60 }}
                                    onMouseEnter={() => setHoveredId(node.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    className={`absolute ${isSelected ? 'z-[100]' : 'z-10'} w-44 touch-none group`}
                                >
                                    <div
                                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
                                        className={`relative bg-[#0c0d15]/95 backdrop-blur-3xl border rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300 cursor-pointer ${isSelected ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]' : 'border-white/5 hover:border-red-500/30'}`}
                                    >
                                        <div className={`h-1 w-full transition-colors ${isSelected ? 'bg-red-500' : 'bg-zinc-800'}`} />

                                        <div className="p-4 flex flex-col items-center">
                                            {/* Compact Portrait */}
                                            <div className={`relative ${isSelected ? 'w-24 h-24 mb-3' : 'w-20 h-20 mb-2'} transition-all duration-500`}>
                                                <div className={`absolute inset-0 rounded-full blur-xl transition-opacity ${isSelected ? 'bg-red-600/20 opacity-100' : 'opacity-0'}`} />
                                                <div className="relative w-full h-full rounded-full border-4 border-zinc-950 overflow-hidden bg-zinc-900 shadow-xl transition-transform duration-500">
                                                    {node.data.image ? (
                                                        <img src={node.data.image} alt={node.data.name} className={`w-full h-full object-cover transition-all duration-500 ${isSelected || hoveredId === node.id ? 'grayscale-0 scale-110' : 'grayscale'}`} />
                                                    ) : (
                                                        <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(node.data.name || 'Unk')} flex items-center justify-center`}>
                                                            <User className="w-8 h-8 text-white/30" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-center w-full">
                                                <h3 className={`font-black uppercase tracking-tighter transition-all ${isSelected ? 'text-lg text-red-500 leading-tight mb-1' : 'text-xs text-white truncate'}`}>
                                                    {node.data.name}
                                                </h3>

                                                {isSelected ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="space-y-3"
                                                    >
                                                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                                                            {node.data.role || 'Investigatory Subject'}
                                                        </p>
                                                        <button
                                                            className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-1.5 focus:ring-2 ring-red-500 ring-offset-2 ring-offset-[#0c0d15]"
                                                        >
                                                            <ExternalLink className="w-2.5 h-2.5" /> Open File
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1 mt-1 opacity-40">
                                                        <Shield className="w-2.5 h-2.5" />
                                                        <span className="text-[6px] font-black uppercase tracking-[0.2em]">Verified</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-20 transition-opacity">
                                            <Move className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(239, 68, 68, 0.3); border-radius: 10px; }
            `}} />
        </div>
    );
};

export default SuspectHubGrid;
