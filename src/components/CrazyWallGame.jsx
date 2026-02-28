import React, { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, User, Search, FileText, Star, Trophy, Zap, Eye, RotateCcw, ChevronRight, X, Scissors } from 'lucide-react';

// ─── Utilities ───────────────────────────────────────────────────────────────
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// ─── SVG Threads overlay ──────────────────────────────────────────────────────
const Threads = ({ connections, positions, suspects, actions, evidenceItems, results, checked }) => {
    const threads = [];

    connections.forEach(({ suspectId, actionId, evidenceId }) => {
        const sPos = positions[`suspect_${suspectId}`];
        const aPos = positions[`action_${actionId}`];
        const ePos = evidenceId && positions[`evidence_${evidenceId}`];

        const suspectResult = checked ? results[suspectId] : null;
        const actionOk = suspectResult?.actionOk;
        const evidenceOk = suspectResult?.evidenceOk;

        if (sPos && aPos) {
            const mx = (sPos.x + aPos.x) / 2;
            const my = (sPos.y + aPos.y) / 2 - 40;
            const color = checked ? (actionOk ? '#34d399' : '#f87171') : '#ef4444';
            threads.push(
                <g key={`sa_${suspectId}_${actionId}`}>
                    <path
                        d={`M ${sPos.x} ${sPos.y} Q ${mx} ${my} ${aPos.x} ${aPos.y}`}
                        stroke={color}
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray={checked && !actionOk ? '5 4' : 'none'}
                        opacity={0.85}
                    />
                    {/* Small pin at midpoint */}
                    <circle cx={mx} cy={my} r="3" fill={color} opacity={0.6} />
                </g>
            );
        }

        if (sPos && ePos) {
            const mx = (sPos.x + ePos.x) / 2;
            const my = (sPos.y + ePos.y) / 2 + 30;
            const color = checked ? (evidenceOk ? '#34d399' : '#fbbf24') : '#fbbf24';
            threads.push(
                <g key={`se_${suspectId}_${evidenceId}`}>
                    <path
                        d={`M ${sPos.x} ${sPos.y} Q ${mx} ${my} ${ePos.x} ${ePos.y}`}
                        stroke={color}
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray={checked && !evidenceOk ? '4 4' : 'none'}
                        opacity={0.7}
                    />
                    <circle cx={mx} cy={my} r="2.5" fill={color} opacity={0.5} />
                </g>
            );
        }
    });

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            <defs>
                <filter id="glow-red">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            {threads}
        </svg>
    );
};

// ─── Pin dot at top of card ───────────────────────────────────────────────────
const Pin = ({ color = '#ef4444' }) => (
    <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-black shadow-lg z-10 flex items-center justify-center"
        style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
    >
        <div className="w-2 h-2 rounded-full bg-white/40" />
    </div>
);

// ─── Suspect Card ─────────────────────────────────────────────────────────────
const SuspectCard = ({ suspect, isSelected, isConnected, connectionOk, checked, onClick, refCallback }) => {
    const border =
        checked && isConnected ? (connectionOk ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.5)]' : 'border-red-400 shadow-[0_0_16px_rgba(248,113,113,0.4)]') :
            isSelected ? 'border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.7)]' :
                isConnected ? 'border-red-400/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                    'border-zinc-700 hover:border-red-400/70';

    return (
        <motion.div
            ref={refCallback}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative border-2 ${border} bg-zinc-900/80 backdrop-blur-sm rounded-xl p-3 cursor-pointer transition-all duration-200 select-none`}
            style={{ width: 130, minHeight: 140 }}
        >
            <Pin color="#ef4444" />
            {suspect.image ? (
                <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-black/30 border border-zinc-800">
                    <img src={suspect.image} alt={suspect.name} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-full h-16 rounded-lg flex items-center justify-center mb-2 bg-red-950/40 border border-red-900/30">
                    <User className="w-8 h-8 text-red-400/70" />
                </div>
            )}
            <p className="text-[10px] font-black text-white text-center leading-tight">{suspect.name}</p>
            <p className="text-[8px] text-red-400 uppercase tracking-widest text-center mt-0.5">Suspect</p>

            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute inset-0 rounded-xl border-2 border-indigo-400 opacity-60 pointer-events-none"
                />
            )}
            {checked && isConnected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-1 -right-1 rounded-full p-0.5 ${connectionOk ? 'bg-emerald-400' : 'bg-red-400'}`}
                >
                    {connectionOk ? <CheckCircle className="w-3 h-3 text-black" /> : <X className="w-3 h-3 text-black" />}
                </motion.div>
            )}
        </motion.div>
    );
};

