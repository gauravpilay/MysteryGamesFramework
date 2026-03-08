import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Move, ZoomIn, ZoomOut, Target, Database, Search, Shield, ExternalLink, ChevronRight, FileText } from 'lucide-react';

const SuspectHubGrid = ({ options, nodes, edges, onSuspectClick, getAvatarColor }) => {
    const containerRef = useRef(null);
    const [cardPositions, setCardPositions] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [scale, setScale] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);

    // Card Dimensions for reference
    const CARD_WIDTH = 224; // w-56
    const CARD_HEIGHT = 200;

    // Filter to only suspect options
    const suspectOptions = useMemo(() => {
        return options.map(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!targetNode || targetNode.type !== 'suspect') return null;
            return { edge, node: targetNode };
        }).filter(Boolean);
    }, [options, nodes]);

    // Grid initialization
    useEffect(() => {
        if (Object.keys(cardPositions).length > 0) return;

        const initialPositions = {};
        const isMobile = window.innerWidth < 768;
        const cols = isMobile ? 1 : 4;
        const spacingX = isMobile ? 260 : 300;
        const spacingY = 280;

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
        const cols = isMobile ? 1 : 4;
        const spacingX = isMobile ? 260 : 300;
        const spacingY = 280;

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
                            type: 'indirect', label: "Connection Found",
                            data: { note: "Related through investigation links." }
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
                        <Target className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">INTELLIGENCE NETWORK</span>
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

            {/* Canvas */}
            <div
                className="relative h-[650px] w-full bg-[#050505] rounded-[2rem] border border-white/5 overflow-auto shadow-[inset_0_0_100px_rgba(0,0,0,1)] custom-scrollbar"
                onClick={() => setSelectedId(null)}
            >
                <motion.div
                    style={{ scale }}
                    className="relative w-[3000px] h-[3000px] origin-top-left p-20"
                >
                    {/* Background Dot Grid */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                        backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '30px 30px'
                    }} />

                    {/* SVG Connections */}
                    <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
                        {activeConnections.map(conn => {
                            const p1 = cardPositions[conn.source];
                            const p2 = cardPositions[conn.target];
                            if (!p1 || !p2) return null;

                            // Connect to center of cards (w-56 = 224px, h = 200px)
                            const x1 = p1.x + 112;
                            const y1 = p1.y + 100;
                            const x2 = p2.x + 112;
                            const y2 = p2.y + 100;

                            const isSelected = selectedId === conn.source || selectedId === conn.target;
                            const isIndirect = conn.type === 'indirect';
                            const label = conn.label || "";
                            const note = conn.data?.note || "";

                            return (
                                <g key={conn.id} className="transition-all duration-500">
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={isIndirect ? "#6366f1" : "#ef4444"}
                                        strokeWidth={isSelected ? "10" : "4"}
                                        className={`${isSelected ? 'opacity-20' : 'opacity-0'} blur-xl`}
                                    />
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={isSelected ? (isIndirect ? "#818cf8" : "#f87171") : (isIndirect ? "#4f46e5" : "#ef4444")}
                                        strokeWidth={isSelected ? "3" : "1"}
                                        strokeDasharray={isIndirect ? "8 6" : "none"}
                                        className={`${selectedId && !isSelected ? 'opacity-5' : 'opacity-40'} transition-opacity`}
                                    />
                                    {label && (
                                        <foreignObject x={(x1 + x2) / 2 - 100} y={(y1 + y2) / 2 - 40} width="200" height="80" className="overflow-visible pointer-events-none">
                                            <div className="flex items-center justify-center h-full">
                                                <motion.div
                                                    animate={{
                                                        scale: isSelected ? 1.2 : 1,
                                                        opacity: isSelected ? 1 : (selectedId ? 0.3 : 0.9)
                                                    }}
                                                    className={`px-4 py-2 bg-[#0c0d15] border border-white/10 rounded-xl shadow-2xl flex flex-col items-center gap-1 border-t-4 ${isIndirect ? 'border-indigo-600' : 'border-red-600'} backdrop-blur-md`}
                                                >
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
                                                    {isSelected && note && (
                                                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest text-center mt-1 max-w-[160px]">
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

                    {/* Suspect Cards */}
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
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{
                                        x: pos.x,
                                        y: pos.y,
                                        scale: isSelected ? 1.1 : 1,
                                        opacity: selectedId ? (isSelected || isRelated ? 1 : 0.3) : 1
                                    }}
                                    whileHover={{ zIndex: 50 }}
                                    onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
                                    className={`absolute z-10 w-56 cursor-pointer touch-none group`}
                                >
                                    <div className={`relative bg-[#1a1b23] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300 ${isSelected ? 'border-red-500/50 shadow-red-900/20' : ''}`}>
                                        {/* Top Header Section (Screenshot Style) */}
                                        <div className="h-24 bg-gradient-to-br from-[#4a2e2a] to-[#2a1a18] p-4 relative">
                                            {/* Circular Avatar */}
                                            <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-zinc-900">
                                                {node.data.image ? (
                                                    <img src={node.data.image} alt={node.data.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(node.data.name || 'U')} flex items-center justify-center text-white font-black text-xl`}>
                                                        {(node.data.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Drag Handle Overlay */}
                                            <div className="absolute top-4 right-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Move className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Bottom Details Section (Screenshot Style) */}
                                        <div className="p-5 bg-[#0c0d15] flex flex-col gap-1 min-h-[100px]">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                                                {node.data.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                                {node.data.role || 'Record Available'}
                                            </p>

                                            <div className="mt-auto flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-red-500/80 transition-colors">
                                                <FileText className="w-3 h-3" />
                                                Review Profile
                                            </div>
                                        </div>

                                        {/* Focus Glow */}
                                        {isSelected && (
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                                        )}
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
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            `}} />
        </div>
    );
};

export default SuspectHubGrid;
