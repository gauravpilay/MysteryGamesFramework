import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Move, ZoomIn, ZoomOut, Target, Database, Search, Shield, ExternalLink, ChevronRight, FileText } from 'lucide-react';

const SuspectHubGrid = ({ options, nodes, edges, onSuspectClick, getAvatarColor }) => {
    const containerRef = useRef(null);
    const [cardPositions, setCardPositions] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [scale, setScale] = useState(1);
    const [selectedId, setSelectedId] = useState(null);

    // Card Dimensions
    const CARD_WIDTH = 224;
    const CARD_HEIGHT = 200;

    // Filter to only suspect options
    const suspectOptions = useMemo(() => {
        return options.map(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!targetNode || targetNode.type !== 'suspect') return null;
            return { edge, node: targetNode };
        }).filter(Boolean);
    }, [options, nodes]);

    // Compute layout positions based on count
    const computePositions = (opts) => {
        const newPositions = {};
        const count = opts.length;
        const isMobile = window.innerWidth < 768;

        if (count === 0) return newPositions;

        if (!isMobile && count <= 8) {
            // ── Radial / Circular Layout ──────────────────────────────────────────
            // Radius is generous so midpoints between adjacent cards are well clear
            // of the card boundaries, giving the connector labels ample breathing room.
            const radius = Math.max(420, count * 90);
            const centerX = radius + CARD_WIDTH / 2 + 120;
            const centerY = radius + CARD_HEIGHT / 2 + 120;

            opts.forEach(({ node }, i) => {
                // Start from top (-π/2) and go clockwise
                const angle = (2 * Math.PI * i) / count - Math.PI / 2;
                newPositions[node.id] = {
                    x: centerX + radius * Math.cos(angle) - CARD_WIDTH / 2,
                    y: centerY + radius * Math.sin(angle) - CARD_HEIGHT / 2,
                };
            });
        } else {
            // ── Staggered Grid Layout ─────────────────────────────────────────────
            // Every odd row is offset by half a column width (honeycomb feel).
            // Large spacing ensures midpoints are always in open canvas space.
            const cols = isMobile ? 1 : Math.min(3, Math.ceil(Math.sqrt(count)));
            const spacingX = isMobile ? 280 : 500;
            const spacingY = 380;

            opts.forEach(({ node }, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const isOddRow = row % 2 === 1;
                newPositions[node.id] = {
                    x: col * spacingX + (isOddRow ? spacingX / 2 : 0) + 100,
                    y: row * spacingY + 100,
                };
            });
        }
        return newPositions;
    };

    // Initialize positions on first render / when suspects change
    useEffect(() => {
        if (Object.keys(cardPositions).length > 0) return;
        setCardPositions(computePositions(suspectOptions));
        setTimeout(() => setIsLoaded(true), 300);
    }, [suspectOptions]);

    const updateCardPos = (id, deltaX, deltaY) => {
        setCardPositions(prev => ({
            ...prev,
            [id]: {
                x: (prev[id]?.x || 0) + deltaX / scale,
                y: (prev[id]?.y || 0) + deltaY / scale,
            }
        }));
    };

    const resetLayout = () => {
        setCardPositions(computePositions(suspectOptions));
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

    // Connection logic (direct + 1-hop)
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
                            label: 'Connection Found',
                            data: { note: 'Related through investigation links.' }
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
            {/* Canvas */}
            <div
                className="relative h-[820px] w-full bg-black/20 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-auto shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] custom-scrollbar"
                onClick={() => setSelectedId(null)}
            >
                <motion.div
                    style={{ scale }}
                    className="relative w-[4000px] h-[4000px] origin-top-left"
                >
                    {/* Dot grid background */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                            backgroundSize: '30px 30px',
                        }}
                    />

                    {/* SVG connection layer */}
                    <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
                        {activeConnections.map(conn => {
                            const p1 = cardPositions[conn.source];
                            const p2 = cardPositions[conn.target];
                            if (!p1 || !p2) return null;

                            // Card centre points
                            const x1 = p1.x + CARD_WIDTH / 2;
                            const y1 = p1.y + CARD_HEIGHT / 2;
                            const x2 = p2.x + CARD_WIDTH / 2;
                            const y2 = p2.y + CARD_HEIGHT / 2;

                            const midX = (x1 + x2) / 2;
                            const midY = (y1 + y2) / 2;

                            // Perpendicular unit vector so the label floats above the line
                            const dx = x2 - x1;
                            const dy = y2 - y1;
                            const len = Math.sqrt(dx * dx + dy * dy) || 1;
                            const perpX = -dy / len;
                            const perpY = dx / len;
                            const LABEL_OFFSET = 36; // px above the midpoint

                            const labelCX = midX + perpX * LABEL_OFFSET;
                            const labelCY = midY + perpY * LABEL_OFFSET;

                            const isSelected = selectedId === conn.source || selectedId === conn.target;
                            const isIndirect = conn.type === 'indirect';
                            const label = conn.label || '';
                            const note = conn.data?.note || '';
                            const accentColor = isIndirect ? '#6366f1' : '#ef4444';
                            const accentColorBright = isIndirect ? '#818cf8' : '#f87171';

                            return (
                                <g key={conn.id}>
                                    {/* Soft glow behind the line */}
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={accentColor}
                                        strokeWidth={isSelected ? 14 : 8}
                                        opacity={isSelected ? 0.18 : 0.06}
                                        style={{ filter: 'blur(6px)' }}
                                    />
                                    {/* Main thread */}
                                    <line
                                        x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke={isSelected ? accentColorBright : accentColor}
                                        strokeWidth={isSelected ? 2.5 : 1.5}
                                        strokeDasharray={isIndirect ? '8 6' : undefined}
                                        opacity={selectedId && !isSelected ? 0.12 : 0.55}
                                    />
                                    {/* Label chip — always visible, offset perpendicularly */}
                                    {label && (
                                        <foreignObject
                                            x={labelCX - 110}
                                            y={labelCY - 30}
                                            width={220}
                                            height={64}
                                            overflow="visible"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                <div
                                                    style={{
                                                        background: 'rgba(12,13,21,0.97)',
                                                        border: `1px solid rgba(255,255,255,0.12)`,
                                                        borderTop: `3px solid ${accentColor}`,
                                                        borderRadius: '12px',
                                                        padding: '6px 14px',
                                                        boxShadow: '0 6px 28px rgba(0,0,0,0.8)',
                                                        backdropFilter: 'blur(12px)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '2px',
                                                        opacity: selectedId && !isSelected ? 0.3 : 1,
                                                        transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                                                        transition: 'opacity 0.3s, transform 0.3s',
                                                        maxWidth: '200px',
                                                    }}
                                                >
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 900,
                                                        color: '#ffffff',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.12em',
                                                        whiteSpace: 'nowrap',
                                                    }}>{label}</span>
                                                    {note && (
                                                        <span style={{
                                                            fontSize: '8px',
                                                            fontWeight: 700,
                                                            color: '#a1a1aa',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.06em',
                                                            textAlign: 'center',
                                                            lineHeight: '1.3',
                                                            maxWidth: '180px',
                                                            overflow: 'hidden',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                        }}>{note}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Suspect Cards */}
                    <AnimatePresence>
                        {suspectOptions.map(({ edge, node }) => {
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
                                        scale: isSelected ? 1.08 : 1,
                                        opacity: selectedId ? (isSelected || isRelated ? 1 : 0.3) : 1,
                                    }}
                                    whileHover={{ zIndex: 50 }}
                                    onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
                                    className="absolute z-10 w-56 cursor-pointer touch-none group"
                                >
                                    <div className={`relative bg-[#1a1b23] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl transition-all duration-300 ${isSelected ? 'border-red-500/50 shadow-red-900/20' : ''}`}>
                                        {/* Header */}
                                        <div className="h-24 bg-gradient-to-br from-[#4a2e2a] to-[#2a1a18] p-4 relative">
                                            <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-zinc-900">
                                                {(node.data.image || node.data.images?.[0]) ? (
                                                    <img
                                                        src={node.data.image || node.data.images[0]}
                                                        alt={node.data.name || node.data.label}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(node.data.name || node.data.label || 'U')} flex items-center justify-center text-white font-black text-xl`}>
                                                        {(node.data.name || node.data.label || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute top-4 right-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Move className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="p-5 bg-[#0c0d15] flex flex-col gap-1 min-h-[100px]">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                                                {node.data.name || node.data.label || 'Unknown Suspect'}
                                            </h3>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                                {node.data.role || 'Record Available'}
                                            </p>
                                            <div className="mt-auto flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-red-500/80 transition-colors">
                                                <FileText className="w-3 h-3" />
                                                Review Profile
                                            </div>
                                        </div>

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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default SuspectHubGrid;