// ─── Action Tile ──────────────────────────────────────────────────────────────
const ActionTile = ({ action, isConnected, susConnected, checked, connectionOk, onClick, refCallback }) => {
    const border =
        checked && isConnected ? (connectionOk ? 'border-emerald-400' : 'border-red-400') :
            isConnected ? 'border-indigo-400/70 shadow-[0_0_10px_rgba(99,102,241,0.3)]' :
                'border-zinc-700 hover:border-indigo-400/60';

    return (
        <motion.div
            ref={refCallback}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`relative border-2 ${border} bg-indigo-950/40 backdrop-blur-sm rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 select-none`}
            style={{ width: 150 }}
        >
            <Pin color="#818cf8" />
            <div className="w-full h-8 rounded flex items-center justify-center mb-2 bg-indigo-900/30">
                <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-[10px] font-bold text-indigo-200 text-center leading-tight">{action.name}</p>
            <p className="text-[8px] text-indigo-400 uppercase tracking-widest text-center mt-0.5">Action</p>
        </motion.div>
    );
};

// ─── Evidence Card ─────────────────────────────────────────────────────────────
const EvidenceCard = ({ evidence, isConnected, checked, connectionOk, onClick, refCallback }) => {
    const border =
        checked && isConnected ? (connectionOk ? 'border-emerald-400' : 'border-yellow-400') :
            isConnected ? 'border-yellow-400/70 shadow-[0_0_10px_rgba(251,191,36,0.3)]' :
                'border-zinc-700 hover:border-yellow-400/60';

    return (
        <motion.div
            ref={refCallback}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative border-2 ${border} bg-yellow-950/30 backdrop-blur-sm rounded-xl p-3 cursor-pointer transition-all duration-200 select-none`}
            style={{ width: 120, minHeight: 120 }}
        >
            <Pin color="#fbbf24" />
            {evidence.image ? (
                <div className="w-full h-16 rounded-lg overflow-hidden mb-2 bg-black/30 border border-zinc-800">
                    <img src={evidence.image} alt={evidence.name} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-full h-12 rounded flex items-center justify-center mb-2 bg-yellow-900/30">
                    <Search className="w-5 h-5 text-yellow-400/70" />
                </div>
            )}
            <p className="text-[10px] font-bold text-white text-center leading-tight">{evidence.name}</p>
            <p className="text-[8px] text-yellow-400 uppercase tracking-widest text-center mt-0.5">Evidence</p>
        </motion.div>
    );
};

// ─── Reveal Animation ─────────────────────────────────────────────────────────
const RevealAnimation = ({ correctRows, onComplete }) => (
    <motion.div
        className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(239,68,68,0.03) 3px, rgba(239,68,68,0.03) 4px)' }} />

        <div className="text-center max-w-2xl mx-auto px-4 relative z-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
            </motion.div>
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-widest"
            >
                Case Cracked!
            </motion.h2>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-red-400 text-sm uppercase tracking-[0.3em] mb-8"
            >
                The truth is finally revealed
            </motion.p>

            <div className="space-y-3 mb-8 max-h-64 overflow-y-auto pr-1">
                {correctRows.map((row, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.18 }}
                        className="flex items-start gap-3 bg-zinc-900/80 border border-emerald-500/30 rounded-2xl px-4 py-3 text-left"
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mt-0.5">
                            <User className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-white font-bold text-sm">{row.suspectName}</span>
                            <span className="text-zinc-500 text-xs mx-2">—</span>
                            <span className="text-indigo-300 text-sm">{row.action}</span>
                            {row.evidenceName && (
                                <>
                                    <span className="text-zinc-500 text-xs mx-2">using</span>
                                    <span className="text-yellow-300 text-sm font-medium">{row.evidenceName}</span>
                                </>
                            )}
                            {row.objectiveLabel && (
                                <p className="text-[9px] text-emerald-400 mt-1 uppercase tracking-wider">{row.objectiveLabel}</p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + correctRows.length * 0.18 + 0.3 }}
                onClick={onComplete}
                className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest transition-all hover:scale-105"
            >
                Continue Investigation →
            </motion.button>
        </div>
    </motion.div>
);

// ─── Intro Screen ─────────────────────────────────────────────────────────────
const IntroScreen = ({ introText, onStart }) => (
    <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        {/* Cork dots background */}
        <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #a16207 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

        {/* Animated red strings */}
        {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
                key={i}
                animate={{ opacity: [0.08, 0.25, 0.08] }}
                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
                className="absolute h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none"
                style={{ top: `${10 + i * 10}%`, left: '5%', right: '5%' }}
            />
        ))}

        <div className="text-center max-w-lg mx-auto px-6 relative z-10">
            <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 150 }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-950/50 border-2 border-red-500/40 flex items-center justify-center"
                style={{ boxShadow: '0 0 40px rgba(239,68,68,0.3)' }}
            >
                <Eye className="w-10 h-10 text-red-400" />
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest mb-3"
            >
                The<br /><span className="text-red-400">Crazy Wall</span>
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-zinc-400 text-sm leading-relaxed mb-8"
            >
                {introText || 'Connect the suspects to their actions and evidence on the investigation board. Click a suspect to select it, then click an action — and optionally evidence — to link them with a thread.'}
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-3 text-left mb-8"
            >
                {[
                    { color: 'bg-red-500', text: 'Click a Suspect card to select it' },
                    { color: 'bg-indigo-500', text: 'Click an Action tile — red thread connects them' },
                    { color: 'bg-yellow-500', text: 'Optionally click Evidence to add a yellow thread' },
                ].map((hint, i) => (
                    <div key={i} className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${hint.color}`} />
                        <span className="text-zinc-300 text-sm">{hint.text}</span>
                    </div>
                ))}
            </motion.div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-sm transition-all"
                style={{ background: 'linear-gradient(to right,#7f1d1d,#ef4444)', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}
            >
                Open The Board →
            </motion.button>
        </div>
    </motion.div>
);

// ─── MAIN CRAZY WALL GAME ─────────────────────────────────────────────────────
export const CrazyWallGame = ({ node, nodes: allNodes, onComplete }) => {
    const data = node?.data || {};
    const rawConnections = data.connections || [];

    // Derive unique suspects, actions, evidence from designer data
    const suspects = useMemo(() =>
        rawConnections.map((c, i) => ({
            id: c.suspectId || `s_${i}`,
            name: c.suspectName || `Suspect ${i + 1}`,
            image: c.suspectImage || '',
        })),
        [rawConnections]);

    // Shuffle actions so they don't appear in order
    const actions = useMemo(() => shuffle(
        rawConnections.map((c, i) => ({
            id: `action_${i}`,
            name: c.action || `Action ${i + 1}`,
            correctSuspectId: c.suspectId || `s_${i}`,
        }))
    ), [rawConnections]);

    // Only include evidence that has a name
    const evidenceItems = useMemo(() => shuffle(
        rawConnections
            .filter(c => c.evidenceName)
            .map((c, i) => ({
                id: c.evidenceId || `e_${i}`,
                name: c.evidenceName,
                image: c.evidenceImage || '',
                correctSuspectId: c.suspectId || `s_${i}`,
            }))
    ), [rawConnections]);

    // ─── State ──────────────────────────────────────────────────────────────
    const [showIntro, setShowIntro] = useState(true);
    const [selectedSuspectId, setSelectedSuspectId] = useState(null);
    // playerMap: { suspectId → { actionId, evidenceId } }
    const [playerMap, setPlayerMap] = useState({});
    const [checked, setChecked] = useState(false);
    const [results, setResults] = useState({});
    const [showReveal, setShowReveal] = useState(false);

    // ─── Refs for position tracking ─────────────────────────────────────────
    const boardRef = useRef(null);
    const itemRefs = useRef({});
    const [positions, setPositions] = useState({});

    const updatePositions = useCallback(() => {
        if (!boardRef.current) return;
        const boardRect = boardRef.current.getBoundingClientRect();
        const newPos = {};
        Object.entries(itemRefs.current).forEach(([key, el]) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            newPos[key] = {
                x: rect.left - boardRect.left + rect.width / 2,
                y: rect.top - boardRect.top + rect.height / 2,
            };
        });
        setPositions(newPos);
    }, []);

    useEffect(() => {
        if (showIntro) return;
        const frame = requestAnimationFrame(() => updatePositions());
        window.addEventListener('resize', updatePositions);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', updatePositions);
        };
    }, [showIntro, updatePositions]);

    // Re-measure when suspects/actions/evidence mount (short delay for layout)
    useEffect(() => {
        if (showIntro) return;
        const t = setTimeout(updatePositions, 120);
        return () => clearTimeout(t);
    }, [showIntro, suspects.length, actions.length, evidenceItems.length, updatePositions]);

    // ─── Interaction ─────────────────────────────────────────────────────────
    const handleSuspectClick = useCallback((suspectId) => {
        setSelectedSuspectId(prev => prev === suspectId ? null : suspectId);
        setChecked(false);
    }, []);

    const handleActionClick = useCallback((actionId) => {
        if (!selectedSuspectId) return;
        setPlayerMap(prev => {
            const existing = prev[selectedSuspectId] || {};
            // If clicking the already-connected action → remove connection
            if (existing.actionId === actionId) {
                const next = { ...existing };
                delete next.actionId;
                if (!next.actionId && !next.evidenceId) {
                    const m = { ...prev };
                    delete m[selectedSuspectId];
                    return m;
                }
                return { ...prev, [selectedSuspectId]: next };
            }
            return { ...prev, [selectedSuspectId]: { ...existing, actionId } };
        });
        setChecked(false);
    }, [selectedSuspectId]);

    const handleEvidenceClick = useCallback((evidenceId) => {
        if (!selectedSuspectId) return;
        setPlayerMap(prev => {
            const existing = prev[selectedSuspectId] || {};
            // Toggle off if same evidence already connected
            if (existing.evidenceId === evidenceId) {
                const next = { ...existing };
                delete next.evidenceId;
                if (!next.actionId && !next.evidenceId) {
                    const m = { ...prev };
                    delete m[selectedSuspectId];
                    return m;
                }
                return { ...prev, [selectedSuspectId]: next };
            }
            return { ...prev, [selectedSuspectId]: { ...existing, evidenceId } };
        });
        setChecked(false);
    }, [selectedSuspectId]);

    const handleRemoveConnection = useCallback((suspectId) => {
        setPlayerMap(prev => {
            const m = { ...prev };
            delete m[suspectId];
            return m;
        });
        setChecked(false);
    }, []);

    // ─── Check connections ───────────────────────────────────────────────────
    const handleReveal = useCallback(() => {
        // Build correct answer map: suspectId → { correctActionId, correctEvidenceId? }
        const correctMap = {};
        rawConnections.forEach((conn, i) => {
            const sId = conn.suspectId || `s_${i}`;
            const aId = `action_${i}`;
            const eId = conn.evidenceName ? (conn.evidenceId || `e_${i}`) : null;
            correctMap[sId] = { actionId: aId, evidenceId: eId };
        });

        const newResults = {};
        let correctCount = 0;

        suspects.forEach(s => {
            const playerConn = playerMap[s.id] || {};
            const correct = correctMap[s.id] || {};
            const actionOk = playerConn.actionId && playerConn.actionId === correct.actionId;
            // Evidence is optional — only wrong if player connected wrong evidence
            const evidenceOk = !correct.evidenceId || !playerConn.evidenceId
                ? true  // no required evidence, or player didn't pick — not penalised
                : playerConn.evidenceId === correct.evidenceId;
            newResults[s.id] = { actionOk, evidenceOk };
            if (actionOk) correctCount++;
        });

        setResults(newResults);
        setChecked(true);

        const allCorrect = correctCount === suspects.length;
        if (allCorrect) {
            setTimeout(() => setShowReveal(true), 900);
        }
    }, [playerMap, suspects, rawConnections]);

    const handleReset = useCallback(() => {
        setPlayerMap({});
        setSelectedSuspectId(null);
        setChecked(false);
        setResults({});
    }, []);

    // ─── Derived ─────────────────────────────────────────────────────────────
    const threadData = useMemo(() => {
        return Object.entries(playerMap).map(([suspectId, conn]) => ({
            suspectId,
            actionId: conn.actionId,
            evidenceId: conn.evidenceId,
        }));
    }, [playerMap]);

    const connectedActions = useMemo(() => new Set(Object.values(playerMap).map(c => c.actionId).filter(Boolean)), [playerMap]);
    const connectedEvidence = useMemo(() => new Set(Object.values(playerMap).map(c => c.evidenceId).filter(Boolean)), [playerMap]);

    const allSuspectsConnected = suspects.length > 0 && suspects.every(s => playerMap[s.id]?.actionId);

    const correctRows = useMemo(() => rawConnections.map(c => {
        let objectiveLabel = '';
        if (c.learningObjectiveIds && data.learningObjectives) {
            const labels = [];
            data.learningObjectives.forEach(cat => {
                (cat.objectives || []).forEach((obj, i) => {
                    if (c.learningObjectiveIds.includes(`${cat.id}:${i}`)) {
                        labels.push(typeof obj === 'string' ? obj : (obj.learningObjective || obj.name || `Obj ${i}`));
                    }
                });
            });
            objectiveLabel = labels.join(', ');
        }
        return {
            suspectName: c.suspectName || '',
            action: c.action || '',
            evidenceName: c.evidenceName || '',
            objectiveLabel: objectiveLabel || c.objectiveLabel || '',
        };
    }), [rawConnections, data.learningObjectives]);

    const correctCount = Object.values(results).filter(r => r.actionOk).length;
    const totalScore = correctCount * (data.score || 100);

    // ─── Intro ───────────────────────────────────────────────────────────────
    if (showIntro) {
        return (
            <IntroScreen
                introText={data.introText}
                onStart={() => setShowIntro(false)}
            />
        );
    }

    return (
        <>
            {/* Reveal overlay */}
            <AnimatePresence>
                {showReveal && (
                    <RevealAnimation
                        correctRows={correctRows}
                        onComplete={() => onComplete && onComplete(totalScore)}
                    />
                )}
            </AnimatePresence>

            {/* ── Main Board ─────────────────────────────────────────────────── */}
            <motion.div
                className="fixed inset-0 z-[200] flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    background: '#1a1108',
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(161,98,7,0.08) 0%, transparent 70%)'
                }}
            >
                {/* Cork dot texture */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(circle, #a16207 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)' }} />

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-black/50 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                            <p className="text-white font-black text-sm uppercase tracking-wider">{data.label || 'Investigation Board'}</p>
                            <p className="text-zinc-500 text-[9px] uppercase tracking-widest">Click suspects to select, then click actions to connect</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Legend */}
                        <div className="hidden md:flex items-center gap-3 mr-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-0.5 bg-red-400" />
                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Action</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-0.5 bg-yellow-400" />
                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Evidence</span>
                            </div>
                        </div>

                        {checked && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${correctCount === suspects.length
                                    ? 'bg-emerald-900/40 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-900/40 border border-red-500/30 text-red-400'
                                    }`}
                            >
                                {correctCount}/{suspects.length} Correct
                            </motion.div>
                        )}

                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    </div>
                </div>

                {/* ── Board Content ─────────────────────────────────────────── */}
                <div ref={boardRef} className="flex-1 relative overflow-auto">
                    {/* SVG Thread layer */}
                    <Threads
                        connections={threadData}
                        positions={positions}
                        suspects={suspects}
                        actions={actions}
                        evidenceItems={evidenceItems}
                        results={results}
                        checked={checked}
                    />

                    {/* ── Three columns ──────────────────────────────────────── */}
                    <div className="relative z-10 flex gap-0 h-full min-h-[600px]">

                        {/* LEFT: Suspects */}
                        <div className="flex-1 flex flex-col items-center gap-6 p-6 pt-10">
                            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2">
                                <div className="w-6 h-px bg-red-400/40" />
                                SUSPECTS
                                <div className="w-6 h-px bg-red-400/40" />
                            </div>
                            {suspects.map((suspect) => (
                                <SuspectCard
                                    key={suspect.id}
                                    suspect={suspect}
                                    isSelected={selectedSuspectId === suspect.id}
                                    isConnected={!!playerMap[suspect.id]?.actionId}
                                    checked={checked}
                                    connectionOk={results[suspect.id]?.actionOk}
                                    onClick={() => handleSuspectClick(suspect.id)}
                                    refCallback={(el) => { itemRefs.current[`suspect_${suspect.id}`] = el; updatePositions(); }}
                                />
                            ))}
                        </div>

                        {/* CENTER: Actions */}
                        <div className="flex-1 flex flex-col items-center gap-5 p-6 pt-16 border-x border-zinc-800/30">
                            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-400 flex items-center gap-2 mb-2">
                                <div className="w-6 h-px bg-indigo-400/40" />
                                ACTIONS
                                <div className="w-6 h-px bg-indigo-400/40" />
                            </div>
                            {selectedSuspectId && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[9px] text-indigo-300 uppercase tracking-wider -mt-3 mb-1"
                                >
                                    ← Click to connect
                                </motion.p>
                            )}
                            {actions.map((action) => (
                                <ActionTile
                                    key={action.id}
                                    action={action}
                                    isConnected={connectedActions.has(action.id)}
                                    checked={checked}
                                    connectionOk={
                                        checked && (() => {
                                            const connSuspect = Object.entries(playerMap).find(([, c]) => c.actionId === action.id);
                                            if (!connSuspect) return false;
                                            return results[connSuspect[0]]?.actionOk;
                                        })()
                                    }
                                    onClick={() => handleActionClick(action.id)}
                                    refCallback={(el) => { itemRefs.current[`action_${action.id}`] = el; updatePositions(); }}
                                />
                            ))}
                        </div>

                        {/* RIGHT: Evidence (optional) */}
                        <div className="flex-1 flex flex-col items-center gap-5 p-6 pt-10">
                            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-yellow-400 flex items-center gap-2">
                                <div className="w-6 h-px bg-yellow-400/40" />
                                EVIDENCE
                                <div className="w-6 h-px bg-yellow-400/40" />
                            </div>
                            {evidenceItems.length === 0 ? (
                                <div className="text-center py-8 opacity-30">
                                    <Search className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-[9px] text-zinc-600 uppercase tracking-wider">No evidence configured</p>
                                </div>
                            ) : (
                                <>
                                    {selectedSuspectId && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[9px] text-yellow-400/80 uppercase tracking-wider -mt-2 mb-1"
                                        >
                                            ← Optional
                                        </motion.p>
                                    )}
                                    {evidenceItems.map((evidence) => (
                                        <EvidenceCard
                                            key={evidence.id}
                                            evidence={evidence}
                                            isConnected={connectedEvidence.has(evidence.id)}
                                            checked={checked}
                                            connectionOk={
                                                checked && (() => {
                                                    const connSuspect = Object.entries(playerMap).find(([, c]) => c.evidenceId === evidence.id);
                                                    if (!connSuspect) return false;
                                                    return results[connSuspect[0]]?.evidenceOk;
                                                })()
                                            }
                                            onClick={() => handleEvidenceClick(evidence.id)}
                                            refCallback={(el) => { itemRefs.current[`evidence_${evidence.id}`] = el; updatePositions(); }}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Helper hint when suspect selected ──────────────────── */}
                    <AnimatePresence>
                        {selectedSuspectId && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="fixed bottom-28 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-indigo-950/80 border border-indigo-500/30 rounded-full text-[10px] text-indigo-300 font-bold uppercase tracking-widest backdrop-blur-sm"
                            >
                                {suspects.find(s => s.id === selectedSuspectId)?.name} selected — now click an Action
                                <button onClick={() => setSelectedSuspectId(null)} className="ml-3 text-zinc-500 hover:text-white transition-colors">✕</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Bottom bar ────────────────────────────────────────────── */}
                <div className="relative z-30 flex flex-col items-center gap-3 px-4 py-4 border-t border-zinc-800/60 bg-black/50 backdrop-blur-sm flex-shrink-0">
                    {/* Incorrect feedback */}
                    <AnimatePresence>
                        {checked && correctCount < suspects.length && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-2 max-w-lg"
                            >
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <p className="text-red-300 text-xs">
                                    {correctCount === 0
                                        ? "No connections are correct. Review the clues and reconnect the threads."
                                        : `${correctCount} of ${suspects.length} connections correct. Fix the highlighted threads and try again.`}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3">
                        {/* Progress pills */}
                        <div className="hidden sm:flex items-center gap-1.5">
                            {suspects.map(s => (
                                <div
                                    key={s.id}
                                    className={`w-2 h-2 rounded-full transition-all ${playerMap[s.id]?.actionId ? 'bg-red-400' : 'bg-zinc-700'}`}
                                    title={s.name}
                                />
                            ))}
                            <span className="text-[9px] text-zinc-600 ml-1">{Object.values(playerMap).filter(c => c.actionId).length}/{suspects.length}</span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleReveal}
                            disabled={!allSuspectsConnected}
                            className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all ${allSuspectsConnected
                                ? 'bg-gradient-to-r from-red-800 to-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                        >
                            <Eye className="w-5 h-5" />
                            Reveal the Truth
                        </motion.button>
                    </div>

                    {!allSuspectsConnected && (
                        <p className="text-[9px] text-zinc-600 uppercase tracking-wider">
                            Connect all {suspects.length} suspect{suspects.length > 1 ? 's' : ''} to an action to reveal
                        </p>
                    )}
                </div>
            </motion.div>
        </>
    );
};

export default CrazyWallGame;
